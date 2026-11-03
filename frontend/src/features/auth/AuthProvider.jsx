import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { supabase, configurationError } from '../../lib/supabase'
import { readProfile, routeForRole } from './access'

import { AuthContext, useAuth } from './authContext'
export function AuthProvider({ children }) {
  const [version, setVersion] = useState(0)
  const [state, setState] = useState({ loading: !configurationError, profile: null, error: configurationError })
  useEffect(() => {
    if (!supabase) return
    // Keep the callback synchronous; Supabase auth callbacks must not await client queries.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => setVersion(v => v + 1))
    return () => subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!supabase) return
    let active = true
    async function refresh() {
      setState(previous => ({ ...previous, loading: !previous.profile }))
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) { if (active) setState({ loading: false, profile: null, error: null }); return }
        const profile = await readProfile(supabase, user.id)
        if (active) setState({ loading: false, profile, error: null })
      } catch (error) { if (active) setState({ loading: false, profile: null, error: error.message }) }
    }
    refresh()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => { active = false; window.removeEventListener('focus', onFocus) }
  }, [version])
  return <AuthContext.Provider value={{ ...state, refresh: () => setVersion(v => v + 1) }}>{children}</AuthContext.Provider>
}
export function ProtectedRoute({ role, children }) {
  const { loading, profile, error } = useAuth()
  if (loading) return <main className="workspace"><p role="status">Checking account access…</p></main>
  if (error) return <main className="workspace"><h1>Account access unavailable</h1><p role="alert">{error}</p><a href="/">Return to portals</a></main>
  if (!profile) return <Navigate to={role === 'Student' ? '/student/login' : role === 'Student Organization' ? '/student-organization/login' : '/admin/login'} replace />
  if (profile.role !== role) return <Navigate to={routeForRole(profile.role)} replace />
  return children
}
