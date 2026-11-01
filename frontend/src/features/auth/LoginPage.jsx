import { useState } from 'react'
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
  const config = loginConfigs[portal]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const emailIsValid = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordIsValid = password.length >= 8
  const formIsValid = emailIsValid && passwordIsValid

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    // Auth intentionally remains disconnected until the Supabase roles are defined.
    // The validated values can later be passed to a portal-specific auth handler.
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
            {submitted && !passwordIsValid && <p className="auth-error" id={`${portal}-password-error`}>Password must be at least 8 characters.</p>}
          </div>

          <div className="auth-form-spacer" aria-hidden="true" />
          <button className="auth-submit" type="submit">Sign In</button>
          {submitted && formIsValid && <p className="auth-placeholder-note" role="status">Credentials are valid. Portal authentication will be connected later.</p>}
        </form>
      </section>
    </main>
  )
}

export default LoginPage
