-- =============================================================================
-- PLM SEAMS — PostgreSQL schema aligned to ERD ver17 and supplied sample data
-- Target: Supabase PostgreSQL
--
-- Run in Supabase Dashboard -> SQL Editor -> New query.
-- Intended for an EMPTY database. This script does not drop existing tables.
--
-- IMPORTANT:
-- 1. Supabase manages the database; do not use CREATE DATABASE or USE.
-- 2. PostgreSQL folds unquoted identifiers to lowercase. Use these lowercase
--    names in frontend/backend queries (e.g. event_proposal, user_id).
-- 3. Do not store plaintext passwords. For production, use Supabase Auth and
--    reference auth.users; the `password` column below is retained only to
--    reflect the supplied ERD/sample-data design and should not hold plaintext.
-- 4. Configure and test Row Level Security (RLS) policies before exposing tables
--    to clients. This file creates tables and constraints, not access policies.
-- =============================================================================

-- 1. USERS
CREATE TABLE users (
    user_id     VARCHAR(50) PRIMARY KEY,
    plm_email   VARCHAR(100) NOT NULL UNIQUE,
    password    TEXT NOT NULL,
    role        VARCHAR(30) NOT NULL
                CHECK (role IN ('Student', 'Student Organization', 'Admin')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS 'Base account record for students, student organizations, and administrators.';
COMMENT ON COLUMN users.password IS 'Legacy ERD field. Do not store plaintext passwords; prefer Supabase Auth.';

-- 2. STUDENTS (subtype of USERS)
CREATE TABLE students (
    student_number VARCHAR(20) PRIMARY KEY REFERENCES users(user_id),
    name           VARCHAR(200) NOT NULL,
    year_level     VARCHAR(20) NOT NULL,
    college        VARCHAR(175) NOT NULL,
    program        VARCHAR(175) NOT NULL
);

-- 3. STUDENT ORGANIZATIONS (subtype of USERS)
CREATE TABLE student_organization (
    org_id                 VARCHAR(50) PRIMARY KEY REFERENCES users(user_id),
    org_name               VARCHAR(200) NOT NULL,
    org_type               VARCHAR(50) NOT NULL,
    acronym                VARCHAR(50),
    college                VARCHAR(175),
    accreditation_status   BOOLEAN
);

-- 4. ADMINISTRATIONS (subtype of USERS)
CREATE TABLE administrations (
    admin_id        VARCHAR(50) PRIMARY KEY REFERENCES users(user_id),
    name            VARCHAR(200) NOT NULL,
    position        VARCHAR(175) NOT NULL,
    office_assigned VARCHAR(200) NOT NULL
);

-- 5. EVENT TYPE
CREATE TABLE event_type (
    event_type_id  VARCHAR(20) PRIMARY KEY,
    description    VARCHAR(100) NOT NULL,
    modality       VARCHAR(20) NOT NULL
                   CHECK (modality IN ('On-Site', 'Online', 'Hybrid')),
    requires_venue BOOLEAN NOT NULL
);

-- 6. VENUE
CREATE TABLE venue (
    venue_id            VARCHAR(30) PRIMARY KEY,
    venue_name          VARCHAR(200) NOT NULL,
    floor_number        VARCHAR(50),
    room_number         VARCHAR(50),
    building            VARCHAR(200) NOT NULL,
    max_capacity        INTEGER NOT NULL CHECK (max_capacity > 0),
    available_equipment TEXT
);

-- 7. EVENT PROPOSAL
CREATE TABLE event_proposal (
    proposal_id                     VARCHAR(30) PRIMARY KEY,
    org_id                          VARCHAR(50) NOT NULL REFERENCES student_organization(org_id),
    objectives                      TEXT NOT NULL,
    description                     TEXT NOT NULL,
    submission_date                 TIMESTAMPTZ NOT NULL,
    approval_status                 VARCHAR(30) NOT NULL
                                    CHECK (approval_status IN ('Pending', 'Approved', 'Rejected', 'Revisions Required')),
    expected_count_attendees        INTEGER NOT NULL CHECK (expected_count_attendees >= 0),
    event_name                      VARCHAR(200) NOT NULL,
    event_type_id                   VARCHAR(20) NOT NULL REFERENCES event_type(event_type_id),
    allowed_college                 TEXT,
    eligibility_mode                VARCHAR(50) NOT NULL,
    resource_requirements           TEXT,
    budget_information              TEXT,
    includes_sponsorship             BOOLEAN NOT NULL DEFAULT FALSE,
    collaborating_organization_text TEXT
);

-- 8. PROPOSAL SCHEDULE (primary and backup options)
CREATE TABLE proposal_schedule (
    schedule_id   VARCHAR(30) PRIMARY KEY,
    proposal_id   VARCHAR(30) NOT NULL REFERENCES event_proposal(proposal_id),
    venue_id      VARCHAR(30) REFERENCES venue(venue_id),
    starts_at     TIMESTAMPTZ NOT NULL,
    ends_at       TIMESTAMPTZ NOT NULL,
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('Primary', 'Backup')),
    CONSTRAINT chk_proposal_schedule_time CHECK (ends_at > starts_at)
);

-- 9. PROPOSAL REVIEW
CREATE TABLE proposal_review (
    review_id      VARCHAR(30) PRIMARY KEY,
    proposal_id    VARCHAR(30) NOT NULL REFERENCES event_proposal(proposal_id),
    admin_id       VARCHAR(50) NOT NULL REFERENCES administrations(admin_id),
    review_decision VARCHAR(30) NOT NULL
                    CHECK (review_decision IN ('Pending', 'Approved', 'Rejected', 'Revisions Required')),
    admin_remarks  TEXT,
    reviewed_at    TIMESTAMPTZ NOT NULL
);

-- 10. EVENT
CREATE TABLE event (
    event_id             VARCHAR(30) PRIMARY KEY,
    event_type_id        VARCHAR(20) NOT NULL REFERENCES event_type(event_type_id),
    publication_status   VARCHAR(30) NOT NULL DEFAULT 'Draft'
                         CHECK (publication_status IN ('Draft', 'Published', 'Unpublished')),
    registration_status  VARCHAR(30) NOT NULL DEFAULT 'Closed'
                         CHECK (registration_status IN ('Open', 'Closed')),
    registration_capacity INTEGER NOT NULL CHECK (registration_capacity >= 0),
    post_caption         TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at         TIMESTAMPTZ,
    cancelled_at         TIMESTAMPTZ,
    cancelled_by         VARCHAR(50) REFERENCES administrations(admin_id),
    cancellation_reason  TEXT,
    rescheduled_at       TIMESTAMPTZ,
    rescheduled_by       VARCHAR(50) REFERENCES administrations(admin_id),
    rescheduled_reason   TEXT,
    completed_at         TIMESTAMPTZ,
    archived_at          TIMESTAMPTZ,
    starts_at            TIMESTAMPTZ NOT NULL,
    ends_at              TIMESTAMPTZ NOT NULL,
    org_id               VARCHAR(50) NOT NULL REFERENCES student_organization(org_id),
    event_status         VARCHAR(30) NOT NULL
                         CHECK (event_status IN ('Upcoming', 'Ongoing', 'Cancelled', 'Completed')),
    proposal_id          VARCHAR(30) UNIQUE REFERENCES event_proposal(proposal_id),
    CONSTRAINT chk_event_time CHECK (ends_at > starts_at)
);

-- 11. REGISTRATION (student/event bridge)
CREATE TABLE registration (
    reg_id                 VARCHAR(30) PRIMARY KEY,
    event_id               VARCHAR(30) NOT NULL REFERENCES event(event_id),
    student_number         VARCHAR(20) NOT NULL REFERENCES students(student_number),
    reg_date               TIMESTAMPTZ NOT NULL DEFAULT now(),
    reg_status             VARCHAR(30) NOT NULL
                           CHECK (reg_status IN ('Confirmed', 'Waitlisted', 'Cancelled')),
    attendance_status      VARCHAR(20)
                           CHECK (attendance_status IS NULL OR attendance_status IN ('Present', 'Absent')),
    cancelled_at           TIMESTAMPTZ,
    cancellation_reason    TEXT,
    attendance_marked_at   TIMESTAMPTZ,
    attendance_marked_by   VARCHAR(50) REFERENCES administrations(admin_id),
    CONSTRAINT uq_registration_event_student UNIQUE (event_id, student_number)
);

-- 12. VENUE BOOKING (booking history)
CREATE TABLE venue_booking (
    booking_id       VARCHAR(30) PRIMARY KEY,
    event_id         VARCHAR(30) NOT NULL REFERENCES event(event_id),
    venue_id         VARCHAR(30) NOT NULL REFERENCES venue(venue_id),
    starts_at        TIMESTAMPTZ NOT NULL,
    ends_at          TIMESTAMPTZ NOT NULL,
    buffer_minutes   INTEGER NOT NULL DEFAULT 0 CHECK (buffer_minutes >= 0),
    booking_status   VARCHAR(30) NOT NULL
                     CHECK (booking_status IN ('Pending', 'Confirmed', 'Cancelled', 'Replaced', 'Rejected')),
    authorized_by    VARCHAR(50) NOT NULL REFERENCES administrations(admin_id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    change_reason    TEXT,
    status_changed_at TIMESTAMPTZ,
    CONSTRAINT chk_venue_booking_time CHECK (ends_at > starts_at)
);

-- At most one confirmed booking record per event. Historical records can remain
-- as Replaced/Cancelled. Availability conflicts between different events still
-- need a transaction-safe booking procedure or an exclusion constraint.
CREATE UNIQUE INDEX uq_venue_booking_confirmed_event
    ON venue_booking(event_id)
    WHERE booking_status = 'Confirmed';

-- 13. NOTIFICATIONS
CREATE TABLE notifications (
    notification_id   BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    recipient_user_id VARCHAR(50) NOT NULL REFERENCES users(user_id),
    event_id          VARCHAR(30) REFERENCES event(event_id),
    proposal_id       VARCHAR(30) REFERENCES event_proposal(proposal_id),
    notification_type VARCHAR(100) NOT NULL,
    message           TEXT NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at           TIMESTAMPTZ,
    CONSTRAINT chk_notification_target
        CHECK (event_id IS NOT NULL OR proposal_id IS NOT NULL)
);

-- Index foreign-key columns commonly used for joins and filtering.
CREATE INDEX idx_event_type_id ON event(event_type_id);
CREATE INDEX idx_event_org_id ON event(org_id);
CREATE INDEX idx_event_proposal_id ON event(proposal_id);
CREATE INDEX idx_proposal_org_id ON event_proposal(org_id);
CREATE INDEX idx_proposal_event_type_id ON event_proposal(event_type_id);
CREATE INDEX idx_schedule_proposal_id ON proposal_schedule(proposal_id);
CREATE INDEX idx_schedule_venue_id ON proposal_schedule(venue_id);
CREATE INDEX idx_review_proposal_id ON proposal_review(proposal_id);
CREATE INDEX idx_review_admin_id ON proposal_review(admin_id);
CREATE INDEX idx_registration_student_number ON registration(student_number);
CREATE INDEX idx_registration_event_id ON registration(event_id);
CREATE INDEX idx_booking_venue_id ON venue_booking(venue_id);
CREATE INDEX idx_booking_event_id ON venue_booking(event_id);
CREATE INDEX idx_notifications_recipient_created ON notifications(recipient_user_id, created_at DESC);
