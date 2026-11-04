import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/authContext'
import { supabase } from '../../lib/supabase'
import { adminTimeZone, deleteAdminNotification, loadAdminNotifications, markAdminNotificationRead, relativeTime } from './adminDashboardData'
import logo from '../../assets/landing/seams-wordmark.png'
import manageIcon from './assets/manage.svg'
import calendarIcon from './assets/calendar-nav.svg'
import archivesIcon from './assets/archives.svg'
import bellIcon from './assets/bell.svg'
import userIcon from './assets/user.svg'
import chevronIcon from './assets/chevron.svg'
import './AdminDashboard.css'

const Icon = ({ src }) => <img className="admin-icon" src={src} alt="" aria-hidden="true" />

function PlaceholderDialog({ target, onClose }) {
  const dialogRef = useRef(null)
  const headingId = useId()
  const descriptionId = useId()
  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])
  const title = target.proposal ? 'Proposal Review' : target.title
  return <dialog ref={dialogRef} className="admin-placeholder-dialog" aria-labelledby={headingId} aria-describedby={descriptionId} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="admin-dialog-heading"><h2 id={headingId}>{title}</h2><button className="admin-close-button" type="button" aria-label="Close dialog" onClick={onClose}>×</button></div>
    {target.proposal && <><p className="admin-dialog-id">{target.proposal.proposal_id}</p><h3>{target.proposal.event_name}</h3></>}
    <p id={descriptionId}>{target.proposal ? 'This proposal is ready for review. The review screen will be available in a future update.' : `The ${target.title.toLowerCase()} screen will be available in a future update.`}</p>
    <button className="admin-review-button" type="button" onClick={onClose}>Back to dashboard</button>
  </dialog>
}



export default function AdminShell({ children, mainClassName = 'admin-main' }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState({ notifications: true })
  const [errors, setErrors] = useState({})
  const [revision, setRevision] = useState(0)
  const [now, setNow] = useState(Date.now)
  const [popover, setPopover] = useState(null)
  const [placeholder, setPlaceholder] = useState(null)
  const [signingOut, setSigningOut] = useState(false)
  const [reading, setReading] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const controlsRef = useRef(null)
  const bellRef = useRef(null)
  const profileButtonRef = useRef(null)
  const menuRef = useRef(null)
  const popoverId = useId()
  const unreadCount = notifications.filter(item => !item.read_at).length
  useEffect(() => {
    let active = true
    async function load() {
      await Promise.resolve()
      if (!active) return
      setLoading({ notifications: true }); setErrors({})
      try { const data = await loadAdminNotifications(supabase, profile.user_id); if (active) setNotifications(data) }
      catch { if (active) setErrors(current => ({ ...current, notifications: 'Unable to load notifications. Please try again.' })) }
      finally { if (active) setLoading({ notifications: false }) }
    }
    load()
    return () => { active = false }
  }, [profile.user_id, revision])
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000)
    const onFocus = () => { setNow(Date.now()); setRevision(value => value + 1) }
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(timer); window.removeEventListener('focus', onFocus) }
  }, [])
  useEffect(() => {
    if (popover === 'profile') menuRef.current?.querySelector('[role="menuitem"]')?.focus()
    function outside(event) { if (!controlsRef.current?.contains(event.target)) setPopover(null) }
    function escape(event) { if (event.key === 'Escape' && popover) { setPopover(null); (popover === 'profile' ? profileButtonRef : bellRef).current?.focus() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [popover])
  function closePopover() { setPopover(null); bellRef.current?.focus() }
  async function markRead(notification) {
    if (notification.read_at || reading !== null) return
    setReading(notification.notification_id)
    try {
      const data = await markAdminNotificationRead(supabase, profile.user_id, notification.notification_id)
      setNotifications(current => current.map(item => item.notification_id === notification.notification_id ? { ...item, read_at: data.read_at } : item))
      setErrors(current => ({ ...current, notificationAction: null }))
    } catch { setErrors(current => ({ ...current, notificationAction: 'Unable to mark the notification as read. Please try again.' })) }
    finally { setReading(null) }
  }
  async function removeNotification(notification) {
    if (deleting !== null) return
    setDeleting(notification.notification_id)
    try {
      await deleteAdminNotification(supabase, profile.user_id, notification.notification_id)
      setNotifications(current => current.filter(item => item.notification_id !== notification.notification_id))
      setErrors(current => ({ ...current, notificationAction: null }))
    } catch { setErrors(current => ({ ...current, notificationAction: 'Unable to delete the notification. Please try again.' })) }
    finally { setDeleting(null) }
  }
  async function signOut() {
    setSigningOut(true)
    try { const { error } = await supabase.auth.signOut({ scope: 'local' }); if (error) throw error; navigate('/', { replace: true }) }
    catch { setErrors(current => ({ ...current, signOut: 'Unable to sign out. Please try again.' })); setSigningOut(false) }
  }
  function menuKeyDown(event) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const items = [...menuRef.current.querySelectorAll('[role="menuitem"]')]
    const index = items.indexOf(document.activeElement)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length
    items[next]?.focus()
  }
  const retry = () => setRevision(value => value + 1)
  return <div className="admin-dashboard">
    <a className="admin-skip-link" href="#admin-main">Skip to dashboard</a>
        <header className="admin-header"><div className="admin-header-inner">
      <Link className="admin-brand" to="/admin/dashboard" aria-label="PLM SEAMS admin dashboard"><img src={logo} alt="PLM SEAMS" width="90" height="41" /></Link>
      <nav className="admin-navigation" aria-label="Admin navigation">
        <Link className={location.pathname.startsWith('/admin/calendar') || location.pathname.startsWith('/admin/archives') ? '' : 'is-active'} to="/admin/dashboard" aria-current={location.pathname.startsWith('/admin/calendar') || location.pathname.startsWith('/admin/archives') ? undefined : 'page'}><Icon src={manageIcon} />Manage</Link>
        <Link className={location.pathname.startsWith('/admin/calendar') ? 'is-active' : ''} to="/admin/calendar" aria-current={location.pathname.startsWith('/admin/calendar') ? 'page' : undefined}><Icon src={calendarIcon} />Calendar</Link>
        <Link className={location.pathname.startsWith('/admin/archives') ? 'is-active' : ''} to="/admin/archives" aria-current={location.pathname.startsWith('/admin/archives') ? 'page' : undefined}><span className="admin-archives-icon"><Icon src={archivesIcon} /></span>Archives</Link>
      </nav>
      <div className="admin-header-actions" ref={controlsRef}>
        <div className="admin-popover-anchor">
          <button ref={bellRef} className="admin-bell-button" type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={popover === 'notifications'} aria-controls={popover === 'notifications' ? `${popoverId}-notifications` : undefined} onClick={() => setPopover(current => current === 'notifications' ? null : 'notifications')}><Icon src={bellIcon} />{unreadCount > 0 && <span className="admin-unread-dot" />}</button>
          {popover === 'notifications' && <div id={`${popoverId}-notifications`} className="admin-popover admin-notifications" role="dialog" aria-label="Notifications">
            <div className="admin-popover-heading"><h2>Notifications</h2><span>{unreadCount} unread</span></div>
            {errors.notificationAction && <p className="admin-inline-error" role="alert">{errors.notificationAction}</p>}
            {loading.notifications ? <p className="admin-popover-message" role="status">Loading notifications…</p> : errors.notifications ? <div className="admin-popover-message" role="alert"><p>{errors.notifications}</p><button type="button" onClick={retry}>Try again</button></div> : <div className="admin-notification-list">{notifications.length ? notifications.map(notification => <article className={`admin-notification ${notification.read_at ? 'is-read' : ''}`} key={notification.notification_id}><span className="admin-notification-dot" aria-hidden="true" /><div><h3>{notification.notification_type}</h3><p>{notification.message}</p><time dateTime={notification.created_at}>{relativeTime(notification.created_at, now)}</time>{!notification.read_at && <button type="button" disabled={reading !== null} onClick={() => markRead(notification)}>{reading === notification.notification_id ? 'Saving…' : 'Mark as read'}</button>}</div><button className="admin-notification-dismiss" type="button" aria-label={`Delete ${notification.notification_type} notification`} disabled={deleting !== null} onClick={() => removeNotification(notification)}>{deleting === notification.notification_id ? '…' : '×'}</button></article>) : <p className="admin-popover-message">You’re all caught up. New updates will appear here.</p>}</div>}
            <button className="admin-popover-close" type="button" onClick={closePopover}>Close notifications</button>
          </div>}
        </div>
        <span className="admin-header-divider" aria-hidden="true" />
        <div className="admin-popover-anchor">
          <button ref={profileButtonRef} className="admin-profile-button" type="button" aria-label="Open profile menu" aria-haspopup="menu" aria-expanded={popover === 'profile'} aria-controls={popover === 'profile' ? `${popoverId}-profile` : undefined} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setPopover('profile') } }} onClick={() => setPopover(current => current === 'profile' ? null : 'profile')}><span className="admin-avatar"><Icon src={userIcon} /></span><Icon src={chevronIcon} /></button>
          {popover === 'profile' && <div ref={menuRef} id={`${popoverId}-profile`} className="admin-popover admin-profile-menu" role="menu" aria-label="Profile menu" onKeyDown={menuKeyDown}><Link to="/admin/profile" role="menuitem" onClick={() => setPopover(null)}>View Profile</Link><Link to="/admin/account" role="menuitem" onClick={() => setPopover(null)}>Account Settings</Link><div className="admin-menu-divider" /><button type="button" role="menuitem" disabled={signingOut} onClick={signOut}>{signingOut ? 'Signing out…' : 'Sign Out'}</button></div>}
        </div>
      </div>
    </div></header>

    <main id="admin-main" className={mainClassName}>
      {errors.signOut && <p className="admin-inline-error" role="alert">{errors.signOut}</p>}
      {children}
    </main>
    <footer className="admin-footer"><strong>Pamantasan ng Lungsod ng Maynila · SEAMS</strong><span>© {new Intl.DateTimeFormat('en', { timeZone: adminTimeZone, year: 'numeric' }).format(now)} PLM Student Event Administration &amp; Management System.</span></footer>
    {placeholder && <PlaceholderDialog target={placeholder} onClose={() => setPlaceholder(null)} />}
  </div>
}
