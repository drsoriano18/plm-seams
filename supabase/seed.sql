-- PLM SEAMS sample seed data aligned with ERD ver17 / Supabase schema
-- Source: supplied 'Sample Data - PLM SEAMS - Google Sheets.pdf'

BEGIN;

-- users: 52 rows
INSERT INTO users (user_id, plm_email, password, role, created_at) VALUES
  ('PLM-OSDS-2016-02782', 'jdmercado@plm.edu.ph', 'jdmercado2016', 'Admin', '2026-01-01 08:00:00+08'),
  ('PLM-OSDS-2019-06772', 'rpchu@plm.edu.ph', 'rpchu2019', 'Admin', '2026-01-02 08:00:00+08'),
  ('PLM-OSDS-2023-07723', 'erdtan@plm.edu.ph', 'erdtan2023', 'Admin', '2026-01-06 08:00:00+08'),
  ('PLM-OSDS-2023-07776', 'cbpreyes@plm.edu.ph', 'cbpreyes2023', 'Admin', '2026-01-07 08:00:00+08'),
  ('PLM-OSDS-2025-08912', 'crcbonifacio@plm.edu.ph', 'crcbonifacio2025', 'Admin', '2026-01-07 08:00:00+08'),
  ('PLMSSC-ORG-01', 'plmssc@plm.edu.ph', 'plmssc01', 'Student Organization', '2026-01-08 08:00:00+08'),
  ('PLMAP-ORG-02', 'ap@plm.edu.ph', 'ap02', 'Student Organization', '2026-01-09 08:00:00+08'),
  ('PLMCOAA-ORG-03', 'plmscoa@plm.edu.ph', 'plmscoa03', 'Student Organization', '2026-01-10 08:00:00+08'),
  ('PLMCOMELEC-ORG-04', 'plmcomelec@plm.edu.ph', 'plmcomelec04', 'Student Organization', '2026-01-11 08:00:00+08'),
  ('PLMSCSC-ORG-07', 'cesc@plm.edu.ph', 'cesc07', 'Student Organization', '2026-01-12 08:00:00+08'),
  ('PLMCHASSSC-ORG-08', 'chasssc@plm.edu.ph', 'chasssc08', 'Student Organization', '2026-01-13 08:00:00+08'),
  ('PLMCISTMSC-ORG-09', 'cistmsc@plm.edu.ph', 'cistmsc09', 'Student Organization', '2026-01-14 08:00:00+08'),
  ('PLMCPA-ORG-12', 'cpa@plm.edu.ph', 'cpa12', 'Student Organization', '2026-01-15 08:00:00+08'),
  ('PLMCTHMSC-ORG-13', 'cthmsc@plm.edu.ph', 'cthmsc13', 'Student Organization', '2026-01-16 08:00:00+08'),
  ('PLMECESS-ORG-17', 'ecessplm@plm.edu.ph', 'ecessplm17', 'Student Organization', '2026-01-17 08:00:00+08'),
  ('PLMJFINEX-ORG-18', 'jfinex@plm.edu.ph', 'jfinex18', 'Student Organization', '2026-01-18 08:00:00+08'),
  ('PLMCSS-ORG-29', 'plmcss@plm.edu.ph', 'plmcss29', 'Student Organization', '2026-01-04 08:00:00+08'),
  ('PLMAWSS-ORG-40', 'awss@plm.edu.ph', 'awss40', 'Student Organization', '2026-01-20 08:00:00+08'),
  ('PLMGDGOC-ORG-41', 'gdgoc@plm.edu.ph', 'gdgoc41', 'Student Organization', '2026-01-21 08:00:00+08'),
  ('PLM-CRADLEORG-45', 'cradle@plm.edu.ph', 'cradle45', 'Student Organization', '2026-01-22 08:00:00+08'),
  ('PLMCRCYC-ORG-46', 'crcyc@plm.edu.ph', 'crcyc46', 'Student Organization', '2026-01-23 08:00:00+08'),
  ('PLMPPG-ORG-51', 'ppg@plm.edu.ph', 'ppg51', 'Student Organization', '2026-01-24 08:00:00+08'),
  ('PLMSPADES-ORG-52', 'spades@plm.edu.ph', 'spades52', 'Student Organization', '2026-01-25 08:00:00+08'),
  ('PLMTUGONRESCUE-ORG-54', 'tugonrescue@plm.edu.ph', 'tugonrescue54', 'Student Organization', '2026-01-26 08:00:00+08'),
  ('PLMCMC-ORG-55', 'cmc@plm.edu.ph', 'cmc55', 'Student Organization', '2026-01-27 08:00:00+08'),
  ('PLMMASA-ORG-56', 'plmmasa@plm.edu.ph', 'plmmasa56', 'Student Organization', '2026-01-28 08:00:00+08'),
  ('PLMTJI-ORG-57', 'tji@plm.edu.ph', 'tji57', 'Student Organization', '2026-01-29 08:00:00+08'),
  ('202515006', 'kccayabyab2025@plm.edu.ph', 'kcc2025', 'Student', '2026-01-03 09:15:00+08'),
  ('202515001', 'amdisagan2025@plm.edu.ph', 'amdi2025', 'Student', '2026-01-04 10:30:00+08'),
  ('202515652', 'drssoriano2025@plm.edu.ph', 'drss2025', 'Student', '2026-01-05 08:45:00+08'),
  ('202515026', 'crbtingcungco2025@plm.edu.ph', 'crbt2025', 'Student', '2026-01-08 11:00:00+08'),
  ('202515101', 'lcdelacruz2025@plm.edu.ph', 'lcdc2025', 'Student', '2026-01-10 09:20:00+08'),
  ('202515114', 'cjmpena2025@plm.edu.ph', 'cjmp2025', 'Student', '2026-01-12 14:10:00+08'),
  ('202514203', 'akndelarosa2024@plm.edu.ph', 'akndr2024', 'Student', '2026-01-14 08:35:00+08'),
  ('202514217', 'ckblopez2024@plm.edu.ph', 'ckbl2024', 'Student', '2026-01-16 13:25:00+08'),
  ('202615301', 'scdrolas2026@plm.edu.ph', 'scdr2026', 'Student', '2026-01-18 10:05:00+08'),
  ('202615314', 'cdpateros2026@plm.edu.ph', 'cdp2026', 'Student', '2026-01-20 15:40:00+08'),
  ('202614427', 'mssantos2026@plm.edu.ph', 'mss2026', 'Student', '2026-01-22 09:50:00+08'),
  ('202415508', 'jmrivera2024@plm.edu.ph', 'jmr2024', 'Student', '2026-01-24 12:15:00+08'),
  ('202315519', 'bnlgarcia2023@plm.edu.ph', 'bnlg2023', 'Student', '2026-01-26 08:55:00+08'),
  ('202514531', 'mabautista2025@plm.edu.ph', 'mab2025', 'Student', '2026-01-28 16:20:00+08'),
  ('202514542', 'karmendoza2025@plm.edu.ph', 'karm2025', 'Student', '2026-01-30 10:40:00+08'),
  ('202315553', 'rtnavarro2023@plm.edu.ph', 'rtn2023', 'Student', '2026-02-02 09:10:00+08'),
  ('202615564', 'smpcruz2026@plm.edu.ph', 'smpc2026', 'Student', '2026-02-04 13:45:00+08'),
  ('202415575', 'acvillanueva2024@plm.edu.ph', 'acv2024', 'Student', '2026-02-06 11:30:00+08'),
  ('202315586', 'nframos2023@plm.edu.ph', 'nfr2023', 'Student', '2026-02-08 14:05:00+08'),
  ('202515597', 'gdflores2025@plm.edu.ph', 'gdf2025', 'Student', '2026-02-10 08:25:00+08'),
  ('202614608', 'abtorres2026@plm.edu.ph', 'abt2026', 'Student', '2026-02-12 15:15:00+08'),
  ('202415619', 'lmjaquino2024@plm.edu.ph', 'lmja2024', 'Student', '2026-02-14 10:50:00+08'),
  ('202514630', 'mcreyes2025@plm.edu.ph', 'mcvr2025', 'Student', '2026-02-16 09:35:00+08'),
  ('202315641', 'jkcastillo2023@plm.edu.ph', 'jkc2023', 'Student', '2026-02-18 14:30:00+08'),
  ('202515662', 'faglim2025@plm.edu.ph', 'fagl2025', 'Student', '2026-02-20 11:05:00+08');

-- students: 25 rows
INSERT INTO students (student_number, name, year_level, college, program) VALUES
  ('202515006', 'Kathreena C. Cayabyab', '2', 'CISTM', 'BSCS'),
  ('202515001', 'Aldrics Miguel D. Isagan', '2', 'CISTM', 'BSCS'),
  ('202515652', 'Dan Rodrick S. Soriano', '2', 'CISTM', 'BSCS'),
  ('202515026', 'Czhiaztee Raime B. Tingcungco', '2', 'CISTM', 'BSCS'),
  ('202515101', 'Leandrea C. Dela Cruz', '2', 'CISTM', 'BSCS'),
  ('202515114', 'Chloe Jennie M. Pena', '2', 'CISTM', 'BSIT'),
  ('202514203', 'Axel Kyle N. Dela Rosa', '2', 'CISTM', 'BSIT'),
  ('202514217', 'Chastine Katy B. Lopez', '2', 'CISTM', 'BSIT'),
  ('202615301', 'Sean Chester D. Rolas', '1', 'CISTM', 'BSIT'),
  ('202615314', 'Carlos D. Pateros', '1', 'CISTM', 'BSIT'),
  ('202614427', 'Mikaela S. Santos', '1', 'CBA', 'BSA'),
  ('202415508', 'Joshua M. Rivera', '3', 'CE', 'BSCpE'),
  ('202315519', 'Bea Nicole L. Garcia', '4', 'CTHM', 'BSTM'),
  ('202514531', 'Marvin A. Bautista', '2', 'CN', 'BSN'),
  ('202514542', 'Kyla Anne R. Mendoza', '2', 'CHASS', 'BSW'),
  ('202315553', 'Rafael T. Navarro', '4', 'CS', 'BS Math'),
  ('202615564', 'Sofia Mae P. Cruz', '1', 'CE', 'BSCE'),
  ('202415575', 'Adrian C. Villanueva', '3', 'CPT', 'BSPT'),
  ('202315586', 'Nina F. Ramos', '4', 'CBA', 'BSBA-MM'),
  ('202515597', 'Gabriel D. Flores', '2', 'CTHM', 'BSHM'),
  ('202614608', 'Angela B. Torres', '1', 'CE', 'BSEE'),
  ('202415619', 'Luis Miguel J. Aquino', '3', 'CHASS', 'BAC'),
  ('202514630', 'Maria Celeste V. Reyes', '2', 'CS', 'BSPSY'),
  ('202315641', 'Jared K. Castillo', '4', 'CBA', 'BSBA-HRM'),
  ('202515662', 'Faith Anne G. Lim', '2', 'CTHM', 'BSTM');

-- student_organization: 22 rows
INSERT INTO student_organization (org_id, org_name, org_type, acronym, college, accreditation_status) VALUES
  ('PLMSSC-ORG-01', 'The PLM Supreme Student Council', 'Academic', 'PLM-SSC', NULL, TRUE),
  ('PLMAP-ORG-02', 'Ang Pamantasan', 'Academic', 'AP', NULL, TRUE),
  ('PLMCOAA-ORG-03', 'PLM Student Commission on Audit', 'Academic', 'PLM SCOA', NULL, TRUE),
  ('PLMCOMELEC-ORG-04', 'PLM Student Commission on Elections', 'Academic', 'PLM COMELEC', NULL, TRUE),
  ('PLMSCSC-ORG-07', 'College of Engineering Student Council', 'Academic', 'CE-SC', 'CE', TRUE),
  ('PLMCHASSSC-ORG-08', 'College of Humanities, Arts and Social Sciences Student Council', 'Academic', 'CHASS-SC', 'CHASS', TRUE),
  ('PLMCISTMSC-ORG-09', 'College of Information Systems and Technology Management', 'Academic', 'CISTM-SC', 'CISTM', TRUE),
  ('PLMCPA-ORG-12', 'College of Public Administration', 'Academic', 'CPA', 'CPA', TRUE),
  ('PLMCTHMSC-ORG-13', 'College of Tourism and Hospitality Management Student Council', 'Academic', 'CTHM-SC', 'CTHM', TRUE),
  ('PLMECESS-ORG-17', 'Electronics Engineering Student’s Society PLM', 'Academic', 'ECESS-PLM', 'CE', TRUE),
  ('PLMJFINEX-ORG-18', 'Junior Financial Executives PLM', 'Academic', 'JFINEX', 'CBA', FALSE),
  ('PLMCSS-ORG-29', 'PLM Computer Science Society', 'Academic', 'PLM-CSS', 'CISTM', TRUE),
  ('PLMAWSS-ORG-40', 'Amazon Web Services Cloud Club - Haribon', 'University-Wide', 'AWSS', 'CISTM', TRUE),
  ('PLMGDGOC-ORG-41', 'Google Developer Groups on Campus PLM', 'University-Wide', 'GDGOC', 'CISTM', TRUE),
  ('PLM-CRADLEORG-45', 'PLM Children’s Rights Advocates League', 'University-Wide', 'CRAdLe', NULL, TRUE),
  ('PLMCRCYC-ORG-46', 'PLM College Red Cross Youth Council', 'University-Wide', 'CRCYC', NULL, TRUE),
  ('PLMPPG-ORG-51', 'PLM Propaganda', 'University-Wide', 'PPG', NULL, TRUE),
  ('PLMSPADES-ORG-52', 'PLM Speech and Debate Society', 'University-Wide', 'SPADES', NULL, TRUE),
  ('PLMTUGONRESCUE-ORG-54', 'TUGON - Rescuing Students for Community Undertaking and Edification', 'University-Wide', 'TUGONReSCUE', NULL, TRUE),
  ('PLMCMC-ORG-55', 'Christ’s Medical Circle', 'Religious', 'CMC', NULL, TRUE),
  ('PLMMASA-ORG-56', 'PLM Muslim Association for Student Affairs', 'Religious', 'PLM MASA', NULL, FALSE),
  ('PLMTJI-ORG-57', 'PLM The Jesus Impact', 'Religious', 'TJI', NULL, FALSE);

-- administrations: 5 rows
INSERT INTO administrations (admin_id, name, position, office_assigned) VALUES
  ('PLM-OSDS-2016-02782', 'Juan D. Mercado', 'Head', 'PLM Office of Student Development and Services'),
  ('PLM-OSDS-2019-06772', 'Raquel P. Chu', 'Co-Head', 'PLM Office of Student Development and Services'),
  ('PLM-OSDS-2023-07723', 'Elena Rose D. Tan', 'Administrative Staff I', 'PLM Office of Student Development and Services'),
  ('PLM-OSDS-2023-07776', 'Christian Bern P. Reyes', 'Administrative Staff I', 'PLM Office of Student Development and Services'),
  ('PLM-OSDS-2025-08912', 'Charles Reece C. Bonifacio', 'Administrative Staff I', 'PLM Office of Student Development and Services');

-- event_type: 20 rows
INSERT INTO event_type (event_type_id, description, modality, requires_venue) VALUES
  ('ET01', 'Seminar', 'On-Site', TRUE),
  ('ET02', 'Competition', 'On-Site', TRUE),
  ('ET03', 'Workshop', 'On-Site', TRUE),
  ('ET04', 'Outreach', 'On-Site', TRUE),
  ('ET05', 'Assembly', 'On-Site', TRUE),
  ('ET06', 'Webinar', 'Online', FALSE),
  ('ET07', 'Seminar', 'Hybrid', TRUE),
  ('ET08', 'Competition', 'Online', FALSE),
  ('ET09', 'Competition', 'Hybrid', TRUE),
  ('ET10', 'Workshop', 'Online', FALSE),
  ('ET11', 'Workshop', 'Hybrid', TRUE),
  ('ET12', 'Outreach', 'Online', FALSE),
  ('ET13', 'Outreach', 'Hybrid', TRUE),
  ('ET14', 'Assembly', 'Online', FALSE),
  ('ET15', 'Assembly', 'Hybrid', TRUE),
  ('ET16', 'Sports', 'On-Site', TRUE),
  ('ET17', 'Festival', 'On-Site', TRUE),
  ('ET18', 'Fundraising', 'On-Site', TRUE),
  ('ET19', 'Mass', 'On-Site', TRUE),
  ('ET20', 'Online Mass', 'Online', FALSE);

-- venue: 15 rows
INSERT INTO venue (venue_id, venue_name, floor_number, room_number, building, max_capacity, available_equipment) VALUES
  ('PLM-VENUE-1', 'Bukod Tanging Bulwagan (BTB)', 'Third_Floor', NULL, 'Gusaling Katipunan', '150', 'Chairs, Sound System, Projector, Airconditioning'),
  ('PLM-VENUE-2', 'Computer Laboratory 1-2', 'Second_Floor', NULL, 'Gusaling Villegas', '40', 'Chairs, Computers, Monitors, Projector, Airconditioning'),
  ('PLM-VENUE-3', 'Computer Laboratory 3-4', 'Fourth_Floor', NULL, 'Gusaling Villegas', '40', 'Chairs, Computers, Monitors, Projector, Airconditioning'),
  ('PLM-VENUE-4', 'GEE Katipunan Lounge', 'Ground_Floor', NULL, 'Gusaling Ejercito Estrada', '125', NULL),
  ('PLM-VENUE-5', 'Justo Alberto Auditorium (JAA)', 'Ground_Floor', NULL, 'Gusaling Lacson', '500', 'Chairs, Sound System, Projector, Airconditioning'),
  ('PLM-VENUE-6', 'PLM Celso Al Carunungan Memorial Library', 'Ground_Floor', NULL, 'Gusaling Katipunan', '200', 'Chairs, Computers, Monitors, Projector, Airconditioning, Fans'),
  ('PLM-VENUE-7', 'PLM Facade', 'Ground_Floor', NULL, 'PLM Facade', '200', NULL),
  ('PLM-VENUE-8', 'PLM Field', NULL, NULL, 'PLM', '1000', NULL),
  ('PLM-VENUE-9', 'PLM GCA Audio Visual Room (AVR)', 'Second_Floor', 'Room 1 & 2', 'Gusaling Corazon Aquino', '120', 'Chairs, Sound System, Tables, Projector, Airconditioning'),
  ('PLM-VENUE-10', 'PLM GEE Audio Visual Room (AVR)', 'Second_Floor', 'Room 1 & 2', 'Gusaling Ejercito Estrada', '120', 'Chairs, Sound System, Tables, Projector, Airconditioning'),
  ('PLM-VENUE-11', 'PLM Lobby', 'Ground_Floor', NULL, 'PLM Facade', '150', NULL),
  ('PLM-VENUE-12', 'PLM Shrine of Jesus, the Divine Teacher', NULL, NULL, 'PLM', '150', 'Chairs, Sound System, Tables, Projector, Fans'),
  ('PLM-VENUE-13', 'Rajah Sulayman Gym', NULL, NULL, 'PLM', '500', 'Chairs, Sound System, Tables, Fans, Mats and Balls'),
  ('PLM-VENUE-14', 'Tanghalang Bayan', NULL, NULL, 'PLM Field', '100', NULL),
  ('PLM-VENUE-15', 'University Activity Center (UAC)', NULL, NULL, 'PLM', '400', 'Chairs, Sound System, Tables, Projector, Fans');

-- event_proposal: 4 rows
INSERT INTO event_proposal (proposal_id, org_id, objectives, description, submission_date, approval_status, expected_count_attendees, event_name, event_type_id, allowed_college, eligibility_mode, resource_requirements, budget_information, includes_sponsorship, collaborating_organization_text) VALUES
  ('PROP-2026-001', 'PLMCSS-ORG-29', 'CSS Tech Summit is an event hosted to introduce and encourage CISTM students to use the new Gemini AI Model (Argon 4) and learn responsible technology practices.', 'A free on-site seminar featuring computing talks, demonstrations, and student discussions.', '2026-01-05 09:00:00+08', 'Approved', '120', 'CSS Tech Summit', 'ET01', 'CISTM', 'College-Specific', 'Projector, microphones, sound system, tables, and stable internet access.', 'PHP 12000 proposed for materials and logistics; no admission fee or portal payment processing.', FALSE, NULL),
  ('PROP-2026-002', 'PLMSSC-ORG-01', 'Haribon Clash is an event led by PLM SSC to promote sportsmanship, student participation, and cooperation across PLM colleges.', 'A free university-wide sports competition led and managed by PLMSSC with collaborating organizations acknowledged.', '2026-01-19 10:00:00+08', 'Approved', '400', 'Haribon Clash', 'ET16', NULL, 'University-Wide', 'Sports equipment, mats, sound system, tables, and first-aid support.', 'PHP 35000 proposed for sports materials, first-aid supplies, and logistics; participation is free.', FALSE, 'CISTM Student Council; CHASS Student Council; PLM Student Commission on Audit (COAA/SCOA); PLM COMELEC; ECESS-PLM; College of Public Administration (CPA); CTHM Student Council. PLMSSC remains the sole lead organizer.'),
  ('PROP-2026-003', 'PLMGDGOC-ORG-41', 'GDGOC Hackathon is a mini-contest focused on tech beginners that encourages students to develop collaborative problem-solving and practical software-development skills.', 'A free university-wide on-site coding competition for eligible PLM students from all programs, organized solely by GDGOC.', '2026-01-22 09:30:00+08', 'Approved', '40', 'GDGOC Hackathon', 'ET02', NULL, 'University-Wide', 'Laboratory computers, projector, stable internet access, and extension outlets.', 'PHP 8000 proposed for materials and logistics; no entry fee or payment processing.', FALSE, NULL),
  ('PROP-2026-004', 'PLMSPADES-ORG-52', 'Debates 101 aims to teach students introductory argumentation skills, evidence evaluation, and respectful debate manners. Includes live demonstration of formal debate formats.', 'A free on-site introductory debate workshop organized solely by PLM SPADES.', '2026-02-16 09:00:00+08', 'Revisions Required', '100', 'Debates 101', 'ET03', NULL, 'University-Wide', 'Projector, microphones, tables, and printed practice materials.', 'PHP 3000 preliminary estimate for printing and workshop materials; itemized breakdown subject to revision.', FALSE, NULL);

-- proposal_schedule: 8 rows
INSERT INTO proposal_schedule (schedule_id, proposal_id, venue_id, starts_at, ends_at, schedule_type) VALUES
  ('SCH-2026-001', 'PROP-2026-001', 'PLM-VENUE-9', '2026-02-20 09:00:00+08', '2026-02-20 12:00:00+08', 'Primary'),
  ('SCH-2026-002', 'PROP-2026-001', 'PLM-VENUE-10', '2026-02-27 09:00:00+08', '2026-02-27 12:00:00+08', 'Backup'),
  ('SCH-2026-003', 'PROP-2026-002', 'PLM-VENUE-13', '2026-03-20 08:00:00+08', '2026-03-20 17:00:00+08', 'Primary'),
  ('SCH-2026-004', 'PROP-2026-002', 'PLM-VENUE-8', '2026-03-27 08:00:00+08', '2026-03-27 17:00:00+08', 'Backup'),
  ('SCH-2026-005', 'PROP-2026-003', 'PLM-VENUE-2', '2026-03-06 09:00:00+08', '2026-03-06 17:00:00+08', 'Primary'),
  ('SCH-2026-006', 'PROP-2026-003', 'PLM-VENUE-3', '2026-03-13 09:00:00+08', '2026-03-13 17:00:00+08', 'Backup'),
  ('SCH-2026-007', 'PROP-2026-004', 'PLM-VENUE-10', '2026-03-20 13:00:00+08', '2026-03-20 16:00:00+08', 'Primary'),
  ('SCH-2026-008', 'PROP-2026-004', 'PLM-VENUE-1', '2026-03-27 13:00:00+08', '2026-03-27 16:00:00+08', 'Backup');

-- proposal_review: 4 rows
INSERT INTO proposal_review (review_id, proposal_id, admin_id, review_decision, admin_remarks, reviewed_at) VALUES
  ('REV-2026-001', 'PROP-2026-001', 'PLM-OSDS-2016-02782', 'Approved', 'Primary schedule approved. Lead organization may prepare publication and open registration.', '2026-01-12 11:00:00+08'),
  ('REV-2026-002', 'PROP-2026-002', 'PLM-OSDS-2019-06772', 'Approved', 'Primary schedule approved. PLMSSC retains sole management; listed collaborators receive no additional permissions.', '2026-01-20 09:15:00+08'),
  ('REV-2026-003', 'PROP-2026-003', 'PLM-OSDS-2016-02782', 'Approved', 'Primary laboratory schedule approved for a maximum of 40 participants.', '2026-01-28 10:00:00+08'),
  ('REV-2026-004', 'PROP-2026-004', 'PLM-OSDS-2023-07723', 'Revisions Required', 'Provide the detailed workshop program flow, facilitator assignments, and itemized budget breakdown before resubmission.', '2026-02-18 08:52:10+08');

-- event: 3 rows
INSERT INTO event (event_id, event_type_id, publication_status, registration_status, registration_capacity, post_caption, created_at, published_at, cancelled_at, cancelled_by, cancellation_reason, rescheduled_at, rescheduled_by, rescheduled_reason, completed_at, archived_at, starts_at, ends_at, org_id, event_status, proposal_id) VALUES
  ('EV-2026-001', 'ET01', 'Published', 'Open', '120', 'Join CSS Tech Summit for computing talks, demonstrations, and student discussions. Free for eligible CISTM students. Updated schedule: February 27, 2026, 9 AM to 12 PM, GEE AVR.', '2026-01-12 11:00:00+08', '2026-01-20 12:00:00+08', NULL, NULL, NULL, '2026-02-05 07:55:00+08', 'PLM-OSDS-2016-02782', 'Administrator-authorized move to the backup schedule and venue due to speaker availability.', NULL, NULL, '2026-02-27 09:00:00+08', '2026-02-27 12:00:00+08', 'PLMCSS-ORG-29', 'Upcoming', 'PROP-2026-001'),
  ('EV-2026-002', 'ET16', 'Published', 'Open', '400', 'Join Haribon Clash, the free PLMSSC-led sports competition. March 20, 2026, 8 AM to 5 PM at Rajah Sulayman Gym. Open to eligible PLM students university-wide.', '2026-01-20 09:15:00+08', '2026-01-21 10:00:00+08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-20 08:00:00+08', '2026-03-20 17:00:00+08', 'PLMSSC-ORG-01', 'Upcoming', 'PROP-2026-002'),
  ('EV-2026-003', 'ET02', 'Published', 'Closed', '40', 'GDGOC Hackathon is cancelled due to emergency venue repairs. Registration is closed. Please refer to portal notifications for updates.', '2026-01-28 10:00:00+08', '2026-01-29 09:00:00+08', '2026-02-10 10:00:00+08', 'PLM-OSDS-2016-02782', 'Emergency venue repairs.', NULL, NULL, NULL, NULL, NULL, '2026-03-06 09:00:00+08', '2026-03-06 17:00:00+08', 'PLMGDGOC-ORG-41', 'Cancelled', 'PROP-2026-003');

-- registration: 33 rows
INSERT INTO registration (reg_id, event_id, student_number, reg_date, reg_status, attendance_status, cancelled_at, cancellation_reason, attendance_marked_at, attendance_marked_by) VALUES
  ('REG-2026-001', 'EV-2026-001', '202515006', '2026-02-01 10:00:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-002', 'EV-2026-001', '202515001', '2026-02-02 14:30:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-003', 'EV-2026-001', '202515652', '2026-02-02 09:00:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-004', 'EV-2026-001', '202515026', '2026-02-02 09:10:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-005', 'EV-2026-001', '202515101', '2026-02-02 09:20:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-006', 'EV-2026-001', '202515114', '2026-02-02 09:30:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-007', 'EV-2026-001', '202514203', '2026-02-02 09:40:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-008', 'EV-2026-001', '202514217', '2026-02-02 09:50:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-009', 'EV-2026-001', '202615301', '2026-02-02 10:00:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-010', 'EV-2026-001', '202615314', '2026-02-02 10:10:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-011', 'EV-2026-003', '202515006', '2026-02-03 09:00:00+08', 'Cancelled', NULL, '2026-02-10 10:00:00+08', 'Event cancelled by OSDS due to emergency venue repairs.', NULL, NULL),
  ('REG-2026-012', 'EV-2026-003', '202515114', '2026-02-03 10:00:00+08', 'Cancelled', NULL, '2026-02-10 10:00:00+08', 'Event cancelled by OSDS due to emergency venue repairs.', NULL, NULL),
  ('REG-2026-013', 'EV-2026-003', '202614427', '2026-02-03 11:00:00+08', 'Cancelled', NULL, '2026-02-10 10:00:00+08', 'Event cancelled by OSDS due to emergency venue repairs.', NULL, NULL),
  ('REG-2026-014', 'EV-2026-003', '202415508', '2026-02-03 12:00:00+08', 'Cancelled', NULL, '2026-02-10 10:00:00+08', 'Event cancelled by OSDS due to emergency venue repairs.', NULL, NULL),
  ('REG-2026-015', 'EV-2026-003', '202315519', '2026-02-03 13:00:00+08', 'Cancelled', NULL, '2026-02-10 10:00:00+08', 'Event cancelled by OSDS due to emergency venue repairs.', NULL, NULL),
  ('REG-2026-016', 'EV-2026-003', '202514531', '2026-02-03 14:00:00+08', 'Cancelled', NULL, '2026-02-10 10:00:00+08', 'Event cancelled by OSDS due to emergency venue repairs.', NULL, NULL),
  ('REG-2026-017', 'EV-2026-003', '202514542', '2026-02-03 15:00:00+08', 'Cancelled', NULL, '2026-02-10 10:00:00+08', 'Event cancelled by OSDS due to emergency venue repairs.', NULL, NULL),
  ('REG-2026-018', 'EV-2026-002', '202515006', '2026-02-19 09:00:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-019', 'EV-2026-002', '202515114', '2026-02-19 09:10:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-020', 'EV-2026-002', '202614427', '2026-02-19 09:20:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-021', 'EV-2026-002', '202415508', '2026-02-19 09:30:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-022', 'EV-2026-002', '202315519', '2026-02-19 09:40:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-023', 'EV-2026-002', '202514531', '2026-02-19 09:50:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-024', 'EV-2026-002', '202514542', '2026-02-19 10:00:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-025', 'EV-2026-002', '202315553', '2026-02-19 10:10:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-026', 'EV-2026-002', '202615564', '2026-02-19 10:20:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-027', 'EV-2026-002', '202415575', '2026-02-19 10:30:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-028', 'EV-2026-002', '202315586', '2026-02-19 10:40:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-029', 'EV-2026-002', '202515597', '2026-02-19 10:50:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-030', 'EV-2026-002', '202614608', '2026-02-19 11:00:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-031', 'EV-2026-002', '202415619', '2026-02-19 11:10:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-032', 'EV-2026-002', '202514630', '2026-02-19 11:20:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
  ('REG-2026-033', 'EV-2026-002', '202315641', '2026-02-19 11:30:00+08', 'Confirmed', NULL, NULL, NULL, NULL, NULL);

-- venue_booking: 4 rows
INSERT INTO venue_booking (booking_id, event_id, venue_id, starts_at, ends_at, buffer_minutes, booking_status, authorized_by, created_at, change_reason, status_changed_at) VALUES
  ('BOOK-2026-001', 'EV-2026-001', 'PLM-VENUE-9', '2026-02-20 09:00:00+08', '2026-02-20 12:00:00+08', '60', 'Replaced', 'PLM-OSDS-2016-02782', '2026-01-12 11:00:00+08', 'Administrator-authorized move to the backup schedule and venue due to speaker availability.', '2026-02-05 07:55:00+08'),
  ('BOOK-2026-002', 'EV-2026-002', 'PLM-VENUE-13', '2026-03-20 08:00:00+08', '2026-03-20 17:00:00+08', '60', 'Confirmed', 'PLM-OSDS-2019-06772', '2026-01-20 09:15:00+08', NULL, '2026-01-20 09:15:00+08'),
  ('BOOK-2026-003', 'EV-2026-003', 'PLM-VENUE-2', '2026-03-06 09:00:00+08', '2026-03-06 17:00:00+08', '60', 'Cancelled', 'PLM-OSDS-2016-02782', '2026-01-28 10:00:00+08', 'Emergency venue repairs.', '2026-02-10 10:00:00+08'),
  ('BOOK-2026-004', 'EV-2026-001', 'PLM-VENUE-10', '2026-02-27 09:00:00+08', '2026-02-27 12:00:00+08', '60', 'Confirmed', 'PLM-OSDS-2016-02782', '2026-02-05 07:55:00+08', 'Administrator-authorized move to the backup schedule and venue due to speaker availability.', '2026-02-05 07:55:00+08');

-- notifications: 8 rows
INSERT INTO notifications (notification_id, recipient_user_id, event_id, proposal_id, notification_type, message, created_at, read_at) VALUES
  ('1', 'PLMCSS-ORG-29', 'EV-2026-001', 'PROP-2026-001', 'Proposal Approved', 'Your event proposal for "CSS Tech Summit" has been reviewed and approved by OSDS. Ready for publish and registration.', '2026-01-12 11:00:00+08', '2026-01-12 11:15:00+08'),
  ('2', '202515006', 'EV-2026-001', 'PROP-2026-001', 'Registration Successful', 'You have successfully submitted your registration request for the CSS Tech Summit! Kindly wait for confirmation of registration.', '2026-02-01 10:00:00+08', '2026-02-01 10:05:00+08'),
  ('3', '202515006', 'EV-2026-001', 'PROP-2026-001', 'Registration Confirmed', 'Your registration status for the CSS Tech Summit has been confirmed! We are excited to see you there!', '2026-02-01 10:01:00+08', '2026-02-01 10:10:00+08'),
  ('4', '202515001', 'EV-2026-001', 'PROP-2026-001', 'Registration Confirmed', 'Your registration for CSS Tech Summit is confirmed. Please check the portal for the latest event schedule.', '2026-02-02 14:30:00+08', NULL),
  ('5', 'PLMSSC-ORG-01', 'EV-2026-002', 'PROP-2026-002', 'Proposal Approved', 'Your event proposal "Haribon Clash" has been reviewed and approved by OSDS. Ready for publish and registration.', '2026-01-20 09:15:00+08', '2026-01-20 10:00:00+08'),
  ('6', 'PLMGDGOC-ORG-41', 'EV-2026-003', 'PROP-2026-003', 'Event Cancelled', 'The event "GDGOC Hackathon" has been cancelled due to emergency venue repairs.', '2026-02-10 10:05:00+08', NULL),
  ('7', 'PLMCSS-ORG-29', 'EV-2026-001', 'PROP-2026-001', 'Event Rescheduled', 'The schedule for "CSS Tech Summit" has been updated. Please check the portal for the new time.', '2026-02-05 08:00:00+08', '2026-02-05 09:00:00+08'),
  ('8', 'PLMSPADES-ORG-52', NULL, 'PROP-2026-004', 'Revisions Required', 'Your event proposal "Debates 101" requires revisions. Please check the admin remarks.', '2026-02-18 08:52:10+08', NULL);

-- Synchronize the identity sequence after explicit notification IDs 1-8.
SELECT setval(pg_get_serial_sequence('public.notifications','notification_id'),
              (SELECT MAX(notification_id) FROM public.notifications));

COMMIT;
