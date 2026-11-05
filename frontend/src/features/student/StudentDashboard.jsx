import useBellNotifications from './useBellNotifications'
import NotificationDates from './NotificationDates'
import { ProfileImage } from '../account/AccountControls'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/authContext'
import { supabase } from '../../lib/supabase'
import logoImage from '../../assets/landing/seams-wordmark.png'
import './StudentDashboard.css'
import './StudentDashboardOverrides.css'

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

function Icon({ name, size = 18 }) {
  const paths = {
    bell: <><path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" /><path d="M10 21h4" /></>,
    user: <><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 9h18" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></>,
    x: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>,
    signout: <><path d="M10 5H5v14h5" /><path d="m13 8 4 4-4 4M7 12h10" /></>,
  }
  return <svg className="student-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function formatDateTime(value) {
  const date = new Date(value)
  return `${dateFormatter.format(date)} • ${timeFormatter.format(date)}`
}

function eventTitle(event) {
  if (event.event_name) return event.event_name
  const caption = event.post_caption?.trim()
  if (caption) return caption.replace(/[.!?].*$/, '')
  return event.event_id
}

function eventType(event) {
  return event.event_type?.description || event.event_type || 'PLM Event'
}

function EventCard({ event, registration }) {
  const isConfirmed = registration?.reg_status === 'Confirmed'
  const status = registration?.reg_status || (event.registration_status === 'Open' ? 'Registration Open' : 'Registration Closed')
  return <Link className="student-event-card" to={`/student/events/${event.event_id}`}>
    <div className="student-event-image" aria-label="Event image placeholder"><span>{eventType(event)}</span></div>
    <div className="student-event-content">
      <div className="student-event-topline">
        <div className="student-event-heading">
          <p className="student-event-type">{eventType(event)}</p>
          <h3>{eventTitle(event)}</h3>
        </div>
        <time className="student-event-time" dateTime={event.starts_at}><Icon name="calendar" size={13} />{formatDateTime(event.starts_at)}</time>
      </div>
      <p className="student-event-location"><Icon name="pin" size={14} />{event.venue_name || 'Online / venue to be announced'}</p>
      <div className="student-event-status-row">
        <span className={`student-status student-status-${status.toLowerCase().replaceAll(' ', '-')}`}><i />{status}</span>
        {isConfirmed && <span className="student-card-note">Registration confirmed</span>}
      </div>
    </div>
  </Link>
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

export default function StudentDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [notifications, setNotifications] = useState([])
  useBellNotifications(setNotifications)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openPopover, setOpenPopover] = useState(null)
  const [profileMenuPinned, setProfileMenuPinned] = useState(false)
  const [notificationsPinned, setNotificationsPinned] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [revision, setRevision] = useState(0)
  const [activeView, setActiveView] = useState('upcoming')
  const [activeFilter, setActiveFilter] = useState('all')
  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    let active = true
    async function loadStudentData() {
      setLoading(true); setError('')
      const [eventResult, registrationResult, notificationResult] = await Promise.all([
        supabase.rpc('get_student_dashboard_events'),
        supabase.from('registration').select('event_id,reg_status').eq('student_number', profile.user_id),
        supabase.from('notifications').select('notification_id,notification_type,message,created_at,read_at,event_id').order('created_at', { ascending: false }).limit(20),
      ])
      if (!active) return
      const firstError = eventResult.error || registrationResult.error || notificationResult.error
      if (firstError) setError('Some student updates could not be loaded. Please retry or refresh.')
      setEvents(eventResult.data || [])
      setRegistrations(registrationResult.data || [])
      setNotifications(notificationResult.data || [])
      setLoading(false)
    }
    loadStudentData()
    return () => { active = false }
  }, [profile.user_id, revision])

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    function closeOnOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target) && profileRef.current && !profileRef.current.contains(event.target)) {
        setOpenPopover(null)
        setProfileMenuPinned(false)
        setNotificationsPinned(false)
      }
    }
    document.addEventListener('mousedown', closeOnOutside)
    return () => document.removeEventListener('mousedown', closeOnOutside)
  }, [])

  async function markAsRead(notification) {
    if (!notification.read_at) { const result = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('notification_id', notification.notification_id); if (result.error) { setError('Notification could not be marked as read.'); return } }
    setNotifications(current => current.map(item => item.notification_id === notification.notification_id ? { ...item, read_at: item.read_at || new Date().toISOString() } : item))
  }

  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
    if (signOutError) { setError('Sign out failed. Please try again.'); return }
    navigate('/student/login', { replace: true })
  }

  const registrationMap = useMemo(() => new Map(registrations.map(item => [item.event_id, item])), [registrations])
  const confirmedCount = registrations.filter(item => item.reg_status === 'Confirmed').length
  const unreadCount = notifications.filter(item => !item.read_at).length
  const filterWindows = useMemo(() => {
    const current = new Date(currentTime)
    const weekStart = new Date(current)
    weekStart.setHours(0, 0, 0, 0)
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const nextMonthStart = new Date(current.getFullYear(), current.getMonth() + 1, 1)
    const nextMonthEnd = new Date(current.getFullYear(), current.getMonth() + 2, 1)
    return { weekStart, weekEnd, nextMonthStart, nextMonthEnd }
  }, [currentTime])
  const filterMatches = (event, filter) => {
    const startsAt = new Date(event.starts_at)
    if (filter === 'week') return startsAt >= filterWindows.weekStart && startsAt < filterWindows.weekEnd
    if (filter === 'next-month') return startsAt >= filterWindows.nextMonthStart && startsAt < filterWindows.nextMonthEnd
    return true
  }
  const filterCounts = { all: events.length, week: events.filter(event => filterMatches(event, 'week')).length, 'next-month': events.filter(event => filterMatches(event, 'next-month')).length }
  const visibleEvents = events.filter(event => filterMatches(event, activeFilter))

  return <main className="student-portal-page">
    <a className="student-skip-link" href="#student-events-heading">Skip to events</a>
    <header className="student-portal-header">
      <a href="/student/dashboard" className="student-brand" aria-label="PLM SEAMS student dashboard"><img src={logoImage} alt="PLM SEAMS" width="112" height="40" /></a>
      <nav className="student-primary-nav" aria-label="Student portal sections"><Link className={activeView === 'upcoming' ? 'is-active' : ''} to="/student/dashboard" onClick={() => setActiveView('upcoming')}><Icon name="calendar" size={14} />Upcoming</Link><Link className={activeView === 'discover' ? 'is-active' : ''} to="/student/discover" onClick={() => setActiveView('discover')}><Icon name="compass" size={14} />Discover</Link></nav>
      <div className="student-header-actions">
        <div className="student-header-popover-wrap" ref={notificationRef} onMouseEnter={() => { setProfileMenuPinned(false); setOpenPopover('notifications') }} onMouseLeave={() => { if (!notificationsPinned) setOpenPopover(null) }}>
          <button className="student-icon-button" type="button" onClick={() => { const nextPinned = !notificationsPinned; setNotificationsPinned(nextPinned); setProfileMenuPinned(false); setOpenPopover(nextPinned ? 'notifications' : null) }} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={openPopover === 'notifications'}><Icon name="bell" size={18} />{unreadCount > 0 && <span className="student-unread-dot" />}</button>
          {openPopover === 'notifications' && <NotificationsPopover notifications={notifications} onRead={markAsRead} onClose={() => { setOpenPopover(null); setNotificationsPinned(false); setProfileMenuPinned(false) }} />}
        </div>
        <div className="student-header-popover-wrap" ref={profileRef} onMouseEnter={() => { setNotificationsPinned(false); setOpenPopover('profile') }} onMouseLeave={() => { if (!profileMenuPinned) setOpenPopover(null) }}>
          <button className="student-profile-button" type="button" onClick={() => { const nextPinned = !profileMenuPinned; setProfileMenuPinned(nextPinned); setNotificationsPinned(false); setOpenPopover(nextPinned ? 'profile' : null) }} aria-label="Open profile menu" aria-expanded={openPopover === 'profile'}><span><ProfileImage fallback={<Icon name="user" size={16} />} /></span><Icon name="chevron" size={13} /></button>
          {openPopover === 'profile' && <ProfilePopover onSignOut={signOut} />}
        </div>
      </div>
    </header>
    <section className="student-main" aria-labelledby="student-events-heading">
      <div className="student-summary-panel">
        <div><h1 id="student-events-heading">Events</h1><p>Manage your registrations</p></div>
        <span className="student-confirmed-count"><i />{confirmedCount} Confirmed</span>
        <div className="student-filter-strip" role="group" aria-label="Event filters"><button className={activeFilter === 'all' ? 'is-active' : ''} type="button" onClick={() => setActiveFilter('all')}>All ({filterCounts.all})</button><button className={activeFilter === 'week' ? 'is-active' : ''} type="button" onClick={() => setActiveFilter('week')}>This Week ({filterCounts.week})</button><button className={activeFilter === 'next-month' ? 'is-active' : ''} type="button" onClick={() => setActiveFilter('next-month')}>Next Month ({filterCounts['next-month']})</button></div>
      </div>
      {error && <p className="student-inline-error" role="alert">{error} <button type="button" onClick={() => setRevision(v => v+1)}>Retry</button></p>}
      <div className="student-event-list" aria-live="polite">
        {loading ? <p className="student-loading" role="status">Loading events…</p> : visibleEvents.length ? visibleEvents.map(event => <EventCard key={event.event_id} event={event} registration={registrationMap.get(event.event_id)} />) : <div className="student-empty-state"><h2>{events.length ? 'No events in this filter' : 'You have no confirmed registration yet'}</h2><p>{events.length ? 'Try another date range to see more published events.' : 'Browse and register to an event through the Discover tab'}</p></div>}
      </div>
    </section>
    <footer className="student-portal-footer"><strong>Pamantasan ng Lungsod ng Maynila • SEAMS</strong><span>© 2026 PLM Student Event Administration &amp; Management System.</span></footer>
  </main>
}
