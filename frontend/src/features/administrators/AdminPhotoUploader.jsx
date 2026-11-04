import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { adminPhotoUrl, replaceAdminPhoto } from './adminAccountApi'

export default function AdminPhotoUploader({ profile, onSaved }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [url, setUrl] = useState('')
  async function upload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await replaceAdminPhoto(supabase, file, profile.profile_image_path)
      setUrl(await adminPhotoUrl(supabase, result.path)); setMessage(result.warning || 'Profile photo saved.'); onSaved(result.path)
    } catch (uploadError) { setError(uploadError.message) } finally { setBusy(false); if (fileRef.current) fileRef.current.value = '' }
  }
  return <div className="admin-photo-uploader"><button className="admin-photo-button" type="button" disabled={busy} onClick={() => fileRef.current?.click()} aria-label={busy ? 'Uploading profile picture' : 'Change profile picture'}>{url || profile.profile_image_url ? <img src={url || profile.profile_image_url} alt="Administrator profile" /> : <span aria-hidden="true" />}</button><input ref={fileRef} type="file" accept="image/png,image/jpeg" onChange={upload} hidden />{error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}</div>
}
