-- Atomic draft edit/resubmission workflow used by the organization proposal form.
create or replace function private.update_proposal(
  pid text, proposal jsonb, schedules jsonb, submit boolean default false
) returns text
language plpgsql security definer set search_path='' as $$
declare current public.event_proposal%rowtype; status text;
begin
  if auth.uid() is null or private.app_role() <> 'Student Organization' then
    raise exception 'Only student organizations may update proposals' using errcode='42501';
  end if;
  select * into current from public.event_proposal
  where proposal_id=pid and org_id=private.app_user_id() for update;
  if not found then raise exception 'Proposal not found' using errcode='P0002'; end if;
  if current.approval_status not in ('Draft','Revisions Required','Pending') then
    raise exception 'This proposal is no longer editable' using errcode='42501';
  end if;
  status := case when submit then 'Pending' else 'Draft' end;

  delete from public.proposal_schedule where proposal_id=pid;
  if jsonb_typeof(schedules)='array' then
    insert into public.proposal_schedule(schedule_id,proposal_id,venue_id,starts_at,ends_at,schedule_type)
    select 'S-'||substr(replace(gen_random_uuid()::text,'-',''),1,24),pid,
      nullif(s->>'venue_id',''),(s->>'starts_at')::timestamptz,(s->>'ends_at')::timestamptz,
      coalesce(s->>'schedule_type','Primary')
    from jsonb_array_elements(schedules) s;
  end if;

  update public.event_proposal set
    event_name=coalesce(proposal->>'event_name',event_name),
    objectives=coalesce(proposal->>'objectives',objectives),
    description=coalesce(proposal->>'description',description),
    event_type_id=coalesce(nullif(proposal->>'event_type_id',''),event_type_id),
    expected_count_attendees=coalesce((proposal->>'expected_count_attendees')::integer,expected_count_attendees),
    allowed_college=coalesce(proposal->>'allowed_college',allowed_college),
    eligibility_mode=coalesce(proposal->>'eligibility_mode',eligibility_mode),
    resource_requirements=coalesce(proposal->>'resource_requirements',resource_requirements),
    budget_information=coalesce(proposal->>'budget_information',budget_information),
    includes_sponsorship=coalesce((proposal->>'includes_sponsorship')::boolean,includes_sponsorship),
    collaborating_organization_text=coalesce(proposal->>'collaborating_organization_text',collaborating_organization_text),
    approval_status=status,
    submission_date=case when submit then statement_timestamp() else submission_date end
  where proposal_id=pid;
  return pid;
end $$;

create or replace function public.update_proposal(
  pid text, proposal jsonb, schedules jsonb, submit boolean default false
) returns text
language sql security invoker set search_path='' as $$
  select private.update_proposal(pid,proposal,schedules,submit)
$$;

revoke all on function private.update_proposal(text,jsonb,jsonb,boolean),public.update_proposal(text,jsonb,jsonb,boolean) from public,anon;
grant execute on function public.update_proposal(text,jsonb,jsonb,boolean) to authenticated;
notify pgrst,'reload schema';
