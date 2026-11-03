-- Synthetic identities only; never provision or reset a real account.
begin;
create function pg_temp.assert_true(ok boolean,msg text) returns void language plpgsql as $$ begin if ok is not true then raise exception 'FAIL: %',msg; end if; end $$;
create function pg_temp.denied(query text) returns void language plpgsql as $$ begin execute query; raise exception 'FAIL: operation allowed'; exception when insufficient_privilege or check_violation then null; end $$;
insert into auth.users(id) values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222'),('33333333-3333-4333-8333-333333333333'),('44444444-4444-4444-8444-444444444444');
insert into public.users(user_id,plm_email,role,auth_user_id) values
('TEST-STUDENT','student@example.invalid','Student','11111111-1111-4111-8111-111111111111'),
('TEST-ORG','org@example.invalid','Student Organization','22222222-2222-4222-8222-222222222222'),
('TEST-ADMIN','admin@example.invalid','Admin','33333333-3333-4333-8333-333333333333'),
('TEST-OTHER','other@example.invalid','Student Organization','44444444-4444-4444-8444-444444444444');
insert into public.students(student_number,name,year_level,college,program) values('TEST-STUDENT','Test','2','CISTM','BSCS');
insert into public.student_organization(org_id,org_name,org_type) values('TEST-ORG','Test org','Academic'),('TEST-OTHER','Other org','Academic');
insert into public.administrators(admin_id,name,position,office_assigned) values('TEST-ADMIN','Test','Test','Test');
insert into public.event_type(event_type_id,description,modality,requires_venue) values('TEST-TYPE','Test','Online',false);
insert into public.event_proposal(proposal_id,org_id,event_name,objectives,description,event_type_id,expected_count_attendees,eligibility_mode,allowed_programs,approval_status,submission_date) values
('TEST-P','TEST-ORG','Program Test','Test','Safe event description','TEST-TYPE',10,'Program-Specific',array['BSCS'],'Approved',now()),
('TEST-P-NO','TEST-ORG','Wrong Program','Test','Test','TEST-TYPE',10,'Program-Specific',array['BSIT'],'Approved',now());
insert into public.proposal_schedule(schedule_id,proposal_id,starts_at,ends_at,schedule_type) values
('TEST-S','TEST-P',now()+interval '20 days',now()+interval '20 days 1 hour','Primary'),
('TEST-S-NO','TEST-P-NO',now()+interval '20 days',now()+interval '20 days 1 hour','Primary');
insert into public.event(event_id,event_type_id,org_id,proposal_id,publication_status,registration_status,registration_capacity,starts_at,ends_at,event_status) values
('TEST-E','TEST-TYPE','TEST-ORG','TEST-P','Published','Open',1,now()+interval '20 days',now()+interval '20 days 1 hour','Upcoming'),
('TEST-E-NO','TEST-TYPE','TEST-ORG','TEST-P-NO','Published','Open',1,now()+interval '20 days',now()+interval '20 days 1 hour','Upcoming');
set constraints all immediate;
insert into auth.users(id) values ('55555555-5555-4555-8555-555555555555');
insert into public.users(user_id,plm_email,role,auth_user_id) values ('TEST-WAITER','waiter@example.invalid','Student','55555555-5555-4555-8555-555555555555');
insert into public.students(student_number,name,year_level,college,program) values ('TEST-WAITER','Waiter','2','CISTM','BSCS');
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;
select public.register_event('TEST-E');
select pg_temp.assert_true((select count(*)=1 from notifications where event_id='TEST-E' and notification_type='Registration Confirmed' and created_at>=statement_timestamp()-interval '1 minute'),'confirmed notice, current server time');
select pg_temp.denied($q$insert into public.notifications(recipient_user_id,event_id,notification_type,message) values('TEST-WAITER','TEST-E','Forged','Forged')$q$);
reset role;
update public.registration set reg_status=reg_status where event_id='TEST-E';
select pg_temp.assert_true((select count(*)=1 from notifications where event_id='TEST-E'),'unchanged status does not duplicate');
select set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',true);
set local role authenticated;
select public.register_event('TEST-E');
select pg_temp.assert_true((select count(*)=1 from notifications where event_id='TEST-E' and notification_type='Added to Waitlist'),'waitlist notice');
select pg_temp.assert_true(not exists(select 1 from notifications where recipient_user_id='TEST-STUDENT'),'cannot read other recipient notices');
reset role;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;
select public.cancel_registration((select reg_id from registration where event_id='TEST-E' and student_number='TEST-STUDENT'),'Test cancellation');
select pg_temp.assert_true(exists(select 1 from notifications where event_id='TEST-E' and notification_type='Registration Cancelled'),'cancellation notice');
select public.cancel_registration((select reg_id from registration where event_id='TEST-E' and student_number='TEST-STUDENT'),'Repeated cancellation');
select pg_temp.assert_true((select count(*)=1 from notifications where event_id='TEST-E' and notification_type='Registration Cancelled'),'repeat cancel does not duplicate');
reset role;
select set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',true);
set local role authenticated;
select pg_temp.assert_true(exists(select 1 from notifications where event_id='TEST-E' and notification_type='Slot Confirmed'),'promotion notice');
select pg_temp.assert_true((select reg_status='Confirmed' from registration where event_id='TEST-E' and student_number='TEST-WAITER'),'waitlist promoted');
reset role;
select pg_temp.assert_true(not has_function_privilege('authenticated','private.notify_registration_status()','execute'),'private trigger is not client callable');
rollback;
