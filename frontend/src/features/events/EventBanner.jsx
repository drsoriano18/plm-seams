import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/authContext'
import { replaceEventBanner } from './eventBannerApi'
import './EventBanner.css'

export function EventBannerUpload({ eventId, orgId, archived }) {
  const { profile } = useAuth()
  const input = useRef(null)
  const inFlight = useRef(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  if (profile?.role !== 'Student Organization' || profile.user_id !== orgId || archived) return null
  async function upload(event) {
    const file = event.target.files?.[0]
    if (!file || inFlight.current) return
    inFlight.current = true; setBusy(true); setMessage('')
    try {
      const result = await replaceEventBanner(supabase, eventId, file)
      window.dispatchEvent(new CustomEvent('event-banner-changed', { detail: eventId }))
      setMessage(result.warning || 'Banner saved.')
    } catch (error) { setMessage(error.message) }
    finally { inFlight.current = false; setBusy(false); if (input.current) input.current.value = '' }
  }
  return <><button className="event-banner-camera" type="button" disabled={busy} aria-busy={busy} aria-label="Upload event banner" title="Upload JPEG or PNG banner (maximum 2 MB)" onClick={() => input.current?.click()}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h3l1.5-2h7L17 7h3v12H4Z" /><circle cx="12" cy="13" r="3.5" /></svg></button><input ref={input} type="file" accept="image/jpeg,image/png" onChange={upload} hidden />{message && <span className="event-banner-message" role="status">{message}</span>}</>
}
