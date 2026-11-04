import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/authContext'
import { supabase } from '../../../lib/supabase'
import OrganizationHeader from '../components/OrganizationHeader'
import OrganizationFooter from '../components/OrganizationFooter'
import EventsIcon from '../events/EventsIcon'
import EventNotice from '../events/EventNotice'
import EventPagination from '../events/EventPagination'
import { fetchConfirmedCounts, fetchOrgEvents, fetchPendingBookings } from '../events/eventsApi.js'
import { CALENDAR_PATH, EVENT_PATH, STATES, STATE_FILTERS, STATE_LABEL, capacityLabel, filterRows, paginate, slotLabel, sortRows, summaryCounts, toRow } from '../events/eventState.js'
import { useNow, useRefreshTriggers } from '../events/useEventSync.js'
import { fetchVenues, venueLabel } from './venueApi.js'
import '../OrganizationDashboard.css'
import '../events/ManageApprovedEvents.css'

const FILTER_LABEL = { All: 'All States', ...Object.fromEntries(STATES.map((state) => [state, state])) }
const LINK_STATE = { from: 'approved-events' }
const NO_MATCH = { title: 'No approved events match your filters.', text: 'Try a different state or venue to see more events.' }

function Row({ row, now, confirmed }) {
  const struck = row.derived === 'Completed'
  return <tr className={`is-${row.derived.toLowerCase()}`}>
    <td data-label="Event Title & Organizer">
      <p className={`organization-events-title ${struck ? 'is-struck' : ''}`}>{row.title}</p>
      {row.organizer ? <p className="organization-events-organizer"><EventsIcon name="building" size={13} />{row.organizer}</p> : null}
      <p className="organization-events-ref">REF: {row.event_id}</p>
      {row.note ? <p className={`organization-events-note is-${row.note.tone}`}><strong>{row.note.title}</strong>{row.note.text}</p> : null}
    </td>
    <td data-label="Scheduled Slot & Venue">
      <p className="organization-events-slot"><EventsIcon name={row.derived === 'Ongoing' ? 'clock' : 'calendar'} size={14} />{slotLabel(row.starts_at, row.ends_at, now)}</p>
      <p className="organization-events-venue"><EventsIcon name="pin" size={13} />{row.venue_text}</p>
    </td>
    <td data-label="State"><span className={`organization-state-pill is-${row.derived.toLowerCase()}`}>{STATE_LABEL[row.derived]}</span></td>
    <td data-label="Portal Visibility"><span className={`organization-portal-pill ${row.portal === 'Published' ? 'is-published' : 'is-unpublished'}`}>{row.portal}</span></td>
    <td data-label="Org Capacity"><span className="organization-capacity-chip">{capacityLabel({ ...row, confirmed })}</span></td>
    <td data-label="Actions">
      <div className="organization-events-actions">
        <Link className="organization-events-view" to={EVENT_PATH(row.event_id)} state={LINK_STATE}>{row.unpublished && row.derived !== 'Completed' && row.derived !== 'Cancelled' ? 'View Details' : 'View Event'}</Link>
        {row.archivable ? <Link className={`organization-events-archive is-${row.derived.toLowerCase()}`} to={`${EVENT_PATH(row.event_id)}?archive=1`} state={LINK_STATE}>Archive Event</Link> : null}
      </div>
    </td>
  </tr>
}

export default function OrganizationApprovedEvents() {
  const { profile } = useAuth()
  const orgId = profile.user_id
  const now = useNow()
  const [data, setData] = useState({ status: 'loading', events: [], venues: [], pending: null, error: '' })
  const [counts, setCounts] = useState({})
  const [filters, setFilters] = useState({ state: 'All', venueId: '' })
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const noticeIdRef = useRef(0)
  const refresh = useCallback(() => setReloadKey((key) => key + 1), [])

  useEffect(() => {
    let active = true
    async function run() {
      try {
        const [events, venues, pending] = await Promise.all([
          fetchOrgEvents(supabase, orgId),
          fetchVenues(supabase).catch(() => []),
          fetchPendingBookings(supabase, orgId),
        ])
        if (active) setData({ status: 'ready', events, venues, pending, error: '' })
      } catch (error) {
        if (active) setData((previous) => (previous.status === 'ready' ? previous : { ...previous, status: 'error', error: error.message }))
      }
    }
    run()
    return () => { active = false }
  }, [orgId, reloadKey])
  useRefreshTriggers(orgId, refresh)

  const rows = useMemo(() => sortRows(data.events.map((event) => toRow(event, now))), [data.events, now])
  const filtered = useMemo(() => filterRows(rows, filters), [rows, filters])
  const paged = useMemo(() => paginate(filtered, page), [filtered, page])
  const summary = useMemo(() => summaryCounts(rows, data.pending), [rows, data.pending])
  const idsKey = paged.items.map((row) => row.event_id).join(',')

  useEffect(() => {
    if (!idsKey) return undefined
    let active = true
    fetchConfirmedCounts(supabase, idsKey.split(',')).then((map) => { if (active) setCounts((previous) => ({ ...previous, ...map })) })
    return () => { active = false }
  }, [idsKey, data.events])

  const closeNotice = useCallback(() => setNotice(null), [])
  const changeFilters = (next) => {
    setFilters(next)
    setPage(1)
    const hasMatches = filterRows(rows, next).length > 0
    setNotice(rows.length > 0 && !hasMatches ? { id: ++noticeIdRef.current, tone: 'info', ...NO_MATCH } : null)
  }

  let body
  if (data.status === 'loading') {
    body = <p className="organization-events-state" role="status">Loading approved events&hellip;</p>
  } else if (data.status === 'error') {
    body = <p className="organization-events-state is-error" role="alert">{data.error}</p>
  } else if (rows.length === 0) {
    body = <div className="organization-events-empty"><span><EventsIcon name="event" size={22} /></span><h2>No approved events yet</h2><p>Events appear here once your event proposals are approved.</p></div>
  } else if (filtered.length === 0) {
    body = <div className="organization-events-empty"><span><EventsIcon name="event" size={22} /></span><h2>No approved events match your filters</h2><p>Try a different state or venue to see more events.</p></div>
  } else {
    body = <>
      <div className="organization-events-table-wrap">
        <table className="organization-events-table">
          <caption className="organization-events-sr">Approved campus events of your organization</caption>
          <thead><tr>
            <th scope="col">Event Title &amp; Organizer</th>
            <th scope="col">Scheduled Slot &amp; Venue</th>
            <th scope="col">State</th>
            <th scope="col">Portal Visibility</th>
            <th scope="col">Org Capacity</th>
            <th scope="col">Actions</th>
          </tr></thead>
          <tbody>{paged.items.map((row) => <Row key={row.event_id} row={row} now={now} confirmed={counts[row.event_id] ?? null} />)}</tbody>
        </table>
      </div>
      <EventPagination page={paged.page} pages={paged.pages} total={filtered.length} onPage={setPage} />
    </>
  }

  return <main className="organization-portal-page organization-events-page">
    <OrganizationHeader active="calendar" skipTarget="organization-approved-heading" />
    <div className="organization-main">
      <div className="organization-events-content">
        <nav className="organization-events-breadcrumb" aria-label="Breadcrumb"><ol>
          <li><Link to={CALENDAR_PATH}><EventsIcon name="arrow-left" size={14} />Calendar</Link></li>
          <li aria-hidden="true">/</li>
          <li><span aria-current="page">Manage Approved Events</span></li>
        </ol></nav>
        <section className="organization-events-summary" aria-label="Summary">
          <article className="organization-summary-card">
            <div><h2>Active Monitoring</h2><p className="organization-summary-value">{summary.active} <span>{summary.active === 1 ? 'Event' : 'Events'}</span></p><p className="organization-summary-sub is-gold"><i aria-hidden="true" />{summary.ongoing} ongoing right now</p></div>
            <span className="organization-summary-icon"><EventsIcon name="activity" size={22} /></span>
          </article>
          <article className="organization-summary-card">
            <div><h2>Schedule Overrides</h2><p className="organization-summary-value">{summary.overrides} <span>{summary.overrides === 1 ? 'Case' : 'Cases'}</span></p><p className="organization-summary-sub is-red"><i aria-hidden="true" />{summary.pending ?? '\u2014'} pending confirmation</p></div>
            <span className="organization-summary-icon is-red"><EventsIcon name="swap" size={22} /></span>
          </article>
        </section>
        <header className="organization-events-heading"><h1 id="organization-approved-heading" tabIndex={-1}>Approved Campus Events</h1></header>
        <section className="organization-events-filters" aria-label="Filters">
          <div className="organization-events-chips" role="group" aria-label="Filter by state">
            <span className="organization-events-chips-label" aria-hidden="true">Filter State:</span>
            {STATE_FILTERS.map((state) => <button key={state} type="button" className={`organization-events-chip is-${state.toLowerCase()}`} aria-pressed={filters.state === state} onClick={() => changeFilters({ ...filters, state })}>{state === 'All' ? null : <i aria-hidden="true" />}{FILTER_LABEL[state]}</button>)}
          </div>
          <div className="organization-events-venue-filter">
            <label htmlFor="organization-events-venue">Venue</label>
            <div className="organization-events-select">
              <select id="organization-events-venue" value={filters.venueId} onChange={(event) => changeFilters({ ...filters, venueId: event.target.value })}>
                <option value="">All Venues (Campus-wide)</option>
                {data.venues.map((venue) => <option key={venue.venue_id} value={String(venue.venue_id)}>{venueLabel(venue)}</option>)}
              </select>
              <EventsIcon name="chevron-down" size={16} />
            </div>
          </div>
          <EventNotice notice={notice} onClose={closeNotice} />
        </section>
        <section className="organization-events-list" aria-label="Approved campus events">{body}</section>
      </div>
    </div>
    <OrganizationFooter />
  </main>
}
