import AdminShell from './AdminShell'
import { PasswordForm } from '../account/AccountControls'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/authContext'
import { loadAdminProfile } from './adminDashboardData'
import AdminPhotoUploader from './AdminPhotoUploader'
import { adminPhotoUrl } from './adminAccountApi'
import './AdminAccount.css'

export default function AdminAccount() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [administrator, setAdministrator] = useState(null)
  useEffect(() => { loadAdminProfile(supabase, profile.user_id).then(async data => setAdministrator(data ? { ...data, profile_image_url: await adminPhotoUrl(supabase, data.profile_image_path) } : null)).catch(() => {}) }, [profile.user_id])
  async function signOut() { await supabase.auth.signOut({ scope: 'local' }); navigate('/', { replace: true }) }
  return <AdminShell mainClassName="admin-account-main">
    <div className="admin-profile-breadcrumb"><span>Account</span><span aria-hidden="true">›</span><strong>Manage</strong></div><div className="admin-title-panel"><h1>Manage Account</h1></div>
    {administrator && <div className="admin-account-layout"><div className="admin-account-left"><section className="admin-account-card"><h2>Profile Picture</h2><div className="admin-account-picture-row"><AdminPhotoUploader profile={administrator} onSaved={path => setAdministrator(current => ({ ...current, profile_image_path: path }))} /><p className="admin-account-help">Accepted file formats: <strong>JPEG or PNG</strong>. Maximum allowable image size is <strong>2.0 MB</strong>. Recommended resolution: 400×400 px or higher.</p></div></section><section className="admin-account-card"><PasswordForm /></section><div className="admin-account-signout"><strong>Sign Out of this Device</strong><button type="button" onClick={signOut}>⇥&nbsp; Sign Out</button></div></div><aside className="admin-account-info"><h2>Administrator Information</h2><dl><div><dt>Admin Name</dt><dd>{administrator.name}</dd></div><div><dt>Admin ID</dt><dd>{administrator.admin_id}</dd></div><div><dt>Position</dt><dd>{administrator.position}</dd></div><div><dt>Office Assigned</dt><dd>{administrator.office_assigned}</dd></div></dl></aside></div>}
  </AdminShell>
}
