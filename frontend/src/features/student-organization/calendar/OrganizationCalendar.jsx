import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/authContext'
import { supabase } from '../../../lib/supabase'
import OrganizationHeader from '../components/OrganizationHeader'
import OrganizationFooter from '../components/OrganizationFooter'
import Icon from '../components/OrganizationIcon'
import { WEEKDAY_LABELS, addDaysToKey, addMonths, buildMonthGrid, currentMonth, formatLongDate, formatManilaTime, formatMonthTitle, makeDayKey, monthRange, todayKey } from './calendarDates'
import { dayStatus, daySlots, isPastDay } from './availability'
import { fetchVenueBookings, fetchVenues, venueDetails, venueLabel } from './venueApi'
import { fetchUnpublishedApprovedEvents } from './unpublishedEventsApi'
import '../OrganizationDashboard.css'
import './OrganizationCalendar.css'

const OWN_ONLY_NOTICE = 'Showing only your organization’s bookings. Other organizations’ bookings will appear once venue availability sharing is enabled.'

function CalendarGrid({ year, month, bookings, selectedKey, onSelect, now }) {
  const gridRef = useRef(null)
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month])
  const statuses = useMemo(() => {
    const map = new Map()
    for (const cell of cells) if (cell.inMonth) map.set(cell.key, dayStatus(cell.key, bookings, now))
    return map
  }, [cells, bookings, now])
  const today = todayKey(now)
  const firstKey = makeDayKey(year, month, 1)
  const tabStop = selectedKey && statuses.has(selectedKey) ? selectedKey : statuses.has(today) ? today : firstKey

  function onKeyDown(event, key) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key]
    if (!step) return
    const target = addDaysToKey(key, step)
    const node = statuses.has(target) ? gridRef.current?.querySelector(`[data-day="${target}"]`) : null
    if (node) { event.preventDefault(); node.focus() }
  }

  return <div className="organization-calendar-grid" ref={gridRef} role="group" aria-label={`${formatMonthTitle(year, month)} dates`}>
    {WEEKDAY_LABELS.map(label => <span className="organization-calendar-weekday" key={label} aria-hidden="true">{label}</span>)}
    {cells.map(cell => {
      if (!cell.inMonth) return <span className="organization-calendar-cell is-outside" key={cell.key} aria-hidden="true">{cell.day}</span>
      const past = isPastDay(cell.key, now)
      const status = statuses.get(cell.key)
      const selected = cell.key === selectedKey
      const isToday = cell.key === today
      const classes = ['organization-calendar-cell', `is-${status}`, selected && 'is-selected', past && 'is-past', isToday && 'is-today'].filter(Boolean).join(' ')
      return <button
        key={cell.key}
        type="button"
        className={classes}
        data-day={cell.key}
        tabIndex={cell.key === tabStop ? 0 : -1}
        aria-label={`${formatLongDate(cell.key)}, ${selected ? 'selected, ' : ''}${status}${isToday ? ', today' : ''}`}
        aria-pressed={selected}
        aria-current={isToday ? 'date' : undefined}
        aria-disabled={past || undefined}
        onClick={() => { if (!past) onSelect(cell.key) }}
        onKeyDown={event => onKeyDown(event, cell.key)}
      >{cell.day}</button>
    })}
  </div>
}

function SlotTable({ slots, venueName }) {
  return <table className="organization-slot-table">
    <thead><tr><th scope="col">Start time</th><th scope="col">End time</th><th scope="col">Status</th></tr></thead>
    <tbody>
      {slots.map(slot => <Fragment key={slot.id}>
        <tr className={`organization-slot-row is-${slot.kind}`}>
          <td data-label="Start time"><strong>{formatManilaTime(slot.startsAt)}</strong></td>
          <td data-label="End time">{formatManilaTime(slot.endsAt)}</td>
          <td data-label="Status"><span className={`organization-slot-tag is-${slot.kind}`}>{slot.status}</span></td>
        </tr>
        {slot.kind === 'occupied' && <tr className="organization-slot-detail"><td colSpan={3}>
          {slot.events.map(event => <dl key={event.id}>
            <div><dt>Hosted event</dt><dd>{event.eventName || 'Not shared'}</dd></div>
            <div><dt>Organization</dt><dd>{event.organizationName || 'Not shared'}</dd></div>
            <div><dt>Venue</dt><dd>{venueName}</dd></div>
            <div><dt>Event time</dt><dd>{formatManilaTime(event.startsAt)} to {formatManilaTime(event.endsAt)}</dd></div>
          </dl>)}
        </td></tr>}
      </Fragment>)}
    </tbody>
  </table>
}

export default function OrganizationCalendar() {
  const { profile } = useAuth()
  const orgId = profile.user_id
  const [now] = useState(() => Date.now())
  const [venues, setVenues] = useState([])
  const [venuesState, setVenuesState] = useState({ loading: true, error: '' })
  const [venueId, setVenueId] = useState('')
  const [month, setMonth] = useState(() => currentMonth())
  const [selectedKey, setSelectedKey] = useState(null)
  const [availability, setAvailability] = useState(null)
  const [events, setEvents] = useState({ loading: true, error: '', rows: [] })
  const [orgName, setOrgName] = useState('')

  useEffect(() => {
    let active = true
    fetchVenues(supabase).then(rows => {
      if (!active) return
      setVenues(rows)
      setVenueId(current => current || rows[0]?.venue_id || '')
      setVenuesState({ loading: false, error: '' })
    }).catch(error => { if (active) setVenuesState({ loading: false, error: error.message }) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    fetchUnpublishedApprovedEvents(supabase, orgId)
      .then(rows => { if (active) setEvents({ loading: false, error: '', rows }) })
      .catch(error => { if (active) setEvents({ loading: false, error: error.message, rows: [] }) })
    supabase.from('student_organization').select('org_name').eq('org_id', orgId).maybeSingle().then(({ data }) => { if (active && data?.org_name) setOrgName(data.org_name) })
    return () => { active = false }
  }, [orgId])

  const requestKey = venueId ? `${venueId}|${month.year}-${month.month}` : ''
  useEffect(() => {
    if (!requestKey) return undefined
    let active = true
    const { fromIso, toIso } = monthRange(month.year, month.month)
    fetchVenueBookings(supabase, venueId, fromIso, toIso)
      .then(result => { if (active) setAvailability({ key: requestKey, error: '', ...result }) })
      .catch(error => { if (active) setAvailability({ key: requestKey, error: error.message, bookings: [], source: 'shared' }) })
    return () => { active = false }
  }, [requestKey, venueId, month.year, month.month])

  const ready = availability?.key === requestKey
  const bookings = useMemo(() => {
    if (!ready) return []
    return availability.source === 'own' && orgName ? availability.bookings.map(item => ({ ...item, organization_name: item.organization_name || orgName })) : availability.bookings
  }, [ready, availability, orgName])
  const venue = venues.find(item => item.venue_id === venueId)
  const slots = useMemo(() => selectedKey && ready ? daySlots(selectedKey, bookings, now) : [], [selectedKey, ready, bookings, now])

  function changeMonth(delta) {
    setMonth(current => addMonths(current, delta))
    setSelectedKey(null)
  }

  function changeVenue(event) {
    setVenueId(event.target.value)
    setSelectedKey(null)
  }

  let slotContent
  if (!selectedKey) slotContent = <p className="organization-calendar-empty" role="status">Select a date on the calendar to see its time slots.</p>
  else if (!ready) slotContent = <p className="organization-calendar-empty" role="status">Loading time slots…</p>
  else if (availability.error) slotContent = <p className="organization-calendar-empty" role="status">Time slots are unavailable until the calendar loads.</p>
  else if (!slots.length) slotContent = <p className="organization-calendar-empty" role="status">No time slots for {formatLongDate(selectedKey)}.</p>
  else slotContent = <SlotTable slots={slots} venueName={venueLabel(venue)} />

  return <main className="organization-portal-page organization-calendar-page">
    <OrganizationHeader active="calendar" skipTarget="organization-calendar-heading" />
    <section className="organization-context-bar" aria-labelledby="organization-calendar-heading"><div className="organization-context-inner organization-calendar-title"><h1 id="organization-calendar-heading">Calendar</h1><p>Review venue availability and select an available date to plan your event.</p></div></section>
    <div className="organization-main"><div className="organization-calendar-content">
      <section className="organization-calendar-card" aria-labelledby="organization-venue-heading">
        <div className="organization-calendar-card-head">
          <div className="organization-calendar-venue">
            <h2 id="organization-venue-heading"><Icon name="calendar" size={18} />Venue Availability</h2>
            <label htmlFor="organization-venue-select">Venue</label>
            <select id="organization-venue-select" value={venueId} onChange={changeVenue} disabled={!venues.length}>
              {venuesState.loading && <option value="">Loading venues…</option>}
              {!venuesState.loading && !venues.length && <option value="">No venues available</option>}
              {venues.map(item => <option key={item.venue_id} value={item.venue_id}>{venueLabel(item)}</option>)}
            </select>
            {venue && <p className="organization-calendar-venue-details">{venueDetails(venue)}</p>}
          </div>
          <div className="organization-calendar-month">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month"><Icon name="chevron-left" size={18} /></button>
            <h3 aria-live="polite">{formatMonthTitle(month.year, month.month)}</h3>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Next month"><Icon name="chevron-right" size={18} /></button>
          </div>
        </div>
        {venuesState.error && <p className="organization-inline-error" role="alert">{venuesState.error}</p>}
        {ready && availability.error && <p className="organization-inline-error" role="alert">{availability.error}</p>}
        {ready && !availability.error && availability.source === 'own' && <p className="organization-calendar-notice" role="status">{OWN_ONLY_NOTICE}</p>}
        <div className="organization-calendar-body" aria-busy={!ready && !!requestKey}>
          <CalendarGrid year={month.year} month={month.month} bookings={bookings} selectedKey={selectedKey} onSelect={setSelectedKey} now={now} />
        </div>
        <ul className="organization-calendar-legend" aria-label="Legend">
          <li><i className="is-available" />Available</li><li><i className="is-selected" />Selected</li><li><i className="is-unavailable" />Unavailable</li>
        </ul>
      </section>

      <section className="organization-calendar-card" aria-labelledby="organization-slots-heading">
        <div className="organization-calendar-card-head is-stacked">
          <h2 id="organization-slots-heading"><Icon name="calendar" size={18} />Available Time Slots</h2>
          <p>{selectedKey ? `${formatLongDate(selectedKey)} (Manila time). ` : ''}Slots are illustrative and should be verified before final booking.</p>
        </div>
        <div className="organization-calendar-card-body">{slotContent}</div>
      </section>

      <section className="organization-calendar-card" aria-labelledby="organization-unpublished-heading">
        <div className="organization-calendar-card-head is-stacked">
          <h2 id="organization-unpublished-heading"><Icon name="calendar" size={18} />Unpublished Approved Events</h2>
          <p>Approved unpublished events. These events are ready for publication once final details are confirmed.</p>
        </div>
        <div className="organization-calendar-card-body">
          {events.error && <p className="organization-inline-error" role="alert">{events.error}</p>}
          {events.loading ? <p className="organization-calendar-empty" role="status">Loading approved events…</p> : !events.error && !events.rows.length ? <p className="organization-calendar-empty" role="status">No unpublished approved events yet.</p> : events.rows.length > 0 && <table className="organization-slot-table organization-events-table">
            <thead><tr><th scope="col">Proposal</th><th scope="col">Date</th><th scope="col">Venue</th><th scope="col" className="is-end">Action</th></tr></thead>
            <tbody>{events.rows.map(row => <tr key={row.proposal_id} className="organization-slot-row">
              <td data-label="Proposal"><strong>{row.event_name}</strong></td>
              <td data-label="Date">{row.date_label}</td>
              <td data-label="Venue">{row.venue_label}</td>
              <td data-label="Action" className="is-end"><Link className="organization-review-link" to={row.review_path} aria-label={`Review ${row.event_name}`}>Review</Link></td>
            </tr>)}</tbody>
          </table>}
        </div>
      </section>

      <Link className="organization-manage-approved" to="/student-organization/calendar/approved-events"><Icon name="calendar" size={16} />Manage Approved Events</Link>
    </div></div>
    <OrganizationFooter />
  </main>
}
