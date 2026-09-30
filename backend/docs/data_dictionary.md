**Table: Users**
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| User_ID | VARCHAR(50) | PK | Unique identifier for the base user account.[cite: 1] |
| Email | VARCHAR(100) | NOT NULL, UNIQUE | User's email address used for login authentication.[cite: 1] |
| Password | VARCHAR(255) | NOT NULL | Hashed password for account security.[cite: 1] |
| Role | ENUM | NOT NULL | Defines the access level for each role ('Student', 'Organization', 'Admin').[cite: 1] |
| Date_Created | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp recording for when the account was registered in the system.[cite: 1] |

**Table: Students**
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| Student_Number | VARCHAR(20) | PK, FK (References Users.User_ID) | Unique student identifier; maps back to the base user record.[cite: 2] |
| Name | VARCHAR(200) | NOT NULL | Full name of the student.[cite: 2] |
| Year_Level | VARCHAR(20) | NOT NULL | The current academic year level of the student.[cite: 2] |
| College | VARCHAR(175) | NOT NULL | The specific college the student belongs to.[cite: 2] |
| Program | VARCHAR(175) | NOT NULL | The degree program the student is enrolled in under their college.[cite: 2] |

**Table: Student_Organizations**
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| Org_ID | VARCHAR(50) | PK, FK (References Users.User_ID) | Unique organization identifier; maps back to the base user record.[cite: 3] |
| Org_Name | VARCHAR(200) | NOT NULL | The complete and official name of the student organization.[cite: 3] |
| Organization_Type | VARCHAR(50) | NOT NULL | Classification of the student organization (e.g., Academic/Non-Academic).[cite: 3] |
| Acronym | VARCHAR(20) | NULL | The abbreviated name or initials of the student organization.[cite: 3] |
| College | VARCHAR(175) | NULL | The college the organization is affiliated with.[cite: 3] |
| Accreditation_Status | BOOLEAN | NOT NULL | Current standing of the organization with the PLM OSDS. (1=Accredited, 0=Not Accredited)[cite: 3] |

**Table: Administrators**
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| Admin_ID | VARCHAR(50) | PK, FK (References Users.User_ID) | Unique administrator identifier; maps back to the base user record.[cite: 4] |
| Name | VARCHAR(200) | NOT NULL | Full name of the administrative staff/official.[cite: 4] |
| Position | VARCHAR(175) | NOT NULL | The job title or role of the administrator.[cite: 4] |
| Office_Assigned | VARCHAR(100) | NOT NULL | The university department or office the admin reports to.[cite: 4] |
| Faculty | BOOLEAN | NOT NULL | Indicates if the administrator also holds a teaching position currently (1=Yes, 0=No).[cite: 4] |

**Table: Event_Proposal**
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| Proposal_ID | INT | PK, Auto Increment | Unique identifier for the event proposal submitted to the administration.[cite: 5] |
| Org_ID | VARCHAR(50) | FK (References Student_Organizations.Org_ID), NOT NULL | Identifies the organization that submitted the proposal.[cite: 5] |
| Submission_Date | DATETIME | NOT NULL | The exact date and time the event proposal was filed.[cite: 5] |
| Approval_Status | VARCHAR(50) | NOT NULL | Tracks workflow state (e.g., Pending, Approved, Rejected).[cite: 5] |
| Admin_Remarks | TEXT | NULL | Comments or required revisions provided by the reviewer.[cite: 5] |
| Reviewed_By | VARCHAR(50) | FK (References Administrators.Admin_ID), NULL | The Admin_ID of the staff member who processed the proposal.[cite: 5] |

**Table: Event**
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| Event_ID | INT | PK, Auto Increment | Unique identifier for the officially scheduled event.[cite: 6] |
| Event_Name | VARCHAR(200) | NOT NULL | The title of the event.[cite: 6] |
| Event_Type | VARCHAR(100) | NOT NULL | Type of the event (e.g., workshop, competition).[cite: 6] |
| Event_Date | DATE | NOT NULL | The calendar date on which the event occurs.[cite: 6] |
| Start_Time | TIME | NOT NULL | The scheduled start time.[cite: 6] |
| End_Time | TIME | NOT NULL | The scheduled conclusion time.[cite: 6] |
| Expected_Attendees | INT | NOT NULL | The projected headcount for the event.[cite: 6] |
| Org_ID | VARCHAR(50) | FK (References Student_Organizations.Org_ID), NOT NULL | Directly identifies the managing organization.[cite: 6, 7] |
| Venue_ID | INT | FK (References Venue.Venue_ID), NOT NULL | Identifies the location booked for the event.[cite: 7] |
| Event_Status | VARCHAR(50) | NOT NULL | Current state (e.g., Upcoming, Ongoing, Cancelled, Completed).[cite: 7] |
| Proposal_ID | INT | FK (References Event_Proposal.Proposal_ID), UNIQUE, NULL | Unique identifier for the event proposal submitted to the administration.[cite: 7] |

**Table: Venue**
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| Venue_ID | INT | PK, Auto Increment | Unique identifier for the booked venue.[cite: 8] |
| Venue_Name | VARCHAR(200) | NOT NULL | The designated name of the booked venue.[cite: 8] |
| Floor_Number | VARCHAR(20) | NULL | The atomic floor location (e.g., 2nd Floor, Ground).[cite: 8] |
| Room_Number | VARCHAR(20) | NULL | The atomic room identifier (e.g., Rm 204).[cite: 8] |
| Building | VARCHAR(200) | NOT NULL | The name of the building housing the venue.[cite: 8] |
| Min_Attendees | INT | NULL | The minimum required headcount to reserve this space.[cite: 8] |
| Max_Capacity | INT | NOT NULL | The maximum capacity or physical limit of people allowed.[cite: 8] |
| Available_Equipment | TEXT | NULL | A list of provided facilities housed in the venue booked (e.g., projector, chairs, sound system).[cite: 8] |

**Table: Registration - Bridging Entity**
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| Reg_ID | INT | PK, Auto Increment | Unique identifier for the registration ticket/record.[cite: 9] |
| Event_ID | INT | FK (References Event.Event_ID), NOT NULL, UNIQUE (Event_ID, Student_Number) | Identifies the event the student is signing up for.[cite: 9] |
| Student_Number | VARCHAR(20) | FK (References Students.Student_Number), NOT NULL, UNIQUE (Event_ID, Student_Number) | Identifies the student making the registration.[cite: 9] |
| Reg_Date | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | The exact timestamp of the registration of the user was logged by the system.[cite: 9] |
| Reg_Status | VARCHAR(50) | NOT NULL | State of the ticket (Confirmed, Waitlisted, Cancelled).[cite: 9] |
| Attendance_Status | VARCHAR(50) | NULL | Tracks physical presence (e.g., Present, Absent); null until event day.[cite: 9] |