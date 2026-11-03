import { useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase, configurationError } from '../../lib/supabase'
import { readProfile, matchesPortal, routeForRole } from './access'
import { useAuth } from './authContext'
import studentBackground from '../../assets/auth/student-background.png'
import organizationBackground from '../../assets/auth/organization-background.png'
import administratorBackground from '../../assets/auth/administrator-background.png'
import eyeIcon from '../../assets/auth/eye.svg'
import './Auth.css'

const loginConfigs = {
  student: {
    title: 'Sign In — Student',
    placeholder: 'name2026@plm.edu.ph',
    background: studentBackground,
    className: 'auth-student',
  },
  organization: {
    title: 'Sign In — Student Organization',
    placeholder: 'org2026@plm.edu.ph',
    background: organizationBackground,
    className: 'auth-organization',
  },
  administrator: {
    title: 'Sign In — Administrators',
    placeholder: 'admin2026@plm.edu.ph',
    background: administratorBackground,
    className: 'auth-administrator',
  },
}

function LoginPage({ portal }) {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const config = loginConfigs[portal]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const emailIsValid = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordIsValid = password.length > 0
  const formIsValid = emailIsValid && passwordIsValid

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    setError('')
    if (!formIsValid || busy) return
    if (!supabase) { setError(configurationError); return }
    setBusy(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (signInError) throw new Error('Unable to sign in. Check your email and password.')
      const profile = await readProfile(supabase, data.user.id)
      if (!matchesPortal(profile.role, portal)) {
        await supabase.auth.signOut({ scope: 'local' })
        throw new Error('This account belongs to a different portal. Please choose the correct portal.')
      }
      setPassword('')
      refresh()
      navigate(routeForRole(profile.role), { replace: true })
    } catch (error) {
      setError(error.message)
    } finally { setBusy(false) }
  }

  return (
    <main className={`auth-page ${config.className}`} style={{ '--auth-background': `url(${config.background})` }}>
      <section className="auth-card" aria-labelledby="login-heading">
        <div className="auth-heading">
          <h1 id="login-heading">{config.title}</h1>
          <p>Use your institutional account to continue.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor={`${portal}-email`}>PLM Email</label>
            <input
              id={`${portal}-email`}
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={config.placeholder}
              autoComplete="username"
              aria-invalid={submitted && !emailIsValid}
              aria-describedby={submitted && !emailIsValid ? `${portal}-email-error` : undefined}
            />
            {submitted && !emailIsValid && <p className="auth-error" id={`${portal}-email-error`}>Enter a valid PLM email address.</p>}
          </div>

          <div className="auth-field">
            <label htmlFor={`${portal}-password`}>Password</label>
            <div className="password-input-wrap">
              <input
                id={`${portal}-password`}
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={submitted && !passwordIsValid}
                aria-describedby={submitted && !passwordIsValid ? `${portal}-password-error` : undefined}
              />
              <button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                <img src={eyeIcon} alt="" aria-hidden="true" />
              </button>
            </div>
            {submitted && !passwordIsValid && <p className="auth-error" id={`${portal}-password-error`}>Enter your password.</p>}
          </div>

          <div className="auth-form-spacer" aria-hidden="true" />
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>
          {error && <p className="auth-error" role="alert">{error}</p>}
        </form>
      </section>
    </main>
  )
}

export default LoginPage
