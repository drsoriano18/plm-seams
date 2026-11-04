import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../auth/authContext'
import { supabase } from '../../../lib/supabase'
import logoImage from '../../../assets/landing/seams-wordmark.png'
import Icon from './OrganizationIcon'
import '../OrganizationDashboard.css'
import './OrganizationHeader.css'

function relativeTime(value) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
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

// Shared Student Organization header. `active` is 'events' | 'calendar' | 'archives'.
export default function OrganizationHeader({ active, skipTarget }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [organization, setOrganization] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [error, setError] = useState('')
  const [openPopover, setOpenPopover] = useState(null)
  const [profileMenuPinned, setProfileMenuPinned] = useState(false)
  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    let alive = true
    async function load() {
      const [organizationResult, notificationResult] = await Promise.all([
        supabase.from('student_organization').select('org_id,org_name,acronym').eq('org_id', profile.user_id).maybeSingle(),
        supabase.from('notifications').select('notification_id,notification_type,message,created_at,read_at,event_id,proposal_id').eq('recipient_user_id', profile.user_id).order('created_at', { ascending: false }).limit(20),
      ])
      if (!alive) return
      setOrganization(organizationResult.data || null)
      setNotifications(notificationResult.data || [])
    }
    load()
    return () => { alive = false }
  }, [profile.user_id])

  useEffect(() => {
    function closeOnOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target) && profileRef.current && !profileRef.current.contains(event.target)) {
        setOpenPopover(null); setProfileMenuPinned(false)
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
  const displayName = organization?.acronym || organization?.org_name || 'Student Organization'
  const navProps = key => active === key ? { className: 'is-active', 'aria-current': 'page' } : {}

  return <>
    {skipTarget && <a className="organization-skip-link" href={`#${skipTarget}`}>Skip to page content</a>}
    <header className="organization-header">
      <Link to="/student-organization/dashboard" className="organization-brand" aria-label="PLM SEAMS student organization dashboard"><img src={logoImage} alt="PLM SEAMS" width="112" height="40" /></Link>
      <nav className="organization-primary-nav" aria-label="Student organization sections">
        <Link to="/student-organization/dashboard" {...navProps('events')}><Icon name="calendar" size={14} />Events</Link>
        <Link to="/student-organization/calendar" {...navProps('calendar')}><Icon name="calendar" size={14} />Calendar</Link>
        <Link to="/student-organization/archives" {...navProps('archives')}><Icon name="archive" size={14} />Archives</Link>
      </nav>
      <div className="organization-header-actions">
        <div className="organization-header-popover-wrap" ref={notificationRef} onMouseEnter={() => setOpenPopover('notifications')} onMouseLeave={() => setOpenPopover(null)}><button className="organization-icon-button" type="button" onClick={() => setOpenPopover(current => current === 'notifications' ? null : 'notifications')} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={openPopover === 'notifications'}><Icon name="bell" size={18} />{unreadCount > 0 && <span className="organization-unread-dot" />}</button>{openPopover === 'notifications' && <NotificationPopover notifications={notifications} onRead={markAsRead} onClose={() => setOpenPopover(null)} />}</div>
        <div className="organization-header-popover-wrap" ref={profileRef} onMouseEnter={() => setOpenPopover('profile')} onMouseLeave={() => { if (!profileMenuPinned) setOpenPopover(null) }}><button className="organization-profile-button" type="button" onClick={() => { const nextPinned = !profileMenuPinned; setProfileMenuPinned(nextPinned); setOpenPopover(nextPinned ? 'profile' : null) }} aria-label={`Open profile menu for ${displayName}`} aria-expanded={openPopover === 'profile'}><span><Icon name="user" size={16} /></span><Icon name="chevron" size={13} /></button>{openPopover === 'profile' && <ProfilePopover onSignOut={signOut} />}</div>
      </div>
    </header>
    {error && <p className="organization-header-error" role="alert">{error}</p>}
  </>
}
