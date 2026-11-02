create or replace function private.check_proposal_notice() returns trigger language plpgsql set search_path = '' as $$
declare pid text; submitted timestamptz; earliest timestamptz;
begin
 if TG_TABLE_NAME='event_proposal' then
 if TG_OP='UPDATE' and private.app_role() is distinct from 'Student Organization' then return null; end if;
 pid:=new.proposal_id;
 elsif TG_OP='DELETE' then pid:=old.proposal_id;
 else pid:=new.proposal_id;
 if TG_OP='UPDATE' and new.proposal_id is distinct from old.proposal_id then raise exception 'Schedule proposal cannot be changed' using errcode='23514'; end if;
 end if;
 select submission_date into submitted from public.event_proposal where proposal_id=pid for update;
 if not found then return null; end if;
 select min(starts_at) into earliest from public.proposal_schedule where proposal_id=pid;
 if earliest is null then raise exception 'A proposal must include at least one event schedule' using errcode='23514'; end if;
 if earliest < greatest(submitted,statement_timestamp()) + interval '360 hours' then
 raise exception 'Every event schedule must start at least 15 full days from submission or schedule change.' using errcode='23514'; end if;
 return null;
end $$;
drop trigger proposal_notice on public.event_proposal;
create constraint trigger proposal_notice after insert or update on public.event_proposal deferrable initially deferred for each row execute function private.check_proposal_notice();
