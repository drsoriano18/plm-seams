import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import AdminShell from './AdminShell'
import AdminEventActionDialog from './AdminEventActionDialog'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/authContext'
import { archiveAdminEvent, cancelAdminEvent, dateKey, eventBooking, eventDisplayState, loadApprovedEvents, loadCalendarVenues, rescheduleAdminEvent } from './calendarData'
import './ApprovedEvents.css'

const assets = import.meta.glob('./assets/events/*.svg', { eager: true, query: '?url', import: 'default' })
const states = ['All States', 'Ongoing', 'Upcoming', 'Completed', 'Cancelled', 'Rescheduled']
const dateFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' })
const pageSize = 6
const stateClass = state => state.toLowerCase()
function EventIcon({ name }) {
  return <img className="approved-icon" src={assets[`./assets/events/${name}.svg`]} alt="" aria-hidden="true" />
}
function Schedule({ event, state }) {
  const [todayKey] = useState(() => dateKey(new Date()))
  const start = new Date(event.starts_at)
  const end = new Date(event.ends_at)
  const sameDay = dateKey(start) === dateKey(end)
  const today = dateKey(start) === todayKey
  const startLabel = today ? `Today, ${new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric' }).format(start)}` : dateFormatter.format(start)
  return <div className="approved-schedule">
    <div className="approved-with-icon"><EventIcon name={`schedule-${stateClass(state)}`} /><span>{startLabel} · {timeFormatter.format(start)} – {sameDay ? '' : `${dateFormatter.format(end)} · `}{timeFormatter.format(end)}</span></div>
    <div className="approved-with-icon approved-venue"><EventIcon name="venue" />{eventBooking(event)?.venue_id ? <Link to={`/admin/calendar?venue=${encodeURIComponent(eventBooking(event).venue_id)}&date=${dateKey(event.starts_at)}`} title="Show this venue and date in the calendar">{eventBooking(event).venue?.venue_name || eventBooking(event).venue_id}</Link> : <span>No physical venue assigned</span>}</div>
  </div>
}
function Capacity({ event, state }) {
  const capacity = event.registration_capacity
  const label = state === 'Cancelled' ? 'Void' : state === 'Completed' ? 'Concluded' : event.registration_status === 'Open' ? 'Open' : 'Closed'
  return <span className={`approved-capacity ${label === 'Open' ? 'is-open' : ''}`}>{label}{capacity != null ? ` (${capacity}${label === 'Open' ? ' Reg' : ''})` : ''}</span>
}

export default function ApprovedEvents() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [venues, setVenues] = useState([])
  const [state, setState] = useState('All States')
  const [venueFilter, setVenueFilter] = useState('')
  const [organizationFilter, setOrganizationFilter] = useState('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    async function load() {
      await Promise.resolve()
      if (!active) return
      setLoading(true); setError('')
      try {
        const [loaded, availableVenues] = await Promise.all([loadApprovedEvents(supabase), loadCalendarVenues(supabase)])
        if (active) { setEvents(loaded); setVenues(availableVenues) }
      } catch (failure) { if (active) setError(failure.message || 'Unable to load approved events. Please try again.') }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [revision])

  const organizations = useMemo(() => [...new Map(events.map(event => [event.org_id, event.proposal?.organization?.org_name || event.org_id])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [events])
  const visible = useMemo(() => events.filter(event =>
    (state === 'All States' || eventDisplayState(event) === state) &&
    (!venueFilter || eventBooking(event)?.venue_id === venueFilter) &&
    (!organizationFilter || event.org_id === organizationFilter)
  ), [events, state, venueFilter, organizationFilter])
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const paged = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const ongoing = events.filter(event => eventDisplayState(event) === 'Ongoing').length
  const rescheduled = events.filter(event => event.rescheduled_at || event.rescheduled_reason).length
  const cancelled = events.filter(event => event.event_status === 'Cancelled').length
  const overrides = events.filter(event => event.rescheduled_at || event.rescheduled_reason || event.event_status === 'Cancelled').length

  function openDialog(kind, event) { setActionError(''); setDialog({ kind, event }) }
  async function confirm(value) {
    if (busy) return
    setBusy(true); setActionError('')
    try {
      if (dialog.kind === 'cancel') await cancelAdminEvent(supabase, dialog.event, value, profile.user_id)
      if (dialog.kind === 'reschedule') await rescheduleAdminEvent(supabase, dialog.event, value, profile.user_id)
      if (dialog.kind === 'archive') await archiveAdminEvent(supabase, dialog.event, profile.user_id)
      setDialog(null); setRevision(current => current + 1)
    } catch (failure) { setActionError(failure.message || 'Unable to update the event.') }
    finally { setBusy(false) }
  }

  return <AdminShell mainClassName="approved-events-main">
    <nav className="approved-breadcrumb" aria-label="Breadcrumb">
      <Link to="/admin/calendar"><EventIcon name="back" />Calendar</Link><span>/</span><span aria-current="page">Manage Approved Events</span>
    </nav>
    <section className="approved-kpis" aria-label="Event monitoring summary">
      <article className="approved-kpi"><div><h2>Active Monitoring</h2><p><strong>{events.length}</strong> Events</p><small><i />{ongoing} ongoing right now</small></div><span className="approved-kpi-icon"><EventIcon name="monitoring" /></span></article>
      <article className="approved-kpi"><div><h2>Schedule Overrides</h2><p><strong>{overrides}</strong> Cases</p><small className="approved-override-count">{rescheduled} rescheduled · {cancelled} cancelled</small></div><span className="approved-kpi-icon is-alert"><EventIcon name="overrides" /></span></article>
    </section>
    <header className="approved-title"><h1>Approved Campus Events</h1></header>
    <section className="approved-toolbar" aria-label="Filter approved events">
      <span className="approved-filter-label">Filter<br />State:</span>
      <div className="approved-state-filters">{states.map(value => <button key={value} type="button" aria-pressed={state === value} className={`${state === value ? 'is-active' : ''} is-${stateClass(value).replace(' ', '-')}`} onClick={() => { setState(value); setPage(1) }}>{value === 'All States' ? <>All<br />States</> : <><i />{value}</>}</button>)}</div>
      <div className="approved-select-filters">
        <label><span className="admin-sr-only">Venue</span><select value={venueFilter} onChange={event => { setVenueFilter(event.target.value); setPage(1) }}><option value="">All Venues (Campus-wide)</option>{venues.map(venue => <option value={venue.venue_id} key={venue.venue_id}>{venue.venue_name}</option>)}</select><EventIcon name="dropdown" /></label>
        <label><span className="admin-sr-only">Organizer unit</span><select value={organizationFilter} onChange={event => { setOrganizationFilter(event.target.value); setPage(1) }}><option value="">All Organizer Units</option>{organizations.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select><EventIcon name="dropdown" /></label>
      </div>
    </section>
    <section className="approved-table-panel" aria-label="Approved campus events">
      <div className="approved-table-scroll"><table className="approved-table">
        <colgroup><col className="approved-col-title" /><col className="approved-col-schedule" /><col /><col /><col /><col className="approved-col-actions" /></colgroup>
        <thead><tr><th scope="col">Event Title &amp; Organizer</th><th scope="col">Scheduled Slot &amp; Venue</th><th scope="col">State</th><th scope="col">Portal<br />Visibility</th><th scope="col">Org<br />Capacity</th><th scope="col">Admin Actions</th></tr></thead>
        <tbody>{!loading && !error && paged.map(event => {
          const displayState = eventDisplayState(event)
          const stateName = stateClass(displayState)
          const note = displayState === 'Cancelled' ? event.cancellation_reason : event.rescheduled_reason
          return <tr key={event.event_id} className={`approved-event-row is-${stateName}`}>
            <td><div className="approved-event-title">{event.proposal?.event_name || event.event_id}</div><div className="approved-with-icon approved-organizer"><EventIcon name={`organization-${stateName}`} /><span>{event.proposal?.organization?.org_name || event.org_id}</span></div><p className="approved-event-id">REF: {event.event_id}</p>{note && <p className={`approved-event-note ${displayState === 'Cancelled' ? 'is-cancellation' : ''}`}><EventIcon name={displayState === 'Cancelled' ? 'cancellation-note' : 'reschedule-note'} /><span>{note}</span></p>}</td>
            <td><Schedule event={event} state={displayState} /></td>
            <td><span className={`approved-state is-${stateName}`}>{displayState === 'Ongoing' ? <i /> : <EventIcon name={`state-${stateName}`} />}{displayState}</span></td>
            <td><span className={`approved-visibility ${event.publication_status === 'Published' ? 'is-published' : ''}`}><EventIcon name={event.publication_status === 'Published' ? 'published' : 'unpublished'} />{event.publication_status}</span></td>
            <td><Capacity event={event} state={displayState} /></td>
            <td><div className="approved-row-actions">
              <button type="button" onClick={() => navigate(`/admin/proposals/${encodeURIComponent(event.proposal_id)}`, { state: { from: '/admin/calendar/events', eventName: event.proposal?.event_name } })}>View Details</button>
              {['Upcoming', 'Rescheduled'].includes(displayState) && <button type="button" className="is-cancel" onClick={() => openDialog('cancel', event)}><EventIcon name="cancel" />Cancel</button>}
              {['Upcoming', 'Rescheduled'].includes(displayState) && <button type="button" className="is-reschedule" onClick={() => openDialog('reschedule', event)}><EventIcon name="reschedule" />Reschedule</button>}
              {['Completed', 'Cancelled'].includes(displayState) && <button type="button" className="is-archive" onClick={() => openDialog('archive', event)}>Archive Event</button>}
            </div></td>
          </tr>
        })}</tbody>
      </table></div>
      {loading && <p className="approved-load-state" role="status">Loading approved events…</p>}
      {error && <div className="approved-load-state" role="alert"><p>{error}</p><button type="button" onClick={() => setRevision(value => value + 1)}>Try again</button></div>}
      {!loading && !error && !visible.length && <p className="approved-load-state">No approved events match the selected filters.</p>}
      <footer className="approved-pagination"><span>Displaying {paged.length} of {visible.length} total recorded slots</span><div><button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><EventIcon name="previous" /></button><span className="admin-sr-only">Page {currentPage} of {pageCount}</span><button type="button" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><EventIcon name="next" /></button></div></footer>
    </section>
    {dialog && <AdminEventActionDialog kind={dialog.kind} event={dialog.event} venues={venues} onClose={() => { if (!busy) setDialog(null) }} onConfirm={confirm} busy={busy} error={actionError} />}
  </AdminShell>
}
