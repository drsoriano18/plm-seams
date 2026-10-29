SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict dJf8naNr9NDR3FAzJSdh96ivP1sgAG0Tq8eOHr8T2fg2y8NnafDe6bQrfuAN7HK

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("user_id", "plm_email", "password", "role", "created_at") VALUES
	('PLM-OSDS-2016-02782', 'jdmercado@plm.edu.ph', 'jdmercado2016', 'Admin', '2026-01-01 00:00:00+00'),
	('PLM-OSDS-2019-06772', 'rpchu@plm.edu.ph', 'rpchu2019', 'Admin', '2026-01-02 00:00:00+00'),
	('PLM-OSDS-2023-07723', 'erdtan@plm.edu.ph', 'erdtan2023', 'Admin', '2026-01-06 00:00:00+00'),
	('PLM-OSDS-2023-07776', 'cbpreyes@plm.edu.ph', 'cbpreyes2023', 'Admin', '2026-01-07 00:00:00+00'),
	('PLM-OSDS-2025-08912', 'crcbonifacio@plm.edu.ph', 'crcbonifacio2025', 'Admin', '2026-01-07 00:00:00+00'),
	('PLMSSC-ORG-01', 'plmssc@plm.edu.ph', 'plmssc01', 'Student Organization', '2026-01-08 00:00:00+00'),
	('PLMAP-ORG-02', 'ap@plm.edu.ph', 'ap02', 'Student Organization', '2026-01-09 00:00:00+00'),
	('PLMCOAA-ORG-03', 'plmscoa@plm.edu.ph', 'plmscoa03', 'Student Organization', '2026-01-10 00:00:00+00'),
	('PLMCOMELEC-ORG-04', 'plmcomelec@plm.edu.ph', 'plmcomelec04', 'Student Organization', '2026-01-11 00:00:00+00'),
	('PLMSCSC-ORG-07', 'cesc@plm.edu.ph', 'cesc07', 'Student Organization', '2026-01-12 00:00:00+00'),
	('PLMCHASSSC-ORG-08', 'chasssc@plm.edu.ph', 'chasssc08', 'Student Organization', '2026-01-13 00:00:00+00'),
	('PLMCISTMSC-ORG-09', 'cistmsc@plm.edu.ph', 'cistmsc09', 'Student Organization', '2026-01-14 00:00:00+00'),
	('PLMCPA-ORG-12', 'cpa@plm.edu.ph', 'cpa12', 'Student Organization', '2026-01-15 00:00:00+00'),
	('PLMCTHMSC-ORG-13', 'cthmsc@plm.edu.ph', 'cthmsc13', 'Student Organization', '2026-01-16 00:00:00+00'),
	('PLMECESS-ORG-17', 'ecessplm@plm.edu.ph', 'ecessplm17', 'Student Organization', '2026-01-17 00:00:00+00'),
	('PLMJFINEX-ORG-18', 'jfinex@plm.edu.ph', 'jfinex18', 'Student Organization', '2026-01-18 00:00:00+00'),
	('PLMCSS-ORG-29', 'plmcss@plm.edu.ph', 'plmcss29', 'Student Organization', '2026-01-04 00:00:00+00'),
	('PLMAWSS-ORG-40', 'awss@plm.edu.ph', 'awss40', 'Student Organization', '2026-01-20 00:00:00+00'),
	('PLMGDGOC-ORG-41', 'gdgoc@plm.edu.ph', 'gdgoc41', 'Student Organization', '2026-01-21 00:00:00+00'),
	('PLM-CRADLEORG-45', 'cradle@plm.edu.ph', 'cradle45', 'Student Organization', '2026-01-22 00:00:00+00'),
	('PLMCRCYC-ORG-46', 'crcyc@plm.edu.ph', 'crcyc46', 'Student Organization', '2026-01-23 00:00:00+00'),
	('PLMPPG-ORG-51', 'ppg@plm.edu.ph', 'ppg51', 'Student Organization', '2026-01-24 00:00:00+00'),
	('PLMSPADES-ORG-52', 'spades@plm.edu.ph', 'spades52', 'Student Organization', '2026-01-25 00:00:00+00'),
	('PLMTUGONRESCUE-ORG-54', 'tugonrescue@plm.edu.ph', 'tugonrescue54', 'Student Organization', '2026-01-26 00:00:00+00'),
	('PLMCMC-ORG-55', 'cmc@plm.edu.ph', 'cmc55', 'Student Organization', '2026-01-27 00:00:00+00'),
	('PLMMASA-ORG-56', 'plmmasa@plm.edu.ph', 'plmmasa56', 'Student Organization', '2026-01-28 00:00:00+00'),
	('PLMTJI-ORG-57', 'tji@plm.edu.ph', 'tji57', 'Student Organization', '2026-01-29 00:00:00+00'),
	('202515006', 'kccayabyab2025@plm.edu.ph', 'kcc2025', 'Student', '2026-01-03 01:15:00+00'),
	('202515001', 'amdisagan2025@plm.edu.ph', 'amdi2025', 'Student', '2026-01-04 02:30:00+00'),
	('202515652', 'drssoriano2025@plm.edu.ph', 'drss2025', 'Student', '2026-01-05 00:45:00+00'),
	('202515026', 'crbtingcungco2025@plm.edu.ph', 'crbt2025', 'Student', '2026-01-08 03:00:00+00'),
	('202515101', 'lcdelacruz2025@plm.edu.ph', 'lcdc2025', 'Student', '2026-01-10 01:20:00+00'),
	('202515114', 'cjmpena2025@plm.edu.ph', 'cjmp2025', 'Student', '2026-01-12 06:10:00+00'),
	('202514203', 'akndelarosa2024@plm.edu.ph', 'akndr2024', 'Student', '2026-01-14 00:35:00+00'),
	('202514217', 'ckblopez2024@plm.edu.ph', 'ckbl2024', 'Student', '2026-01-16 05:25:00+00'),
	('202615301', 'scdrolas2026@plm.edu.ph', 'scdr2026', 'Student', '2026-01-18 02:05:00+00'),
	('202615314', 'cdpateros2026@plm.edu.ph', 'cdp2026', 'Student', '2026-01-20 07:40:00+00'),
	('202614427', 'mssantos2026@plm.edu.ph', 'mss2026', 'Student', '2026-01-22 01:50:00+00'),
	('202415508', 'jmrivera2024@plm.edu.ph', 'jmr2024', 'Student', '2026-01-24 04:15:00+00'),
	('202315519', 'bnlgarcia2023@plm.edu.ph', 'bnlg2023', 'Student', '2026-01-26 00:55:00+00'),
	('202514531', 'mabautista2025@plm.edu.ph', 'mab2025', 'Student', '2026-01-28 08:20:00+00'),
	('202514542', 'karmendoza2025@plm.edu.ph', 'karm2025', 'Student', '2026-01-30 02:40:00+00'),
	('202315553', 'rtnavarro2023@plm.edu.ph', 'rtn2023', 'Student', '2026-02-02 01:10:00+00'),
	('202615564', 'smpcruz2026@plm.edu.ph', 'smpc2026', 'Student', '2026-02-04 05:45:00+00'),
	('202415575', 'acvillanueva2024@plm.edu.ph', 'acv2024', 'Student', '2026-02-06 03:30:00+00'),
	('202315586', 'nframos2023@plm.edu.ph', 'nfr2023', 'Student', '2026-02-08 06:05:00+00'),
	('202515597', 'gdflores2025@plm.edu.ph', 'gdf2025', 'Student', '2026-02-10 00:25:00+00'),
	('202614608', 'abtorres2026@plm.edu.ph', 'abt2026', 'Student', '2026-02-12 07:15:00+00'),
	('202415619', 'lmjaquino2024@plm.edu.ph', 'lmja2024', 'Student', '2026-02-14 02:50:00+00'),
	('202514630', 'mcreyes2025@plm.edu.ph', 'mcvr2025', 'Student', '2026-02-16 01:35:00+00'),
	('202315641', 'jkcastillo2023@plm.edu.ph', 'jkc2023', 'Student', '2026-02-18 06:30:00+00'),
	('202515662', 'faglim2025@plm.edu.ph', 'fagl2025', 'Student', '2026-02-20 03:05:00+00'),
	('202615701', 'ermendoza2026@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-10 01:00:00+00'),
	('202515702', 'imsantos2025@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-11 01:00:00+00'),
	('202415703', 'npreyes2024@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-12 01:00:00+00'),
	('202315704', 'ogcruz2023@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-13 01:00:00+00'),
	('202615705', 'lbaquino2026@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-14 01:00:00+00'),
	('202515706', 'sltorres2025@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-15 01:00:00+00'),
	('202415707', 'edramos2024@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-16 01:00:00+00'),
	('202315708', 'mcflores2023@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-17 01:00:00+00'),
	('202615709', 'lvgarcia2026@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-18 01:00:00+00'),
	('202515710', 'anbautista2025@plm.edu.ph', '!DISABLED_SAMPLE_ACCOUNT!', 'Student', '2026-03-19 01:00:00+00');


--
-- Data for Name: administrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."administrations" ("admin_id", "name", "position", "office_assigned") VALUES
	('PLM-OSDS-2016-02782', 'Juan D. Mercado', 'Head', 'PLM Office of Student Development and Services'),
	('PLM-OSDS-2019-06772', 'Raquel P. Chu', 'Co-Head', 'PLM Office of Student Development and Services'),
	('PLM-OSDS-2023-07723', 'Elena Rose D. Tan', 'Administrative Staff I', 'PLM Office of Student Development and Services'),
	('PLM-OSDS-2023-07776', 'Christian Bern P. Reyes', 'Administrative Staff I', 'PLM Office of Student Development and Services'),
	('PLM-OSDS-2025-08912', 'Charles Reece C. Bonifacio', 'Administrative Staff I', 'PLM Office of Student Development and Services');


--
-- Data for Name: event_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."event_type" ("event_type_id", "description", "modality", "requires_venue") VALUES
	('ET01', 'Seminar', 'On-Site', true),
	('ET02', 'Competition', 'On-Site', true),
	('ET03', 'Workshop', 'On-Site', true),
	('ET04', 'Outreach', 'On-Site', true),
	('ET05', 'Assembly', 'On-Site', true),
	('ET06', 'Webinar', 'Online', false),
	('ET07', 'Seminar', 'Hybrid', true),
	('ET08', 'Competition', 'Online', false),
	('ET09', 'Competition', 'Hybrid', true),
	('ET10', 'Workshop', 'Online', false),
	('ET11', 'Workshop', 'Hybrid', true),
	('ET12', 'Outreach', 'Online', false),
	('ET13', 'Outreach', 'Hybrid', true),
	('ET14', 'Assembly', 'Online', false),
	('ET15', 'Assembly', 'Hybrid', true),
	('ET16', 'Sports', 'On-Site', true),
	('ET17', 'Festival', 'On-Site', true),
	('ET18', 'Fundraising', 'On-Site', true),
	('ET19', 'Mass', 'On-Site', true),
	('ET20', 'Online Mass', 'Online', false);


--
-- Data for Name: student_organization; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."student_organization" ("org_id", "org_name", "org_type", "acronym", "college", "accreditation_status") VALUES
	('PLMSSC-ORG-01', 'The PLM Supreme Student Council', 'Academic', 'PLM-SSC', NULL, true),
	('PLMAP-ORG-02', 'Ang Pamantasan', 'Academic', 'AP', NULL, true),
	('PLMCOAA-ORG-03', 'PLM Student Commission on Audit', 'Academic', 'PLM SCOA', NULL, true),
	('PLMCOMELEC-ORG-04', 'PLM Student Commission on Elections', 'Academic', 'PLM COMELEC', NULL, true),
	('PLMSCSC-ORG-07', 'College of Engineering Student Council', 'Academic', 'CE-SC', 'CE', true),
	('PLMCHASSSC-ORG-08', 'College of Humanities, Arts and Social Sciences Student Council', 'Academic', 'CHASS-SC', 'CHASS', true),
	('PLMCISTMSC-ORG-09', 'College of Information Systems and Technology Management', 'Academic', 'CISTM-SC', 'CISTM', true),
	('PLMCPA-ORG-12', 'College of Public Administration', 'Academic', 'CPA', 'CPA', true),
	('PLMCTHMSC-ORG-13', 'College of Tourism and Hospitality Management Student Council', 'Academic', 'CTHM-SC', 'CTHM', true),
	('PLMECESS-ORG-17', 'Electronics Engineering Student’s Society PLM', 'Academic', 'ECESS-PLM', 'CE', true),
	('PLMJFINEX-ORG-18', 'Junior Financial Executives PLM', 'Academic', 'JFINEX', 'CBA', false),
	('PLMCSS-ORG-29', 'PLM Computer Science Society', 'Academic', 'PLM-CSS', 'CISTM', true),
	('PLMAWSS-ORG-40', 'Amazon Web Services Cloud Club - Haribon', 'University-Wide', 'AWSS', 'CISTM', true),
	('PLMGDGOC-ORG-41', 'Google Developer Groups on Campus PLM', 'University-Wide', 'GDGOC', 'CISTM', true),
	('PLM-CRADLEORG-45', 'PLM Children’s Rights Advocates League', 'University-Wide', 'CRAdLe', NULL, true),
	('PLMCRCYC-ORG-46', 'PLM College Red Cross Youth Council', 'University-Wide', 'CRCYC', NULL, true),
	('PLMPPG-ORG-51', 'PLM Propaganda', 'University-Wide', 'PPG', NULL, true),
	('PLMSPADES-ORG-52', 'PLM Speech and Debate Society', 'University-Wide', 'SPADES', NULL, true),
	('PLMTUGONRESCUE-ORG-54', 'TUGON - Rescuing Students for Community Undertaking and Edification', 'University-Wide', 'TUGONReSCUE', NULL, true),
	('PLMCMC-ORG-55', 'Christ’s Medical Circle', 'Religious', 'CMC', NULL, true),
	('PLMMASA-ORG-56', 'PLM Muslim Association for Student Affairs', 'Religious', 'PLM MASA', NULL, false),
	('PLMTJI-ORG-57', 'PLM The Jesus Impact', 'Religious', 'TJI', NULL, false);


--
-- Data for Name: event_proposal; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."event_proposal" ("proposal_id", "org_id", "objectives", "description", "submission_date", "approval_status", "expected_count_attendees", "event_name", "event_type_id", "allowed_college", "eligibility_mode", "resource_requirements", "budget_information", "includes_sponsorship", "collaborating_organization_text") VALUES
	('PROP-2026-001', 'PLMCSS-ORG-29', 'CSS Tech Summit is an event hosted to introduce and encourage CISTM students to use the new Gemini AI Model (Argon 4) and learn responsible technology practices.', 'A free on-site seminar featuring computing talks, demonstrations, and student discussions.', '2026-01-05 01:00:00+00', 'Approved', 120, 'CSS Tech Summit', 'ET01', 'CISTM', 'College-Specific', 'Projector, microphones, sound system, tables, and stable internet access.', 'PHP 12000 proposed for materials and logistics; no admission fee or portal payment processing.', false, NULL),
	('PROP-2026-002', 'PLMSSC-ORG-01', 'Haribon Clash is an event led by PLM SSC to promote sportsmanship, student participation, and cooperation across PLM colleges.', 'A free university-wide sports competition led and managed by PLMSSC with collaborating organizations acknowledged.', '2026-01-19 02:00:00+00', 'Approved', 400, 'Haribon Clash', 'ET16', NULL, 'University-Wide', 'Sports equipment, mats, sound system, tables, and first-aid support.', 'PHP 35000 proposed for sports materials, first-aid supplies, and logistics; participation is free.', false, 'CISTM Student Council; CHASS Student Council; PLM Student Commission on Audit (COAA/SCOA); PLM COMELEC; ECESS-PLM; College of Public Administration (CPA); CTHM Student Council. PLMSSC remains the sole lead organizer.'),
	('PROP-2026-003', 'PLMGDGOC-ORG-41', 'GDGOC Hackathon is a mini-contest focused on tech beginners that encourages students to develop collaborative problem-solving and practical software-development skills.', 'A free university-wide on-site coding competition for eligible PLM students from all programs, organized solely by GDGOC.', '2026-01-22 01:30:00+00', 'Approved', 40, 'GDGOC Hackathon', 'ET02', NULL, 'University-Wide', 'Laboratory computers, projector, stable internet access, and extension outlets.', 'PHP 8000 proposed for materials and logistics; no entry fee or payment processing.', false, NULL),
	('PROP-2026-004', 'PLMSPADES-ORG-52', 'Debates 101 aims to teach students introductory argumentation skills, evidence evaluation, and respectful debate manners. Includes live demonstration of formal debate formats.', 'A free on-site introductory debate workshop organized solely by PLM SPADES.', '2026-02-16 01:00:00+00', 'Revisions Required', 100, 'Debates 101', 'ET03', NULL, 'University-Wide', 'Projector, microphones, tables, and printed practice materials.', 'PHP 3000 preliminary estimate for printing and workshop materials; itemized breakdown subject to revision.', false, NULL),
	('PROP-2026-005', 'PLMCISTMSC-ORG-09', 'To strengthen student skills and engagement through cistm career forum.', 'Free student-led cistm career forum with practical learning activities.', '2026-03-01 01:00:00+00', 'Approved', 100, 'CISTM Career Forum', 'ET01', NULL, 'University-Wide', 'Projector and microphones', 'PHP 3000 proposed for logistics and materials', false, NULL),
	('PROP-2026-006', 'PLMCHASSSC-ORG-08', 'To strengthen student skills and engagement through chass arts festival.', 'Free student-led chass arts festival with practical learning activities.', '2026-03-02 01:00:00+00', 'Approved', 100, 'CHASS Arts Festival', 'ET17', NULL, 'University-Wide', 'Projector and microphones', 'PHP 3500 proposed for logistics and materials', false, NULL),
	('PROP-2026-007', 'PLMSCSC-ORG-07', 'To strengthen student skills and engagement through engineering research expo.', 'Free student-led engineering research expo with practical learning activities.', '2026-03-03 01:00:00+00', 'Approved', 100, 'Engineering Research Expo', 'ET01', NULL, 'University-Wide', 'Projector and microphones', 'PHP 4000 proposed for logistics and materials', false, NULL),
	('PROP-2026-008', 'PLMCTHMSC-ORG-13', 'To strengthen student skills and engagement through hospitality skills workshop.', 'Free student-led hospitality skills workshop with practical learning activities.', '2026-03-04 01:00:00+00', 'Approved', 100, 'Hospitality Skills Workshop', 'ET03', NULL, 'University-Wide', 'Projector and microphones', 'PHP 4500 proposed for logistics and materials', false, NULL),
	('PROP-2026-009', 'PLMECESS-ORG-17', 'To strengthen student skills and engagement through electronics innovation day.', 'Free student-led electronics innovation day with practical learning activities.', '2026-03-05 01:00:00+00', 'Approved', 40, 'Electronics Innovation Day', 'ET02', NULL, 'University-Wide', 'Projector and microphones', 'PHP 5000 proposed for logistics and materials', false, NULL),
	('PROP-2026-010', 'PLMAWSS-ORG-40', 'To strengthen student skills and engagement through cloud computing bootcamp.', 'Free student-led cloud computing bootcamp with practical learning activities.', '2026-03-06 01:00:00+00', 'Approved', 40, 'Cloud Computing Bootcamp', 'ET03', NULL, 'University-Wide', 'Projector and microphones', 'PHP 5500 proposed for logistics and materials', false, NULL),
	('PROP-2026-011', 'PLMCRCYC-ORG-46', 'To strengthen student skills and engagement through red cross first aid training.', 'Free student-led red cross first aid training with practical learning activities.', '2026-03-07 01:00:00+00', 'Approved', 100, 'Red Cross First Aid Training', 'ET03', NULL, 'University-Wide', 'Projector and microphones', 'PHP 6000 proposed for logistics and materials', false, NULL),
	('PROP-2026-012', 'PLMCPA-ORG-12', 'To strengthen student skills and engagement through public service leadership forum.', 'Free student-led public service leadership forum with practical learning activities.', '2026-03-08 01:00:00+00', 'Approved', 100, 'Public Service Leadership Forum', 'ET01', NULL, 'University-Wide', 'Projector and microphones', 'PHP 6500 proposed for logistics and materials', false, NULL),
	('PROP-2026-013', 'PLMAP-ORG-02', 'To strengthen student skills and engagement through campus journalism workshop.', 'Free student-led campus journalism workshop with practical learning activities.', '2026-03-09 01:00:00+00', 'Approved', 100, 'Campus Journalism Workshop', 'ET03', NULL, 'University-Wide', 'Projector and microphones', 'PHP 7000 proposed for logistics and materials', false, NULL),
	('PROP-2026-014', 'PLMCOAA-ORG-03', 'To strengthen student skills and engagement through student accountability seminar.', 'Free student-led student accountability seminar with practical learning activities.', '2026-03-10 01:00:00+00', 'Approved', 100, 'Student Accountability Seminar', 'ET01', NULL, 'University-Wide', 'Projector and microphones', 'PHP 7500 proposed for logistics and materials', false, NULL),
	('PROP-2026-015', 'PLMCOMELEC-ORG-04', 'To strengthen student skills and engagement through student election orientation.', 'Free student-led student election orientation with practical learning activities.', '2026-03-11 01:00:00+00', 'Approved', 100, 'Student Election Orientation', 'ET05', NULL, 'University-Wide', 'Projector and microphones', 'PHP 8000 proposed for logistics and materials', false, NULL),
	('PROP-2026-016', 'PLMJFINEX-ORG-18', 'To strengthen student skills and engagement through financial literacy webinar.', 'Free student-led financial literacy webinar with practical learning activities.', '2026-03-12 01:00:00+00', 'Approved', 0, 'Financial Literacy Webinar', 'ET06', NULL, 'University-Wide', 'Video conferencing platform', 'PHP 8500 proposed for logistics and materials', false, NULL),
	('PROP-2026-017', 'PLM-CRADLEORG-45', 'To strengthen student skills and engagement through child rights awareness forum.', 'Free student-led child rights awareness forum with practical learning activities.', '2026-03-13 01:00:00+00', 'Approved', 100, 'Child Rights Awareness Forum', 'ET01', NULL, 'University-Wide', 'Projector and microphones', 'PHP 9000 proposed for logistics and materials', false, NULL),
	('PROP-2026-018', 'PLMTUGONRESCUE-ORG-54', 'To strengthen student skills and engagement through disaster preparedness drill.', 'Free student-led disaster preparedness drill with practical learning activities.', '2026-03-14 01:00:00+00', 'Approved', 100, 'Disaster Preparedness Drill', 'ET04', NULL, 'University-Wide', 'Projector and microphones', 'PHP 9500 proposed for logistics and materials', false, NULL),
	('PROP-2026-019', 'PLMCMC-ORG-55', 'To strengthen student skills and engagement through community wellness assembly.', 'Free student-led community wellness assembly with practical learning activities.', '2026-03-15 01:00:00+00', 'Approved', 100, 'Community Wellness Assembly', 'ET05', NULL, 'University-Wide', 'Projector and microphones', 'PHP 10000 proposed for logistics and materials', false, NULL),
	('PROP-2026-020', 'PLMSSC-ORG-01', 'To strengthen student skills and engagement through student leadership summit.', 'Free student-led student leadership summit with practical learning activities.', '2026-03-16 01:00:00+00', 'Revisions Required', 100, 'Student Leadership Summit', 'ET01', NULL, 'University-Wide', 'Projector and microphones', 'PHP 10500 proposed for logistics and materials', false, NULL),
	('PROP-2026-021', 'PLMCSS-ORG-29', 'To strengthen student skills and engagement through cs research colloquium.', 'Free student-led cs research colloquium with practical learning activities.', '2026-03-17 01:00:00+00', 'Rejected', 100, 'CS Research Colloquium', 'ET01', NULL, 'University-Wide', 'Projector and microphones', 'PHP 11000 proposed for logistics and materials', false, NULL),
	('PROP-2026-022', 'PLMCISTMSC-ORG-09', 'Promote student participation in campus sustainability forum.', 'Free on-site campus sustainability forum.', '2026-04-01 01:00:00+00', 'Approved', 200, 'Campus Sustainability Forum', 'ET01', NULL, 'University-Wide', 'Sound system, chairs, projector', 'PHP 10000 for logistics', false, NULL),
	('PROP-2026-023', 'PLMCHASSSC-ORG-08', 'Promote student participation in student entrepreneurship fair.', 'Free on-site student entrepreneurship fair.', '2026-04-02 01:00:00+00', 'Approved', 200, 'Student Entrepreneurship Fair', 'ET01', NULL, 'University-Wide', 'Sound system, chairs, projector', 'PHP 10000 for logistics', false, NULL);


--
-- Data for Name: event; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."event" ("event_id", "event_type_id", "publication_status", "registration_status", "registration_capacity", "post_caption", "created_at", "published_at", "cancelled_at", "cancelled_by", "cancellation_reason", "rescheduled_at", "rescheduled_by", "rescheduled_reason", "completed_at", "archived_at", "starts_at", "ends_at", "org_id", "event_status", "proposal_id") VALUES
	('EV-2026-001', 'ET01', 'Published', 'Open', 120, 'Join CSS Tech Summit for computing talks, demonstrations, and student discussions. Free for eligible CISTM students. Updated schedule: February 27, 2026, 9 AM to 12 PM, GEE AVR.', '2026-01-12 03:00:00+00', '2026-01-20 04:00:00+00', NULL, NULL, NULL, '2026-02-04 23:55:00+00', 'PLM-OSDS-2016-02782', 'Administrator-authorized move to the backup schedule and venue due to speaker availability.', NULL, NULL, '2026-02-27 01:00:00+00', '2026-02-27 04:00:00+00', 'PLMCSS-ORG-29', 'Upcoming', 'PROP-2026-001'),
	('EV-2026-002', 'ET16', 'Published', 'Open', 400, 'Join Haribon Clash, the free PLMSSC-led sports competition. March 20, 2026, 8 AM to 5 PM at Rajah Sulayman Gym. Open to eligible PLM students university-wide.', '2026-01-20 01:15:00+00', '2026-01-21 02:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-20 00:00:00+00', '2026-03-20 09:00:00+00', 'PLMSSC-ORG-01', 'Upcoming', 'PROP-2026-002'),
	('EV-2026-003', 'ET02', 'Published', 'Closed', 40, 'GDGOC Hackathon is cancelled due to emergency venue repairs. Registration is closed. Please refer to portal notifications for updates.', '2026-01-28 02:00:00+00', '2026-01-29 01:00:00+00', '2026-02-10 02:00:00+00', 'PLM-OSDS-2016-02782', 'Emergency venue repairs.', NULL, NULL, NULL, NULL, NULL, '2026-03-06 01:00:00+00', '2026-03-06 09:00:00+00', 'PLMGDGOC-ORG-41', 'Cancelled', 'PROP-2026-003'),
	('EV-2026-004', 'ET01', 'Published', 'Open', 100, 'Join CISTM Career Forum! Free for eligible PLM students.', '2026-03-04 02:00:00+00', '2026-03-04 03:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-04 01:00:00+00', '2026-05-04 04:00:00+00', 'PLMCISTMSC-ORG-09', 'Upcoming', 'PROP-2026-005'),
	('EV-2026-005', 'ET17', 'Published', 'Open', 100, 'Join CHASS Arts Festival! Free for eligible PLM students.', '2026-03-05 02:00:00+00', '2026-03-05 03:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-11 01:00:00+00', '2026-05-11 04:00:00+00', 'PLMCHASSSC-ORG-08', 'Upcoming', 'PROP-2026-006'),
	('EV-2026-006', 'ET01', 'Published', 'Open', 100, 'Join Engineering Research Expo! Free for eligible PLM students.', '2026-03-06 02:00:00+00', '2026-03-06 03:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-18 01:00:00+00', '2026-05-18 04:00:00+00', 'PLMSCSC-ORG-07', 'Upcoming', 'PROP-2026-007'),
	('EV-2026-007', 'ET03', 'Published', 'Open', 100, 'Join Hospitality Skills Workshop! Free for eligible PLM students.', '2026-03-07 02:00:00+00', '2026-03-07 03:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-25 01:00:00+00', '2026-05-25 04:00:00+00', 'PLMCTHMSC-ORG-13', 'Upcoming', 'PROP-2026-008'),
	('EV-2026-008', 'ET02', 'Published', 'Open', 40, 'Join Electronics Innovation Day! Free for eligible PLM students.', '2026-03-08 02:00:00+00', '2026-03-08 03:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-01 01:00:00+00', '2026-06-01 04:00:00+00', 'PLMECESS-ORG-17', 'Upcoming', 'PROP-2026-009'),
	('EV-2026-009', 'ET03', 'Published', 'Open', 40, 'Join Cloud Computing Bootcamp! Free for eligible PLM students.', '2026-03-09 02:00:00+00', '2026-03-09 03:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-08 01:00:00+00', '2026-06-08 04:00:00+00', 'PLMAWSS-ORG-40', 'Upcoming', 'PROP-2026-010'),
	('EV-2026-010', 'ET03', 'Published', 'Open', 100, 'Join Red Cross First Aid Training! Free for eligible PLM students.', '2026-03-10 02:00:00+00', '2026-03-10 03:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-15 01:00:00+00', '2026-06-15 04:00:00+00', 'PLMCRCYC-ORG-46', 'Upcoming', 'PROP-2026-011'),
	('EV-2026-011', 'ET01', 'Published', 'Open', 100, 'Join Public Service Leadership Forum! Free for eligible PLM students.', '2026-03-11 02:00:00+00', '2026-03-11 03:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-22 01:00:00+00', '2026-06-22 04:00:00+00', 'PLMCPA-ORG-12', 'Upcoming', 'PROP-2026-012'),
	('EV-2026-012', 'ET03', 'Published', 'Open', 100, 'Join Campus Journalism Workshop! Free for eligible PLM students.', '2026-03-12 02:00:00+00', '2026-03-12 03:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-29 01:00:00+00', '2026-06-29 04:00:00+00', 'PLMAP-ORG-02', 'Upcoming', 'PROP-2026-013'),
	('EV-2026-013', 'ET01', 'Published', 'Open', 100, 'Join Student Accountability Seminar! Free for eligible PLM students.', '2026-03-13 02:00:00+00', '2026-03-13 03:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-06 01:00:00+00', '2026-07-06 04:00:00+00', 'PLMCOAA-ORG-03', 'Upcoming', 'PROP-2026-014'),
	('EV-2026-014', 'ET05', 'Published', 'Open', 100, 'Join Student Election Orientation! Free for eligible PLM students.', '2026-03-14 02:00:00+00', '2026-03-14 03:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-13 01:00:00+00', '2026-07-13 04:00:00+00', 'PLMCOMELEC-ORG-04', 'Upcoming', 'PROP-2026-015'),
	('EV-2026-015', 'ET06', 'Published', 'Open', 0, 'Join Financial Literacy Webinar! Free for eligible PLM students.', '2026-03-15 02:00:00+00', '2026-03-15 03:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-20 01:00:00+00', '2026-07-20 04:00:00+00', 'PLMJFINEX-ORG-18', 'Upcoming', 'PROP-2026-016'),
	('EV-2026-016', 'ET01', 'Published', 'Open', 100, 'Join Child Rights Awareness Forum! Free for eligible PLM students.', '2026-03-16 02:00:00+00', '2026-03-16 03:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-27 01:00:00+00', '2026-07-27 04:00:00+00', 'PLM-CRADLEORG-45', 'Upcoming', 'PROP-2026-017'),
	('EV-2026-017', 'ET04', 'Published', 'Open', 100, 'Join Disaster Preparedness Drill! Free for eligible PLM students.', '2026-03-17 02:00:00+00', '2026-03-17 03:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-03 01:00:00+00', '2026-08-03 04:00:00+00', 'PLMTUGONRESCUE-ORG-54', 'Upcoming', 'PROP-2026-018'),
	('EV-2026-018', 'ET05', 'Published', 'Open', 100, 'Join Community Wellness Assembly! Free for eligible PLM students.', '2026-03-18 02:00:00+00', '2026-03-18 03:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-10 01:00:00+00', '2026-08-10 04:00:00+00', 'PLMCMC-ORG-55', 'Upcoming', 'PROP-2026-019'),
	('EV-2026-021', 'ET01', 'Published', 'Open', 200, 'Join Campus Sustainability Forum.', '2026-04-05 01:00:00+00', '2026-04-05 03:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-07 01:00:00+00', '2026-09-07 04:00:00+00', 'PLMCISTMSC-ORG-09', 'Upcoming', 'PROP-2026-022'),
	('EV-2026-022', 'ET01', 'Published', 'Open', 200, 'Join Student Entrepreneurship Fair.', '2026-04-06 01:00:00+00', '2026-04-06 03:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-14 01:00:00+00', '2026-09-14 04:00:00+00', 'PLMCHASSSC-ORG-08', 'Upcoming', 'PROP-2026-023');


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notifications" ("notification_id", "recipient_user_id", "event_id", "proposal_id", "notification_type", "message", "created_at", "read_at") VALUES
	(1, 'PLMCSS-ORG-29', 'EV-2026-001', 'PROP-2026-001', 'Proposal Approved', 'Your event proposal for "CSS Tech Summit" has been reviewed and approved by OSDS. Ready for publish and registration.', '2026-01-12 03:00:00+00', '2026-01-12 03:15:00+00'),
	(2, '202515006', 'EV-2026-001', 'PROP-2026-001', 'Registration Successful', 'You have successfully submitted your registration request for the CSS Tech Summit! Kindly wait for confirmation of registration.', '2026-02-01 02:00:00+00', '2026-02-01 02:05:00+00'),
	(3, '202515006', 'EV-2026-001', 'PROP-2026-001', 'Registration Confirmed', 'Your registration status for the CSS Tech Summit has been confirmed! We are excited to see you there!', '2026-02-01 02:01:00+00', '2026-02-01 02:10:00+00'),
	(4, '202515001', 'EV-2026-001', 'PROP-2026-001', 'Registration Confirmed', 'Your registration for CSS Tech Summit is confirmed. Please check the portal for the latest event schedule.', '2026-02-02 06:30:00+00', NULL),
	(5, 'PLMSSC-ORG-01', 'EV-2026-002', 'PROP-2026-002', 'Proposal Approved', 'Your event proposal "Haribon Clash" has been reviewed and approved by OSDS. Ready for publish and registration.', '2026-01-20 01:15:00+00', '2026-01-20 02:00:00+00'),
	(6, 'PLMGDGOC-ORG-41', 'EV-2026-003', 'PROP-2026-003', 'Event Cancelled', 'The event "GDGOC Hackathon" has been cancelled due to emergency venue repairs.', '2026-02-10 02:05:00+00', NULL),
	(7, 'PLMCSS-ORG-29', 'EV-2026-001', 'PROP-2026-001', 'Event Rescheduled', 'The schedule for "CSS Tech Summit" has been updated. Please check the portal for the new time.', '2026-02-05 00:00:00+00', '2026-02-05 01:00:00+00'),
	(8, 'PLMSPADES-ORG-52', NULL, 'PROP-2026-004', 'Revisions Required', 'Your event proposal "Debates 101" requires revisions. Please check the admin remarks.', '2026-02-18 00:52:10+00', NULL),
	(9, 'PLMCISTMSC-ORG-09', 'EV-2026-004', 'PROP-2026-005', 'Proposal Approved', 'Your proposal for CISTM Career Forum has been approved.', '2026-03-04 02:05:00+00', NULL),
	(10, 'PLMCHASSSC-ORG-08', 'EV-2026-005', 'PROP-2026-006', 'Proposal Approved', 'Your proposal for CHASS Arts Festival has been approved.', '2026-03-05 02:05:00+00', NULL),
	(11, 'PLMSCSC-ORG-07', 'EV-2026-006', 'PROP-2026-007', 'Proposal Approved', 'Your proposal for Engineering Research Expo has been approved.', '2026-03-06 02:05:00+00', NULL),
	(12, 'PLMCTHMSC-ORG-13', 'EV-2026-007', 'PROP-2026-008', 'Proposal Approved', 'Your proposal for Hospitality Skills Workshop has been approved.', '2026-03-07 02:05:00+00', NULL),
	(13, 'PLMECESS-ORG-17', 'EV-2026-008', 'PROP-2026-009', 'Proposal Approved', 'Your proposal for Electronics Innovation Day has been approved.', '2026-03-08 02:05:00+00', NULL),
	(14, 'PLMAWSS-ORG-40', 'EV-2026-009', 'PROP-2026-010', 'Proposal Approved', 'Your proposal for Cloud Computing Bootcamp has been approved.', '2026-03-09 02:05:00+00', NULL),
	(15, 'PLMCRCYC-ORG-46', 'EV-2026-010', 'PROP-2026-011', 'Proposal Approved', 'Your proposal for Red Cross First Aid Training has been approved.', '2026-03-10 02:05:00+00', NULL),
	(16, 'PLMCPA-ORG-12', 'EV-2026-011', 'PROP-2026-012', 'Proposal Approved', 'Your proposal for Public Service Leadership Forum has been approved.', '2026-03-11 02:05:00+00', NULL),
	(17, 'PLMAP-ORG-02', 'EV-2026-012', 'PROP-2026-013', 'Proposal Approved', 'Your proposal for Campus Journalism Workshop has been approved.', '2026-03-12 02:05:00+00', NULL),
	(18, 'PLMCOAA-ORG-03', 'EV-2026-013', 'PROP-2026-014', 'Proposal Approved', 'Your proposal for Student Accountability Seminar has been approved.', '2026-03-13 02:05:00+00', NULL),
	(19, 'PLMCOMELEC-ORG-04', 'EV-2026-014', 'PROP-2026-015', 'Proposal Approved', 'Your proposal for Student Election Orientation has been approved.', '2026-03-14 02:05:00+00', NULL),
	(20, 'PLMJFINEX-ORG-18', 'EV-2026-015', 'PROP-2026-016', 'Proposal Approved', 'Your proposal for Financial Literacy Webinar has been approved.', '2026-03-15 02:05:00+00', NULL),
	(21, 'PLM-CRADLEORG-45', 'EV-2026-016', 'PROP-2026-017', 'Proposal Approved', 'Your proposal for Child Rights Awareness Forum has been approved.', '2026-03-16 02:05:00+00', NULL),
	(22, 'PLMTUGONRESCUE-ORG-54', 'EV-2026-017', 'PROP-2026-018', 'Proposal Approved', 'Your proposal for Disaster Preparedness Drill has been approved.', '2026-03-17 02:05:00+00', NULL),
	(23, 'PLMCMC-ORG-55', 'EV-2026-018', 'PROP-2026-019', 'Proposal Approved', 'Your proposal for Community Wellness Assembly has been approved.', '2026-03-18 02:05:00+00', NULL),
	(24, 'PLMCISTMSC-ORG-09', 'EV-2026-021', 'PROP-2026-022', 'Proposal Approved', 'Campus Sustainability Forum has been approved.', '2026-04-05 01:00:00+00', NULL),
	(25, 'PLMCHASSSC-ORG-08', 'EV-2026-022', 'PROP-2026-023', 'Proposal Approved', 'Student Entrepreneurship Fair has been approved.', '2026-04-06 01:00:00+00', NULL);


--
-- Data for Name: proposal_review; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."proposal_review" ("review_id", "proposal_id", "admin_id", "review_decision", "admin_remarks", "reviewed_at") VALUES
	('REV-2026-001', 'PROP-2026-001', 'PLM-OSDS-2016-02782', 'Approved', 'Primary schedule approved. Lead organization may prepare publication and open registration.', '2026-01-12 03:00:00+00'),
	('REV-2026-002', 'PROP-2026-002', 'PLM-OSDS-2019-06772', 'Approved', 'Primary schedule approved. PLMSSC retains sole management; listed collaborators receive no additional permissions.', '2026-01-20 01:15:00+00'),
	('REV-2026-003', 'PROP-2026-003', 'PLM-OSDS-2016-02782', 'Approved', 'Primary laboratory schedule approved for a maximum of 40 participants.', '2026-01-28 02:00:00+00'),
	('REV-2026-004', 'PROP-2026-004', 'PLM-OSDS-2023-07723', 'Revisions Required', 'Provide the detailed workshop program flow, facilitator assignments, and itemized budget breakdown before resubmission.', '2026-02-18 00:52:10+00'),
	('REV-2026-005', 'PROP-2026-005', 'PLM-OSDS-2016-02782', 'Approved', 'Approved for publication and event preparation.', '2026-03-04 02:00:00+00'),
	('REV-2026-006', 'PROP-2026-006', 'PLM-OSDS-2019-06772', 'Approved', 'Approved for publication and event preparation.', '2026-03-05 02:00:00+00'),
	('REV-2026-007', 'PROP-2026-007', 'PLM-OSDS-2023-07723', 'Approved', 'Approved for publication and event preparation.', '2026-03-06 02:00:00+00'),
	('REV-2026-008', 'PROP-2026-008', 'PLM-OSDS-2023-07776', 'Approved', 'Approved for publication and event preparation.', '2026-03-07 02:00:00+00'),
	('REV-2026-009', 'PROP-2026-009', 'PLM-OSDS-2025-08912', 'Approved', 'Approved for publication and event preparation.', '2026-03-08 02:00:00+00'),
	('REV-2026-010', 'PROP-2026-010', 'PLM-OSDS-2016-02782', 'Approved', 'Approved for publication and event preparation.', '2026-03-09 02:00:00+00'),
	('REV-2026-011', 'PROP-2026-011', 'PLM-OSDS-2019-06772', 'Approved', 'Approved for publication and event preparation.', '2026-03-10 02:00:00+00'),
	('REV-2026-012', 'PROP-2026-012', 'PLM-OSDS-2023-07723', 'Approved', 'Approved for publication and event preparation.', '2026-03-11 02:00:00+00'),
	('REV-2026-013', 'PROP-2026-013', 'PLM-OSDS-2023-07776', 'Approved', 'Approved for publication and event preparation.', '2026-03-12 02:00:00+00'),
	('REV-2026-014', 'PROP-2026-014', 'PLM-OSDS-2025-08912', 'Approved', 'Approved for publication and event preparation.', '2026-03-13 02:00:00+00'),
	('REV-2026-015', 'PROP-2026-015', 'PLM-OSDS-2016-02782', 'Approved', 'Approved for publication and event preparation.', '2026-03-14 02:00:00+00'),
	('REV-2026-016', 'PROP-2026-016', 'PLM-OSDS-2019-06772', 'Approved', 'Approved for publication and event preparation.', '2026-03-15 02:00:00+00'),
	('REV-2026-017', 'PROP-2026-017', 'PLM-OSDS-2023-07723', 'Approved', 'Approved for publication and event preparation.', '2026-03-16 02:00:00+00'),
	('REV-2026-018', 'PROP-2026-018', 'PLM-OSDS-2023-07776', 'Approved', 'Approved for publication and event preparation.', '2026-03-17 02:00:00+00'),
	('REV-2026-019', 'PROP-2026-019', 'PLM-OSDS-2025-08912', 'Approved', 'Approved for publication and event preparation.', '2026-03-18 02:00:00+00'),
	('REV-2026-020', 'PROP-2026-020', 'PLM-OSDS-2016-02782', 'Revisions Required', 'Please revise the event plan and resubmit.', '2026-03-19 02:00:00+00'),
	('REV-2026-021', 'PROP-2026-021', 'PLM-OSDS-2019-06772', 'Rejected', 'Proposal does not meet current activity requirements.', '2026-03-20 02:00:00+00'),
	('REV-2026-022', 'PROP-2026-022', 'PLM-OSDS-2016-02782', 'Approved', 'Approved for publication.', '2026-04-05 01:00:00+00'),
	('REV-2026-023', 'PROP-2026-023', 'PLM-OSDS-2019-06772', 'Approved', 'Approved for publication.', '2026-04-06 01:00:00+00');


--
-- Data for Name: venue; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."venue" ("venue_id", "venue_name", "floor_number", "room_number", "building", "max_capacity", "available_equipment") VALUES
	('PLM-VENUE-1', 'Bukod Tanging Bulwagan (BTB)', 'Third_Floor', NULL, 'Gusaling Katipunan', 150, 'Chairs, Sound System, Projector, Airconditioning'),
	('PLM-VENUE-2', 'Computer Laboratory 1-2', 'Second_Floor', NULL, 'Gusaling Villegas', 40, 'Chairs, Computers, Monitors, Projector, Airconditioning'),
	('PLM-VENUE-3', 'Computer Laboratory 3-4', 'Fourth_Floor', NULL, 'Gusaling Villegas', 40, 'Chairs, Computers, Monitors, Projector, Airconditioning'),
	('PLM-VENUE-4', 'GEE Katipunan Lounge', 'Ground_Floor', NULL, 'Gusaling Ejercito Estrada', 125, NULL),
	('PLM-VENUE-5', 'Justo Alberto Auditorium (JAA)', 'Ground_Floor', NULL, 'Gusaling Lacson', 500, 'Chairs, Sound System, Projector, Airconditioning'),
	('PLM-VENUE-6', 'PLM Celso Al Carunungan Memorial Library', 'Ground_Floor', NULL, 'Gusaling Katipunan', 200, 'Chairs, Computers, Monitors, Projector, Airconditioning, Fans'),
	('PLM-VENUE-7', 'PLM Facade', 'Ground_Floor', NULL, 'PLM Facade', 200, NULL),
	('PLM-VENUE-8', 'PLM Field', NULL, NULL, 'PLM', 1000, NULL),
	('PLM-VENUE-9', 'PLM GCA Audio Visual Room (AVR)', 'Second_Floor', 'Room 1 & 2', 'Gusaling Corazon Aquino', 120, 'Chairs, Sound System, Tables, Projector, Airconditioning'),
	('PLM-VENUE-10', 'PLM GEE Audio Visual Room (AVR)', 'Second_Floor', 'Room 1 & 2', 'Gusaling Ejercito Estrada', 120, 'Chairs, Sound System, Tables, Projector, Airconditioning'),
	('PLM-VENUE-11', 'PLM Lobby', 'Ground_Floor', NULL, 'PLM Facade', 150, NULL),
	('PLM-VENUE-12', 'PLM Shrine of Jesus, the Divine Teacher', NULL, NULL, 'PLM', 150, 'Chairs, Sound System, Tables, Projector, Fans'),
	('PLM-VENUE-13', 'Rajah Sulayman Gym', NULL, NULL, 'PLM', 500, 'Chairs, Sound System, Tables, Fans, Mats and Balls'),
	('PLM-VENUE-14', 'Tanghalang Bayan', NULL, NULL, 'PLM Field', 100, NULL),
	('PLM-VENUE-15', 'University Activity Center (UAC)', NULL, NULL, 'PLM', 400, 'Chairs, Sound System, Tables, Projector, Fans');


--
-- Data for Name: proposal_schedule; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."proposal_schedule" ("schedule_id", "proposal_id", "venue_id", "starts_at", "ends_at", "schedule_type") VALUES
	('SCH-2026-001', 'PROP-2026-001', 'PLM-VENUE-9', '2026-02-20 01:00:00+00', '2026-02-20 04:00:00+00', 'Primary'),
	('SCH-2026-002', 'PROP-2026-001', 'PLM-VENUE-10', '2026-02-27 01:00:00+00', '2026-02-27 04:00:00+00', 'Backup'),
	('SCH-2026-003', 'PROP-2026-002', 'PLM-VENUE-13', '2026-03-20 00:00:00+00', '2026-03-20 09:00:00+00', 'Primary'),
	('SCH-2026-004', 'PROP-2026-002', 'PLM-VENUE-8', '2026-03-27 00:00:00+00', '2026-03-27 09:00:00+00', 'Backup'),
	('SCH-2026-005', 'PROP-2026-003', 'PLM-VENUE-2', '2026-03-06 01:00:00+00', '2026-03-06 09:00:00+00', 'Primary'),
	('SCH-2026-006', 'PROP-2026-003', 'PLM-VENUE-3', '2026-03-13 01:00:00+00', '2026-03-13 09:00:00+00', 'Backup'),
	('SCH-2026-007', 'PROP-2026-004', 'PLM-VENUE-10', '2026-03-20 05:00:00+00', '2026-03-20 08:00:00+00', 'Primary'),
	('SCH-2026-008', 'PROP-2026-004', 'PLM-VENUE-1', '2026-03-27 05:00:00+00', '2026-03-27 08:00:00+00', 'Backup'),
	('SCH-2026-009', 'PROP-2026-005', 'PLM-VENUE-10', '2026-05-04 01:00:00+00', '2026-05-04 04:00:00+00', 'Primary'),
	('SCH-2026-010', 'PROP-2026-005', 'PLM-VENUE-9', '2026-05-11 01:00:00+00', '2026-05-11 04:00:00+00', 'Backup'),
	('SCH-2026-011', 'PROP-2026-006', 'PLM-VENUE-8', '2026-05-11 01:00:00+00', '2026-05-11 04:00:00+00', 'Primary'),
	('SCH-2026-012', 'PROP-2026-006', 'PLM-VENUE-15', '2026-05-18 01:00:00+00', '2026-05-18 04:00:00+00', 'Backup'),
	('SCH-2026-013', 'PROP-2026-007', 'PLM-VENUE-5', '2026-05-18 01:00:00+00', '2026-05-18 04:00:00+00', 'Primary'),
	('SCH-2026-014', 'PROP-2026-007', 'PLM-VENUE-15', '2026-05-25 01:00:00+00', '2026-05-25 04:00:00+00', 'Backup'),
	('SCH-2026-015', 'PROP-2026-008', 'PLM-VENUE-9', '2026-05-25 01:00:00+00', '2026-05-25 04:00:00+00', 'Primary'),
	('SCH-2026-016', 'PROP-2026-008', 'PLM-VENUE-10', '2026-06-01 01:00:00+00', '2026-06-01 04:00:00+00', 'Backup'),
	('SCH-2026-017', 'PROP-2026-009', 'PLM-VENUE-2', '2026-06-01 01:00:00+00', '2026-06-01 04:00:00+00', 'Primary'),
	('SCH-2026-018', 'PROP-2026-009', 'PLM-VENUE-3', '2026-06-08 01:00:00+00', '2026-06-08 04:00:00+00', 'Backup'),
	('SCH-2026-019', 'PROP-2026-010', 'PLM-VENUE-3', '2026-06-08 01:00:00+00', '2026-06-08 04:00:00+00', 'Primary'),
	('SCH-2026-020', 'PROP-2026-010', 'PLM-VENUE-2', '2026-06-15 01:00:00+00', '2026-06-15 04:00:00+00', 'Backup'),
	('SCH-2026-021', 'PROP-2026-011', 'PLM-VENUE-1', '2026-06-15 01:00:00+00', '2026-06-15 04:00:00+00', 'Primary'),
	('SCH-2026-022', 'PROP-2026-011', 'PLM-VENUE-6', '2026-06-22 01:00:00+00', '2026-06-22 04:00:00+00', 'Backup'),
	('SCH-2026-023', 'PROP-2026-012', 'PLM-VENUE-6', '2026-06-22 01:00:00+00', '2026-06-22 04:00:00+00', 'Primary'),
	('SCH-2026-024', 'PROP-2026-012', 'PLM-VENUE-1', '2026-06-29 01:00:00+00', '2026-06-29 04:00:00+00', 'Backup'),
	('SCH-2026-025', 'PROP-2026-013', 'PLM-VENUE-10', '2026-06-29 01:00:00+00', '2026-06-29 04:00:00+00', 'Primary'),
	('SCH-2026-026', 'PROP-2026-013', 'PLM-VENUE-9', '2026-07-06 01:00:00+00', '2026-07-06 04:00:00+00', 'Backup'),
	('SCH-2026-027', 'PROP-2026-014', 'PLM-VENUE-1', '2026-07-06 01:00:00+00', '2026-07-06 04:00:00+00', 'Primary'),
	('SCH-2026-028', 'PROP-2026-014', 'PLM-VENUE-10', '2026-07-13 01:00:00+00', '2026-07-13 04:00:00+00', 'Backup'),
	('SCH-2026-029', 'PROP-2026-015', 'PLM-VENUE-5', '2026-07-13 01:00:00+00', '2026-07-13 04:00:00+00', 'Primary'),
	('SCH-2026-030', 'PROP-2026-015', 'PLM-VENUE-15', '2026-07-20 01:00:00+00', '2026-07-20 04:00:00+00', 'Backup'),
	('SCH-2026-031', 'PROP-2026-016', NULL, '2026-07-20 01:00:00+00', '2026-07-20 04:00:00+00', 'Primary'),
	('SCH-2026-032', 'PROP-2026-016', NULL, '2026-07-27 01:00:00+00', '2026-07-27 04:00:00+00', 'Backup'),
	('SCH-2026-033', 'PROP-2026-017', 'PLM-VENUE-9', '2026-07-27 01:00:00+00', '2026-07-27 04:00:00+00', 'Primary'),
	('SCH-2026-034', 'PROP-2026-017', 'PLM-VENUE-10', '2026-08-03 01:00:00+00', '2026-08-03 04:00:00+00', 'Backup'),
	('SCH-2026-035', 'PROP-2026-018', 'PLM-VENUE-8', '2026-08-03 01:00:00+00', '2026-08-03 04:00:00+00', 'Primary'),
	('SCH-2026-036', 'PROP-2026-018', 'PLM-VENUE-13', '2026-08-10 01:00:00+00', '2026-08-10 04:00:00+00', 'Backup'),
	('SCH-2026-037', 'PROP-2026-019', 'PLM-VENUE-15', '2026-08-10 01:00:00+00', '2026-08-10 04:00:00+00', 'Primary'),
	('SCH-2026-038', 'PROP-2026-019', 'PLM-VENUE-5', '2026-08-17 01:00:00+00', '2026-08-17 04:00:00+00', 'Backup'),
	('SCH-2026-039', 'PROP-2026-020', 'PLM-VENUE-5', '2026-08-17 01:00:00+00', '2026-08-17 04:00:00+00', 'Primary'),
	('SCH-2026-040', 'PROP-2026-020', 'PLM-VENUE-15', '2026-08-24 01:00:00+00', '2026-08-24 04:00:00+00', 'Backup'),
	('SCH-2026-041', 'PROP-2026-021', 'PLM-VENUE-9', '2026-08-24 01:00:00+00', '2026-08-24 04:00:00+00', 'Primary'),
	('SCH-2026-042', 'PROP-2026-021', 'PLM-VENUE-10', '2026-08-31 01:00:00+00', '2026-08-31 04:00:00+00', 'Backup'),
	('SCH-2026-043', 'PROP-2026-022', 'PLM-VENUE-15', '2026-09-07 01:00:00+00', '2026-09-07 04:00:00+00', 'Primary'),
	('SCH-2026-044', 'PROP-2026-022', 'PLM-VENUE-5', '2026-09-08 01:00:00+00', '2026-09-08 04:00:00+00', 'Backup'),
	('SCH-2026-045', 'PROP-2026-023', 'PLM-VENUE-15', '2026-09-14 01:00:00+00', '2026-09-14 04:00:00+00', 'Primary'),
	('SCH-2026-046', 'PROP-2026-023', 'PLM-VENUE-5', '2026-09-15 01:00:00+00', '2026-09-15 04:00:00+00', 'Backup');


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."students" ("student_number", "name", "year_level", "college", "program") VALUES
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
	('202515662', 'Faith Anne G. Lim', '2', 'CTHM', 'BSTM'),
	('202615701', 'Elijah R. Mendoza', '1', 'CISTM', 'BSCS'),
	('202515702', 'Isabella M. Santos', '2', 'CISTM', 'BSIT'),
	('202415703', 'Noah P. Reyes', '3', 'CE', 'BSCE'),
	('202315704', 'Olivia G. Cruz', '4', 'CHASS', 'BAC'),
	('202615705', 'Liam B. Aquino', '1', 'CBA', 'BSA'),
	('202515706', 'Sophia L. Torres', '2', 'CTHM', 'BSTM'),
	('202415707', 'Ethan D. Ramos', '3', 'CISTM', 'BSCS'),
	('202315708', 'Mia C. Flores', '4', 'CS', 'BS Math'),
	('202615709', 'Lucas V. Garcia', '1', 'CN', 'BSN'),
	('202515710', 'Ava N. Bautista', '2', 'CISTM', 'BSIT');


--
-- Data for Name: registration; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."registration" ("reg_id", "event_id", "student_number", "reg_date", "reg_status", "attendance_status", "cancelled_at", "cancellation_reason", "attendance_marked_at", "attendance_marked_by") VALUES
	('REG-2026-001', 'EV-2026-001', '202515006', '2026-02-01 02:00:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-002', 'EV-2026-001', '202515001', '2026-02-02 06:30:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-003', 'EV-2026-001', '202515652', '2026-02-02 01:00:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-004', 'EV-2026-001', '202515026', '2026-02-02 01:10:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-005', 'EV-2026-001', '202515101', '2026-02-02 01:20:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-006', 'EV-2026-001', '202515114', '2026-02-02 01:30:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-007', 'EV-2026-001', '202514203', '2026-02-02 01:40:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-008', 'EV-2026-001', '202514217', '2026-02-02 01:50:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-009', 'EV-2026-001', '202615301', '2026-02-02 02:00:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-010', 'EV-2026-001', '202615314', '2026-02-02 02:10:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-011', 'EV-2026-003', '202515006', '2026-02-03 01:00:00+00', 'Cancelled', NULL, '2026-02-10 02:00:00+00', 'Event cancelled by OSDS due to emergency venue repairs.', NULL, NULL),
	('REG-2026-012', 'EV-2026-003', '202515114', '2026-02-03 02:00:00+00', 'Cancelled', NULL, '2026-02-10 02:00:00+00', 'Event cancelled by OSDS due to emergency venue repairs.', NULL, NULL),
	('REG-2026-013', 'EV-2026-003', '202614427', '2026-02-03 03:00:00+00', 'Cancelled', NULL, '2026-02-10 02:00:00+00', 'Event cancelled by OSDS due to emergency venue repairs.', NULL, NULL),
	('REG-2026-014', 'EV-2026-003', '202415508', '2026-02-03 04:00:00+00', 'Cancelled', NULL, '2026-02-10 02:00:00+00', 'Event cancelled by OSDS due to emergency venue repairs.', NULL, NULL),
	('REG-2026-015', 'EV-2026-003', '202315519', '2026-02-03 05:00:00+00', 'Cancelled', NULL, '2026-02-10 02:00:00+00', 'Event cancelled by OSDS due to emergency venue repairs.', NULL, NULL),
	('REG-2026-016', 'EV-2026-003', '202514531', '2026-02-03 06:00:00+00', 'Cancelled', NULL, '2026-02-10 02:00:00+00', 'Event cancelled by OSDS due to emergency venue repairs.', NULL, NULL),
	('REG-2026-017', 'EV-2026-003', '202514542', '2026-02-03 07:00:00+00', 'Cancelled', NULL, '2026-02-10 02:00:00+00', 'Event cancelled by OSDS due to emergency venue repairs.', NULL, NULL),
	('REG-2026-018', 'EV-2026-002', '202515006', '2026-02-19 01:00:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-019', 'EV-2026-002', '202515114', '2026-02-19 01:10:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-020', 'EV-2026-002', '202614427', '2026-02-19 01:20:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-021', 'EV-2026-002', '202415508', '2026-02-19 01:30:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-022', 'EV-2026-002', '202315519', '2026-02-19 01:40:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-023', 'EV-2026-002', '202514531', '2026-02-19 01:50:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-024', 'EV-2026-002', '202514542', '2026-02-19 02:00:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-025', 'EV-2026-002', '202315553', '2026-02-19 02:10:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-026', 'EV-2026-002', '202615564', '2026-02-19 02:20:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-027', 'EV-2026-002', '202415575', '2026-02-19 02:30:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-028', 'EV-2026-002', '202315586', '2026-02-19 02:40:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-029', 'EV-2026-002', '202515597', '2026-02-19 02:50:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-030', 'EV-2026-002', '202614608', '2026-02-19 03:00:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-031', 'EV-2026-002', '202415619', '2026-02-19 03:10:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-032', 'EV-2026-002', '202514630', '2026-02-19 03:20:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-033', 'EV-2026-002', '202315641', '2026-02-19 03:30:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-034', 'EV-2026-004', '202615701', '2026-04-10 01:00:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-035', 'EV-2026-004', '202515702', '2026-04-11 01:00:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-036', 'EV-2026-004', '202415703', '2026-04-12 01:00:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-037', 'EV-2026-004', '202315704', '2026-04-13 01:00:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-038', 'EV-2026-004', '202615705', '2026-04-14 01:00:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-039', 'EV-2026-004', '202515706', '2026-04-15 01:00:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-040', 'EV-2026-004', '202415707', '2026-04-16 01:00:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-041', 'EV-2026-004', '202315708', '2026-04-17 01:00:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-042', 'EV-2026-004', '202615709', '2026-04-18 01:00:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL),
	('REG-2026-043', 'EV-2026-004', '202515710', '2026-04-19 01:00:00+00', 'Confirmed', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: venue_booking; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."venue_booking" ("booking_id", "event_id", "venue_id", "starts_at", "ends_at", "buffer_minutes", "booking_status", "authorized_by", "created_at", "change_reason", "status_changed_at") VALUES
	('BOOK-2026-001', 'EV-2026-001', 'PLM-VENUE-9', '2026-02-20 01:00:00+00', '2026-02-20 04:00:00+00', 60, 'Replaced', 'PLM-OSDS-2016-02782', '2026-01-12 03:00:00+00', 'Administrator-authorized move to the backup schedule and venue due to speaker availability.', '2026-02-04 23:55:00+00'),
	('BOOK-2026-002', 'EV-2026-002', 'PLM-VENUE-13', '2026-03-20 00:00:00+00', '2026-03-20 09:00:00+00', 60, 'Confirmed', 'PLM-OSDS-2019-06772', '2026-01-20 01:15:00+00', NULL, '2026-01-20 01:15:00+00'),
	('BOOK-2026-003', 'EV-2026-003', 'PLM-VENUE-2', '2026-03-06 01:00:00+00', '2026-03-06 09:00:00+00', 60, 'Cancelled', 'PLM-OSDS-2016-02782', '2026-01-28 02:00:00+00', 'Emergency venue repairs.', '2026-02-10 02:00:00+00'),
	('BOOK-2026-004', 'EV-2026-001', 'PLM-VENUE-10', '2026-02-27 01:00:00+00', '2026-02-27 04:00:00+00', 60, 'Confirmed', 'PLM-OSDS-2016-02782', '2026-02-04 23:55:00+00', 'Administrator-authorized move to the backup schedule and venue due to speaker availability.', '2026-02-04 23:55:00+00'),
	('BOOK-2026-005', 'EV-2026-004', 'PLM-VENUE-10', '2026-05-04 01:00:00+00', '2026-05-04 04:00:00+00', 60, 'Confirmed', 'PLM-OSDS-2016-02782', '2026-03-04 02:00:00+00', NULL, '2026-03-04 02:00:00+00'),
	('BOOK-2026-006', 'EV-2026-005', 'PLM-VENUE-8', '2026-05-11 01:00:00+00', '2026-05-11 04:00:00+00', 60, 'Confirmed', 'PLM-OSDS-2019-06772', '2026-03-05 02:00:00+00', NULL, '2026-03-05 02:00:00+00'),
	('BOOK-2026-007', 'EV-2026-006', 'PLM-VENUE-5', '2026-05-18 01:00:00+00', '2026-05-18 04:00:00+00', 60, 'Confirmed', 'PLM-OSDS-2023-07723', '2026-03-06 02:00:00+00', NULL, '2026-03-06 02:00:00+00'),
	('BOOK-2026-008', 'EV-2026-007', 'PLM-VENUE-9', '2026-05-25 01:00:00+00', '2026-05-25 04:00:00+00', 60, 'Confirmed', 'PLM-OSDS-2023-07776', '2026-03-07 02:00:00+00', NULL, '2026-03-07 02:00:00+00'),
	('BOOK-2026-009', 'EV-2026-008', 'PLM-VENUE-2', '2026-06-01 01:00:00+00', '2026-06-01 04:00:00+00', 60, 'Confirmed', 'PLM-OSDS-2025-08912', '2026-03-08 02:00:00+00', NULL, '2026-03-08 02:00:00+00'),
	('BOOK-2026-010', 'EV-2026-009', 'PLM-VENUE-3', '2026-06-08 01:00:00+00', '2026-06-08 04:00:00+00', 60, 'Confirmed', 'PLM-OSDS-2016-02782', '2026-03-09 02:00:00+00', NULL, '2026-03-09 02:00:00+00'),
	('BOOK-2026-011', 'EV-2026-010', 'PLM-VENUE-1', '2026-06-15 01:00:00+00', '2026-06-15 04:00:00+00', 60, 'Confirmed', 'PLM-OSDS-2019-06772', '2026-03-10 02:00:00+00', NULL, '2026-03-10 02:00:00+00'),
	('BOOK-2026-012', 'EV-2026-011', 'PLM-VENUE-6', '2026-06-22 01:00:00+00', '2026-06-22 04:00:00+00', 60, 'Confirmed', 'PLM-OSDS-2023-07723', '2026-03-11 02:00:00+00', NULL, '2026-03-11 02:00:00+00'),
	('BOOK-2026-013', 'EV-2026-012', 'PLM-VENUE-10', '2026-06-29 01:00:00+00', '2026-06-29 04:00:00+00', 60, 'Confirmed', 'PLM-OSDS-2023-07776', '2026-03-12 02:00:00+00', NULL, '2026-03-12 02:00:00+00'),
	('BOOK-2026-014', 'EV-2026-013', 'PLM-VENUE-1', '2026-07-06 01:00:00+00', '2026-07-06 04:00:00+00', 60, 'Confirmed', 'PLM-OSDS-2025-08912', '2026-03-13 02:00:00+00', NULL, '2026-03-13 02:00:00+00'),
	('BOOK-2026-015', 'EV-2026-014', 'PLM-VENUE-5', '2026-07-13 01:00:00+00', '2026-07-13 04:00:00+00', 60, 'Confirmed', 'PLM-OSDS-2016-02782', '2026-03-14 02:00:00+00', NULL, '2026-03-14 02:00:00+00'),
	('BOOK-2026-016', 'EV-2026-016', 'PLM-VENUE-9', '2026-07-27 01:00:00+00', '2026-07-27 04:00:00+00', 60, 'Confirmed', 'PLM-OSDS-2023-07723', '2026-03-16 02:00:00+00', NULL, '2026-03-16 02:00:00+00'),
	('BOOK-2026-017', 'EV-2026-017', 'PLM-VENUE-8', '2026-08-03 01:00:00+00', '2026-08-03 04:00:00+00', 60, 'Confirmed', 'PLM-OSDS-2023-07776', '2026-03-17 02:00:00+00', NULL, '2026-03-17 02:00:00+00'),
	('BOOK-2026-018', 'EV-2026-018', 'PLM-VENUE-15', '2026-08-10 01:00:00+00', '2026-08-10 04:00:00+00', 60, 'Confirmed', 'PLM-OSDS-2025-08912', '2026-03-18 02:00:00+00', NULL, '2026-03-18 02:00:00+00'),
	('BOOK-2026-019', 'EV-2026-021', 'PLM-VENUE-15', '2026-09-07 01:00:00+00', '2026-09-07 04:00:00+00', 60, 'Confirmed', 'PLM-OSDS-2016-02782', '2026-04-05 01:00:00+00', NULL, '2026-04-05 01:00:00+00'),
	('BOOK-2026-020', 'EV-2026-022', 'PLM-VENUE-15', '2026-09-14 01:00:00+00', '2026-09-14 04:00:00+00', 60, 'Confirmed', 'PLM-OSDS-2019-06772', '2026-04-06 01:00:00+00', NULL, '2026-04-06 01:00:00+00');


--
-- Name: notifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."notifications_notification_id_seq"', 25, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict dJf8naNr9NDR3FAzJSdh96ivP1sgAG0Tq8eOHr8T2fg2y8NnafDe6bQrfuAN7HK

RESET ALL;
