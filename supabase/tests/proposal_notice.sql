-- Transactional boundary and bypass checks; leaves no test records.
begin;
select set_config('request.jwt.claim.sub',(select auth_user_id::text from public.users where role='Student Organization' and auth_user_id is not null limit 1),true);
set local role authenticated;
do $$
declare p jsonb; pid text; days integer; before_count bigint;
begin
 select jsonb_build_object('event_name','Notice validation test','objectives','Test','description','Test','event_type_id',event_type_id,'expected_count_attendees',10,'eligibility_mode','University-Wide') into p from public.event_type limit 1;
 foreach days in array array[14,15,16] loop
  begin
   select count(*) into before_count from public.event_proposal;
   pid:=public.submit_proposal(p,jsonb_build_object('starts_at',statement_timestamp()+make_interval(days=>days),'ends_at',statement_timestamp()+make_interval(days=>days,hours=>1)));
   set constraints all immediate;
   if days<15 then raise exception 'FAIL: late proposal accepted'; end if;
   set constraints all deferred;
  exception when check_violation then
   if days>=15 then raise; end if;
   if (select count(*) from public.event_proposal)<>before_count then raise exception 'FAIL: partial proposal left behind'; end if;
  end;
 end loop;
 begin
  update public.proposal_schedule set starts_at=statement_timestamp()+interval '14 days' where proposal_id=pid;
  set constraints all immediate;
  raise exception 'FAIL: early schedule edit accepted';
 exception when check_violation then null; end;
 begin
  update public.event_proposal set submission_date=statement_timestamp()-interval '100 days' where proposal_id=pid;
  raise exception 'FAIL: backdating accepted';
 exception when check_violation then null; end;
 begin
  delete from public.proposal_schedule where proposal_id=pid;
  set constraints all immediate;
  raise exception 'FAIL: missing schedule accepted';
 exception when check_violation then null; end;
end $$;
rollback;
