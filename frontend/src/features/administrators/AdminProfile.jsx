import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import AdminShell from './AdminShell'
import { adminPhotoUrl } from './adminAccountApi'
import { loadAdminProfile } from './adminDashboardData'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/authContext'
import './AdminAccount.css'

export default function AdminProfile() {
  const { profile } = useAuth()
  const [administrator, setAdministrator] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    loadAdminProfile(supabase, profile.user_id).then(async data => {
      const url = await adminPhotoUrl(supabase, data?.profile_image_path)
      if (active) setAdministrator(data ? { ...data, profile_image_url: url } : null)
    }).catch(loadError => { if (active) setError(loadError.message) })
    return () => { active = false }
  }, [profile.user_id])
  return <AdminShell mainClassName="admin-profile-main">
    <div className="admin-profile-breadcrumb"><span>Account</span><span aria-hidden="true">›</span><strong>Profile</strong></div>
    {error && <p className="admin-inline-error" role="alert">{error}</p>}
    {administrator && <section className="admin-profile-card" aria-labelledby="admin-profile-heading">
      <div className="admin-profile-toolbar"><Link to="/admin/account" className="admin-edit-settings">☷&nbsp; Edit Settings</Link></div>
      <div className="admin-profile-body"><div className="admin-profile-avatar">{administrator.profile_image_url ? <img src={administrator.profile_image_url} alt="Administrator profile" /> : <span aria-hidden="true" />}</div><div className="admin-profile-copy"><div className="admin-profile-tags"><span>Admin ID: {administrator.admin_id}</span><span>{administrator.position}</span><span>AY 2026-2027</span></div><h1 id="admin-profile-heading">{administrator.name || 'Not available'}</h1><p>{administrator.office_assigned || 'Not available'}</p></div></div>
    </section>}
  </AdminShell>
}
