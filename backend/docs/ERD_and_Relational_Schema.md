# ERD and Relational Schema

> Note: This document is aligned with `data_dictionary.md` and `database/schema.sql`. The column types below replace the earlier values transcribed from the Relational Schema image, including the truncated `varchar(2...)` entries. The ERD and Relational Schema images must be redrawn to match.

## 1. Entity Relationship Diagram (ERD)

### Entities and Attributes

#### USERS
- **User_ID** (PK)
- Email
- Password
- Role (Student / Organization / Admin)
- Date_Created

*(USERS connects to an ISA (generalization/specialization) relationship with cardinality "1" from USERS, branching into STUDENTS, STUDENT ORGANIZATIONS, and ADMINISTRATORS, each with cardinality "0:1")*

#### STUDENTS
- **Student_Number** (PK, FK → Users)
- Name
- Year_Level
- College
- Program

#### STUDENT ORGANIZATIONS
- **Org_ID** (PK, FK → Users)
- Org_Name
- Organization_Type
- Acronym
- College
- Accreditation_Status

#### ADMINISTRATORS
- **Admin_ID** (PK, FK → Users)
- Name
- Position
- Office_Assigned
- Faculty

#### EVENT PROPOSAL
- **Proposal_ID** (PK)
- Org_ID (FK)
- Submission_Date
- Approval_Status
- Admin_Remarks
- Reviewed_By (FK → Administrators.Admin_ID)

#### EVENT
- **Event_ID** (PK)
- Event_Name
- Event_Type
- Event_Date
- Start_Time
- End_Time
- Expected_Attendees
- Org_ID (FK)
- Venue_ID (FK)
- Event_Status
- Proposal_ID (FK, UNIQUE)

#### VENUE
- **Venue_ID** (PK)
- Venue_Name
- Floor_Number
- Room_Number
- Building
- Min_Attendees
- Max_Capacity
- Available_Equipment

#### REGISTERS (associative entity)
- **Reg_ID** (PK)
- Event_ID (FK)
- Student_Number (FK → Students.Student_Number)
- Attendance_Status
- Reg_Status
- Reg_Date

*(Event_ID and Student_Number together are UNIQUE: a student can register for the same event only once.)*

### Relationships

| Relationship | Entities Involved | Cardinality |
|---|---|---|
| ISA | USERS → STUDENTS | 1 : 0:1 |
| ISA | USERS → STUDENT ORGANIZATIONS | 1 : 0:1 |
| ISA | USERS → ADMINISTRATORS | 1 : 0:1 |
| CREATES | STUDENT ORGANIZATIONS → EVENT PROPOSAL | 1:M |
| REVIEWS | ADMINISTRATORS → EVENT PROPOSAL | 1:M |
| MANAGES | STUDENT ORGANIZATIONS → EVENT | 1:M |
| ORIGINATES_FROM | EVENT PROPOSAL → EVENT | 1:1 (enforced by UNIQUE on Event.Proposal_ID) |
| OCCURS_AT | EVENT → VENUE | M:1 |
| REGISTERS | STUDENTS → EVENT (via REGISTERS) | M:M |

---

## 2. Relational Schema

### Users
| Column | Type | Key |
|---|---|---|
| User_ID | varchar(50) | PK |
| Email | varchar(100) | UNIQUE |
| Password | varchar(255) | |
| Role | enum('Student','Organization','Admin') | |
| Date_Created | datetime | |

### Students
| Column | Type | Key |
|---|---|---|
| Student_Number | varchar(20) | PK, FK → Users.User_ID |
| Name | varchar(200) | |
| Year_Level | varchar(20) | |
| College | varchar(175) | |
| Program | varchar(175) | |

### Student_Organizations
| Column | Type | Key |
|---|---|---|
| Org_ID | varchar(50) | PK, FK → Users.User_ID |
| Org_Name | varchar(200) | |
| Organization_Type | varchar(50) | |
| Acronym | varchar(20) | |
| College | varchar(175) | |
| Accreditation_Status | boolean | |

### Administrators
| Column | Type | Key |
|---|---|---|
| Admin_ID | varchar(50) | PK, FK → Users.User_ID |
| Name | varchar(200) | |
| Position | varchar(175) | |
| Office_Assigned | varchar(100) | |
| Faculty | boolean | |

### Registration
| Column | Type | Key |
|---|---|---|
| Reg_ID | int | PK |
| Event_ID | int | FK → Event.Event_ID, UNIQUE (Event_ID, Student_Number) |
| Student_Number | varchar(20) | FK → Students.Student_Number, UNIQUE (Event_ID, Student_Number) |
| Attendance_Status | varchar(50) | |
| Reg_Status | varchar(50) | |
| Reg_Date | datetime | |

### Event
| Column | Type | Key |
|---|---|---|
| Event_ID | int | PK |
| Event_Name | varchar(200) | |
| Event_Type | varchar(100) | |
| Event_Date | date | |
| Start_Time | time | |
| End_Time | time | |
| Expected_Attendees | int | |
| Org_ID | varchar(50) | FK → Student_Organizations.Org_ID |
| Venue_ID | int | FK → Venue.Venue_ID |
| Event_Status | varchar(50) | |
| Proposal_ID | int | FK → Event_Proposal.Proposal_ID, UNIQUE |

### Venue
| Column | Type | Key |
|---|---|---|
| Venue_ID | int | PK |
| Venue_Name | varchar(200) | |
| Floor_Number | varchar(20) | |
| Room_Number | varchar(20) | |
| Building | varchar(200) | |
| Min_Attendees | int | |
| Max_Capacity | int | |
| Available_Equipment | text | |

### Event_Proposal
| Column | Type | Key |
|---|---|---|
| Proposal_ID | int | PK |
| Org_ID | varchar(50) | FK → Student_Organizations.Org_ID |
| Submission_Date | datetime | |
| Approval_Status | varchar(50) | |
| Admin_Remarks | text | |
| Reviewed_By | varchar(50) | FK → Administrators.Admin_ID |
