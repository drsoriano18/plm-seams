-- Store all selected college codes in the existing text field.
-- Single-college values, RPC signatures, and display payloads remain compatible.
CREATE OR REPLACE FUNCTION private.normalize_proposal_eligibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    college_codes text[];
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

            college_codes := string_to_array(NEW.allowed_college, ',');
            IF EXISTS (
                SELECT 1 FROM unnest(college_codes) AS items(code)
                WHERE btrim(code) <> ALL (ARRAY[
                    'CA','CASBE','CBA','CED','CE','CHASS','CISTM',
                    'CM','CN','CPT','CPA','CS','CTHM'
                ])
            ) THEN
                RAISE EXCEPTION 'Select valid college codes'
                    USING ERRCODE = '22023';
            END IF;
            SELECT string_agg(code, ', ' ORDER BY first_position)
            INTO NEW.allowed_college
            FROM (
                SELECT btrim(value) AS code, min(position) AS first_position
                FROM unnest(college_codes) WITH ORDINALITY AS items(value, position)
                GROUP BY btrim(value)
            ) AS unique_colleges;
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


create or replace function private.student_event_access(eid text) returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce(auth.uid() is not null and private.app_role()='Student' and exists(
 select 1 from public.event e join public.event_proposal p using(proposal_id)
 join public.students s on s.student_number=private.app_user_id()
 where e.event_id=eid and e.publication_status='Published'
 and (p.eligibility_mode='University-Wide'
 or (p.eligibility_mode='College-Specific' and s.college = any(regexp_split_to_array(p.allowed_college, '\s*,\s*')))
 or (p.eligibility_mode='Program-Specific' and s.program=any(p.allowed_programs)
 and (p.allowed_college is null or s.college = any(regexp_split_to_array(p.allowed_college, '\s*,\s*')))))
 and (cardinality(p.allowed_programs)=0 or s.program=any(p.allowed_programs))),false)
$$;
