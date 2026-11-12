-- Failure #1:
-- Reject rescheduling when the destination venue cannot accommodate
-- the current Confirmed registrations.

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

REVOKE ALL ON FUNCTION public.admin_reschedule_event(
    text, timestamptz, timestamptz, text, text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_reschedule_event(
    text, timestamptz, timestamptz, text, text
) TO authenticated;

-- Failure #2: repair archive authorization and execution permissions.

CREATE OR REPLACE FUNCTION private.archive_event(eid text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    ev public.event%ROWTYPE;
    caller_role text := private.app_role();
BEGIN
    IF auth.uid() IS NULL
       OR caller_role IS NULL
       OR caller_role NOT IN ('Admin', 'Student Organization')
    THEN
        RAISE EXCEPTION 'Organization or administrator access required'
            USING ERRCODE = '42501';
    END IF;

    SELECT e.*
    INTO ev
    FROM public.event AS e
    WHERE e.event_id = eid
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found'
            USING ERRCODE = 'P0002';
    END IF;

    IF caller_role = 'Student Organization'
       AND ev.org_id IS DISTINCT FROM private.app_user_id()
    THEN
        RAISE EXCEPTION 'Event ownership required'
            USING ERRCODE = '42501';
    END IF;

    IF ev.event_status NOT IN ('Completed', 'Cancelled') THEN
        RAISE EXCEPTION
            'Only completed or cancelled events may be archived'
            USING ERRCODE = '22023';
    END IF;

    -- Repeated calls do not change history or duplicate notifications.
    IF ev.archived_at IS NOT NULL THEN
        RETURN;
    END IF;

    PERFORM set_config('seams.archive_event', 'on', true);

    UPDATE public.event
    SET archived_at = statement_timestamp()
    WHERE event_id = eid;

    PERFORM set_config('seams.archive_event', 'off', true);
END;
$$;

REVOKE ALL ON FUNCTION private.archive_event(text)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.archive_event(text)
TO authenticated;

REVOKE ALL ON FUNCTION public.archive_event(text)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.archive_event(text)
TO authenticated;

-- Failures #3–6: archived history must remain immutable.

CREATE OR REPLACE FUNCTION private.guard_archived_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    old_row jsonb := '{}'::jsonb;
    new_row jsonb := '{}'::jsonb;
    target_event_ids text[] := ARRAY[]::text[];
    target_proposal_ids text[] := ARRAY[]::text[];
    linked_event record;
BEGIN
    IF TG_OP <> 'INSERT' THEN
        old_row := to_jsonb(OLD);
    END IF;

    IF TG_OP <> 'DELETE' THEN
        new_row := to_jsonb(NEW);
    END IF;

    IF TG_TABLE_NAME = 'event' THEN
        -- Allow the initial archive operation, but reject every
        -- subsequent update or deletion of the archived event.
        IF old_row ->> 'archived_at' IS NOT NULL THEN
            RAISE EXCEPTION 'Archived events cannot be changed'
                USING ERRCODE = '55000';
        END IF;

    ELSE
        IF TG_TABLE_NAME = 'registration' THEN
            target_event_ids := ARRAY[
                old_row ->> 'event_id',
                new_row ->> 'event_id'
            ];

        ELSIF TG_TABLE_NAME IN (
            'event_proposal',
            'proposal_schedule'
        ) THEN
            target_proposal_ids := ARRAY[
                old_row ->> 'proposal_id',
                new_row ->> 'proposal_id'
            ];

        ELSE
            RAISE EXCEPTION 'Unsupported archive guard table';
        END IF;

        -- Check both previous and proposed parents.
        -- Locks serialize these writes with the archive operation.
        FOR linked_event IN
            SELECT e.event_id, e.archived_at
            FROM public.event AS e
            WHERE e.event_id = ANY(target_event_ids)
               OR e.proposal_id = ANY(target_proposal_ids)
            ORDER BY e.event_id
            FOR UPDATE
        LOOP
            IF linked_event.archived_at IS NOT NULL THEN
                RAISE EXCEPTION
                    'Archived event history cannot be changed'
                    USING ERRCODE = '55000';
            END IF;
        END LOOP;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_archived_history()
FROM PUBLIC, anon, authenticated;

CREATE TRIGGER guard_archived_event
BEFORE UPDATE OR DELETE ON public.event
FOR EACH ROW
EXECUTE FUNCTION private.guard_archived_history();

CREATE TRIGGER guard_archived_proposal
BEFORE INSERT OR UPDATE OR DELETE ON public.event_proposal
FOR EACH ROW
EXECUTE FUNCTION private.guard_archived_history();

CREATE TRIGGER guard_archived_proposal_schedule
BEFORE INSERT OR UPDATE OR DELETE ON public.proposal_schedule
FOR EACH ROW
EXECUTE FUNCTION private.guard_archived_history();

CREATE TRIGGER guard_archived_registration
BEFORE INSERT OR UPDATE OR DELETE ON public.registration
FOR EACH ROW
EXECUTE FUNCTION private.guard_archived_history();

-- Failure #7: distinguish omitted fields from explicit null values.

CREATE OR REPLACE FUNCTION private.update_proposal(
    pid text,
    proposal jsonb,
    schedules jsonb,
    submit boolean DEFAULT false
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_proposal public.event_proposal%ROWTYPE;
    next_status text;
BEGIN
    IF auth.uid() IS NULL
       OR private.app_role() IS DISTINCT FROM 'Student Organization'
    THEN
        RAISE EXCEPTION
            'Only student organizations may update proposals'
            USING ERRCODE = '42501';
    END IF;

    SELECT p.*
    INTO current_proposal
    FROM public.event_proposal AS p
    WHERE p.proposal_id = pid
      AND p.org_id = private.app_user_id()
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Proposal not found'
            USING ERRCODE = 'P0002';
    END IF;

    IF current_proposal.approval_status NOT IN (
        'Draft', 'Revisions Required', 'Pending'
    ) THEN
        RAISE EXCEPTION 'This proposal is no longer editable'
            USING ERRCODE = '42501';
    END IF;

    -- The sponsorship column is NOT NULL: accept JSON booleans only.
    IF proposal ? 'includes_sponsorship'
       AND jsonb_typeof(proposal -> 'includes_sponsorship')
           IS DISTINCT FROM 'boolean'
    THEN
        RAISE EXCEPTION 'includes_sponsorship must be true or false'
            USING ERRCODE = '22023';
    END IF;

    next_status := CASE WHEN submit THEN 'Pending' ELSE 'Draft' END;

    IF proposal ? 'allowed_programs' THEN
        IF jsonb_typeof(proposal -> 'allowed_programs')
           IS DISTINCT FROM 'array'
        THEN
            RAISE EXCEPTION 'allowed_programs must be an array'
                USING ERRCODE = '22023';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM jsonb_array_elements(
                proposal -> 'allowed_programs'
            ) AS items(value)
            WHERE jsonb_typeof(value) IS DISTINCT FROM 'string'
        ) THEN
            RAISE EXCEPTION 'Each program must be a string'
                USING ERRCODE = '22023';
        END IF;
    END IF;

    DELETE FROM public.proposal_schedule
    WHERE proposal_id = pid;

    IF jsonb_typeof(schedules) = 'array' THEN
        INSERT INTO public.proposal_schedule (
            schedule_id,
            proposal_id,
            venue_id,
            starts_at,
            ends_at,
            schedule_type
        )
        SELECT
            'S-' || substr(
                replace(gen_random_uuid()::text, '-', ''),
                1,
                24
            ),
            pid,
            nullif(s ->> 'venue_id', ''),
            (s ->> 'starts_at')::timestamptz,
            (s ->> 'ends_at')::timestamptz,
            coalesce(s ->> 'schedule_type', 'Primary')
        FROM jsonb_array_elements(schedules) AS items(s);
    END IF;

    UPDATE public.event_proposal AS p
    SET
        event_name = coalesce(
            proposal ->> 'event_name', p.event_name
        ),
        objectives = coalesce(
            proposal ->> 'objectives', p.objectives
        ),
        description = coalesce(
            proposal ->> 'description', p.description
        ),
        event_type_id = coalesce(
            nullif(proposal ->> 'event_type_id', ''),
            p.event_type_id
        ),
        expected_count_attendees = coalesce(
            (proposal ->> 'expected_count_attendees')::integer,
            p.expected_count_attendees
        ),
        allowed_college = CASE
            WHEN proposal ? 'allowed_college'
                THEN proposal ->> 'allowed_college'
            ELSE p.allowed_college
        END,
        allowed_programs = CASE
            WHEN proposal ? 'allowed_programs' THEN
                ARRAY(
                    SELECT jsonb_array_elements_text(
                        proposal -> 'allowed_programs'
                    )
                )
            ELSE p.allowed_programs
        END,
        eligibility_mode = coalesce(
            proposal ->> 'eligibility_mode', p.eligibility_mode
        ),

        resource_requirements = CASE
            WHEN proposal ? 'resource_requirements'
                THEN proposal ->> 'resource_requirements'
            ELSE p.resource_requirements
        END,

        budget_information = CASE
            WHEN proposal ? 'budget_information'
                THEN proposal ->> 'budget_information'
            ELSE p.budget_information
        END,

        collaborating_organization_text = CASE
            WHEN proposal ? 'collaborating_organization_text'
                THEN proposal ->> 'collaborating_organization_text'
            ELSE p.collaborating_organization_text
        END,

        includes_sponsorship = CASE
            WHEN proposal ? 'includes_sponsorship'
                THEN (proposal ->> 'includes_sponsorship')::boolean
            ELSE p.includes_sponsorship
        END,

        approval_status = next_status,
        submission_date = CASE
            WHEN submit THEN statement_timestamp()
            ELSE p.submission_date
        END
    WHERE p.proposal_id = pid;

    RETURN pid;
END;
$$;

-- Failure #8: normalize saved eligibility restrictions.

CREATE OR REPLACE FUNCTION private.normalize_proposal_eligibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    CASE NEW.eligibility_mode
        WHEN 'University-Wide' THEN
            NEW.allowed_college := NULL;
            NEW.allowed_programs := ARRAY[]::text[];

        WHEN 'College-Specific' THEN
            NEW.allowed_college :=
                nullif(btrim(NEW.allowed_college), '');

            IF NEW.allowed_college IS NULL THEN
                RAISE EXCEPTION
                    'College-Specific eligibility requires a college'
                    USING ERRCODE = '22023';
            END IF;

            NEW.allowed_programs := ARRAY[]::text[];

        WHEN 'Program-Specific' THEN
            -- College is optional, matching the existing access rules.
            -- When supplied, it remains an additional restriction.
            NEW.allowed_college :=
                nullif(btrim(NEW.allowed_college), '');

            IF NEW.allowed_programs IS NULL
               OR cardinality(NEW.allowed_programs) = 0
            THEN
                RAISE EXCEPTION
                    'Program-Specific eligibility requires programs'
                    USING ERRCODE = '22023';
            END IF;

            IF EXISTS (
                SELECT 1
                FROM unnest(NEW.allowed_programs) AS programs(program)
                WHERE program IS NULL
                   OR btrim(program) = ''
            ) THEN
                RAISE EXCEPTION
                    'Programs must not contain null or blank values'
                    USING ERRCODE = '22023';
            END IF;

            -- Trim and deduplicate program identifiers.
            NEW.allowed_programs := ARRAY(
                SELECT DISTINCT btrim(program)
                FROM unnest(NEW.allowed_programs) AS programs(program)
                ORDER BY btrim(program)
            );

        ELSE
            RAISE EXCEPTION 'Invalid eligibility mode'
                USING ERRCODE = '22023';
    END CASE;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.normalize_proposal_eligibility()
FROM PUBLIC, anon, authenticated;

CREATE TRIGGER normalize_proposal_eligibility
BEFORE INSERT OR UPDATE OF
    eligibility_mode, allowed_college, allowed_programs
ON public.event_proposal
FOR EACH ROW
EXECUTE FUNCTION private.normalize_proposal_eligibility();

-- Failure #9: lifecycle transitions must close registration.

CREATE OR REPLACE FUNCTION public.refresh_event_states()
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    completed_count integer;
    ongoing_count integer;
BEGIN
    IF auth.uid() IS NULL
       OR private.app_role() IS NULL
       OR private.app_role() NOT IN (
           'Admin', 'Student Organization'
       )
    THEN
        RAISE EXCEPTION
            'Organization or administrator access required'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.event
    SET event_status = 'Completed',
        registration_status = 'Closed',
        completed_at = coalesce(
            completed_at, statement_timestamp()
        )
    WHERE archived_at IS NULL
      AND event_status IN ('Upcoming', 'Ongoing')
      AND ends_at <= statement_timestamp();

    GET DIAGNOSTICS completed_count = ROW_COUNT;

    UPDATE public.event
    SET event_status = 'Ongoing',
        registration_status = 'Closed'
    WHERE archived_at IS NULL
      AND event_status = 'Upcoming'
      AND starts_at <= statement_timestamp()
      AND ends_at > statement_timestamp();

    GET DIAGNOSTICS ongoing_count = ROW_COUNT;

    RETURN completed_count + ongoing_count;
END;
$$;

CREATE OR REPLACE FUNCTION private.refresh_event_states_system()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    completed_count integer;
    ongoing_count integer;
BEGIN
    UPDATE public.event
    SET event_status = 'Completed',
        registration_status = 'Closed',
        completed_at = coalesce(
            completed_at, statement_timestamp()
        )
    WHERE archived_at IS NULL
      AND event_status IN ('Upcoming', 'Ongoing')
      AND ends_at <= statement_timestamp();

    GET DIAGNOSTICS completed_count = ROW_COUNT;

    UPDATE public.event
    SET event_status = 'Ongoing',
        registration_status = 'Closed'
    WHERE archived_at IS NULL
      AND event_status = 'Upcoming'
      AND starts_at <= statement_timestamp()
      AND ends_at > statement_timestamp();

    GET DIAGNOSTICS ongoing_count = ROW_COUNT;

    RETURN completed_count + ongoing_count;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_event_states()
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.refresh_event_states()
TO authenticated;

REVOKE ALL ON FUNCTION private.refresh_event_states_system()
FROM PUBLIC, anon, authenticated;


-- Step 8: permit precisely validated organization lifecycle refreshes.
create or replace function private.guard_event() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if coalesce(current_setting('seams.archive_event',true),'off')='on' then
    if new.event_id is distinct from old.event_id or new.event_status is distinct from old.event_status
       or new.archived_at is null or new.archived_at < old.archived_at then
      raise exception 'Archive operation may only set archived_at' using errcode='42501';
    end if;
    return new;
  end if;
  if private.app_role()='Student Organization' then
    -- Allow only due lifecycle transitions on the caller's own event.
    -- No client-set session flag or general status-edit permission is used.
    if TG_OP = 'UPDATE'
       and old.org_id = private.app_user_id()
       and old.archived_at is null
       and new.registration_status = 'Closed'
       and (to_jsonb(new) - array['event_status','registration_status','completed_at'])
           is not distinct from
           (to_jsonb(old) - array['event_status','registration_status','completed_at'])
       and (
         (old.event_status = 'Upcoming'
          and new.event_status = 'Ongoing'
          and old.starts_at <= statement_timestamp()
          and old.ends_at > statement_timestamp()
          and new.completed_at is not distinct from old.completed_at)
         or
         (old.event_status in ('Upcoming','Ongoing')
          and new.event_status = 'Completed'
          and old.ends_at <= statement_timestamp()
          and new.completed_at is not distinct from
              coalesce(old.completed_at, statement_timestamp()))
       )
    then
      return new;
    end if;
    if (to_jsonb(new)-array['post_caption','publication_status','published_at','registration_status'])
       is distinct from (to_jsonb(old)-array['post_caption','publication_status','published_at','registration_status']) then
      raise exception 'Organizations may edit only publication, caption and registration visibility' using errcode='42501';
    end if;
    if new.event_status in ('Completed','Cancelled') and new.publication_status='Published' then
      raise exception 'Completed or cancelled events cannot be published' using errcode='23514';
    end if;
    if new.event_status in ('Completed','Cancelled') and new.registration_status='Open' then
      raise exception 'Completed or cancelled events cannot accept registrations' using errcode='23514';
    end if;
  end if;
  if new.registration_status='Open' and new.publication_status<>'Published' then
    raise exception 'Publish the event before opening registration' using errcode='23514';
  end if;
  return new;
end $$;

-- Step 9 - Failure #10: owned draft deletion must succeed completely or roll back.

ALTER POLICY rbac_delete
ON public.event_proposal
USING (
    private.app_role() = 'Admin'
    OR (
        private.app_role() = 'Student Organization'
        AND private.owns_proposal(proposal_id)
        AND approval_status = 'Draft'
    )
);

CREATE OR REPLACE FUNCTION private.delete_proposal(pid text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    target public.event_proposal%ROWTYPE;
    deleted_count integer;
BEGIN
    IF auth.uid() IS NULL
       OR private.app_role() IS DISTINCT FROM 'Student Organization'
    THEN
        RAISE EXCEPTION 'Organization access required'
            USING ERRCODE = '42501';
    END IF;

    SELECT p.*
    INTO target
    FROM public.event_proposal AS p
    WHERE p.proposal_id = pid
      AND p.org_id = private.app_user_id()
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Only your drafts may be deleted'
            USING ERRCODE = '42501';
    END IF;

    IF target.approval_status <> 'Draft' THEN
        RAISE EXCEPTION 'Only your drafts may be deleted'
            USING ERRCODE = '42501';
    END IF;

    -- A proposal associated with an event must remain intact.
    IF EXISTS (
        SELECT 1
        FROM public.event AS e
        WHERE e.proposal_id = pid
    ) THEN
        RAISE EXCEPTION
            'A proposal linked to an event cannot be deleted'
            USING ERRCODE = '55000';
    END IF;

    DELETE FROM public.proposal_schedule
    WHERE proposal_id = pid;

    -- A returned proposal saved as Draft can retain review history.
    DELETE FROM public.proposal_review
    WHERE proposal_id = pid;

    DELETE FROM public.event_proposal
    WHERE proposal_id = pid
      AND org_id = private.app_user_id()
      AND approval_status = 'Draft';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    IF deleted_count <> 1 THEN
        RAISE EXCEPTION 'Draft deletion failed'
            USING ERRCODE = '55000';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_proposal(pid text)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT private.delete_proposal(pid);
$$;

REVOKE ALL ON FUNCTION private.delete_proposal(text)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.delete_proposal(text)
TO authenticated;

REVOKE ALL ON FUNCTION public.delete_proposal(text)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.delete_proposal(text)
TO authenticated;