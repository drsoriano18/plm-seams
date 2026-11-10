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
set constraints all deferred;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;
select pg_temp.assert_true(private.student_event_access('TEST-E'),'matching program eligible');
select pg_temp.assert_true(not private.student_event_access('TEST-E-NO'),'wrong program denied');
select pg_temp.assert_true(exists(select 1 from public.get_student_discover_events() where event_id='TEST-E'),'discover eligible');
select pg_temp.assert_true(exists(select 1 from public.get_student_discover_events() where event_id='TEST-E-NO' and not is_eligible),'discover shows ineligible with authoritative flag');
select pg_temp.assert_true(public.get_student_event_details('TEST-E')->>'event_name'='Program Test','details name');
select pg_temp.assert_true(public.get_student_event_details('TEST-E') ?& array['rescheduled_at','cancelled_at'],'event record timestamps included');
select pg_temp.assert_true(public.get_student_event_details('TEST-E-NO')->>'is_eligible'='false','details visible but ineligible');
select pg_temp.assert_true(public.get_student_event_details('TEST-E')->>'event_description'='Safe event description','safe description');
select pg_temp.denied($q$select public.register_event('TEST-E-NO')$q$);
select pg_temp.assert_true(not exists(select 1 from public.registration where event_id='TEST-E-NO'),'ineligible attempt creates no registration');
-- Broader viewing must never reveal unpublished events, even by direct ID.
reset role;
-- Unpublishing closes registration in this project's publication workflow.
update public.event set publication_status='Draft',registration_status='Closed' where event_id='TEST-E-NO';
set local role authenticated;
select pg_temp.assert_true(public.get_student_event_details('TEST-E-NO') is null,'unpublished details hidden');
select pg_temp.assert_true(not exists(select 1 from public.get_student_discover_events() where event_id='TEST-E-NO'),'unpublished discovery hidden');
reset role;
update public.event set publication_status='Published',registration_status='Closed' where event_id='TEST-E-NO';
update public.event_proposal set eligibility_mode='College-Specific',allowed_college='CBA',allowed_programs='{}' where proposal_id='TEST-P-NO';
set local role authenticated;
select pg_temp.assert_true(exists(select 1 from public.get_student_discover_events() where event_id='TEST-E-NO' and not is_eligible),'closed registration and other college still visible');
select pg_temp.assert_true(public.get_student_event_details('TEST-E-NO')->>'can_register'='false','other college cannot register');
select pg_temp.assert_true(exists(select 1 from public.get_student_dashboard_events() e where e->>'event_id'='TEST-E-NO'),'dashboard shows published event across colleges');
select pg_temp.assert_true(not exists(select 1 from public.get_student_registration_history() e where e->>'event_id'='TEST-E-NO'),'visibility does not create registration history');
reset role;
update public.event set registration_status='Open' where event_id='TEST-E-NO';
update public.event_proposal set eligibility_mode='Program-Specific',allowed_college=null,allowed_programs=array['BSIT'] where proposal_id='TEST-P-NO';
set local role authenticated;
select public.register_event('TEST-E');
select pg_temp.assert_true(public.get_student_event_details('TEST-E')->>'student_reg_status'='Confirmed','server registration state');
select pg_temp.assert_true(public.get_student_event_details('TEST-E')->>'confirmed_registrations'='1','accurate count');
select pg_temp.assert_true(exists(select 1 from public.get_student_registration_history() e where e->>'event_id'='TEST-E'),'history');
select pg_temp.denied($q$select public.set_student_profile_image('22222222-2222-4222-8222-222222222222/fake.png')$q$);
insert into storage.objects(bucket_id,name) values('student-profile-images','11111111-1111-4111-8111-111111111111/test.png');
select public.set_student_profile_image('11111111-1111-4111-8111-111111111111/test.png');
select pg_temp.assert_true((select profile_image_path is not null from public.students where student_number='TEST-STUDENT'),'photo persisted');
update public.students set program='BSIT' where student_number='TEST-STUDENT';
select pg_temp.assert_true((select program='BSCS' from public.students where student_number='TEST-STUDENT'),'cannot self change program');
reset role;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
set local role authenticated;
select pg_temp.assert_true(public.get_student_event_details('TEST-E') is null,'org cannot use student details');
select pg_temp.assert_true(not exists(select 1 from public.get_student_discover_events()),'org cannot use student discovery');
select pg_temp.denied($q$select public.set_student_profile_image(null)$q$);
select public.submit_proposal(jsonb_build_object('event_name','Submitted via RPC','objectives','Test','description','Test','event_type_id','TEST-TYPE','expected_count_attendees',10,'eligibility_mode','Program-Specific','allowed_programs',jsonb_build_array('BSCS')),jsonb_build_object('starts_at',now()+interval '20 days','ends_at',now()+interval '20 days 1 hour'));
set constraints all immediate;
set constraints all deferred;
select pg_temp.assert_true(exists(select 1 from public.event_proposal where event_name='Submitted via RPC' and allowed_programs=array['BSCS']),'atomic proposal retains program restrictions');
update public.event set published_at=now()+interval '1 day' where event_id='TEST-E';
select pg_temp.assert_true((select published_at<=statement_timestamp() from public.event where event_id='TEST-E'),'original publication cannot be forged');
do $$
declare original_published_at timestamptz;
begin
 select published_at into original_published_at from public.event where event_id='TEST-E';
 update public.event set publication_status='Unpublished',registration_status='Closed'
 where event_id='TEST-E';
 update public.event set publication_status='Published',registration_status='Open',
   published_at=statement_timestamp()+interval '1 day' where event_id='TEST-E';
 perform pg_temp.assert_true(
   (select published_at=original_published_at from public.event where event_id='TEST-E'),
   'republishing retains the original server publication timestamp');
end $$;
reset role;
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
set local role authenticated;
reset role;
-- Registration still stops at the start timestamp.
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
update public.event set starts_at=now(),ends_at=now()+interval '1 hour' where event_id='TEST-E-NO';
update public.event_proposal set allowed_programs=array['BSCS'] where proposal_id='TEST-P-NO';
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;
select pg_temp.denied($q$select public.register_event('TEST-E-NO')$q$);
reset role;
set local role anon;
select pg_temp.denied($q$select public.get_student_event_details('TEST-E')$q$);
reset role;
select pg_temp.assert_true(to_regclass('public.event_task') is null, 'retired task table absent');
select pg_temp.assert_true(to_regprocedure('public.save_event_task(jsonb)') is null, 'retired task RPC absent');
rollback;
