create function private.stamp_proposal_submission() returns trigger language plpgsql set search_path = '' as $$
begin
 if TG_OP='INSERT' then new.submission_date:=statement_timestamp();
 elsif new.submission_date is distinct from old.submission_date then
 raise exception 'Submission time is assigned by the server' using errcode='23514'; end if;
 return new;
end $$;
create trigger stamp_proposal_submission before insert or update on public.event_proposal for each row execute function private.stamp_proposal_submission();
create function private.check_proposal_notice() returns trigger language plpgsql set search_path = '' as $$
declare pid text; submitted timestamptz; earliest timestamptz;
begin
 if TG_TABLE_NAME='event_proposal' then pid:=new.proposal_id;
 elsif TG_OP='DELETE' then pid:=old.proposal_id;
 else pid:=new.proposal_id;
 if TG_OP='UPDATE' and new.proposal_id is distinct from old.proposal_id then raise exception 'Schedule proposal cannot be changed' using errcode='23514'; end if;
 end if;
 select submission_date into submitted from public.event_proposal where proposal_id=pid;
 if not found then return null; end if;
 select min(starts_at) into earliest from public.proposal_schedule where proposal_id=pid;
 if earliest is null then raise exception 'A proposal must include at least one event schedule' using errcode='23514'; end if;
 if earliest < greatest(submitted,statement_timestamp()) + interval '360 hours' then
 raise exception 'Every event schedule must start at least 15 full days from submission or schedule change.' using errcode='23514'; end if;
 return null;
end $$;
create constraint trigger proposal_notice after insert on public.event_proposal deferrable initially deferred for each row execute function private.check_proposal_notice();
create constraint trigger schedule_notice after insert or update or delete on public.proposal_schedule deferrable initially deferred for each row execute function private.check_proposal_notice();
create function public.submit_proposal(proposal jsonb,schedule jsonb) returns text language plpgsql security invoker set search_path = '' as $$
declare pid text:='P-' || substr(replace(gen_random_uuid()::text,'-',''),1,24);
begin
 if private.app_role() is distinct from 'Student Organization' then raise exception 'Only student organizations may submit proposals' using errcode='42501'; end if;
 insert into public.event_proposal(proposal_id,org_id,event_name,objectives,description,event_type_id,expected_count_attendees,eligibility_mode,allowed_college,resource_requirements,budget_information,approval_status,submission_date,includes_sponsorship)
 values(pid,private.app_user_id(),proposal->>'event_name',proposal->>'objectives',proposal->>'description',proposal->>'event_type_id',(proposal->>'expected_count_attendees')::integer,proposal->>'eligibility_mode',proposal->>'allowed_college',proposal->>'resource_requirements',proposal->>'budget_information','Pending',statement_timestamp(),false);
 insert into public.proposal_schedule(schedule_id,proposal_id,venue_id,starts_at,ends_at,schedule_type)
 values('S-' || substr(replace(gen_random_uuid()::text,'-',''),1,24),pid,nullif(schedule->>'venue_id',''),(schedule->>'starts_at')::timestamptz,(schedule->>'ends_at')::timestamptz,'Primary');
 return pid;
end $$;
revoke all on function public.submit_proposal(jsonb,jsonb) from public,anon;
grant execute on function public.submit_proposal(jsonb,jsonb) to authenticated;
revoke all on function private.stamp_proposal_submission(),private.check_proposal_notice() from public,anon,authenticated;
