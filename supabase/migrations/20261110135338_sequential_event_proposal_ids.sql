-- Number future workflow IDs by Manila calendar year. Existing IDs are untouched.
-- Row-locked counters serialize concurrent allocations and are private to the DB.
CREATE TABLE private.workflow_id_counters (
    kind text NOT NULL CHECK (kind IN ('event', 'proposal')),
    id_year integer NOT NULL,
    last_number bigint NOT NULL CHECK (last_number >= 0),
    PRIMARY KEY (kind, id_year)
);
REVOKE ALL ON private.workflow_id_counters FROM PUBLIC, anon, authenticated;

-- Block concurrent workflow inserts while taking the initial numbering baseline.
LOCK TABLE public.event, public.event_proposal IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO private.workflow_id_counters (kind, id_year, last_number)
SELECT 'event', split_part(event_id, '-', 2)::integer,
       max(split_part(event_id, '-', 3)::bigint)
FROM public.event WHERE event_id ~ '^EV-[0-9]{4}-[0-9]+$'
GROUP BY split_part(event_id, '-', 2)::integer;
INSERT INTO private.workflow_id_counters (kind, id_year, last_number)
SELECT 'proposal', split_part(proposal_id, '-', 2)::integer,
       max(split_part(proposal_id, '-', 3)::bigint)
FROM public.event_proposal WHERE proposal_id ~ '^PROP-[0-9]{4}-[0-9]+$'
GROUP BY split_part(proposal_id, '-', 2)::integer;

CREATE FUNCTION private.next_workflow_id(id_kind text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    current_year integer := extract(year FROM statement_timestamp() AT TIME ZONE 'Asia/Manila');
    allocated bigint;
    prefix text;
BEGIN
    IF auth.uid() IS NULL
       OR (id_kind = 'event' AND private.app_role() IS DISTINCT FROM 'Admin')
       OR (id_kind = 'proposal' AND private.app_role() IS DISTINCT FROM 'Student Organization')
       OR id_kind IS NULL OR id_kind NOT IN ('event', 'proposal') THEN
        RAISE EXCEPTION 'ID allocation is not permitted' USING ERRCODE = '42501';
    END IF;
    prefix := CASE id_kind WHEN 'event' THEN 'EV' ELSE 'PROP' END;
    -- ON CONFLICT takes a row lock: concurrent requests receive distinct values.
    INSERT INTO private.workflow_id_counters AS counters (kind, id_year, last_number)
    VALUES (id_kind, current_year, 1)
    ON CONFLICT (kind, id_year) DO UPDATE
    SET last_number = counters.last_number + 1
    RETURNING last_number INTO allocated;
    -- Three digits minimum, without truncation when numbering exceeds 999.
    RETURN prefix || '-' || current_year::text || '-' ||
           lpad(allocated::text, greatest(3, length(allocated::text)), '0');
END;
$$;
REVOKE ALL ON FUNCTION private.next_workflow_id(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.next_workflow_id(text) TO authenticated;

-- Change only the ID expressions, preserving each deployed function's checks,
-- permissions, signature, required fields, and atomic workflow behavior.
DO $$
DECLARE
    signature text;
    original_definition text;
    revised_definition text;
BEGIN
    FOREACH signature IN ARRAY ARRAY[
        'public.submit_proposal(jsonb,jsonb)',
        'private.save_proposal_draft(jsonb,jsonb,text)',
        'public.review_proposal(text,text,text)'
    ] LOOP
        original_definition := pg_get_functiondef(signature::regprocedure);
        revised_definition := replace(original_definition,
            '''P-''||substr(replace(gen_random_uuid()::text,''-'',''''),1,24)',
            'private.next_workflow_id(''proposal'')');
        revised_definition := replace(revised_definition,
            '''E-''||substr(replace(gen_random_uuid()::text,''-'',''''),1,24)',
            'private.next_workflow_id(''event'')');
        IF revised_definition = original_definition THEN
            RAISE EXCEPTION 'Unexpected ID generator in %; migration aborted', signature;
        END IF;
        EXECUTE revised_definition;
    END LOOP;
END;
$$;
