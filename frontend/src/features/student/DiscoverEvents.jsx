import useBellNotifications from './useBellNotifications'
import NotificationDates from './NotificationDates'
import { eligibilityLabel, isRestrictedEvent } from './discoverEligibility'
import { ProfileImage } from '../account/AccountControls'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { supabase } from '../../lib/supabase'
import logoImage from '../../assets/landing/seams-wordmark.png'
import './StudentDashboard.css'
import './StudentDashboardOverrides.css'
import './DiscoverEvents.css'

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

function Icon({ name, size = 18 }) {
  const paths = {
    bell: <><path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" /><path d="M10 21h4" /></>,
    user: <><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 9h18" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    filter: <path d="M4 6h16M7 12h10m-7 6h4" />,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2" /></>,
    arrow: <path d="M4 12h15m-5-5 5 5-5 5" />,
    x: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>,
    signout: <><path d="M10 5H5v14h5" /><path d="m13 8 4 4-4 4M7 12h10" /></>,
  }
  return <svg className="student-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function formatDateTime(value) {
  const date = new Date(value)
  return `${dateFormatter.format(date)} • ${timeFormatter.format(date)}`
}

function NotificationsPopover({ notifications, onRead, onClose }) {
  return <div className="student-popover student-notifications-popover" role="dialog" aria-label="Notifications">
    <div className="student-popover-heading"><h2>Notifications</h2><span>{notifications.filter(item => !item.read_at).length} unread</span></div>
    <div className="student-notification-list">
      {notifications.length ? notifications.map(notification => <div className={`student-notification ${notification.read_at ? 'is-read' : ''}`} key={notification.notification_id}>
        <span className="student-notification-dot" aria-hidden="true" />
        <div className="student-notification-copy"><strong>{notification.notification_type}</strong><p>{notification.message}</p><NotificationDates notification={notification} /></div>
        <button className="student-dismiss-button" type="button" onClick={() => onRead(notification)} aria-label={`Mark “${notification.notification_type}” as read`}><Icon name="x" size={13} /></button>
      </div>) : <p className="student-empty-notifications">You’re all caught up. New updates will appear here.</p>}
    </div>
    <button className="student-popover-close" type="button" onClick={onClose}>Close notifications</button>
  </div>
}

function ProfilePopover({ onSignOut }) {
  return <div className="student-popover student-profile-popover" role="menu" aria-label="Profile menu">
    <Link to="/student/profile" role="menuitem"><Icon name="user" size={16} />View Profile</Link>
    <div className="student-menu-divider" />
    <button type="button" role="menuitem" onClick={onSignOut}><Icon name="signout" size={16} />Sign Out</button>
  </div>
}

function DiscoverCard({ event }) {
  const isLimited = Number(event.confirmed_registrations) >= Number(event.registration_capacity)
  const category = (event.event_type || 'Event').toUpperCase()
  return <Link className="discover-event-card" to={`/student/events/${event.event_id}`} state={{ from: 'discover' }}>
    <div className="discover-event-image" aria-label="Event image placeholder"><span>{category.slice(0, 8)}</span></div>
    <div className="discover-event-content">
      <div className="discover-event-topline"><p>{formatDateTime(event.starts_at)}</p><span className={isLimited ? 'is-limited' : ''}>{eligibilityLabel(event)}{isLimited ? ' · Waitlist' : ''}</span></div>
      <h3>{event.event_name}</h3>
      <p className="discover-event-organization">{event.organization_name}</p>
      <div className="discover-event-meta"><span><Icon name="pin" size={13} />{event.venue_name || 'Venue to be announced'}</span><span className="discover-event-arrow" aria-label={`View ${event.event_name}`}><Icon name="arrow" size={14} /></span></div>
    </div>
  </Link>
}

export default function DiscoverEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [notifications, setNotifications] = useState([])
  useBellNotifications(setNotifications)
  const [search, setSearch] = useState('')
  const [revision, setRevision] = useState(0)
  const [college, setCollege] = useState('all')
  const [sortLatestFirst, setSortLatestFirst] = useState(false)
  const [openPopover, setOpenPopover] = useState(null)
  const [profileMenuPinned, setProfileMenuPinned] = useState(false)
  const [notificationsPinned, setNotificationsPinned] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    let active = true
    async function loadDiscoverData() {
      setLoading(true); setError('')
      const [eventsResult, notificationsResult] = await Promise.all([
        supabase.rpc('get_student_discover_events'),
        supabase.from('notifications').select('notification_id,notification_type,message,created_at,read_at,event_id').order('created_at', { ascending: false }).limit(20),
      ])
      if (!active) return
      if (eventsResult.error) setError('Discover events could not be loaded. Please retry or try again later.')
      if (notificationsResult.error && !eventsResult.error) setError('Notifications could not be loaded. Please refresh and try again.')
      setEvents(eventsResult.data || [])
      setNotifications(notificationsResult.data || [])
      setLoading(false)
    }
    loadDiscoverData()
    return () => { active = false }
  }, [revision])

  useEffect(() => {
    function closeOnOutside(event) {
      if (!notificationRef.current?.contains(event.target) && !profileRef.current?.contains(event.target)) {
        setOpenPopover(null); setProfileMenuPinned(false); setNotificationsPinned(false)
      }
    }
    document.addEventListener('mousedown', closeOnOutside)
    return () => document.removeEventListener('mousedown', closeOnOutside)
  }, [])

  const filteredEvents = useMemo(() => {
    const term = search.trim().toLowerCase()
    const matches = events.filter(event => {
      const searchable = [event.event_name, event.organization_name, event.eligible_college, event.event_type, event.venue_name].filter(Boolean).join(' ').toLowerCase()
      return (!term || searchable.includes(term)) && (college === 'all' || isRestrictedEvent(event))
    })
    return sortLatestFirst ? [...matches].sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at) || String(a.event_id).localeCompare(String(b.event_id))) : matches
  }, [college, events, search, sortLatestFirst])
  const unreadCount = notifications.filter(item => !item.read_at).length

  async function markAsRead(notification) {
    if (!notification.read_at) { const result = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('notification_id', notification.notification_id); if (result.error) { setError('Notification could not be marked as read.'); return } }
    setNotifications(current => current.map(item => item.notification_id === notification.notification_id ? { ...item, read_at: item.read_at || new Date().toISOString() } : item))
  }

  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
    if (signOutError) { setError('Sign out failed. Please try again.'); return }
    navigate('/student/login', { replace: true })
  }

  return <main className="student-portal-page discover-page">
    <a className="student-skip-link" href="#discover-events-heading">Skip to discover events</a>
    <header className="student-portal-header">
      <a href="/student/dashboard" className="student-brand" aria-label="PLM SEAMS student dashboard"><img src={logoImage} alt="PLM SEAMS" width="112" height="40" /></a>
      <nav className="student-primary-nav" aria-label="Student portal sections"><Link to="/student/dashboard"><Icon name="calendar" size={14} />Upcoming</Link><Link className="is-active" to="/student/discover"><Icon name="compass" size={14} />Discover</Link></nav>
      <div className="student-header-actions">
        <div className="student-header-popover-wrap" ref={notificationRef} onMouseEnter={() => { setProfileMenuPinned(false); setOpenPopover('notifications') }} onMouseLeave={() => { if (!notificationsPinned) setOpenPopover(null) }}><button className="student-icon-button" type="button" onClick={() => { const nextPinned = !notificationsPinned; setNotificationsPinned(nextPinned); setProfileMenuPinned(false); setOpenPopover(nextPinned ? 'notifications' : null) }} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={openPopover === 'notifications'}><Icon name="bell" size={18} />{unreadCount > 0 && <span className="student-unread-dot" />}</button>{openPopover === 'notifications' && <NotificationsPopover notifications={notifications} onRead={markAsRead} onClose={() => { setOpenPopover(null); setNotificationsPinned(false); setProfileMenuPinned(false) }} />}</div>
        <div className="student-header-popover-wrap" ref={profileRef} onMouseEnter={() => { setNotificationsPinned(false); setOpenPopover('profile') }} onMouseLeave={() => { if (!profileMenuPinned) setOpenPopover(null) }}><button className="student-profile-button" type="button" onClick={() => { const nextPinned = !profileMenuPinned; setProfileMenuPinned(nextPinned); setNotificationsPinned(false); setOpenPopover(nextPinned ? 'profile' : null) }} aria-label="Open profile menu" aria-expanded={openPopover === 'profile'}><span><ProfileImage fallback={<Icon name="user" size={16} />} /></span><Icon name="chevron" size={13} /></button>{openPopover === 'profile' && <ProfilePopover onSignOut={signOut} />}</div>
      </div>
    </header>
    <section className="discover-main" aria-labelledby="discover-events-heading">
      <div className="discover-heading-row"><h1 id="discover-events-heading">Discover Campus Events</h1><label className="discover-search"><span className="sr-only">Search events</span><Icon name="search" size={14} /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search events, keywords…" spellCheck="false" /></label></div>
      <div className="discover-filter-bar"><span className="discover-filter-label"><Icon name="filter" size={14} />Filter:</span><label><span className="sr-only">Filter by college eligibility</span><select value={college} onChange={event => setCollege(event.target.value)}><option value="all">All Colleges</option><option value="eligible">Eligible Colleges Only</option></select></label></div>
      <div className="discover-section-heading"><h2><i />Approved Upcoming Events</h2><button type="button" className="discover-sort-button" aria-pressed={sortLatestFirst} aria-label={`Sort by date, currently ${sortLatestFirst ? 'latest' : 'earliest'} first. Activate to reverse.`} onClick={() => setSortLatestFirst(current => !current)}>Sort: <strong>{sortLatestFirst ? 'Latest Date ↑' : 'Earliest Date ↓'}</strong></button></div>
      {error && <p className="discover-error" role="alert">{error} <button type="button" onClick={() => setRevision(v => v+1)}>Retry</button></p>}
      <div className="discover-event-list" aria-live="polite">{loading ? <p className="discover-status" role="status">Loading events…</p> : filteredEvents.length ? filteredEvents.map(event => <DiscoverCard key={event.event_id} event={event} />) : <div className="discover-empty"><h3>{events.length ? 'No events match your search' : 'No upcoming events'}</h3><p>{events.length ? 'Try another keyword or college filter.' : 'New published upcoming events will appear here.'}</p></div>}</div>
    </section>
    <footer className="student-portal-footer"><strong>Pamantasan ng Lungsod ng Maynila • SEAMS</strong><span>© 2026 PLM Student Event Administration &amp; Management System.</span></footer>
  </main>
}
