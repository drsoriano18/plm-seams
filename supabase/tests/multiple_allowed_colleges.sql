-- Synthetic identities only; never provision or reset a real account.
begin;
create or replace function pg_temp.assert_true(ok boolean,msg text) returns void language plpgsql as $$ begin if ok is not true then raise exception 'FAIL: %',msg; end if; end $$;
create or replace function pg_temp.denied(query text) returns void language plpgsql as $$ begin execute query; raise exception 'FAIL: operation allowed'; exception when insufficient_privilege or check_violation then null; end $$;
insert into auth.users(id) values ('77777777-7777-4777-8777-777777777777'),('88888888-8888-4888-8888-888888888888'),('99999999-9999-4999-8999-999999999999'),('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.users(user_id,plm_email,role,auth_user_id) values
('MULTICOL-STUDENT','multicol-student@example.invalid','Student','77777777-7777-4777-8777-777777777777'),
('MULTICOL-ORG','multicol-org@example.invalid','Student Organization','88888888-8888-4888-8888-888888888888'),
('MULTICOL-ADMIN','multicol-admin@example.invalid','Admin','99999999-9999-4999-8999-999999999999'),
('MULTICOL-OTHER','multicol-other@example.invalid','Student Organization','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.students(student_number,name,year_level,college,program) values('MULTICOL-STUDENT','Test','2','CISTM','BSCS');
insert into public.student_organization(org_id,org_name,org_type) values('MULTICOL-ORG','Test org','Academic'),('MULTICOL-OTHER','Other org','Academic');
insert into public.administrators(admin_id,name,position,office_assigned) values('MULTICOL-ADMIN','Test','Test','Test');
insert into public.event_type(event_type_id,description,modality,requires_venue) values('MULTICOL-TYPE','Test','Online',false);
insert into public.event_proposal(proposal_id,org_id,event_name,objectives,description,event_type_id,expected_count_attendees,eligibility_mode,allowed_programs,approval_status,submission_date) values
('MULTICOL-P','MULTICOL-ORG','Program Test','Test','Safe event description','MULTICOL-TYPE',10,'Program-Specific',array['BSCS'],'Approved',now()),
('MULTICOL-P-NO','MULTICOL-ORG','Wrong Program','Test','Test','MULTICOL-TYPE',10,'Program-Specific',array['BSIT'],'Approved',now());
insert into public.proposal_schedule(schedule_id,proposal_id,starts_at,ends_at,schedule_type) values
('MULTICOL-S','MULTICOL-P',now()+interval '20 days',now()+interval '20 days 1 hour','Primary'),
('MULTICOL-S-NO','MULTICOL-P-NO',now()+interval '20 days',now()+interval '20 days 1 hour','Primary');
insert into public.event(event_id,event_type_id,org_id,proposal_id,publication_status,registration_status,registration_capacity,starts_at,ends_at,event_status) values
('MULTICOL-E','MULTICOL-TYPE','MULTICOL-ORG','MULTICOL-P','Published','Open',1,now()+interval '20 days',now()+interval '20 days 1 hour','Upcoming'),
('MULTICOL-E-NO','MULTICOL-TYPE','MULTICOL-ORG','MULTICOL-P-NO','Published','Open',1,now()+interval '20 days',now()+interval '20 days 1 hour','Upcoming');
set constraints all immediate;
insert into auth.users(id) values('55555555-5555-4555-8555-555555555555'),('66666666-6666-4666-8666-666666666666');
insert into public.users(user_id,plm_email,role,auth_user_id) values
('MULTI-CHASS','multi-chass@example.invalid','Student','55555555-5555-4555-8555-555555555555'),
('MULTI-CN','multi-cn@example.invalid','Student','66666666-6666-4666-8666-666666666666');
insert into public.students(student_number,name,year_level,college,program) values
('MULTI-CHASS','Test CHASS','2','CHASS','BAC'),('MULTI-CN','Test CN','2','CN','BSN');
update public.event set registration_capacity=5 where event_id='MULTICOL-E';
update public.event_proposal set eligibility_mode='College-Specific',allowed_college=' CISTM, CHASS, CISTM ' where proposal_id='MULTICOL-P';
select pg_temp.assert_true((select allowed_college='CISTM, CHASS' from public.event_proposal where proposal_id='MULTICOL-P'),'college list normalized without losing selections');
select set_config('request.jwt.claim.sub','77777777-7777-4777-8777-777777777777',true);
set local role authenticated;
select public.register_event('MULTICOL-E');
reset role;
select set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',true);
set local role authenticated;
select public.register_event('MULTICOL-E');
reset role;
select set_config('request.jwt.claim.sub','66666666-6666-4666-8666-666666666666',true);
set local role authenticated;
select pg_temp.denied($q$select public.register_event('MULTICOL-E')$q$);
reset role;
select pg_temp.assert_true((select count(*)=2 from public.registration where event_id='MULTICOL-E'),'students from both selected colleges register');
select pg_temp.assert_true(not exists(select 1 from public.registration where student_number='MULTI-CN'),'outside college creates no registration');
select pg_temp.assert_true(not exists(select 1 from public.notifications where recipient_user_id='MULTI-CN'),'denied student gets no success notice');
update public.event_proposal set allowed_college='CA' where proposal_id='MULTICOL-P';
select pg_temp.assert_true((select allowed_college='CA' from public.event_proposal where proposal_id='MULTICOL-P'),'CA is valid');
update public.event_proposal set eligibility_mode='University-Wide' where proposal_id='MULTICOL-P';
select pg_temp.assert_true((select allowed_college is null from public.event_proposal where proposal_id='MULTICOL-P'),'University-Wide clears list');
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
set local role authenticated;
set constraints all deferred;
select public.submit_proposal(
 jsonb_build_object('event_name','Multi-college submission','objectives','Test','description','Test','event_type_id','MULTICOL-TYPE','expected_count_attendees',5,'eligibility_mode','College-Specific','allowed_college','CA, CHASS'),
 jsonb_build_object('starts_at',now()+interval '25 days','ends_at',now()+interval '25 days 1 hour'));
select pg_temp.assert_true(exists(select 1 from public.event_proposal where event_name='Multi-college submission' and allowed_college='CA, CHASS'),'submission retains every college');
select public.save_proposal_draft(
 jsonb_build_object('event_name','Multi-college draft','objectives','Test','description','Test','event_type_id','MULTICOL-TYPE','expected_count_attendees',5,'eligibility_mode','College-Specific','allowed_college','CA, CHASS'),
 jsonb_build_array(jsonb_build_object('schedule_type','Primary','starts_at',now()+interval '25 days','ends_at',now()+interval '25 days 1 hour')));
select public.update_proposal(
 (select proposal_id from public.event_proposal where event_name='Multi-college draft'),
 jsonb_build_object('allowed_college','CN, CISTM'),
 jsonb_build_array(jsonb_build_object('schedule_type','Primary','starts_at',now()+interval '25 days','ends_at',now()+interval '25 days 1 hour')),false);
select pg_temp.assert_true(exists(select 1 from public.event_proposal where event_name='Multi-college draft' and allowed_college='CN, CISTM'),'draft edit and reload retains every college');
set constraints all immediate;
reset role;
rollback;
