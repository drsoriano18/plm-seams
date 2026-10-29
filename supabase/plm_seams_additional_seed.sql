-- PLM-SEAMS additional fictional sample data; append-only and re-runnable.

-- Review against your current schema and back up before running against cloud.

BEGIN;

SET LOCAL TIME ZONE 'Asia/Manila';

-- users: 10 new rows

INSERT INTO public."users" ("user_id", "plm_email", "password", "role", "created_at") VALUES

('202615701', 'ermendoza2026@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-10 09:00:00+08'),
('202515702', 'imsantos2025@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-11 09:00:00+08'),
('202415703', 'npreyes2024@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-12 09:00:00+08'),
('202315704', 'ogcruz2023@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-13 09:00:00+08'),
('202615705', 'lbaquino2026@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-14 09:00:00+08'),
('202515706', 'sltorres2025@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-15 09:00:00+08'),
('202415707', 'edramos2024@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-16 09:00:00+08'),
('202315708', 'mcflores2023@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-17 09:00:00+08'),
('202615709', 'lvgarcia2026@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-18 09:00:00+08'),
('202515710', 'anbautista2025@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-19 09:00:00+08')

ON CONFLICT ("user_id") DO NOTHING;

-- students: 10 new rows

INSERT INTO public."students" ("student_number", "name", "year_level", "college", "program") VALUES

('202615701', 'Elijah R. Mendoza', '1', 'CISTM', 'BSCS'),
('202515702', 'Isabella M. Santos', '2', 'CISTM', 'BSIT'),
('202415703', 'Noah P. Reyes', '3', 'CE', 'BSCE'),
('202315704', 'Olivia G. Cruz', '4', 'CHASS', 'BAC'),
('202615705', 'Liam B. Aquino', '1', 'CBA', 'BSA'),
('202515706', 'Sophia L. Torres', '2', 'CTHM', 'BSTM'),
('202415707', 'Ethan D. Ramos', '3', 'CISTM', 'BSCS'),
('202315708', 'Mia C. Flores', '4', 'CS', 'BS Math'),
('202615709', 'Lucas V. Garcia', '1', 'CN', 'BSN'),
('202515710', 'Ava N. Bautista', '2', 'CISTM', 'BSIT')

ON CONFLICT ("student_number") DO NOTHING;

-- event_proposal: 19 new rows

INSERT INTO public."event_proposal" ("proposal_id", "org_id", "objectives", "description", "submission_date", "approval_status", "expected_count_attendees", "event_name", "event_type_id", "allowed_college", "eligibility_mode", "resource_requirements", "budget_information", "includes_sponsorship", "collaborating_organization_text") VALUES

('PROP-2026-005', 'PLMCISTMSC-ORG-09', 'To strengthen student skills and engagement through cistm career forum.', 'Free student-led cistm career forum with practical learning activities.', '2026-03-01 09:00:00+08', 'Approved', '100', 'CISTM Career Forum', 'ET01', NULL, 'University-Wide', 'Projector and microphones', 'PHP 3000 proposed for logistics and materials', false, NULL),
('PROP-2026-006', 'PLMCHASSSC-ORG-08', 'To strengthen student skills and engagement through chass arts festival.', 'Free student-led chass arts festival with practical learning activities.', '2026-03-02 09:00:00+08', 'Approved', '100', 'CHASS Arts Festival', 'ET17', NULL, 'University-Wide', 'Projector and microphones', 'PHP 3500 proposed for logistics and materials', false, NULL),
('PROP-2026-007', 'PLMSCSC-ORG-07', 'To strengthen student skills and engagement through engineering research expo.', 'Free student-led engineering research expo with practical learning activities.', '2026-03-03 09:00:00+08', 'Approved', '100', 'Engineering Research Expo', 'ET01', NULL, 'University-Wide', 'Projector and microphones', 'PHP 4000 proposed for logistics and materials', false, NULL),
('PROP-2026-008', 'PLMCTHMSC-ORG-13', 'To strengthen student skills and engagement through hospitality skills workshop.', 'Free student-led hospitality skills workshop with practical learning activities.', '2026-03-04 09:00:00+08', 'Approved', '100', 'Hospitality Skills Workshop', 'ET03', NULL, 'University-Wide', 'Projector and microphones', 'PHP 4500 proposed for logistics and materials', false, NULL),
('PROP-2026-009', 'PLMECESS-ORG-17', 'To strengthen student skills and engagement through electronics innovation day.', 'Free student-led electronics innovation day with practical learning activities.', '2026-03-05 09:00:00+08', 'Approved', '40', 'Electronics Innovation Day', 'ET02', NULL, 'University-Wide', 'Projector and microphones', 'PHP 5000 proposed for logistics and materials', false, NULL),
('PROP-2026-010', 'PLMAWSS-ORG-40', 'To strengthen student skills and engagement through cloud computing bootcamp.', 'Free student-led cloud computing bootcamp with practical learning activities.', '2026-03-06 09:00:00+08', 'Approved', '40', 'Cloud Computing Bootcamp', 'ET03', NULL, 'University-Wide', 'Projector and microphones', 'PHP 5500 proposed for logistics and materials', false, NULL),
('PROP-2026-011', 'PLMCRCYC-ORG-46', 'To strengthen student skills and engagement through red cross first aid training.', 'Free student-led red cross first aid training with practical learning activities.', '2026-03-07 09:00:00+08', 'Approved', '100', 'Red Cross First Aid Training', 'ET03', NULL, 'University-Wide', 'Projector and microphones', 'PHP 6000 proposed for logistics and materials', false, NULL),
('PROP-2026-012', 'PLMCPA-ORG-12', 'To strengthen student skills and engagement through public service leadership forum.', 'Free student-led public service leadership forum with practical learning activities.', '2026-03-08 09:00:00+08', 'Approved', '100', 'Public Service Leadership Forum', 'ET01', NULL, 'University-Wide', 'Projector and microphones', 'PHP 6500 proposed for logistics and materials', false, NULL),
('PROP-2026-013', 'PLMAP-ORG-02', 'To strengthen student skills and engagement through campus journalism workshop.', 'Free student-led campus journalism workshop with practical learning activities.', '2026-03-09 09:00:00+08', 'Approved', '100', 'Campus Journalism Workshop', 'ET03', NULL, 'University-Wide', 'Projector and microphones', 'PHP 7000 proposed for logistics and materials', false, NULL),
('PROP-2026-014', 'PLMCOAA-ORG-03', 'To strengthen student skills and engagement through student accountability seminar.', 'Free student-led student accountability seminar with practical learning activities.', '2026-03-10 09:00:00+08', 'Approved', '100', 'Student Accountability Seminar', 'ET01', NULL, 'University-Wide', 'Projector and microphones', 'PHP 7500 proposed for logistics and materials', false, NULL),
('PROP-2026-015', 'PLMCOMELEC-ORG-04', 'To strengthen student skills and engagement through student election orientation.', 'Free student-led student election orientation with practical learning activities.', '2026-03-11 09:00:00+08', 'Approved', '100', 'Student Election Orientation', 'ET05', NULL, 'University-Wide', 'Projector and microphones', 'PHP 8000 proposed for logistics and materials', false, NULL),
('PROP-2026-016', 'PLMJFINEX-ORG-18', 'To strengthen student skills and engagement through financial literacy webinar.', 'Free student-led financial literacy webinar with practical learning activities.', '2026-03-12 09:00:00+08', 'Approved', '0', 'Financial Literacy Webinar', 'ET06', NULL, 'University-Wide', 'Video conferencing platform', 'PHP 8500 proposed for logistics and materials', false, NULL),
('PROP-2026-017', 'PLM-CRADLEORG-45', 'To strengthen student skills and engagement through child rights awareness forum.', 'Free student-led child rights awareness forum with practical learning activities.', '2026-03-13 09:00:00+08', 'Approved', '100', 'Child Rights Awareness Forum', 'ET01', NULL, 'University-Wide', 'Projector and microphones', 'PHP 9000 proposed for logistics and materials', false, NULL),
('PROP-2026-018', 'PLMTUGONRESCUE-ORG-54', 'To strengthen student skills and engagement through disaster preparedness drill.', 'Free student-led disaster preparedness drill with practical learning activities.', '2026-03-14 09:00:00+08', 'Approved', '100', 'Disaster Preparedness Drill', 'ET04', NULL, 'University-Wide', 'Projector and microphones', 'PHP 9500 proposed for logistics and materials', false, NULL),
('PROP-2026-019', 'PLMCMC-ORG-55', 'To strengthen student skills and engagement through community wellness assembly.', 'Free student-led community wellness assembly with practical learning activities.', '2026-03-15 09:00:00+08', 'Approved', '100', 'Community Wellness Assembly', 'ET05', NULL, 'University-Wide', 'Projector and microphones', 'PHP 10000 proposed for logistics and materials', false, NULL),
('PROP-2026-020', 'PLMSSC-ORG-01', 'To strengthen student skills and engagement through student leadership summit.', 'Free student-led student leadership summit with practical learning activities.', '2026-03-16 09:00:00+08', 'Revisions Required', '100', 'Student Leadership Summit', 'ET01', NULL, 'University-Wide', 'Projector and microphones', 'PHP 10500 proposed for logistics and materials', false, NULL),
('PROP-2026-021', 'PLMCSS-ORG-29', 'To strengthen student skills and engagement through cs research colloquium.', 'Free student-led cs research colloquium with practical learning activities.', '2026-03-17 09:00:00+08', 'Rejected', '100', 'CS Research Colloquium', 'ET01', NULL, 'University-Wide', 'Projector and microphones', 'PHP 11000 proposed for logistics and materials', false, NULL),
('PROP-2026-022', 'PLMCISTMSC-ORG-09', 'Promote student participation in campus sustainability forum.', 'Free on-site campus sustainability forum.', '2026-04-01 09:00:00+08', 'Approved', '200', 'Campus Sustainability Forum', 'ET01', NULL, 'University-Wide', 'Sound system, chairs, projector', 'PHP 10000 for logistics', false, NULL),
('PROP-2026-023', 'PLMCHASSSC-ORG-08', 'Promote student participation in student entrepreneurship fair.', 'Free on-site student entrepreneurship fair.', '2026-04-02 09:00:00+08', 'Approved', '200', 'Student Entrepreneurship Fair', 'ET01', NULL, 'University-Wide', 'Sound system, chairs, projector', 'PHP 10000 for logistics', false, NULL)

ON CONFLICT ("proposal_id") DO NOTHING;

-- proposal_schedule: 38 new rows

INSERT INTO public."proposal_schedule" ("schedule_id", "proposal_id", "venue_id", "starts_at", "ends_at", "schedule_type") VALUES

('SCH-2026-009', 'PROP-2026-005', 'PLM-VENUE-10', '2026-05-04 09:00:00+08', '2026-05-04 12:00:00+08', 'Primary'),
('SCH-2026-010', 'PROP-2026-005', 'PLM-VENUE-9', '2026-05-11 09:00:00+08', '2026-05-11 12:00:00+08', 'Backup'),
('SCH-2026-011', 'PROP-2026-006', 'PLM-VENUE-8', '2026-05-11 09:00:00+08', '2026-05-11 12:00:00+08', 'Primary'),
('SCH-2026-012', 'PROP-2026-006', 'PLM-VENUE-15', '2026-05-18 09:00:00+08', '2026-05-18 12:00:00+08', 'Backup'),
('SCH-2026-013', 'PROP-2026-007', 'PLM-VENUE-5', '2026-05-18 09:00:00+08', '2026-05-18 12:00:00+08', 'Primary'),
('SCH-2026-014', 'PROP-2026-007', 'PLM-VENUE-15', '2026-05-25 09:00:00+08', '2026-05-25 12:00:00+08', 'Backup'),
('SCH-2026-015', 'PROP-2026-008', 'PLM-VENUE-9', '2026-05-25 09:00:00+08', '2026-05-25 12:00:00+08', 'Primary'),
('SCH-2026-016', 'PROP-2026-008', 'PLM-VENUE-10', '2026-06-01 09:00:00+08', '2026-06-01 12:00:00+08', 'Backup'),
('SCH-2026-017', 'PROP-2026-009', 'PLM-VENUE-2', '2026-06-01 09:00:00+08', '2026-06-01 12:00:00+08', 'Primary'),
('SCH-2026-018', 'PROP-2026-009', 'PLM-VENUE-3', '2026-06-08 09:00:00+08', '2026-06-08 12:00:00+08', 'Backup'),
('SCH-2026-019', 'PROP-2026-010', 'PLM-VENUE-3', '2026-06-08 09:00:00+08', '2026-06-08 12:00:00+08', 'Primary'),
('SCH-2026-020', 'PROP-2026-010', 'PLM-VENUE-2', '2026-06-15 09:00:00+08', '2026-06-15 12:00:00+08', 'Backup'),
('SCH-2026-021', 'PROP-2026-011', 'PLM-VENUE-1', '2026-06-15 09:00:00+08', '2026-06-15 12:00:00+08', 'Primary'),
('SCH-2026-022', 'PROP-2026-011', 'PLM-VENUE-6', '2026-06-22 09:00:00+08', '2026-06-22 12:00:00+08', 'Backup'),
('SCH-2026-023', 'PROP-2026-012', 'PLM-VENUE-6', '2026-06-22 09:00:00+08', '2026-06-22 12:00:00+08', 'Primary'),
('SCH-2026-024', 'PROP-2026-012', 'PLM-VENUE-1', '2026-06-29 09:00:00+08', '2026-06-29 12:00:00+08', 'Backup'),
('SCH-2026-025', 'PROP-2026-013', 'PLM-VENUE-10', '2026-06-29 09:00:00+08', '2026-06-29 12:00:00+08', 'Primary'),
('SCH-2026-026', 'PROP-2026-013', 'PLM-VENUE-9', '2026-07-06 09:00:00+08', '2026-07-06 12:00:00+08', 'Backup'),
('SCH-2026-027', 'PROP-2026-014', 'PLM-VENUE-1', '2026-07-06 09:00:00+08', '2026-07-06 12:00:00+08', 'Primary'),
('SCH-2026-028', 'PROP-2026-014', 'PLM-VENUE-10', '2026-07-13 09:00:00+08', '2026-07-13 12:00:00+08', 'Backup'),
('SCH-2026-029', 'PROP-2026-015', 'PLM-VENUE-5', '2026-07-13 09:00:00+08', '2026-07-13 12:00:00+08', 'Primary'),
('SCH-2026-030', 'PROP-2026-015', 'PLM-VENUE-15', '2026-07-20 09:00:00+08', '2026-07-20 12:00:00+08', 'Backup'),
('SCH-2026-031', 'PROP-2026-016', NULL, '2026-07-20 09:00:00+08', '2026-07-20 12:00:00+08', 'Primary'),
('SCH-2026-032', 'PROP-2026-016', NULL, '2026-07-27 09:00:00+08', '2026-07-27 12:00:00+08', 'Backup'),
('SCH-2026-033', 'PROP-2026-017', 'PLM-VENUE-9', '2026-07-27 09:00:00+08', '2026-07-27 12:00:00+08', 'Primary'),
('SCH-2026-034', 'PROP-2026-017', 'PLM-VENUE-10', '2026-08-03 09:00:00+08', '2026-08-03 12:00:00+08', 'Backup'),
('SCH-2026-035', 'PROP-2026-018', 'PLM-VENUE-8', '2026-08-03 09:00:00+08', '2026-08-03 12:00:00+08', 'Primary'),
('SCH-2026-036', 'PROP-2026-018', 'PLM-VENUE-13', '2026-08-10 09:00:00+08', '2026-08-10 12:00:00+08', 'Backup'),
('SCH-2026-037', 'PROP-2026-019', 'PLM-VENUE-15', '2026-08-10 09:00:00+08', '2026-08-10 12:00:00+08', 'Primary'),
('SCH-2026-038', 'PROP-2026-019', 'PLM-VENUE-5', '2026-08-17 09:00:00+08', '2026-08-17 12:00:00+08', 'Backup'),
('SCH-2026-039', 'PROP-2026-020', 'PLM-VENUE-5', '2026-08-17 09:00:00+08', '2026-08-17 12:00:00+08', 'Primary'),
('SCH-2026-040', 'PROP-2026-020', 'PLM-VENUE-15', '2026-08-24 09:00:00+08', '2026-08-24 12:00:00+08', 'Backup'),
('SCH-2026-041', 'PROP-2026-021', 'PLM-VENUE-9', '2026-08-24 09:00:00+08', '2026-08-24 12:00:00+08', 'Primary'),
('SCH-2026-042', 'PROP-2026-021', 'PLM-VENUE-10', '2026-08-31 09:00:00+08', '2026-08-31 12:00:00+08', 'Backup'),
('SCH-2026-043', 'PROP-2026-022', 'PLM-VENUE-15', '2026-09-07 09:00:00+08', '2026-09-07 12:00:00+08', 'Primary'),
('SCH-2026-044', 'PROP-2026-022', 'PLM-VENUE-5', '2026-09-08 09:00:00+08', '2026-09-08 12:00:00+08', 'Backup'),
('SCH-2026-045', 'PROP-2026-023', 'PLM-VENUE-15', '2026-09-14 09:00:00+08', '2026-09-14 12:00:00+08', 'Primary'),
('SCH-2026-046', 'PROP-2026-023', 'PLM-VENUE-5', '2026-09-15 09:00:00+08', '2026-09-15 12:00:00+08', 'Backup')

ON CONFLICT ("schedule_id") DO NOTHING;

-- proposal_review: 19 new rows

INSERT INTO public."proposal_review" ("review_id", "proposal_id", "admin_id", "review_decision", "admin_remarks", "reviewed_at") VALUES

('REV-2026-005', 'PROP-2026-005', 'PLM-OSDS-2016-02782', 'Approved', 'Approved for publication and event preparation.', '2026-03-04 10:00:00+08'),
('REV-2026-006', 'PROP-2026-006', 'PLM-OSDS-2019-06772', 'Approved', 'Approved for publication and event preparation.', '2026-03-05 10:00:00+08'),
('REV-2026-007', 'PROP-2026-007', 'PLM-OSDS-2023-07723', 'Approved', 'Approved for publication and event preparation.', '2026-03-06 10:00:00+08'),
('REV-2026-008', 'PROP-2026-008', 'PLM-OSDS-2023-07776', 'Approved', 'Approved for publication and event preparation.', '2026-03-07 10:00:00+08'),
('REV-2026-009', 'PROP-2026-009', 'PLM-OSDS-2025-08912', 'Approved', 'Approved for publication and event preparation.', '2026-03-08 10:00:00+08'),
('REV-2026-010', 'PROP-2026-010', 'PLM-OSDS-2016-02782', 'Approved', 'Approved for publication and event preparation.', '2026-03-09 10:00:00+08'),
('REV-2026-011', 'PROP-2026-011', 'PLM-OSDS-2019-06772', 'Approved', 'Approved for publication and event preparation.', '2026-03-10 10:00:00+08'),
('REV-2026-012', 'PROP-2026-012', 'PLM-OSDS-2023-07723', 'Approved', 'Approved for publication and event preparation.', '2026-03-11 10:00:00+08'),
('REV-2026-013', 'PROP-2026-013', 'PLM-OSDS-2023-07776', 'Approved', 'Approved for publication and event preparation.', '2026-03-12 10:00:00+08'),
('REV-2026-014', 'PROP-2026-014', 'PLM-OSDS-2025-08912', 'Approved', 'Approved for publication and event preparation.', '2026-03-13 10:00:00+08'),
('REV-2026-015', 'PROP-2026-015', 'PLM-OSDS-2016-02782', 'Approved', 'Approved for publication and event preparation.', '2026-03-14 10:00:00+08'),
('REV-2026-016', 'PROP-2026-016', 'PLM-OSDS-2019-06772', 'Approved', 'Approved for publication and event preparation.', '2026-03-15 10:00:00+08'),
('REV-2026-017', 'PROP-2026-017', 'PLM-OSDS-2023-07723', 'Approved', 'Approved for publication and event preparation.', '2026-03-16 10:00:00+08'),
('REV-2026-018', 'PROP-2026-018', 'PLM-OSDS-2023-07776', 'Approved', 'Approved for publication and event preparation.', '2026-03-17 10:00:00+08'),
('REV-2026-019', 'PROP-2026-019', 'PLM-OSDS-2025-08912', 'Approved', 'Approved for publication and event preparation.', '2026-03-18 10:00:00+08'),
('REV-2026-020', 'PROP-2026-020', 'PLM-OSDS-2016-02782', 'Revisions Required', 'Please revise the event plan and resubmit.', '2026-03-19 10:00:00+08'),
('REV-2026-021', 'PROP-2026-021', 'PLM-OSDS-2019-06772', 'Rejected', 'Proposal does not meet current activity requirements.', '2026-03-20 10:00:00+08'),
('REV-2026-022', 'PROP-2026-022', 'PLM-OSDS-2016-02782', 'Approved', 'Approved for publication.', '2026-04-05 09:00:00+08'),
('REV-2026-023', 'PROP-2026-023', 'PLM-OSDS-2019-06772', 'Approved', 'Approved for publication.', '2026-04-06 09:00:00+08')

ON CONFLICT ("review_id") DO NOTHING;

-- event: 17 new rows

INSERT INTO public."event" ("event_id", "event_type_id", "publication_status", "registration_status", "registration_capacity", "post_caption", "created_at", "published_at", "cancelled_at", "cancelled_by", "cancellation_reason", "rescheduled_at", "rescheduled_by", "rescheduled_reason", "completed_at", "archived_at", "starts_at", "ends_at", "org_id", "event_status", "proposal_id") VALUES

('EV-2026-004', 'ET01', 'Published', 'Open', '100', 'Join CISTM Career Forum! Free for eligible PLM students.', '2026-03-04 10:00:00+08', '2026-03-04 11:00:00+08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-04 09:00:00+08', '2026-05-04 12:00:00+08', 'PLMCISTMSC-ORG-09', 'Upcoming', 'PROP-2026-005'),
('EV-2026-005', 'ET17', 'Published', 'Open', '100', 'Join CHASS Arts Festival! Free for eligible PLM students.', '2026-03-05 10:00:00+08', '2026-03-05 11:00:00+08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-11 09:00:00+08', '2026-05-11 12:00:00+08', 'PLMCHASSSC-ORG-08', 'Upcoming', 'PROP-2026-006'),
('EV-2026-006', 'ET01', 'Published', 'Open', '100', 'Join Engineering Research Expo! Free for eligible PLM students.', '2026-03-06 10:00:00+08', '2026-03-06 11:00:00+08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-18 09:00:00+08', '2026-05-18 12:00:00+08', 'PLMSCSC-ORG-07', 'Upcoming', 'PROP-2026-007'),
('EV-2026-007', 'ET03', 'Published', 'Open', '100', 'Join Hospitality Skills Workshop! Free for eligible PLM students.', '2026-03-07 10:00:00+08', '2026-03-07 11:00:00+08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-25 09:00:00+08', '2026-05-25 12:00:00+08', 'PLMCTHMSC-ORG-13', 'Upcoming', 'PROP-2026-008'),
('EV-2026-008', 'ET02', 'Published', 'Open', '40', 'Join Electronics Innovation Day! Free for eligible PLM students.', '2026-03-08 10:00:00+08', '2026-03-08 11:00:00+08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-01 09:00:00+08', '2026-06-01 12:00:00+08', 'PLMECESS-ORG-17', 'Upcoming', 'PROP-2026-009'),
('EV-2026-009', 'ET03', 'Published', 'Open', '40', 'Join Cloud Computing Bootcamp! Free for eligible PLM students.', '2026-03-09 10:00:00+08', '2026-03-09 11:00:00+08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-08 09:00:00+08', '2026-06-08 12:00:00+08', 'PLMAWSS-ORG-40', 'Upcoming', 'PROP-2026-010'),
('EV-2026-010', 'ET03', 'Published', 'Open', '100', 'Join Red Cross First Aid Training! Free for eligible PLM students.', '2026-03-10 10:00:00+08', '2026-03-10 11:00:00+08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-15 09:00:00+08', '2026-06-15 12:00:00+08', 'PLMCRCYC-ORG-46', 'Upcoming', 'PROP-2026-011'),
('EV-2026-011', 'ET01', 'Published', 'Open', '100', 'Join Public Service Leadership Forum! Free for eligible PLM students.', '2026-03-11 10:00:00+08', '2026-03-11 11:00:00+08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-22 09:00:00+08', '2026-06-22 12:00:00+08', 'PLMCPA-ORG-12', 'Upcoming', 'PROP-2026-012'),
('EV-2026-012', 'ET03', 'Published', 'Open', '100', 'Join Campus Journalism Workshop! Free for eligible PLM students.', '2026-03-12 10:00:00+08', '2026-03-12 11:00:00+08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-29 09:00:00+08', '2026-06-29 12:00:00+08', 'PLMAP-ORG-02', 'Upcoming', 'PROP-2026-013'),
('EV-2026-013', 'ET01', 'Published', 'Open', '100', 'Join Student Accountability Seminar! Free for eligible PLM students.', '2026-03-13 10:00:00+08', '2026-03-13 11:00:00+08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-06 09:00:00+08', '2026-07-06 12:00:00+08', 'PLMCOAA-ORG-03', 'Upcoming', 'PROP-2026-014'),
('EV-2026-014', 'ET05', 'Published', 'Open', '100', 'Join Student Election Orientation! Free for eligible PLM students.', '2026-03-14 10:00:00+08', '2026-03-14 11:00:00+08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-13 09:00:00+08', '2026-07-13 12:00:00+08', 'PLMCOMELEC-ORG-04', 'Upcoming', 'PROP-2026-015'),
('EV-2026-015', 'ET06', 'Published', 'Open', '0', 'Join Financial Literacy Webinar! Free for eligible PLM students.', '2026-03-15 10:00:00+08', '2026-03-15 11:00:00+08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-20 09:00:00+08', '2026-07-20 12:00:00+08', 'PLMJFINEX-ORG-18', 'Upcoming', 'PROP-2026-016'),
('EV-2026-016', 'ET01', 'Published', 'Open', '100', 'Join Child Rights Awareness Forum! Free for eligible PLM students.', '2026-03-16 10:00:00+08', '2026-03-16 11:00:00+08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-27 09:00:00+08', '2026-07-27 12:00:00+08', 'PLM-CRADLEORG-45', 'Upcoming', 'PROP-2026-017'),
('EV-2026-017', 'ET04', 'Published', 'Open', '100', 'Join Disaster Preparedness Drill! Free for eligible PLM students.', '2026-03-17 10:00:00+08', '2026-03-17 11:00:00+08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-03 09:00:00+08', '2026-08-03 12:00:00+08', 'PLMTUGONRESCUE-ORG-54', 'Upcoming', 'PROP-2026-018'),
('EV-2026-018', 'ET05', 'Published', 'Open', '100', 'Join Community Wellness Assembly! Free for eligible PLM students.', '2026-03-18 10:00:00+08', '2026-03-18 11:00:00+08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-10 09:00:00+08', '2026-08-10 12:00:00+08', 'PLMCMC-ORG-55', 'Upcoming', 'PROP-2026-019'),
('EV-2026-021', 'ET01', 'Published', 'Open', '200', 'Join Campus Sustainability Forum.', '2026-04-05 09:00:00+08', '2026-04-05 11:00:00+08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-07 09:00:00+08', '2026-09-07 12:00:00+08', 'PLMCISTMSC-ORG-09', 'Upcoming', 'PROP-2026-022'),
('EV-2026-022', 'ET01', 'Published', 'Open', '200', 'Join Student Entrepreneurship Fair.', '2026-04-06 09:00:00+08', '2026-04-06 11:00:00+08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-14 09:00:00+08', '2026-09-14 12:00:00+08', 'PLMCHASSSC-ORG-08', 'Upcoming', 'PROP-2026-023')

ON CONFLICT ("event_id") DO NOTHING;

-- venue_booking: 16 new rows

INSERT INTO public."venue_booking" ("booking_id", "event_id", "venue_id", "starts_at", "ends_at", "buffer_minutes", "booking_status", "authorized_by", "created_at", "change_reason", "status_changed_at") VALUES

('BOOK-2026-005', 'EV-2026-004', 'PLM-VENUE-10', '2026-05-04 09:00:00+08', '2026-05-04 12:00:00+08', '60', 'Confirmed', 'PLM-OSDS-2016-02782', '2026-03-04 10:00:00+08', NULL, '2026-03-04 10:00:00+08'),
('BOOK-2026-006', 'EV-2026-005', 'PLM-VENUE-8', '2026-05-11 09:00:00+08', '2026-05-11 12:00:00+08', '60', 'Confirmed', 'PLM-OSDS-2019-06772', '2026-03-05 10:00:00+08', NULL, '2026-03-05 10:00:00+08'),
('BOOK-2026-007', 'EV-2026-006', 'PLM-VENUE-5', '2026-05-18 09:00:00+08', '2026-05-18 12:00:00+08', '60', 'Confirmed', 'PLM-OSDS-2023-07723', '2026-03-06 10:00:00+08', NULL, '2026-03-06 10:00:00+08'),
('BOOK-2026-008', 'EV-2026-007', 'PLM-VENUE-9', '2026-05-25 09:00:00+08', '2026-05-25 12:00:00+08', '60', 'Confirmed', 'PLM-OSDS-2023-07776', '2026-03-07 10:00:00+08', NULL, '2026-03-07 10:00:00+08'),
('BOOK-2026-009', 'EV-2026-008', 'PLM-VENUE-2', '2026-06-01 09:00:00+08', '2026-06-01 12:00:00+08', '60', 'Confirmed', 'PLM-OSDS-2025-08912', '2026-03-08 10:00:00+08', NULL, '2026-03-08 10:00:00+08'),
('BOOK-2026-010', 'EV-2026-009', 'PLM-VENUE-3', '2026-06-08 09:00:00+08', '2026-06-08 12:00:00+08', '60', 'Confirmed', 'PLM-OSDS-2016-02782', '2026-03-09 10:00:00+08', NULL, '2026-03-09 10:00:00+08'),
('BOOK-2026-011', 'EV-2026-010', 'PLM-VENUE-1', '2026-06-15 09:00:00+08', '2026-06-15 12:00:00+08', '60', 'Confirmed', 'PLM-OSDS-2019-06772', '2026-03-10 10:00:00+08', NULL, '2026-03-10 10:00:00+08'),
('BOOK-2026-012', 'EV-2026-011', 'PLM-VENUE-6', '2026-06-22 09:00:00+08', '2026-06-22 12:00:00+08', '60', 'Confirmed', 'PLM-OSDS-2023-07723', '2026-03-11 10:00:00+08', NULL, '2026-03-11 10:00:00+08'),
('BOOK-2026-013', 'EV-2026-012', 'PLM-VENUE-10', '2026-06-29 09:00:00+08', '2026-06-29 12:00:00+08', '60', 'Confirmed', 'PLM-OSDS-2023-07776', '2026-03-12 10:00:00+08', NULL, '2026-03-12 10:00:00+08'),
('BOOK-2026-014', 'EV-2026-013', 'PLM-VENUE-1', '2026-07-06 09:00:00+08', '2026-07-06 12:00:00+08', '60', 'Confirmed', 'PLM-OSDS-2025-08912', '2026-03-13 10:00:00+08', NULL, '2026-03-13 10:00:00+08'),
('BOOK-2026-015', 'EV-2026-014', 'PLM-VENUE-5', '2026-07-13 09:00:00+08', '2026-07-13 12:00:00+08', '60', 'Confirmed', 'PLM-OSDS-2016-02782', '2026-03-14 10:00:00+08', NULL, '2026-03-14 10:00:00+08'),
('BOOK-2026-016', 'EV-2026-016', 'PLM-VENUE-9', '2026-07-27 09:00:00+08', '2026-07-27 12:00:00+08', '60', 'Confirmed', 'PLM-OSDS-2023-07723', '2026-03-16 10:00:00+08', NULL, '2026-03-16 10:00:00+08'),
('BOOK-2026-017', 'EV-2026-017', 'PLM-VENUE-8', '2026-08-03 09:00:00+08', '2026-08-03 12:00:00+08', '60', 'Confirmed', 'PLM-OSDS-2023-07776', '2026-03-17 10:00:00+08', NULL, '2026-03-17 10:00:00+08'),
('BOOK-2026-018', 'EV-2026-018', 'PLM-VENUE-15', '2026-08-10 09:00:00+08', '2026-08-10 12:00:00+08', '60', 'Confirmed', 'PLM-OSDS-2025-08912', '2026-03-18 10:00:00+08', NULL, '2026-03-18 10:00:00+08'),
('BOOK-2026-019', 'EV-2026-021', 'PLM-VENUE-15', '2026-09-07 09:00:00+08', '2026-09-07 12:00:00+08', '60', 'Confirmed', 'PLM-OSDS-2016-02782', '2026-04-05 09:00:00+08', NULL, '2026-04-05 09:00:00+08'),
('BOOK-2026-020', 'EV-2026-022', 'PLM-VENUE-15', '2026-09-14 09:00:00+08', '2026-09-14 12:00:00+08', '60', 'Confirmed', 'PLM-OSDS-2019-06772', '2026-04-06 09:00:00+08', NULL, '2026-04-06 09:00:00+08')

ON CONFLICT ("booking_id") DO NOTHING;

-- notifications: 17 new rows

INSERT INTO public."notifications" ("notification_id", "recipient_user_id", "event_id", "proposal_id", "notification_type", "message", "created_at", "read_at") VALUES

('9', 'PLMCISTMSC-ORG-09', 'EV-2026-004', 'PROP-2026-005', 'Proposal Approved', 'Your proposal for CISTM Career Forum has been approved.', '2026-03-04 10:05:00+08', NULL),
('10', 'PLMCHASSSC-ORG-08', 'EV-2026-005', 'PROP-2026-006', 'Proposal Approved', 'Your proposal for CHASS Arts Festival has been approved.', '2026-03-05 10:05:00+08', NULL),
('11', 'PLMSCSC-ORG-07', 'EV-2026-006', 'PROP-2026-007', 'Proposal Approved', 'Your proposal for Engineering Research Expo has been approved.', '2026-03-06 10:05:00+08', NULL),
('12', 'PLMCTHMSC-ORG-13', 'EV-2026-007', 'PROP-2026-008', 'Proposal Approved', 'Your proposal for Hospitality Skills Workshop has been approved.', '2026-03-07 10:05:00+08', NULL),
('13', 'PLMECESS-ORG-17', 'EV-2026-008', 'PROP-2026-009', 'Proposal Approved', 'Your proposal for Electronics Innovation Day has been approved.', '2026-03-08 10:05:00+08', NULL),
('14', 'PLMAWSS-ORG-40', 'EV-2026-009', 'PROP-2026-010', 'Proposal Approved', 'Your proposal for Cloud Computing Bootcamp has been approved.', '2026-03-09 10:05:00+08', NULL),
('15', 'PLMCRCYC-ORG-46', 'EV-2026-010', 'PROP-2026-011', 'Proposal Approved', 'Your proposal for Red Cross First Aid Training has been approved.', '2026-03-10 10:05:00+08', NULL),
('16', 'PLMCPA-ORG-12', 'EV-2026-011', 'PROP-2026-012', 'Proposal Approved', 'Your proposal for Public Service Leadership Forum has been approved.', '2026-03-11 10:05:00+08', NULL),
('17', 'PLMAP-ORG-02', 'EV-2026-012', 'PROP-2026-013', 'Proposal Approved', 'Your proposal for Campus Journalism Workshop has been approved.', '2026-03-12 10:05:00+08', NULL),
('18', 'PLMCOAA-ORG-03', 'EV-2026-013', 'PROP-2026-014', 'Proposal Approved', 'Your proposal for Student Accountability Seminar has been approved.', '2026-03-13 10:05:00+08', NULL),
('19', 'PLMCOMELEC-ORG-04', 'EV-2026-014', 'PROP-2026-015', 'Proposal Approved', 'Your proposal for Student Election Orientation has been approved.', '2026-03-14 10:05:00+08', NULL),
('20', 'PLMJFINEX-ORG-18', 'EV-2026-015', 'PROP-2026-016', 'Proposal Approved', 'Your proposal for Financial Literacy Webinar has been approved.', '2026-03-15 10:05:00+08', NULL),
('21', 'PLM-CRADLEORG-45', 'EV-2026-016', 'PROP-2026-017', 'Proposal Approved', 'Your proposal for Child Rights Awareness Forum has been approved.', '2026-03-16 10:05:00+08', NULL),
('22', 'PLMTUGONRESCUE-ORG-54', 'EV-2026-017', 'PROP-2026-018', 'Proposal Approved', 'Your proposal for Disaster Preparedness Drill has been approved.', '2026-03-17 10:05:00+08', NULL),
('23', 'PLMCMC-ORG-55', 'EV-2026-018', 'PROP-2026-019', 'Proposal Approved', 'Your proposal for Community Wellness Assembly has been approved.', '2026-03-18 10:05:00+08', NULL),
('24', 'PLMCISTMSC-ORG-09', 'EV-2026-021', 'PROP-2026-022', 'Proposal Approved', 'Campus Sustainability Forum has been approved.', '2026-04-05 09:00:00+08', NULL),
('25', 'PLMCHASSSC-ORG-08', 'EV-2026-022', 'PROP-2026-023', 'Proposal Approved', 'Student Entrepreneurship Fair has been approved.', '2026-04-06 09:00:00+08', NULL)

ON CONFLICT ("notification_id") DO NOTHING;

-- registration: 10 new rows

INSERT INTO public."registration" ("reg_id", "event_id", "student_number", "reg_date", "reg_status", "attendance_status", "cancelled_at", "cancellation_reason", "attendance_marked_at", "attendance_marked_by") VALUES

('REG-2026-034', 'EV-2026-004', '202615701', '2026-04-10 09:00:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
('REG-2026-035', 'EV-2026-004', '202515702', '2026-04-11 09:00:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
('REG-2026-036', 'EV-2026-004', '202415703', '2026-04-12 09:00:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
('REG-2026-037', 'EV-2026-004', '202315704', '2026-04-13 09:00:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
('REG-2026-038', 'EV-2026-004', '202615705', '2026-04-14 09:00:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
('REG-2026-039', 'EV-2026-004', '202515706', '2026-04-15 09:00:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
('REG-2026-040', 'EV-2026-004', '202415707', '2026-04-16 09:00:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
('REG-2026-041', 'EV-2026-004', '202315708', '2026-04-17 09:00:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
('REG-2026-042', 'EV-2026-004', '202615709', '2026-04-18 09:00:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
('REG-2026-043', 'EV-2026-004', '202515710', '2026-04-19 09:00:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL)

ON CONFLICT ("reg_id") DO NOTHING;

-- Advance notification identity sequence after explicit IDs

SELECT setval(pg_get_serial_sequence('public.notifications', 'notification_id'), GREATEST(COALESCE((SELECT MAX(notification_id) FROM public.notifications), 1), 1), true);

COMMIT;
