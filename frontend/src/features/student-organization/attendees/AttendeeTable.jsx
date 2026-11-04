import { useEffect, useRef } from 'react'
import AttendeeIcon from './AttendeeIcon'
import { archivedAttendanceText } from './attendeeModel.js'
import { statusLabel } from './attendeeFormat.js'

function StatusPill({ row }) {
  const tone = row.reg_status === 'Confirmed' ? 'is-confirmed' : row.reg_status === 'Waitlisted' ? 'is-waitlisted' : 'is-cancelled'
  return <span className={`organization-attendees-pill ${tone}`}>{row.reg_status === 'Confirmed' ? <i aria-hidden="true" /> : null}{statusLabel(row)}</span>
}

function MarkCell({ row, canMark, pending, hintId, onMark }) {
  if (row.reg_status === 'Waitlisted') return <span className="organization-attendees-pending-seat"><i aria-hidden="true" />Pending Seat Allocation</span>
  if (row.reg_status !== 'Confirmed') return <span className="organization-attendees-dash">-</span>
  const disabled = !canMark || pending
  const press = (status) => () => { if (!disabled) onMark(row, status) }
  const aria = { 'aria-disabled': disabled ? 'true' : undefined, 'aria-describedby': !canMark ? hintId : undefined }
  const current = row.attendance_status
  if (current === 'Present' || current === 'Absent') {
    const next = current === 'Present' ? 'Absent' : 'Present'
    return <button type="button" className={`organization-attendees-mark is-set ${current === 'Present' ? 'is-present' : 'is-absent'}`} aria-busy={pending || undefined} aria-label={`Marked ${current} for ${row.name}. Switch to ${next}.`} onClick={press(next)} {...aria}>
      <AttendeeIcon name={current === 'Present' ? 'check' : 'x'} size={11} />{current.toUpperCase()}
    </button>
  }
  return <div className="organization-attendees-mark-group" role="group" aria-label={`Mark attendance for ${row.name}`} aria-busy={pending || undefined}>
    <button type="button" className="organization-attendees-mark is-open is-present" onClick={press('Present')} {...aria}>Present</button>
    <button type="button" className="organization-attendees-mark is-open is-absent" onClick={press('Absent')} {...aria}>Absent</button>
  </div>
}

export default function AttendeeTable({ rows, readOnly, selected, onToggle, onToggleAll, pending, canMark, onMark, hintId, filteredEmpty }) {
  const selectable = rows.filter((row) => row.reg_status === 'Confirmed')
  const chosen = selectable.filter((row) => selected.has(row.reg_id)).length
  const allRef = useRef(null)
  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = chosen > 0 && chosen < selectable.length
  }, [chosen, selectable.length])
  const columns = readOnly ? 4 : 5

  return <div className="organization-attendees-table-wrap">
    <table className={`organization-attendees-table ${readOnly ? 'is-readonly' : ''}`}>
      <caption className="organization-events-sr">{readOnly ? 'Registrations and attendance log' : 'Event attendees and attendance'}</caption>
      <colgroup>
        {readOnly ? null : <col className="organization-attendees-col-select" />}
        <col />
        <col className="organization-attendees-col-log" />
        <col className="organization-attendees-col-status" />
        <col className="organization-attendees-col-mark" />
      </colgroup>
      <thead>
        <tr>
          {readOnly ? null : <th scope="col" className="organization-attendees-th-select">
            <input ref={allRef} type="checkbox" aria-label="Select all confirmed attendees on this page" checked={selectable.length > 0 && chosen === selectable.length} disabled={selectable.length === 0} onChange={onToggleAll} />
          </th>}
          <th scope="col">Attendee</th>
          <th scope="col">Registration Log</th>
          <th scope="col">Registration Status</th>
          <th scope="col">{readOnly ? 'Attendance' : 'Mark Attendance'}</th>
        </tr>
      </thead>
      <tbody>
        {filteredEmpty ? <tr className="organization-attendees-empty-row"><td colSpan={columns}>No attendees match your filters.</td></tr> : rows.map((row) => {
          const rowClass = row.reg_status === 'Waitlisted' ? 'is-waitlisted' : row.reg_status === 'Cancelled' ? 'is-cancelled' : ''
          const text = archivedAttendanceText(row)
          return <tr key={row.reg_id} className={rowClass}>
            {readOnly ? null : <td className="organization-attendees-td-select" data-label="Select">
              <input type="checkbox" aria-label={`Select ${row.name}`} checked={selected.has(row.reg_id)} disabled={row.reg_status !== 'Confirmed'} onChange={() => onToggle(row.reg_id)} />
            </td>}
            <td className="organization-attendees-td-person" data-label="Attendee">
              <strong className="organization-attendees-name">{row.name}</strong>
              {row.student_number ? <span className="organization-attendees-number">{row.student_number}</span> : null}
              {row.college || row.rest ? <span className="organization-attendees-detail">{row.college ? <b>{row.college}</b> : null}{row.college && row.rest ? ' \u2022 ' : ''}{row.rest}</span> : null}
            </td>
            <td data-label="Registration Log">
              <span className="organization-attendees-stamp">{row.reg_label || '-'}</span>
              <span className="organization-attendees-source"><AttendeeIcon name="globe" size={11} />{row.source}</span>
            </td>
            <td data-label="Registration Status"><StatusPill row={row} /></td>
            {readOnly
              ? <td data-label="Attendance"><span className={`organization-attendees-log ${row.reg_status === 'Waitlisted' ? 'is-muted' : ''}`}>{text}</span></td>
              : <td data-label="Mark Attendance"><MarkCell row={row} canMark={canMark} pending={pending.has(row.reg_id)} hintId={hintId} onMark={onMark} /></td>}
          </tr>
        })}
      </tbody>
    </table>
  </div>
}
