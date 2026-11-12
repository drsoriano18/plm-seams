-- Preserve existing reschedule behavior and require the destination venue
-- to accommodate the configured registration capacity before any changes.

CREATE OR REPLACE FUNCTION public.admin_reschedule_event(
    eid text,
    new_starts_at timestamptz,
    new_ends_at timestamptz,
    new_venue_id text,
    reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    ev public.event%ROWTYPE;
    booking public.venue_booking%ROWTYPE;

    clean_reason text := nullif(btrim(reason), '');
    destination_venue_id text;
    destination_capacity integer;
    confirmed_count bigint;
BEGIN
    PERFORM private.require_admin();

    IF clean_reason IS NULL THEN
        RAISE EXCEPTION 'Rescheduling reason is required'
            USING ERRCODE = '22023';
    END IF;

    IF new_starts_at IS NULL
       OR new_ends_at IS NULL
       OR new_ends_at <= new_starts_at
       OR new_starts_at <= statement_timestamp()
    THEN
        RAISE EXCEPTION 'Invalid future schedule'
            USING ERRCODE = '22023';
    END IF;

    -- Registration and cancellation also lock the event.
    -- This serializes the capacity check with those workflows.
    SELECT e.*
    INTO ev
    FROM public.event AS e
    WHERE e.event_id = eid
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found'
            USING ERRCODE = 'P0002';
    END IF;

    IF ev.event_status IN ('Completed', 'Cancelled')
       OR ev.archived_at IS NOT NULL
    THEN
        RAISE EXCEPTION 'Event cannot be rescheduled'
            USING ERRCODE = '22023';
    END IF;

    SELECT vb.*
    INTO booking
    FROM public.venue_booking AS vb
    WHERE vb.event_id = eid
      AND vb.booking_status = 'Confirmed'
    ORDER BY vb.booking_id
    LIMIT 1
    FOR UPDATE;

    destination_venue_id :=
        coalesce(new_venue_id, booking.venue_id);

    IF destination_venue_id IS NOT NULL THEN
        -- Prevent a concurrent capacity edit during this operation.
        SELECT v.max_capacity
        INTO destination_capacity
        FROM public.venue AS v
        WHERE v.venue_id = destination_venue_id
        FOR SHARE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Destination venue not found'
                USING ERRCODE = '22023';
        END IF;

        SELECT count(*)
        INTO confirmed_count
        FROM public.registration AS r
        WHERE r.event_id = eid
          AND r.reg_status = 'Confirmed';

        IF confirmed_count > destination_capacity THEN
            RAISE EXCEPTION
                'Destination venue capacity (%) is below the Confirmed attendee count (%)',
                destination_capacity,
                confirmed_count
                USING ERRCODE = '22023';
        END IF;

        IF ev.registration_capacity > destination_capacity THEN
            RAISE EXCEPTION
                'Destination venue capacity (%) is below the configured registration capacity (%)',
                destination_capacity,
                ev.registration_capacity
                USING ERRCODE = '22023';
        END IF;
    END IF;

    UPDATE public.event
    SET starts_at = new_starts_at,
        ends_at = new_ends_at,
        rescheduled_at = statement_timestamp(),
        rescheduled_by = private.app_user_id(),
        rescheduled_reason = clean_reason
    WHERE event_id = eid;

    IF booking.booking_id IS NOT NULL THEN
        UPDATE public.venue_booking
        SET venue_id = destination_venue_id,
            starts_at = new_starts_at,
            ends_at = new_ends_at,
            status_changed_at = statement_timestamp(),
            change_reason = clean_reason
        WHERE booking_id = booking.booking_id;

    ELSIF destination_venue_id IS NOT NULL THEN
        INSERT INTO public.venue_booking (
            booking_id,
            event_id,
            venue_id,
            starts_at,
            ends_at,
            buffer_minutes,
            booking_status,
            authorized_by,
            status_changed_at,
            change_reason
        )
        VALUES (
            'B-' || substr(
                replace(gen_random_uuid()::text, '-', ''),
                1,
                24
            ),
            eid,
            destination_venue_id,
            new_starts_at,
            new_ends_at,
            60,
            'Confirmed',
            private.app_user_id(),
            statement_timestamp(),
            clean_reason
        );
    END IF;

    INSERT INTO public.notifications (
        recipient_user_id,
        event_id,
        notification_type,
        message
    )
    VALUES (
        ev.org_id,
        eid,
        'Event Rescheduled',
        ev.event_id || ': event rescheduled. ' || clean_reason
    );

    INSERT INTO public.notifications (
        recipient_user_id,
        event_id,
        notification_type,
        message
    )
    SELECT
        r.student_number,
        eid,
        'Event Rescheduled',
        'Your registered event has been rescheduled. ' || clean_reason
    FROM public.registration AS r
    WHERE r.event_id = eid
      AND r.reg_status IN ('Confirmed', 'Waitlisted');
END;
$$;
