import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/authContext'
import { supabase } from '../../lib/supabase'
import logoImage from '../../assets/landing/seams-wordmark.png'
import { proposalActionLabel, proposalPath } from './proposals/proposalStatus.js'
import './OrganizationDashboard.css'
import './OrganizationFilterOverrides.css'

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

function Icon({ name, size = 16 }) {
  const paths = {
    bell: <><path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" /><path d="M10 21h4" /></>,
    user: <><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 9h18" /></>,
    archive: <><path d="M4 7h16v13H4zM3 4h18v3H3z" /><path d="M9 11h6" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2" /></>,
    manage: <><path d="M4 7h16M4 12h16M4 17h10" /><path d="m17 16 2 2 3-4" /></>,
    x: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>,
    signout: <><path d="M10 5H5v14h5" /><path d="m13 8 4 4-4 4M7 12h10" /></>,
  }
  return <svg className="organization-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function formatRange(start, end) {
  if (!start) return 'Date to be confirmed'
  const first = dateFormatter.format(new Date(start))
  if (!end) return first
  const secondDate = new Date(end)
  const second = dateFormatter.format(secondDate)
  return first === second ? `${first} · ${timeFormatter.format(new Date(start))}–${timeFormatter.format(secondDate)}` : `${first}–${second}`
}

function relativeTime(value) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

function statusClass(value) {
  return String(value || '').toLowerCase().replaceAll(' ', '-')
}

function NotificationPopover({ notifications, onRead, onClose }) {
  const unreadCount = notifications.filter(item => !item.read_at).length
  return <div className="organization-popover organization-notification-popover" role="dialog" aria-label="Organization notifications">
    <div className="organization-popover-heading"><h2>Notifications</h2><span>{unreadCount} unread</span></div>
    <div className="organization-notification-list">
      {notifications.length ? notifications.map(notification => <div className={`organization-notification ${notification.read_at ? 'is-read' : ''}`} key={notification.notification_id}>
        <span className="organization-notification-status" aria-hidden="true" />
        <div className="organization-notification-copy"><strong>{notification.notification_type}</strong><p>{notification.message}</p><time dateTime={notification.created_at}>{relativeTime(notification.created_at)}</time></div>
        <button className="organization-dismiss-button" type="button" onClick={() => onRead(notification)} aria-label={`Mark “${notification.notification_type}” as read`}><Icon name="x" size={13} /></button>
      </div>) : <p className="organization-empty-notifications">You’re all caught up. New organization updates will appear here.</p>}
    </div>
    <button className="organization-popover-close" type="button" onClick={onClose}>Close notifications</button>
  </div>
}

function ProfilePopover({ onSignOut }) {
  return <div className="organization-popover organization-profile-popover" role="menu" aria-label="Organization profile menu">
    <Link to="/student-organization/profile" role="menuitem"><Icon name="user" size={16} />View Profile</Link>
    <div className="organization-menu-divider" />
    <button type="button" role="menuitem" onClick={onSignOut}><Icon name="signout" size={16} />Sign Out</button>
  </div>
}

function EventCard({ event }) {
  const registrations = event.registration || []
  const confirmed = registrations.filter(item => item.reg_status === 'Confirmed').length
  const capacity = Number(event.registration_capacity || 0)
  const percent = capacity ? Math.min(100, Math.round((confirmed / capacity) * 100)) : 0
  const registrationLabel = event.registration_status === 'Open' ? 'Registration Open' : 'Registration Closed'
  const venue = event.venue_booking?.find(item => item.booking_status === 'Confirmed')?.venue || event.venue_booking?.[0]?.venue
  const title = event.event_proposal?.event_name || event.post_caption || event.event_id
  return <article className="organization-event-card">
    <div className="organization-card-body">
      <div className="organization-card-tags"><span className="tag tag-gold">Published</span><span className={`tag ${event.registration_status === 'Open' ? 'tag-blue' : 'tag-muted'}`}>{registrationLabel}</span><span className="tag tag-muted">ID: {event.event_id}</span></div>
      <h3>{title}</h3>
      <p className="organization-event-description">{event.post_caption || event.event_proposal?.description || 'Event details are available in the event management view.'}</p>
      <div className="organization-event-meta"><span><Icon name="calendar" size={14} />{formatRange(event.starts_at, event.ends_at)}</span><span><Icon name="pin" size={14} />{venue ? `${venue.venue_name}${venue.room_number ? ` · ${venue.room_number}` : ''}` : 'Venue to be confirmed'}</span></div>
      <div className="organization-capacity"><div className="organization-capacity-heading"><strong>Live Capacity Roster</strong><span className={percent >= 100 ? 'is-full' : ''}>{confirmed} / {capacity || '—'} Registered ({percent}%{capacity && percent >= 100 ? ' Full' : ''})</span></div><div className="organization-progress"><i style={{ width: `${percent}%` }} /></div></div>
    </div>
    <div className="organization-card-footer"><Link to={`/student-organization/events/${event.event_id}`} className="organization-manage-link"><Icon name="manage" size={14} />Manage Event</Link></div>
  </article>
}

function ProposalRow({ proposal }) {
  const schedule = proposal.proposal_schedule?.find(item => item.schedule_type === 'Primary') || proposal.proposal_schedule?.[0]
  const status = proposal.approval_status || 'Pending'
  const statusLabel = status === 'Revisions Required' ? 'Revisions Required' : status === 'Pending' ? 'Pending Review' : status
  return <article className="organization-proposal-row">
    <div className={`organization-proposal-icon status-${statusClass(status)}`} aria-hidden="true"><Icon name={status === 'Rejected' ? 'x' : status === 'Pending' ? 'calendar' : 'manage'} size={16} /></div>
    <div className="organization-proposal-copy"><div className="organization-proposal-title"><span className={`proposal-status status-${statusClass(status)}`}>{statusLabel}</span><span className="proposal-id">{proposal.proposal_id}</span></div><h3>{proposal.event_name}</h3><p>{schedule ? `Target: ${formatRange(schedule.starts_at, schedule.ends_at)}` : 'Schedule pending'} · Submitted {dateFormatter.format(new Date(proposal.submission_date))}</p>{status === 'Revisions Required' && proposal.proposal_review?.[0]?.admin_remarks && <div className="organization-review-note"><strong>Admin review feedback</strong><span>{proposal.proposal_review[0].admin_remarks}</span></div>}</div>
    <Link className={`organization-proposal-action ${status === 'Revisions Required' ? 'is-revision' : ''}`} to={proposalPath(proposal.proposal_id)}>{proposalActionLabel(status)}</Link>
  </article>
}

export default function OrganizationDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [organization, setOrganization] = useState(null)
  const [events, setEvents] = useState([])
  const [proposals, setProposals] = useState([])
  const [notifications, setNotifications] = useState([])
  const [proposalFilter, setProposalFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openPopover, setOpenPopover] = useState(null)
  const [profileMenuPinned, setProfileMenuPinned] = useState(false)
  const [notificationsPinned, setNotificationsPinned] = useState(false)
  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    let active = true
    async function loadOrganizationData() {
      setLoading(true); setError('')
      const [organizationResult, eventResult, proposalResult, notificationResult] = await Promise.all([
        supabase.from('student_organization').select('org_id,org_name,acronym').eq('org_id', profile.user_id).maybeSingle(),
        supabase.from('event').select('event_id,org_id,post_caption,starts_at,ends_at,event_status,publication_status,registration_status,registration_capacity,event_type(description,modality),event_proposal(event_name,description),venue_booking(booking_status,venue(venue_name,room_number)),registration(reg_status)').eq('org_id', profile.user_id).in('event_status', ['Upcoming', 'Ongoing']).order('starts_at', { ascending: true }),
        supabase.from('event_proposal').select('proposal_id,event_name,submission_date,approval_status,description,event_type(description),proposal_schedule(schedule_type,starts_at,ends_at,venue(venue_name,room_number)),proposal_review(review_decision,admin_remarks,reviewed_at)').eq('org_id', profile.user_id).order('submission_date', { ascending: false }),
        supabase.from('notifications').select('notification_id,notification_type,message,created_at,read_at,event_id,proposal_id').eq('recipient_user_id', profile.user_id).order('created_at', { ascending: false }).limit(20),
      ])
      if (!active) return
      const firstError = organizationResult.error || eventResult.error || proposalResult.error || notificationResult.error
      if (firstError) setError('Some organization updates could not be loaded. Please refresh and try again.')
      setOrganization(organizationResult.data || null)
      setEvents(eventResult.data || [])
      setProposals(proposalResult.data || [])
      setNotifications(notificationResult.data || [])
      setLoading(false)
    }
    loadOrganizationData()
    return () => { active = false }
  }, [profile.user_id])

  useEffect(() => {
    function closeOnOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target) && profileRef.current && !profileRef.current.contains(event.target)) {
        setOpenPopover(null); setProfileMenuPinned(false); setNotificationsPinned(false)
      }
    }
    document.addEventListener('mousedown', closeOnOutside)
    return () => document.removeEventListener('mousedown', closeOnOutside)
  }, [])

  async function markAsRead(notification) {
    const readAt = notification.read_at || new Date().toISOString()
    if (!notification.read_at) await supabase.from('notifications').update({ read_at: readAt }).eq('notification_id', notification.notification_id)
    setNotifications(current => current.map(item => item.notification_id === notification.notification_id ? { ...item, read_at: item.read_at || readAt } : item))
  }

  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
    if (signOutError) { setError('Sign out failed. Please try again.'); return }
    navigate('/student-organization/login', { replace: true })
  }

  const unreadCount = useMemo(() => notifications.filter(item => !item.read_at).length, [notifications])
  const proposalFilters = [['all', 'All'], ['Draft', 'Draft'], ['Pending', 'Pending'], ['Revisions Required', 'Revisions'], ['Rejected', 'Rejected']]
  const visibleProposals = useMemo(() => proposalFilter === 'all' ? proposals : proposals.filter(item => item.approval_status === proposalFilter), [proposalFilter, proposals])
  const proposalCount = filter => filter === 'all' ? proposals.length : proposals.filter(item => item.approval_status === filter).length
  const displayName = organization?.acronym || organization?.org_name || 'Student Organization'

  return <main className="organization-portal-page">
    <a className="organization-skip-link" href="#organization-dashboard-heading">Skip to dashboard content</a>
    <header className="organization-header">
      <Link to="/student-organization/dashboard" className="organization-brand" aria-label="PLM SEAMS student organization dashboard"><img src={logoImage} alt="PLM SEAMS" width="112" height="40" /></Link>
      <nav className="organization-primary-nav" aria-label="Student organization sections"><Link className="is-active" to="/student-organization/dashboard"><Icon name="calendar" size={14} />Events</Link><Link to="/student-organization/calendar"><Icon name="calendar" size={14} />Calendar</Link><Link to="/student-organization/archives"><Icon name="archive" size={14} />Archives</Link></nav>
      <div className="organization-header-actions">
        <div className="organization-header-popover-wrap" ref={notificationRef} onMouseEnter={() => { setProfileMenuPinned(false); setOpenPopover('notifications') }} onMouseLeave={() => { if (!notificationsPinned) setOpenPopover(null) }}><button className="organization-icon-button" type="button" onClick={() => { const nextPinned = !notificationsPinned; setNotificationsPinned(nextPinned); setProfileMenuPinned(false); setOpenPopover(nextPinned ? 'notifications' : null) }} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={openPopover === 'notifications'}><Icon name="bell" size={18} />{unreadCount > 0 && <span className="organization-unread-dot" />}</button>{openPopover === 'notifications' && <NotificationPopover notifications={notifications} onRead={markAsRead} onClose={() => { setOpenPopover(null); setNotificationsPinned(false); setProfileMenuPinned(false) }} />}</div>
        <div className="organization-header-popover-wrap" ref={profileRef} onMouseEnter={() => { setNotificationsPinned(false); setOpenPopover('profile') }} onMouseLeave={() => { if (!profileMenuPinned) setOpenPopover(null) }}><button className="organization-profile-button" type="button" onClick={() => { const nextPinned = !profileMenuPinned; setProfileMenuPinned(nextPinned); setNotificationsPinned(false); setOpenPopover(nextPinned ? 'profile' : null) }} aria-label={`Open profile menu for ${displayName}`} aria-expanded={openPopover === 'profile'}><span><Icon name="user" size={16} /></span><Icon name="chevron" size={13} /></button>{openPopover === 'profile' && <ProfilePopover onSignOut={signOut} />}</div>
      </div>
    </header>
    <section className="organization-context-bar" aria-labelledby="organization-dashboard-heading"><div className="organization-context-inner"><h1 id="organization-dashboard-heading">Student Organization Executive Desk</h1><Link className="organization-create-button" to="/student-organization/proposals/create"><Icon name="plus" size={14} />Create Event Proposal</Link></div></section>
    <section className="organization-main" aria-live="polite">
      <div className="organization-content">
        {error && <p className="organization-inline-error" role="alert">{error}</p>}
        <section className="organization-section" aria-labelledby="active-events-heading"><div className="organization-section-heading"><h2 id="active-events-heading">Active Events</h2><label>Sort by: <select defaultValue="execution"><option value="execution">Execution Date</option><option value="published">Published Date</option></select></label></div><div className="organization-event-grid">{loading ? <p className="organization-loading" role="status">Loading active events…</p> : events.length ? events.map(event => <EventCard key={event.event_id} event={event} />) : <div className="organization-empty-state"><h3>No active events yet</h3><p>Approved and published organization events will appear here.</p></div>}</div></section>
        <section className="organization-section organization-proposals-section" aria-labelledby="proposed-events-heading"><div className="organization-section-heading"><h2 id="proposed-events-heading">Proposed Events</h2><div className="organization-proposal-counts" role="group" aria-label="Proposal status filters">{proposalFilters.map(([value, label]) => <button key={value} className={proposalFilter === value ? 'is-active' : ''} type="button" aria-pressed={proposalFilter === value} onClick={() => setProposalFilter(value)}><span>{label}</span><strong>{proposalCount(value)}</strong></button>)}</div></div><div className="organization-proposal-list">{loading ? <p className="organization-loading" role="status">Loading proposals…</p> : visibleProposals.length ? visibleProposals.map(proposal => <ProposalRow key={proposal.proposal_id} proposal={proposal} />) : <div className="organization-empty-state"><h3>No proposals in this filter</h3><p>Choose another status or create a new event proposal.</p></div>}</div></section>
      </div>
    </section>
    <footer className="organization-footer"><strong>Pamantasan ng Lungsod ng Maynila · SEAMS</strong><span>© 2026 PLM Student Event Administration &amp; Management System.</span></footer>
  </main>
}
