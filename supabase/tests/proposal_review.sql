-- Execute as postgres. Fixtures, decisions, events, bookings and notifications are rolled back.
begin;
do $$
declare org_id_value text; org_auth uuid; admin_id_value text; admin_auth uuid; student_auth uuid;
  created_event text; proposal_key text; decision_value text; review_error boolean;
begin
  select user_id,auth_user_id into org_id_value,org_auth from public.users where role='Student Organization' and auth_user_id is not null limit 1;
  select user_id,auth_user_id into admin_id_value,admin_auth from public.users where role='Admin' and auth_user_id is not null limit 1;
  select auth_user_id into student_auth from public.users where role='Student' and auth_user_id is not null limit 1;
  if org_auth is null or admin_auth is null or student_auth is null then raise exception 'Linked role fixtures are required'; end if;
  insert into public.event_type(event_type_id,description,modality,requires_venue)
  values('_REVIEW_TYPE','Review test','On-Site',true),('_REVIEW_ONLINE','Online test','Online',false);
  insert into public.venue(venue_id,venue_name,building,max_capacity)
  values('_REVIEW_PRIMARY','Primary test room','Test',300),('_REVIEW_BACKUP','Backup test room','Test',300);
  foreach proposal_key in array array['_REVIEW_APPROVE','_REVIEW_CONFLICT','_REVIEW_ADJACENT','_REVIEW_RETURN','_REVIEW_REJECT','_REVIEW_MISSING','_REVIEW_ONLINE'] loop
    insert into public.event_proposal(proposal_id,org_id,event_name,event_type_id,objectives,description,submission_date,approval_status,expected_count_attendees,eligibility_mode)
    values(proposal_key,org_id_value,'Transactional review fixture',case when proposal_key='_REVIEW_ONLINE' then '_REVIEW_ONLINE' else '_REVIEW_TYPE' end,'Test','Test',now(),'Pending',250,'University-Wide');
    insert into public.proposal_schedule(schedule_id,proposal_id,venue_id,starts_at,ends_at,schedule_type)
    values(proposal_key||'_S',proposal_key,case when proposal_key='_REVIEW_ONLINE' then null else '_REVIEW_PRIMARY' end,
      now()+interval '40 days'+case when proposal_key='_REVIEW_CONFLICT' then interval '1 hour' when proposal_key='_REVIEW_ADJACENT' then interval '2 hours' else interval '0 hours' end,
      now()+interval '40 days'+case when proposal_key='_REVIEW_CONFLICT' then interval '3 hours' when proposal_key='_REVIEW_ADJACENT' then interval '4 hours' else interval '2 hours' end,
      case when proposal_key='_REVIEW_MISSING' then 'Backup' else 'Primary' end);
  end loop;
  insert into public.proposal_schedule(schedule_id,proposal_id,venue_id,starts_at,ends_at,schedule_type)
  values('_REVIEW_APPROVE_B','_REVIEW_APPROVE','_REVIEW_BACKUP',now()+interval '40 days',now()+interval '40 days 2 hours','Backup');
  set constraints all immediate;

  perform set_config('request.jwt.claim.sub',student_auth::text,true);
  perform set_config('request.jwt.claims',json_build_object('sub',student_auth,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  begin
    perform public.review_proposal('_REVIEW_APPROVE','Approved',null);
    raise exception 'Student approval was accepted';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',org_auth::text,true);
  perform set_config('request.jwt.claims',json_build_object('sub',org_auth,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  begin
    perform public.review_proposal('_REVIEW_APPROVE','Approved',null);
    raise exception 'Organization self-approval was accepted';
  exception when insufficient_privilege then null; end;
  execute 'reset role';

  perform set_config('request.jwt.claim.sub',admin_auth::text,true);
  perform set_config('request.jwt.claims',json_build_object('sub',admin_auth,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  foreach decision_value in array array['Rejected','Revisions Required'] loop
    begin
      perform public.review_proposal('_REVIEW_RETURN',decision_value,'   ');
      raise exception 'Missing remarks accepted for %',decision_value;
    exception when invalid_parameter_value then null; end;
  end loop;
  perform public.review_proposal('_REVIEW_APPROVE','Approved',null);
  select event_id into created_event from public.event where proposal_id='_REVIEW_APPROVE';
  if created_event is null then raise exception 'Approval did not create the event'; end if;
  if not exists(select 1 from public.event where event_id=created_event and publication_status='Unpublished' and registration_status='Closed' and registration_capacity=250 and starts_at=(select starts_at from public.proposal_schedule where schedule_id='_REVIEW_APPROVE_S')) then
    raise exception 'Approved event defaults or primary schedule are incorrect';
  end if;
  if (select count(*) from public.venue_booking where event_id=created_event)<>1 or not exists(select 1 from public.venue_booking where event_id=created_event and venue_id='_REVIEW_PRIMARY' and booking_status='Confirmed' and authorized_by=admin_id_value) then
    raise exception 'Approval did not reserve only the primary venue';
  end if;
  if (select count(*) from public.proposal_review where proposal_id='_REVIEW_APPROVE' and admin_id=admin_id_value)<>1 then raise exception 'Review author/history is incorrect'; end if;
  begin
    perform public.review_proposal('_REVIEW_APPROVE','Rejected','Second decision');
    raise exception 'A second decision was accepted';
  exception when serialization_failure then null; end;

  begin
    perform public.review_proposal('_REVIEW_CONFLICT','Approved','Conflicting approval');
    raise exception 'Overlapping primary reservation was accepted';
  exception when exclusion_violation then null; end;
  if not exists(select 1 from public.event_proposal where proposal_id='_REVIEW_CONFLICT' and approval_status='Pending')
    or exists(select 1 from public.event where proposal_id='_REVIEW_CONFLICT')
    or exists(select 1 from public.proposal_review where proposal_id='_REVIEW_CONFLICT') then
    raise exception 'A failed reservation partially saved its review';
  end if;
  perform public.review_proposal('_REVIEW_ADJACENT','Approved','Back-to-back reservation');
  begin
    perform public.review_proposal('_REVIEW_MISSING','Approved',null);
    raise exception 'Approval without a primary schedule was accepted';
  exception when invalid_parameter_value then null; end;
  perform public.review_proposal('_REVIEW_ONLINE','Approved',null);
  if exists(select 1 from public.venue_booking b join public.event e on e.event_id=b.event_id where e.proposal_id='_REVIEW_ONLINE') then raise exception 'Online approval reserved a venue'; end if;
  perform public.review_proposal('_REVIEW_RETURN','Revisions Required','Please revise the objectives.');
  perform public.review_proposal('_REVIEW_REJECT','Rejected','Final rejection reason.');
  if exists(select 1 from public.event where proposal_id in ('_REVIEW_RETURN','_REVIEW_REJECT')) then raise exception 'Non-approval created an event'; end if;
  execute 'reset role';
  if (select count(*) from public.notifications where proposal_id='_REVIEW_APPROVE' and recipient_user_id=org_id_value)<>1
    or not exists(select 1 from public.notifications where proposal_id='_REVIEW_RETURN' and message like '%Please revise the objectives.%')
    or not exists(select 1 from public.notifications where proposal_id='_REVIEW_REJECT' and message like '%Final rejection reason.%')
    or exists(select 1 from public.notifications where proposal_id='_REVIEW_CONFLICT') then
    raise exception 'Organization notifications are missing, duplicated, or persisted after failure';
  end if;

  perform set_config('request.jwt.claim.sub',org_auth::text,true);
  perform set_config('request.jwt.claims',json_build_object('sub',org_auth,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  if not exists(select 1 from public.event where event_id=created_event and publication_status='Unpublished') then raise exception 'Organization cannot see its unpublished event'; end if;
  if not exists(select 1 from public.notifications where proposal_id='_REVIEW_RETURN') then raise exception 'Organization cannot read decision notification'; end if;
  begin
    update public.event set registration_status='Open' where event_id=created_event;
    raise exception 'Registration opened before publication';
  exception when check_violation then null; end;
  update public.event set publication_status='Published',registration_status='Open' where event_id=created_event;
  if not exists(select 1 from public.event where event_id=created_event and publication_status='Published' and registration_status='Open') then raise exception 'Organization publication failed'; end if;
  update public.event_proposal set approval_status='Pending',description='Revised description' where proposal_id='_REVIEW_RETURN';
  if not exists(select 1 from public.event_proposal where proposal_id='_REVIEW_RETURN' and approval_status='Pending') then raise exception 'Returned proposal could not be resubmitted'; end if;
  update public.event_proposal set approval_status='Pending' where proposal_id='_REVIEW_REJECT';
  if exists(select 1 from public.event_proposal where proposal_id='_REVIEW_REJECT' and approval_status<>'Rejected') then raise exception 'Organization reopened a rejected proposal'; end if;
  execute 'reset role';
  raise notice 'PASS: review authorization, required remarks, atomic approval, one primary reservation, overlaps, adjacent slots, repeat decisions, online events, final rejection, resubmission, notifications and organization publication';
end $$;
rollback;
