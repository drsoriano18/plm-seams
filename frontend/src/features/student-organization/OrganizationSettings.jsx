import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/authContext'
import { PasswordForm } from '../account/AccountControls'
import { supabase } from '../../lib/supabase'
import logoImage from '../../assets/landing/seams-wordmark.png'
import './OrganizationDashboard.css'
import './OrganizationSettings.css'
import './OrganizationSettingsOverrides.css'

function Icon({ name, size = 16 }) {
  const paths = {
    bell: <><path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" /><path d="M10 21h4" /></>,
    user: <><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 9h18" /></>,
    archive: <><path d="M4 7h16v13H4zM3 4h18v3H3z" /><path d="M9 11h6" /></>,
    camera: <><path d="M4 7h3l1.5-2h7L17 7h3v12H4Z" /><circle cx="12" cy="13" r="3.5" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2" /></>,
    settings: <><path d="M4 5h10M4 10h7M4 15h5" /><path d="m14 17 4.8-4.8a1.4 1.4 0 0 1 2 2L16 19l-3 .7.7-3Z" /></>,
    signout: <><path d="M10 5H5v14h5" /><path d="m13 8 4 4-4 4M7 12h10" /></>,
  }
  return <svg className="organization-settings-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export default function OrganizationSettings() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [organization, setOrganization] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [error, setError] = useState('')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  useEffect(() => {
    let active = true
    supabase.from('student_organization').select('org_id,org_name,org_type,acronym,college,accreditation_status').eq('org_id', profile.user_id).maybeSingle().then(({ data, error: queryError }) => {
      if (!active) return
      if (queryError) setError('Organization information could not be loaded. Please refresh and try again.')
      setOrganization(data || null)
    })
    return () => { active = false }
  }, [profile.user_id])

  function selectPicture(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 2 * 1024 * 1024) { setError('Please choose a JPEG or PNG image smaller than 2 MB.'); return }
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
    if (signOutError) { setError('Sign out failed. Please try again.'); return }
    navigate('/student-organization/login', { replace: true })
  }

  const navMenu = <div className="organization-settings-profile-menu" role="menu"><Link to="/student-organization/profile" role="menuitem"><Icon name="user" size={16} />View Profile</Link><div className="organization-menu-divider" /><button type="button" role="menuitem" onClick={signOut}><Icon name="signout" size={16} />Sign Out</button></div>
  const name = organization?.org_name || 'Student Organization'

  return <main className="organization-settings-page organization-portal-page"><a className="organization-skip-link" href="#organization-settings-heading">Skip to account settings</a><header className="organization-header"><Link to="/student-organization/dashboard" className="organization-brand" aria-label="PLM SEAMS student organization dashboard"><img src={logoImage} alt="PLM SEAMS" width="112" height="40" /></Link><nav className="organization-primary-nav" aria-label="Student organization sections"><Link className="is-active" to="/student-organization/dashboard"><Icon name="calendar" size={14} />Events</Link><Link to="/student-organization/calendar"><Icon name="calendar" size={14} />Calendar</Link><Link to="/student-organization/archives"><Icon name="archive" size={14} />Archives</Link></nav><div className="organization-header-actions"><button className="organization-icon-button" type="button" aria-label="Notifications"><Icon name="bell" size={18} /></button><div className="organization-header-popover-wrap"><button className="organization-profile-button" type="button" onClick={() => setProfileMenuOpen(open => !open)} aria-label="Open profile menu" aria-expanded={profileMenuOpen}><span><Icon name="user" size={16} /></span><Icon name="chevron" size={13} /></button>{profileMenuOpen && navMenu}</div></div></header><section className="organization-settings-main" aria-labelledby="organization-settings-heading"><p className="organization-settings-breadcrumb">Account <span>›</span> Manage</p><h1 id="organization-settings-heading">Manage Account</h1>{error && <p className="organization-settings-error" role="alert">{error}</p>}<div className="organization-settings-layout"><div className="organization-settings-primary"><section className="organization-settings-panel organization-picture-panel"><h2>Profile Picture</h2><div className="organization-picture-content"><button className="organization-picture-button" type="button" onClick={() => fileRef.current?.click()} aria-label="Choose an organization profile picture">{photoPreview ? <img src={photoPreview} alt="New organization profile preview" /> : <><span /><Icon name="camera" size={16} /></>}</button><input ref={fileRef} type="file" accept="image/jpeg,image/png" onChange={selectPicture} hidden /><p>Accepted file formats: <strong>JPEG or PNG</strong>. Maximum allowable image size is <strong>2.0 MB</strong>. Recommended resolution: 400x400 px or higher.</p></div></section><section className="organization-settings-panel organization-password-panel"><PasswordForm /></section><section className="organization-settings-panel organization-device-panel"><p>Sign Out of this Device</p><button className="organization-device-signout" type="button" onClick={signOut}><Icon name="signout" size={14} />Sign Out</button></section></div><aside className="organization-settings-panel organization-information-panel"><h2>Student Organization Information</h2><dl><div><dt>Organization Name</dt><dd>{name}</dd></div><div><dt>Organization ID</dt><dd>{organization?.org_id || profile.user_id}</dd></div><div><dt>Official PLM Email</dt><dd>{profile.plm_email}</dd></div><div><dt>Organization Type</dt><dd>{organization?.org_type || 'Not available'}</dd></div><div><dt>Acronym</dt><dd>{organization?.acronym || 'Not available'}</dd></div><div><dt>College</dt><dd>{organization?.college || 'Not available'}</dd></div><div><dt>Accreditation Status</dt><dd className="organization-accreditation-value"><span aria-hidden="true">●</span>{organization?.accreditation_status ? 'Accredited' : 'Pending Accreditation'}</dd></div></dl></aside></div></section><footer className="organization-footer"><strong>Pamantasan ng Lungsod ng Maynila · SEAMS</strong><span>© 2026 PLM Student Event Administration &amp; Management System.</span></footer></main>
}
