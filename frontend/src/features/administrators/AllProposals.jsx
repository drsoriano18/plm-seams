import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import AdminShell from './AdminShell'
import { adminTimeZone, loadAdminProposals } from './adminDashboardData'
import { supabase } from '../../lib/supabase'
import './AllProposals.css'

const statuses = [
  ['All', 'All Proposals', '#c59b27'],
  ['Pending', 'Pending Review', '#f59e0b'],
  ['Revisions Required', 'Revisions Required', '#f43f5e'],
  ['Approved', 'Approved', '#10b981'],
  ['Rejected', 'Rejected', '#ef4444'],
]
const normalizeStatus = value => {
  const normalized = String(value || '').trim().toLowerCase()
  return statuses.find(([key]) => key !== 'All' && key.toLowerCase() === normalized)?.[0] || 'Pending'
}
const dateFormatter = new Intl.DateTimeFormat('en-US', { timeZone: adminTimeZone, month: 'short', day: '2-digit', year: 'numeric' })
const formatDate = value => value ? dateFormatter.format(new Date(value)) : 'Date to be confirmed'
const primarySchedule = proposal => (proposal.schedules || []).find(schedule => schedule.schedule_type === 'Primary') || proposal.schedules?.[0]
const eventId = proposal => proposal.events?.[0]?.event_id

function ProposalCard({ proposal, onOpen }) {
  const schedule = primarySchedule(proposal)
  const status = proposal.approval_status
  const label = status === 'Pending' ? 'Pending Review' : status
  const generatedEventId = status === 'Approved' ? eventId(proposal) : null
  return <article className={`all-proposal-card is-${status.toLowerCase().replaceAll(' ', '-')}`}>
    <div className="all-proposal-card-top"><span className="all-proposal-id">{proposal.proposal_id}</span><span className="all-proposal-status">{label}</span></div>
    <h2>{proposal.event_name}</h2>
    <p className="all-proposal-org">{proposal.organization?.org_name || 'Student Organization'}</p>
    <dl className="all-proposal-details">
      <div><dt>Venue</dt><dd>{schedule?.venue?.venue_name || 'Venue to be confirmed'}</dd></div>
      <div><dt>Expected Headcount</dt><dd>{proposal.expected_count_attendees ? `${proposal.expected_count_attendees} Attendees` : 'Not provided'}</dd></div>
      <div><dt>Proposed Date</dt><dd>{formatDate(schedule?.starts_at)}</dd></div>
      <div><dt>Submitted</dt><dd>{formatDate(proposal.submission_date)}</dd></div>
    </dl>
    {generatedEventId && <p className="all-proposal-event-id">{generatedEventId}</p>}
    <button type="button" className="all-proposal-view" onClick={() => onOpen(proposal)}>View Proposal <span aria-hidden="true">→</span></button>
  </article>
}

export default function AllProposals() {
  const navigate = useNavigate()
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')
  const [college, setCollege] = useState('All Colleges')
  const [venue, setVenue] = useState('All Facilities')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 9

  useEffect(() => {
    let active = true
    async function load() {
      await Promise.resolve()
      if (!active) return
      setLoading(true); setError('')
      try { setProposals(await loadAdminProposals(supabase)) } catch { setError('Unable to load proposals. Please try again.') } finally { setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [revision])

  const records = useMemo(() => proposals.map(item => ({ ...item, approval_status: normalizeStatus(item.approval_status) })), [proposals])
  const colleges = useMemo(() => ['All Colleges', ...new Set(records.map(item => item.organization?.college || item.allowed_college).filter(Boolean))], [records])
  const venues = useMemo(() => ['All Facilities', ...new Set(records.map(item => primarySchedule(item)?.venue?.venue_name).filter(Boolean))], [records])
  const counts = useMemo(() => Object.fromEntries(statuses.map(([key]) => [key, key === 'All' ? records.length : records.filter(item => item.approval_status === key).length])), [records])
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const from = fromDate ? Date.parse(`${fromDate}T00:00:00+08:00`) : -Infinity
    const to = toDate ? Date.parse(`${toDate}T23:59:59+08:00`) : Infinity
    return records.filter(item => {
      if (status !== 'All' && item.approval_status !== status) return false
      if (normalized && ![item.proposal_id, item.event_name, item.organization?.org_name].some(value => value?.toLowerCase().includes(normalized))) return false
      if (college !== 'All Colleges' && (item.organization?.college || item.allowed_college) !== college) return false
      if (venue !== 'All Facilities' && primarySchedule(item)?.venue?.venue_name !== venue) return false
      const submitted = Date.parse(item.submission_date)
      return submitted >= from && submitted <= to
    })
  }, [college, fromDate, query, records, status, toDate, venue])
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage))
  const visible = filtered.slice((page - 1) * perPage, page * perPage)
  const updateFilter = setter => event => { setter(event.target.value); setPage(1) }

  return <AdminShell mainClassName="all-proposals-main">
    <section className="all-proposals-header" aria-labelledby="all-proposals-heading">
      <div className="all-proposals-heading-row"><Link className="all-proposals-back" to="/admin/dashboard">← Dashboard</Link><h1 id="all-proposals-heading">Event Proposals Review</h1></div>
      <div className="all-proposals-tabs" role="tablist" aria-label="Filter proposals by approval status">
        {statuses.map(([key, label, color]) => <button key={key} type="button" role="tab" aria-selected={status === key} className={status === key ? 'is-active' : ''} onClick={() => { setStatus(key); setPage(1) }}><span style={{ '--status-color': color }} className="all-proposals-tab-dot" />{label}<span className="all-proposals-count">{counts[key]}</span></button>)}
      </div>
      <div className="all-proposals-filters">
        <label><span className="all-proposals-search-icon" aria-hidden="true">⌕</span><span className="admin-sr-only">Search proposals</span><input value={query} onChange={updateFilter(setQuery)} placeholder="Search proposal ID or event name" /></label>
        <label><span className="admin-sr-only">College</span><select value={college} onChange={updateFilter(setCollege)}>{colleges.map(value => <option key={value}>{value}</option>)}</select></label>
        <label><span className="admin-sr-only">Venue</span><select value={venue} onChange={updateFilter(setVenue)}>{venues.map(value => <option key={value}>{value}</option>)}</select></label>
        <label><span className="admin-sr-only">From date</span><input type="date" value={fromDate} onChange={updateFilter(setFromDate)} /></label>
        <label><span className="admin-sr-only">To date</span><input type="date" value={toDate} onChange={updateFilter(setToDate)} /></label>
      </div>
    </section>
    <div className="all-proposals-summary"><span>{loading ? 'Loading proposals…' : `Showing ${filtered.length} recorded institutional proposals`}</span><span>Order: Submission Date (Desc)</span></div>
    {error && <div className="all-proposals-error" role="alert">{error}<button type="button" onClick={() => setRevision(value => value + 1)}>Try again</button></div>}
    {!loading && !error && <div className="all-proposals-grid">{visible.length ? visible.map(proposal => <ProposalCard key={proposal.proposal_id} proposal={proposal} onOpen={item => navigate(`/admin/proposals/${encodeURIComponent(item.proposal_id)}`, { state: { from: '/admin/proposals' } })} />) : <div className="all-proposals-empty">No proposals match the selected filters.</div>}</div>}
    <nav className="all-proposals-pagination" aria-label="Proposal pages"><button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>‹</button><span>Page {page} of {pageCount}</span><button type="button" aria-label="Next page" disabled={page >= pageCount} onClick={() => setPage(value => value + 1)}>›</button></nav>
  </AdminShell>
}
