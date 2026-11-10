-- Run as postgres against PLM-SEAMS; all fixtures and changes are rolled back.
begin;
do $$
declare sid text; suid uuid; oid text; ouid uuid; aid text; auid uuid; other_org text; other_student text; typ text; rid text; n integer;
begin
 select user_id,auth_user_id into sid,suid from public.users where role='Student' and auth_user_id is not null limit 1;
 select user_id,auth_user_id into oid,ouid from public.users where role='Student Organization' and auth_user_id is not null limit 1;
 select user_id,auth_user_id into aid,auid from public.users where role='Admin' and auth_user_id is not null limit 1;
 if suid is null or ouid is null or auid is null then raise exception 'Provision a linked account for each role before running tests'; end if;
 select org_id into other_org from public.student_organization where org_id<>oid limit 1;
 select student_number into other_student from public.students where student_number<>sid limit 1;
 select event_type_id into typ from public.event_type limit 1;
 insert into public.event_proposal(proposal_id,org_id,objectives,description,submission_date,approval_status,expected_count_attendees,event_name,event_type_id,eligibility_mode)
 values ('_RBAC_P1',oid,'Test','Test',now(),'Approved',1,'Test own',typ,'University-Wide'),('_RBAC_P2',other_org,'Test','Test',now(),'Approved',1,'Test other',typ,'University-Wide'),('_RBAC_P3',oid,'Test','Test',now(),'Pending',1,'Pending',typ,'University-Wide');
 insert into public.event(event_id,event_type_id,publication_status,registration_status,registration_capacity,starts_at,ends_at,org_id,event_status,proposal_id)
 values('_RBAC_E1',typ,'Published','Open',1,now()+interval '10 days',now()+interval '11 days',oid,'Upcoming','_RBAC_P1'),('_RBAC_E2',typ,'Draft','Closed',1,now()+interval '10 days',now()+interval '11 days',other_org,'Upcoming','_RBAC_P2');
 insert into public.registration(reg_id,event_id,student_number,reg_status) values('_RBAC_OTHER_REG','_RBAC_E2',other_student,'Confirmed');
 insert into public.event_proposal(proposal_id,org_id,objectives,description,submission_date,approval_status,expected_count_attendees,event_name,event_type_id,eligibility_mode,allowed_college)
 values('_RBAC_P4',oid,'Test','Test',now(),'Approved',1,'Restricted',typ,'College-Specific',case when (select college from public.students where student_number=sid)='CHASS' then 'CN' else 'CHASS' end);
 insert into public.event(event_id,event_type_id,publication_status,registration_status,registration_capacity,starts_at,ends_at,org_id,event_status,proposal_id)
 values('_RBAC_E3',typ,'Published','Open',1,now()+interval '10 days',now()+interval '11 days',oid,'Upcoming','_RBAC_P4');
 insert into public.notifications(notification_id,recipient_user_id,event_id,notification_type,message) values(-990000001,sid,'_RBAC_E1','Test','Test');
 perform set_config('request.jwt.claim.sub',suid::text,true);
 perform set_config('request.jwt.claims',json_build_object('sub',suid,'role','authenticated')::text,true);
 execute 'set local role authenticated';
 if public.get_my_role()<>'Student' then raise exception 'Student role lookup failed'; end if;
 if (select count(*) from public.users)<>1 then raise exception 'Student can see other accounts'; end if;
 if exists(select 1 from public.event where event_id='_RBAC_E2') then raise exception 'Student sees unpublished event'; end if;
 if exists(select 1 from public.event where event_id='_RBAC_E3') then raise exception 'College eligibility bypassed'; end if;
 begin
  perform public.register_event('_RBAC_E3'); raise exception 'Ineligible registration allowed';
 exception when insufficient_privilege then null; end;
 update public.notifications set read_at=now() where notification_id=-990000001;
 if not exists(select 1 from public.notifications where notification_id=-990000001 and read_at is not null) then raise exception 'Notification read update failed'; end if;
 begin
  update public.notifications set message='Forged' where notification_id=-990000001; raise exception 'Notification content forgery allowed';
 exception when insufficient_privilege then null; end;
 if exists(select 1 from public.event_proposal) then raise exception 'Student sees confidential proposals'; end if;
 begin
  perform password from public.users; raise exception 'Password column exposed';
 exception when insufficient_privilege then null; end;
 begin
  update public.users set role='Admin' where user_id=sid; raise exception 'Role escalation allowed';
 exception when insufficient_privilege then null; end;
 rid:=public.register_event('_RBAC_E1');
 if not exists(select 1 from public.registration where reg_id=rid and reg_status='Confirmed') then raise exception 'Registration failed'; end if;
 begin
  update public.registration set attendance_status='Present' where reg_id=rid; raise exception 'Student edits attendance';
 exception when insufficient_privilege then null; end;
 begin
  perform public.cancel_registration('_RBAC_OTHER_REG','attack'); raise exception 'Student cancels other account';
 exception when insufficient_privilege then null; end;
 begin
  perform public.register_event('_RBAC_E2'); raise exception 'Student registers for closed event';
 exception when insufficient_privilege then null; end;
 perform public.cancel_registration(rid,'test cancellation');
 if not exists(select 1 from public.registration where reg_id=rid and reg_status='Cancelled' and cancelled_at is not null) then raise exception 'Cancellation failed'; end if;
 if public.register_event('_RBAC_E1')<>rid then raise exception 'Re-registration did not reuse unique row'; end if;
 execute 'reset role';
 -- A second student competing for the full event must be waitlisted.
 perform set_config('request.jwt.claim.sub',suid::text,true);
 -- Same authenticated account, temporarily linked to a second student in this rolled-back transaction.
 update public.users set auth_user_id=null where user_id=sid;
 update public.users set auth_user_id=suid where user_id=other_student;
 execute 'set local role authenticated';
 perform public.register_event('_RBAC_E1');
 if not exists(select 1 from public.registration where event_id='_RBAC_E1' and student_number=other_student and reg_status='Waitlisted') then raise exception 'Capacity bypassed'; end if;
 execute 'reset role';
 update public.users set auth_user_id=null where user_id=other_student;
 update public.users set auth_user_id=suid where user_id=sid;
 perform set_config('request.jwt.claim.sub',ouid::text,true);
 perform set_config('request.jwt.claims',json_build_object('sub',ouid,'role','authenticated')::text,true);
 execute 'set local role authenticated';
 if public.get_my_role()<>'Student Organization' then raise exception 'Organization role lookup failed'; end if;
 if not exists(select 1 from public.event_proposal where proposal_id='_RBAC_P1') or exists(select 1 from public.event_proposal where proposal_id='_RBAC_P2') then raise exception 'Proposal isolation failed'; end if;
 perform public.mark_attendance(rid,'Present');
 if not exists(select 1 from public.registration where reg_id=rid and attendance_status='Present' and attendance_marked_by=oid) then raise exception 'Attendance attribution failed'; end if;
 begin
  perform public.mark_attendance('_RBAC_OTHER_REG','Present'); raise exception 'Cross-organization attendance allowed';
 exception when insufficient_privilege then null; end;
 begin
  update public.event_proposal set approval_status='Approved' where proposal_id='_RBAC_P3'; raise exception 'Organization self-approval allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.event_proposal(proposal_id,org_id,objectives,description,submission_date,approval_status,expected_count_attendees,event_name,event_type_id,eligibility_mode)
  values('_RBAC_ATTACK',oid,'x','x',now(),'Approved',1,'x',typ,'University-Wide');
  raise exception 'Approved proposal insert allowed';
 exception when insufficient_privilege then null; end;
 insert into public.proposal_schedule(schedule_id,proposal_id,starts_at,ends_at,schedule_type)
 values('_RBAC_S1','_RBAC_P3',now()+interval '10 days',now()+interval '11 days','Primary');
 begin
  insert into public.proposal_schedule(schedule_id,proposal_id,starts_at,ends_at,schedule_type)
  values('_RBAC_S2','_RBAC_P2',now()+interval '10 days',now()+interval '11 days','Primary');
  raise exception 'Cross-organization schedule insert allowed';
 exception when insufficient_privilege then null; end;
 update public.event set post_caption='Organization edit' where event_id='_RBAC_E1';
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Organization publication edit failed'; end if;
 begin
  update public.event set registration_capacity=100 where event_id='_RBAC_E1'; raise exception 'Organization changed protected event column';
 exception when insufficient_privilege then null; end;
 execute 'reset role';
 perform set_config('request.jwt.claim.sub',auid::text,true);
 perform set_config('request.jwt.claims',json_build_object('sub',auid,'role','authenticated')::text,true);
 execute 'set local role authenticated';
 if public.get_my_role()<>'Admin' then raise exception 'Admin role lookup failed'; end if;
 if (select count(*) from public.event where event_id in ('_RBAC_E1','_RBAC_E2'))<>2 then raise exception 'Admin read failed'; end if;
 perform public.review_proposal('_RBAC_P3','Approved','Test');
 if not exists(select 1 from public.event_proposal where proposal_id='_RBAC_P3' and approval_status='Approved') then raise exception 'Admin review failed'; end if;
 begin
  perform public.mark_attendance(rid,'Absent'); raise exception 'Admin impersonates an organization attendance marker';
 exception when insufficient_privilege then null; end;
 execute 'reset role';
 perform set_config('request.jwt.claim.sub',suid::text,true);
 perform set_config('request.jwt.claims',json_build_object('sub',suid,'role','authenticated')::text,true);
 execute 'set local role authenticated';
 perform public.cancel_registration(rid,'promotion test');
 execute 'reset role';
 if not exists(select 1 from public.registration where event_id='_RBAC_E1' and student_number=other_student and reg_status='Confirmed') then raise exception 'Waitlist promotion failed'; end if;
 if exists(select 1 from public.registration where reg_id=rid and attendance_marked_by is not null) then raise exception 'Cancelled registration kept attendance'; end if;
 perform set_config('request.jwt.claim.sub','',true);
 perform set_config('request.jwt.claims','{}',true);
 execute 'set local role anon';
 begin
  perform public.get_my_role(); raise exception 'Anonymous role RPC allowed';
 exception when insufficient_privilege then null; end;
 begin
  perform user_id from public.users; raise exception 'Anonymous user reads allowed';
 exception when insufficient_privilege then null; end;
 execute 'reset role';
end $$;
select 'PASS: Student, Organization, Admin and anonymous authorization checks' as result;
rollback;
