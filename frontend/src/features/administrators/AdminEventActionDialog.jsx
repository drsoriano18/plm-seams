import { useEffect, useRef, useState } from 'react'
import { dateKey, eventBooking } from './calendarData'
import './AdminEventActionDialog.css'

const timeValue = value => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value))
const dateLabel = value => new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value))

export default function AdminEventActionDialog({ kind, event, venues, onClose, onConfirm, busy, error }) {
  const dialog = useRef(null)
  const [reason, setReason] = useState('')
  const [date, setDate] = useState(dateKey(event.starts_at))
  const [endDate, setEndDate] = useState(dateKey(event.ends_at))
  const [start, setStart] = useState(timeValue(event.starts_at))
  const [end, setEnd] = useState(timeValue(event.ends_at))
  const [venueId, setVenueId] = useState(eventBooking(event)?.venue_id || '')
  const title = kind === 'cancel' ? 'Cancel' : kind === 'reschedule' ? 'Reschedule' : 'Archive'
  useEffect(() => { const element = dialog.current; element.showModal(); return () => element.close() }, [])
  function submit(e) {
    e.preventDefault()
    onConfirm(kind === 'reschedule' ? { reason, date, endDate, start, end, venueId } : reason)
  }
  return <dialog ref={dialog} className="admin-event-dialog" aria-labelledby="admin-event-dialog-title" onCancel={e => { e.preventDefault(); if (!busy) onClose() }}>
    <form onSubmit={submit}>
      <header><small>{title} Confirmation</small><h2 id="admin-event-dialog-title">{title} {event.proposal?.event_name}?</h2><p>Are you sure you want to {kind} this event?</p><button type="button" aria-label="Close dialog" disabled={busy} onClick={onClose}>×</button></header>
      <div className="admin-event-dialog-body"><section className="admin-event-dialog-summary"><small>Event to {kind}</small><h3>{event.proposal?.event_name}</h3><div className="admin-event-dialog-dates"><div><small>Starts</small><strong>{dateLabel(event.starts_at)}</strong><span>{timeValue(event.starts_at)}</span></div><div><small>Concludes</small><strong>{dateLabel(event.ends_at)}</strong><span>{timeValue(event.ends_at)}</span></div></div></section>
        {kind === 'reschedule' && <section className="admin-event-dialog-replacement"><small>Replacement Schedule</small><h3>Proposed new dates and venue</h3><div className="admin-event-dialog-fields"><label>New start date<input type="date" required value={date} onChange={e => setDate(e.target.value)} /></label><label>New start time<input type="time" required value={start} onChange={e => setStart(e.target.value)} /></label><label>New end date<input type="date" required min={date} value={endDate} onChange={e => setEndDate(e.target.value)} /></label><label>New end time<input type="time" required value={end} onChange={e => setEnd(e.target.value)} /></label><label className="admin-event-dialog-venue">Replacement venue<select required value={venueId} onChange={e => setVenueId(e.target.value)}><option value="" disabled>Select a venue</option>{venues.map(venue => <option value={venue.venue_id} key={venue.venue_id}>{venue.venue_name}</option>)}</select></label></div></section>}
        {kind !== 'archive' && <label className="admin-event-dialog-reason">{kind === 'cancel' ? 'Cancellation' : 'Rescheduling'} Reason <span>Required</span><textarea required maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} placeholder={`Enter the reason for ${kind === 'cancel' ? 'cancellation' : 'rescheduling'}…`} /></label>}
        {error && <p className="admin-event-dialog-error" role="alert">{error}</p>}
      </div>
      <footer><button type="submit" className={kind === 'cancel' ? 'is-danger' : ''} disabled={busy || (kind !== 'archive' && !reason.trim())}>{busy ? 'Saving…' : `Confirm ${title}`}</button><button type="button" disabled={busy} onClick={onClose}>Cancel</button></footer>
    </form>
  </dialog>
}
