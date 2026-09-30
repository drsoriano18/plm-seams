# PLM SEAMS DATABASE REQUIREMENTS

## SYSTEM REQUIREMENTS

### Functional Requirements

#### 3.1.1 Users Authentication and Role Management

The system uses a secure login system to manage user accounts and control access. Depending on the user’s assigned role determines which specific features they can access.

**The systems shall:**

- Allow users to create and manage their accounts using their university ID numbers.
- Assign newly registered users with access only to student-related functions by default.
- Allow users to request for a Student Organization or Administrator account role.
- Allow authorized administrators to review and verify accounts requisition for Student Organization or Administrator access/
- Provide users with access to system features based on their verified and assigned roles.
- Restrict unauthorized access to functions intended for Student Organizations and Administrators.

#### 3.1.2 Venue Booking and Schedule Management

The system shall provide a centralized feature for venue and scheduling management to prevent conflicts and overlaps between proposed events.

**The system shall:**

- Allow student organizations to view available venues and equipment that are included in the system database.
- Display information regarding venues location, maximum capacity, and available equipment.
- Allow student organizations to check the availability of preferred venues based on a centralized calendar of approved events.
- Allow students to submit a request to book a venue and equipment by specifying preferred date and schedule.
- Allow organizations to set back-up dates in case of rejection from the university officials or weather conditions.
- Detect overlapping venue and equipment requests that involve confliction schedules by restricting reservations.
- Allow administrators to monitor and manage the availability of requested venues and equipment.

#### 3.1.3 Event Creation and Approval

##### 3.1.3.1 Event Proposal Submission

This allows student organizations to digitally submit and monitor their event proposals through the system.

**The system shall:**

- Enable student organizations to submit event proposals digitally.
- Allow organizations to provide and update required details of the event.
- Display the current status of all submitted proposals
- Allow organizations to view the feedback or remarks provided by administrators.
- Allow Revision and resubmission is permitted based on the feedback by administrators.

##### 3.1.3.2 Event Proposal Review and Approval

This allows permitted administrators to review submitted proposals, provide feedback, and manage their approval status.

**The system shall:**

- Give admins full access to review submitted proposals.
- Enable administrators to approve, reject, or request revisions on proposals.
- Include a text field for administrators to leave specific feedback or remarks.

#### 3.1.4. Event Browsing, Registration, and Attendance Tracking

##### 3.1.4.1 Event Browsing

The system shall provide students, organizations, and university officials to have access for all upcoming, ongoing, cancelled, re-scheduled, and past events.

**The system shall:**

- Give students access to browse university events and be notified of their status.
- Display updated event status such as upcoming, ongoing, cancelled, re-scheduled, or past events.
- Display all the information related to the event such as the date, time, venue, college host, and program flow.

##### 3.1.4.2 Event Registration and Attendance Tracking

The system shall allow registration of students to events, automate student attendance, and monitor crowd numbers.

**The system shall:**

- Allow students to register in events based on eligibility, such as open for everyone or for certain students of colleges only.
- Give organization and university officials an access to the total crowd number attended in the event.

### Non-Functional Requirements

#### 3.2.1 Performance

The system shall maintain reasonable response times and support high volume activities such as during event registrations and attendance tracking.

**The system shall:**

- Load web pages within 3 to 5 seconds under standard campus network conditions.
- Send automated notifications a few minutes after event registration.
- Execute venue availability and double-booking checks instantly during proposal submissions.
- Handle at least 100 active users during peak registration periods without system crashes.

#### 3.2.2 Security and Access Control

The system shall protect student information and enforce strict access boundaries aligned with the university policies.

**The system shall:**

- Restrict account creation strictly to active PLM-administered emails only (@plm.edu.ph).
- Enforce Role-Based Access Control (RBAC) to restrict unauthorized access from student profiles to Student Organization and Administrator features.
- Secure user passwords using standard hashing algorithms prior to database storage.
- Comply with basic data privacy principles by collecting only necessary student identification data.

#### 3.2.3 System Availability and Reliability

The system shall remain accessible throughout the academic term and protect user data integrity.

**The system shall:**

- Maintain consistent uptime during regular academic semesters.
- Prevent double-bookings and duplicate event registrations through database constraint checks.

#### 3.2.4 Usability and Compatibility

The system shall provide a simple, intuitive, interface design across various devices for students, organization officers, and administrators.

**The system shall:**

- Provide a mobile-responsive interface accessible on common web browsers (e.g., Chrome, Edge, Safari).
- Allow students to browse and complete an event registration in 3 clicks or fewer from the main dashboard.
- Display clear status labels (Approved, Rejected, Pending, Revisions Required) on event proposals to simplify tracking.
- Utilize a consistent design system with clear typography across all modules.

## Business Rules

This section outlines the policies and institutional requirements of PLM SEAMS. The following business rules define the boundaries to Role-Based Access Control, Event Proposal and Approval Process, Venue and Resource Allocation, and Function Scopes (Registration and Attendance, Event Scope Exclusions). These rules ensure that the platform operates in alignment with the existing guidelines of the approved 2025 PLM Student Manual and digital governance structures.

### User Authentication and Role Management

- **SEAMS-UA-01:** Only individuals with a valid PLM-administered email, @plm.edu.ph, may access and register for the system.
- **SEAMS-UA-02:** Role-Based Access Control is implemented, effectively determining system privileges for the following: Students, Organizers, Admin.
- **SEAMS-UA-03:** Students can only browse and register through open events.
- **SEAMS-UA-04:** Only accredited student organizations (Academic & Non-Academic) may submit event proposals, book venues and resources, and publish open events.
- **SEAMS-UA-05:** Only the verified PLM OSDS Admin and Admin Staff are allowed to monitor and review events.

### Event Creation and Approval

- **SEAMS-EC-01:** The final approval of proposed events falls under the professional responsibility of the PLM OSDS Admin and Admin Staff. Proposing an event is not automatically approved by the system.
- **SEAMS-EC-02:** An event proposal must be complete in detail. It must include the event name, objective, venue, schedule, resource requirements, back-up time and location, and the budget allotted by the organization before it is reviewed.
- **SEAMS-EC-03:** A proposal may be returned for revision if the office deems any information unclear or unnecessary. The required modification in the document must be outlined by the administrator.
- **SEAMS-EC-04:** An event proposal must be made 14 business days prior to the event date. If a project does not follow this timeframe, the proposal is automatically sent for revision or rejection.
- **SEAMS-EC-05:** A rejected event proposal cannot be edited or re-submitted. A new event proposal must be made.
- **SEAMS-EC-06:** The administrators are authorized to cancel an approved event and reschedule them at any time should unforeseen circumstances arise.

### Venue Booking and Schedule Management

- **SEAMS-VB-01:** Only PLM recognized venues can be booked. (e.g. Justo Albert Auditorium, University Activity Center, Rajah Sulayman Gym, GEE AVR, Computer Laboratories). Off-campus venues are out of the system’s scope. Equipment and resources are tied to the venue booked. However, if there is a need for supplementary resources on the day of the event, any available facility needed must be requested from the staff on duty.
- **SEAMS-VB-02:** A venue cannot be double-booked. No two approved events cannot occupy the same venue in the same timeslot.
- **SEAMS-VB-03:** There is a mandatory buffer between scheduled events (minimum of 1 hour) to allow proper setup.
- **SEAMS-VB-04:** Specialized facilities (e.g. Gymnasium, Computer Laboratory), require supporting approval from overseeing departments.

### Event Browsing, Registration, and Attendance Tracking

- **SEAMS-EB-01:** Registration is only available to enrolled students with valid school credentials.
- **SEAMS-EB-02:** Registration is only available for approved events. Events that are required for revision or rejected are not visible to students.
- **SEAMS-EB-03:** A student cannot register for events that have exceeded its capacity limit.
- **SEAMS-EB-04:** Attendance is only marked for registered attendees. Participation is recorded per event and tied to the individual registration record of each student. In the case of walk-in attendance, a physical record must be passed by the organizers to the OSDS for record-keeping.

### Event Scope

- **SEAMS-ES-01:** The system only supports free events. It does not record, process, and monitor any financial transactions of the student organizers.
- **SEAMS-ES-02:** In the case of merchandise sales from student organizers or external sponsorships and partnership with external companies or organizations, documentation such as Complete Staff Work (CSW) which includes Memorandum of Agreements (MOAs) and Budget Plan must be physically submitted to the OSDS. While Acknowledgement Receipts and Financial Records must be compiled and submitted to appropriate administrative offices such as the Student Commission on Audit (SCOA) for security and auditing purposes.
- **SEAMS-ES-03:** The uploading, processing, and storing of legal agreements with outside companies is strictly prohibited in the portal.
- **SEAMS-ES-04:** System-generated communications are strictly limited to the system’s notification. Student Organizations have the right to utilize external platforms (e.g. social media platforms, emails, messaging apps) to promote events or notify students. Management of these platforms are outside the scope of the system.
