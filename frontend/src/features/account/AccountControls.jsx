import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/authContext'
import { changePassword, PHOTO_BUCKET, replacePhoto } from './accountApi'
import './AccountControls.css'

function useStudentPhoto() {
  const { profile } = useAuth()
  const [photo, setPhoto] = useState({ userId: null, path: null, url: '' })
  useEffect(() => {
    if (profile?.role !== 'Student') return
    let active = true
    async function load() {
      const result = await supabase.from('students').select('profile_image_path').eq('student_number', profile.user_id).maybeSingle()
      const path = result.data?.profile_image_path
      const signed = path ? await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600) : null
      if (active) setPhoto({ userId: profile.user_id, path: path ?? null, url: signed?.data?.signedUrl ?? '' })
    }
    load()
    window.addEventListener('student-photo-changed', load)
    const timer = setInterval(load, 45 * 60 * 1000)
    return () => { active = false; clearInterval(timer); window.removeEventListener('student-photo-changed', load) }
  }, [profile?.user_id, profile?.role])
  return photo.userId === profile?.user_id ? photo : { path: null, url: '' }
}
export function ProfileImage({ fallback }) {
  const photo = useStudentPhoto()
  const [failedUrl, setFailedUrl] = useState('')
  return photo.url && failedUrl !== photo.url ? <img className="account-avatar" src={photo.url} alt="Your profile" onError={() => setFailedUrl(photo.url)} /> : fallback
}
export function PhotoUploader({ className = 'settings-picture-button' }) {
  const { path, url } = useStudentPhoto()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function upload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await replacePhoto(supabase, file, path)
      window.dispatchEvent(new Event('student-photo-changed'))
      setMessage(result.warning || 'Profile photo saved.')
    } catch (e) { setError(e.message) } finally { setBusy(false); if(fileRef.current) fileRef.current.value = '' }
  }
  return <div className="photo-upload"><button className={className} type="button" disabled={busy} onClick={() => fileRef.current?.click()} aria-label={busy ? 'Uploading profile picture' : 'Change profile picture'} aria-busy={busy}>{url ? <img src={url} alt="Your profile" /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h3l1.5-2h7L17 7h3v12H4Z" /><circle cx="12" cy="13" r="3.5" /></svg>}</button><input ref={fileRef} type="file" accept="image/png,image/jpeg" onChange={upload} hidden />{error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}</div>
}
export function PasswordForm() {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('')
  const [visible, setVisible] = useState({ current: false, password: false, confirmation: false })
  async function submit(e) {
    e.preventDefault()
    const form = e.currentTarget, values = new FormData(form)
    setBusy(true); setError(''); setMessage('')
    const verifier = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
    try {
      await changePassword(supabase, verifier, values.get('current'), values.get('password'), values.get('confirmation'))
      form.reset(); setMessage('Password updated. Use your new password next time you sign in.')
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const field = (name, label, autoComplete, minLength) => <label key={name}>{label}<span className="password-input-wrap"><input name={name} type={visible[name] ? 'text' : 'password'} autoComplete={autoComplete} minLength={minLength} required disabled={busy} /><button type="button" className="password-visibility-toggle" aria-label={visible[name] ? `Hide ${label}` : `Show ${label}`} onClick={() => setVisible(current => ({ ...current, [name]: !current[name] }))}>{visible[name] ? '◉' : '◌'}</button></span></label>
  return <form className="account-password-form" onSubmit={submit}><h2>Password</h2>{field('current', 'Current password', 'current-password')}{field('password', 'New password', 'new-password', 8)}{field('confirmation', 'Confirm new password', 'new-password', 8)}<button className="settings-save-button" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>{error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}</form>
}
