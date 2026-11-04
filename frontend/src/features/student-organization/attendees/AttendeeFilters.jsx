import AttendeeIcon from './AttendeeIcon'
import { ATTENDANCE_OPTIONS, REGISTRATION_OPTIONS } from './attendeeModel.js'

const REGISTRATION_LABEL = { All: 'Registration: All (Confirmed, Waitlisted, Cancelled)' }
const ATTENDANCE_LABEL = { All: 'Attendance: All (Present, Absent, Unmarked)' }

function Select({ id, label, value, onChange, children }) {
  return <div className="organization-attendees-select">
    <label htmlFor={id} className="organization-events-sr">{label}</label>
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>
    <AttendeeIcon name="chevron-down" size={12} />
  </div>
}

export default function AttendeeFilters({ filters, colleges, onChange }) {
  return <form className="organization-attendees-toolbar" role="search" aria-label="Filter Attendees" onSubmit={(event) => event.preventDefault()}>
    <div className="organization-attendees-search">
      <label htmlFor="organization-attendees-search" className="organization-events-sr">Search Attendees</label>
      <AttendeeIcon name="search" size={14} />
      <input id="organization-attendees-search" type="search" name="attendee-search" autoComplete="off" spellCheck={false} placeholder="Search by student name, ID number (e.g. 2021-04821)..." value={filters.query} onChange={(event) => onChange({ query: event.target.value })} />
    </div>
    <div className="organization-attendees-filter-row">
      <Select id="organization-attendees-registration" label="Registration Status" value={filters.registration} onChange={(registration) => onChange({ registration })}>
        {REGISTRATION_OPTIONS.map((option) => <option key={option} value={option}>{REGISTRATION_LABEL[option] ?? `Registration: ${option}`}</option>)}
      </Select>
      <Select id="organization-attendees-attendance" label="Attendance Status" value={filters.attendance} onChange={(attendance) => onChange({ attendance })}>
        {ATTENDANCE_OPTIONS.map((option) => <option key={option} value={option}>{ATTENDANCE_LABEL[option] ?? `Attendance: ${option}`}</option>)}
      </Select>
      <Select id="organization-attendees-college" label="College" value={filters.college} onChange={(college) => onChange({ college })}>
        <option value="All">College: All</option>
        {colleges.map((college) => <option key={college} value={college}>College: {college}</option>)}
      </Select>
    </div>
  </form>
}
