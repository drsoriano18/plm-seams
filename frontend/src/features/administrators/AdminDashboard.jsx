import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/authContext'
import { supabase } from '../../lib/supabase'
import AdminShell from './AdminShell'
import AdminProposalQueue from './AdminProposalQueue'
import { adminTimeZone, agendaEvents, agendaWindow, loadAdminAgenda, loadAdminProposals } from './adminDashboardData'
import agendaIcon from './assets/agenda.svg'
import agendaPinIcon from './assets/agenda-pin.svg'

const timeFormatter = new Intl.DateTimeFormat('en-US', { timeZone: adminTimeZone, hour: '2-digit', minute: '2-digit' })
const Icon = ({ src }) => <img className="admin-icon" src={src} alt="" aria-hidden="true" />

function AgendaItem({ event, now }) {
  const starts = Date.parse(event.starts_at)
  const ongoing = starts <= now && Date.parse(event.ends_at) > now
  const tomorrow = starts >= agendaWindow(now).tomorrow
  const booking = event.bookings?.find(item => item.booking_status === 'Confirmed')
  return <li className={`admin-agenda-item ${ongoing ? 'is-ongoing' : tomorrow ? 'is-tomorrow' : 'is-today'}`}>
    <span className="admin-timeline-dot" aria-hidden="true" />
    <div className="admin-agenda-topline"><time dateTime={event.starts_at}>{tomorrow ? 'Tomorrow · ' : ''}{timeFormatter.format(new Date(event.starts_at))}{!tomorrow && ` – ${timeFormatter.format(new Date(event.ends_at))}`}</time><span className="admin-agenda-badge">{ongoing ? 'In Progress' : tomorrow ? 'Tomorrow' : 'Today'}</span></div>
    <h3>{event.proposal.event_name}</h3>
    <p><Icon src={agendaPinIcon} />{booking?.venue?.venue_name || 'Venue to be confirmed'}</p>
  </li>
}

export default function AdminDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [proposals, setProposals] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState({ proposals: true, agenda: true })
  const [errors, setErrors] = useState({})
  const [revision, setRevision] = useState(0)
  const [now, setNow] = useState(Date.now)
  const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: adminTimeZone }).format(now)
  useEffect(() => {
    let active = true
    async function refresh() {
      await Promise.resolve()
      if (!active) return
      setLoading({ proposals: true, agenda: true }); setErrors({})
      const tasks = [['proposals', () => loadAdminProposals(supabase), setProposals], ['agenda', () => loadAdminAgenda(supabase), setEvents]]
      await Promise.all(tasks.map(async ([section, load, save]) => {
        try { const data = await load(); if (active) save(data) }
        catch { if (active) setErrors(current => ({ ...current, [section]: 'Unable to load ' + (section === 'agenda' ? 'the agenda' : section) + '. Please try again.' })) }
        finally { if (active) setLoading(current => ({ ...current, [section]: false })) }
      }))
    }
    refresh()
    return () => { active = false }
  }, [profile.user_id, revision, dayKey])
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000)
    const refresh = () => { setNow(Date.now()); setRevision(value => value + 1) }
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', onVisible) }
  }, [])
  const visibleEvents = useMemo(() => agendaEvents(events, now), [events, now])
  const retry = () => setRevision(value => value + 1)
  return (
    <AdminShell>
      <div className="admin-title-panel"><h1>Administrator Dashboard</h1></div>
      {location.state?.notice && <p className="admin-success-message" role="status">{location.state.notice}</p>}
      <div className="admin-content-grid">
        <AdminProposalQueue proposals={proposals} loading={loading.proposals} error={errors.proposals} now={now} onReviewAll={() => navigate('/admin/proposals')} onRetry={retry} onReview={item => navigate(`/admin/proposals/${encodeURIComponent(item.proposal_id)}`, { state: { from: '/admin/dashboard' } })} />
        <section className="admin-agenda" aria-labelledby="admin-agenda-heading">
          <div className="admin-agenda-heading"><h2 id="admin-agenda-heading"><Icon src={agendaIcon} />Agenda Feed</h2><span>Active Facility Flow</span></div>
          {loading.agenda ? <p className="admin-agenda-empty" role="status">Loading agenda…</p> : errors.agenda ? <div className="admin-agenda-empty" role="alert"><p>{errors.agenda}</p><button type="button" onClick={retry}>Try again</button></div> : visibleEvents.length ? <ol className="admin-agenda-list">{visibleEvents.map(event => <AgendaItem key={event.event_id} event={event} now={now} />)}</ol> : <div className="admin-agenda-empty"><h3>No events scheduled</h3><p>Published events for today and tomorrow will appear here, including events in progress.</p></div>}
        </section>
      </div>
    </AdminShell>
  )
}
