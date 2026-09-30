-- =============================================================================
-- PLM SEAMS (Student Event and Activity Management System)
-- Database Schema : PLMSEAMSDB
-- Target          : MySQL 8.0+ / MariaDB 10.4+ (XAMPP),InnoDB, utf8mb4
--
-- Source documents:
--   backend/docs/data_dictionary.md           (column types and constraints)
--   backend/docs/ERD_and_Relational_Schema.md (entities and relationships)
--   backend/docs/database_reqs.md             (requirements and business rules)
--
-- Table creation order (parents before children):
--   1. Users
--   2. Students               (ISA subtype of Users)
--   3. Student_Organizations  (ISA subtype of Users)
--   4. Administrators         (ISA subtype of Users)
--   5. Venue
--   6. Event_Proposal         -> Student_Organizations, Administrators
--   7. Event                  -> Student_Organizations, Venue, Event_Proposal
--   8. Registration           -> Event, Students (bridging entity)
--
-- Notes:
--   * No ON DELETE / ON UPDATE actions are declared. MySQL therefore defaults
--     to RESTRICT: a parent row cannot be deleted while child rows refer to it.
--   * CHECK constraints for the status columns are written as comments inside
--     each table for study. They are NOT active yet.
--   * This script never drops tables. Running it a second time stops with
--     "ERROR 1050: Table 'Users' already exists" and no data is touched.
--     To apply design changes, first drop the old tables manually (e.g. drop
--     PLMSEAMSDB in phpMyAdmin), then run this script again.
--     Seed data belongs in database/seed_data.sql.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS PLMSEAMSDB
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE PLMSEAMSDB;

-- =============================================================================
-- 1. Users
-- -----------------------------------------------------------------------------
-- Definition : Base account for every person or organization that logs in.
--              Supertype of the ISA hierarchy: each user is specialized into
--              at most one of Students, Student_Organizations, Administrators
--              (cardinality 1 : 0..1 for each subtype).
-- Rules      : SEAMS-UA-01 (only @plm.edu.ph emails), SEAMS-UA-02 (RBAC),
--              Req 3.1.1, Req 3.2.2 (hashed passwords).
-- Key        : User_ID is VARCHAR(50) so organization accounts can use
--              acronym-based IDs. Values are assigned by the application
--              (VARCHAR columns cannot be AUTO_INCREMENT).
-- =============================================================================
CREATE TABLE Users (
    User_ID       VARCHAR(50)  NOT NULL
        COMMENT 'Unique identifier for the base user account.',
    Email         VARCHAR(100) NOT NULL
        COMMENT 'User''s email address used for login authentication.',
    Password      VARCHAR(255) NOT NULL
        COMMENT 'Hashed password for account security.',
    Role          ENUM('Student', 'Organization', 'Admin') NOT NULL
        COMMENT 'Defines the access level for each role (Student, Organization, Admin).',
    Date_Created  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
        COMMENT 'Timestamp recording for when the account was registered in the system.',

    CONSTRAINT pk_users       PRIMARY KEY (User_ID),
    CONSTRAINT uq_users_email UNIQUE (Email)

    -- CHECK rule for study (SEAMS-UA-01), not active yet:
    -- , CONSTRAINT chk_users_email_domain CHECK (Email LIKE '%@plm.edu.ph')
) ENGINE = InnoDB
  COMMENT = 'Base user accounts; supertype of Students, Student_Organizations, and Administrators.';


-- =============================================================================
-- 2. Students
-- -----------------------------------------------------------------------------
-- Definition : Student profile. ISA subtype of Users; Student_Number is both
--              the primary key and a foreign key to Users.User_ID.
-- Rules      : SEAMS-UA-03 (students browse and register for open events),
--              SEAMS-EB-01 (only enrolled students may register).
-- =============================================================================
CREATE TABLE Students (
    Student_Number  VARCHAR(20)  NOT NULL
        COMMENT 'Unique student identifier; maps back to the base user record.',
    Name            VARCHAR(200) NOT NULL
        COMMENT 'Full name of the student.',
    Year_Level      VARCHAR(20)  NOT NULL
        COMMENT 'The current academic year level of the student.',
    College         VARCHAR(175) NOT NULL
        COMMENT 'The specific college the student belongs to.',
    Program         VARCHAR(175) NOT NULL
        COMMENT 'The degree program the student is enrolled in under their college.',

    CONSTRAINT pk_students       PRIMARY KEY (Student_Number),
    CONSTRAINT fk_students_users FOREIGN KEY (Student_Number)
        REFERENCES Users (User_ID)
) ENGINE = InnoDB
  COMMENT = 'Student profiles; ISA subtype of Users.';


-- =============================================================================
-- 3. Student_Organizations
-- -----------------------------------------------------------------------------
-- Definition : Student organization profile. ISA subtype of Users; Org_ID is
--              both the primary key and a foreign key to Users.User_ID.
-- Relations  : CREATES Event_Proposal (1:M), MANAGES Event (1:M).
-- Rules      : SEAMS-UA-04 (only accredited organizations submit proposals,
--              book venues, and publish events).
-- =============================================================================
CREATE TABLE Student_Organizations (
    Org_ID                VARCHAR(50)  NOT NULL
        COMMENT 'Unique organization identifier; maps back to the base user record.',
    Org_Name              VARCHAR(200) NOT NULL
        COMMENT 'The complete and official name of the student organization.',
    Organization_Type     VARCHAR(50)  NOT NULL
        COMMENT 'Classification of the student organization (e.g., Academic/Non-Academic).',
    Acronym               VARCHAR(20)  NULL
        COMMENT 'The abbreviated name or initials of the student organization.',
    College               VARCHAR(175) NULL
        COMMENT 'The college the organization is affiliated with.',
    Accreditation_Status  BOOLEAN      NOT NULL
        COMMENT 'Current standing of the organization with the PLM OSDS (1=Accredited, 0=Not Accredited).',

    CONSTRAINT pk_student_organizations PRIMARY KEY (Org_ID),
    CONSTRAINT fk_student_orgs_users    FOREIGN KEY (Org_ID)
        REFERENCES Users (User_ID)

    -- CHECK rule for study, not active yet:
    -- , CONSTRAINT chk_orgs_type CHECK (Organization_Type IN ('Academic', 'Non-Academic'))
) ENGINE = InnoDB
  COMMENT = 'Student organization profiles; ISA subtype of Users.';


-- =============================================================================
-- 4. Administrators
-- -----------------------------------------------------------------------------
-- Definition : Administrator profile (PLM OSDS Admin and Admin Staff). ISA
--              subtype of Users; Admin_ID is both the primary key and a
--              foreign key to Users.User_ID.
-- Relations  : REVIEWS Event_Proposal (1:M).
-- Rules      : SEAMS-UA-05, SEAMS-EC-01 (final approval by OSDS), SEAMS-EC-06.
-- =============================================================================
CREATE TABLE Administrators (
    Admin_ID         VARCHAR(50)  NOT NULL
        COMMENT 'Unique administrator identifier; maps back to the base user record.',
    Name             VARCHAR(200) NOT NULL
        COMMENT 'Full name of the administrative staff/official.',
    Position         VARCHAR(175) NOT NULL
        COMMENT 'The job title or role of the administrator.',
    Office_Assigned  VARCHAR(100) NOT NULL
        COMMENT 'The university department or office the admin reports to.',
    Faculty          BOOLEAN      NOT NULL
        COMMENT 'Indicates if the administrator also holds a teaching position currently (1=Yes, 0=No).',

    CONSTRAINT pk_administrators       PRIMARY KEY (Admin_ID),
    CONSTRAINT fk_administrators_users FOREIGN KEY (Admin_ID)
        REFERENCES Users (User_ID)
) ENGINE = InnoDB
  COMMENT = 'Administrator profiles; ISA subtype of Users.';


-- =============================================================================
-- 5. Venue
-- -----------------------------------------------------------------------------
-- Definition : PLM-recognized venue that can be booked for an event.
-- Relations  : Event OCCURS_AT Venue (M:1).
-- Rules      : SEAMS-VB-01 (only PLM-recognized venues; equipment is tied to
--              the venue), SEAMS-VB-02, SEAMS-VB-03, SEAMS-VB-04, Req 3.1.2.
-- =============================================================================
CREATE TABLE Venue (
    Venue_ID             INT          NOT NULL AUTO_INCREMENT
        COMMENT 'Unique identifier for the booked venue.',
    Venue_Name           VARCHAR(200) NOT NULL
        COMMENT 'The designated name of the booked venue.',
    Floor_Number         VARCHAR(20)  NULL
        COMMENT 'The atomic floor location (e.g., 2nd Floor, Ground).',
    Room_Number          VARCHAR(20)  NULL
        COMMENT 'The atomic room identifier (e.g., Rm 204).',
    Building             VARCHAR(200) NOT NULL
        COMMENT 'The name of the building housing the venue.',
    Min_Attendees        INT          NULL
        COMMENT 'The minimum required headcount to reserve this space.',
    Max_Capacity         INT          NOT NULL
        COMMENT 'The maximum capacity or physical limit of people allowed.',
    Available_Equipment  TEXT         NULL
        COMMENT 'A list of provided facilities housed in the venue booked (e.g., projector, chairs, sound system).',

    CONSTRAINT pk_venue PRIMARY KEY (Venue_ID)

    -- CHECK rule for study, not active yet:
    -- , CONSTRAINT chk_venue_capacity CHECK (Min_Attendees IS NULL OR Min_Attendees <= Max_Capacity)
) ENGINE = InnoDB
  COMMENT = 'PLM-recognized venues available for event booking.';


-- =============================================================================
-- 6. Event_Proposal
-- -----------------------------------------------------------------------------
-- Definition : Event proposal submitted by a student organization for review.
-- Relations  : Student_Organizations CREATES Event_Proposal (1:M).
--              Administrators REVIEWS Event_Proposal (1:M).
--              Event_Proposal ORIGINATES_FROM -> Event (1:1).
-- Rules      : SEAMS-EC-01 to SEAMS-EC-05, Req 3.1.3.1, Req 3.1.3.2.
-- Note       : Reviewed_By is NULL until an administrator processes it.
-- =============================================================================
CREATE TABLE Event_Proposal (
    Proposal_ID      INT          NOT NULL AUTO_INCREMENT
        COMMENT 'Unique identifier for the event proposal submitted to the administration.',
    Org_ID           VARCHAR(50)  NOT NULL
        COMMENT 'Identifies the organization that submitted the proposal.',
    Submission_Date  DATETIME     NOT NULL
        COMMENT 'The exact date and time the event proposal was filed.',
    Approval_Status  VARCHAR(50)  NOT NULL
        COMMENT 'Tracks workflow state (e.g., Pending, Approved, Rejected).',
    Admin_Remarks    TEXT         NULL
        COMMENT 'Comments or required revisions provided by the reviewer.',
    Reviewed_By      VARCHAR(50)  NULL
        COMMENT 'The Admin_ID of the staff member who processed the proposal.',

    CONSTRAINT pk_event_proposal          PRIMARY KEY (Proposal_ID),
    CONSTRAINT fk_proposal_organization   FOREIGN KEY (Org_ID)
        REFERENCES Student_Organizations (Org_ID),
    CONSTRAINT fk_proposal_reviewed_by    FOREIGN KEY (Reviewed_By)
        REFERENCES Administrators (Admin_ID)

    -- CHECK rule for study, not active yet (values from Req 3.2.4):
    -- , CONSTRAINT chk_proposal_approval_status
    --     CHECK (Approval_Status IN ('Pending', 'Approved', 'Rejected', 'Revisions Required'))
) ENGINE = InnoDB
  COMMENT = 'Event proposals submitted by organizations and reviewed by administrators.';


-- =============================================================================
-- 7. Event
-- -----------------------------------------------------------------------------
-- Definition : Officially scheduled event, generated from an approved proposal.
-- Relations  : Student_Organizations MANAGES Event (1:M).
--              Event OCCURS_AT Venue (M:1).
--              Event ORIGINATES_FROM Event_Proposal (1:1), enforced by the
--              UNIQUE constraint on Proposal_ID: one proposal -> one event.
-- Rules      : SEAMS-VB-02 (no double-booking), SEAMS-EB-02, Req 3.1.4.1.
-- =============================================================================
CREATE TABLE Event (
    Event_ID            INT          NOT NULL AUTO_INCREMENT
        COMMENT 'Unique identifier for the officially scheduled event.',
    Event_Name          VARCHAR(200) NOT NULL
        COMMENT 'The title of the event.',
    Event_Type          VARCHAR(100) NOT NULL
        COMMENT 'Type of the event (e.g., workshop, competition).',
    Event_Date          DATE         NOT NULL
        COMMENT 'The calendar date on which the event occurs.',
    Start_Time          TIME         NOT NULL
        COMMENT 'The scheduled start time.',
    End_Time            TIME         NOT NULL
        COMMENT 'The scheduled conclusion time.',
    Expected_Attendees  INT          NOT NULL
        COMMENT 'The projected headcount for the event.',
    Org_ID              VARCHAR(50)  NOT NULL
        COMMENT 'Directly identifies the managing organization.',
    Venue_ID            INT          NOT NULL
        COMMENT 'Identifies the location booked for the event.',
    Event_Status        VARCHAR(50)  NOT NULL
        COMMENT 'Current state (e.g., Upcoming, Ongoing, Cancelled, Completed).',
    Proposal_ID         INT          NULL
        COMMENT 'Unique identifier for the event proposal submitted to the administration.',

    CONSTRAINT pk_event              PRIMARY KEY (Event_ID),
    CONSTRAINT uq_event_proposal     UNIQUE (Proposal_ID),
    CONSTRAINT fk_event_organization FOREIGN KEY (Org_ID)
        REFERENCES Student_Organizations (Org_ID),
    CONSTRAINT fk_event_venue        FOREIGN KEY (Venue_ID)
        REFERENCES Venue (Venue_ID),
    CONSTRAINT fk_event_proposal     FOREIGN KEY (Proposal_ID)
        REFERENCES Event_Proposal (Proposal_ID)

    -- CHECK rules for study, not active yet:
    -- , CONSTRAINT chk_event_status
    --     CHECK (Event_Status IN ('Upcoming', 'Ongoing', 'Cancelled', 'Completed'))
    -- , CONSTRAINT chk_event_time_order CHECK (End_Time > Start_Time)
) ENGINE = InnoDB
  COMMENT = 'Officially scheduled events; each originates from at most one proposal.';


-- =============================================================================
-- 8. Registration (bridging entity)
-- -----------------------------------------------------------------------------
-- Definition : Resolves the M:M REGISTERS relationship between Students and
--              Event. One row = one student registered for one event.
-- Rules      : SEAMS-EB-01 to SEAMS-EB-04, Req 3.1.4.2,
--              Req 3.2.3 (prevent duplicate event registrations), enforced by
--              the UNIQUE constraint on (Event_ID, Student_Number): the same
--              student cannot register for the same event twice.
-- Note       : Attendance_Status is NULL until event day.
-- =============================================================================
CREATE TABLE Registration (
    Reg_ID             INT          NOT NULL AUTO_INCREMENT
        COMMENT 'Unique identifier for the registration ticket/record.',
    Event_ID           INT          NOT NULL
        COMMENT 'Identifies the event the student is signing up for.',
    Student_Number     VARCHAR(20)  NOT NULL
        COMMENT 'Identifies the student making the registration.',
    Reg_Date           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
        COMMENT 'The exact timestamp of the registration of the user was logged by the system.',
    Reg_Status         VARCHAR(50)  NOT NULL
        COMMENT 'State of the ticket (Confirmed, Waitlisted, Cancelled).',
    Attendance_Status  VARCHAR(50)  NULL
        COMMENT 'Tracks physical presence (e.g., Present, Absent); null until event day.',

    CONSTRAINT pk_registration               PRIMARY KEY (Reg_ID),
    CONSTRAINT uq_registration_event_student UNIQUE (Event_ID, Student_Number),
    CONSTRAINT fk_registration_event         FOREIGN KEY (Event_ID)
        REFERENCES Event (Event_ID),
    CONSTRAINT fk_registration_student       FOREIGN KEY (Student_Number)
        REFERENCES Students (Student_Number)

    -- CHECK rules for study, not active yet:
    -- , CONSTRAINT chk_registration_reg_status
    --     CHECK (Reg_Status IN ('Confirmed', 'Waitlisted', 'Cancelled'))
    -- , CONSTRAINT chk_registration_attendance
    --     CHECK (Attendance_Status IS NULL OR Attendance_Status IN ('Present', 'Absent'))
) ENGINE = InnoDB
  COMMENT = 'Bridging entity for the Students-Event M:M registration relationship.';
