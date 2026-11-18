import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { validatePhoto } from '../account/accountApi'

const BUCKET = 'organization-profile-images'
export function useOrganizationPhoto(orgId) {
  const [photo, setPhoto] = useState({ orgId: null, path: null, url: '' })
  useEffect(() => {
    let active = true
    async function load() {
      const { data, error } = await supabase.from('student_organization').select('profile_image_path').eq('org_id', orgId).maybeSingle()
      if (error) return
      const path = data?.profile_image_path
      const signed = path ? await supabase.storage.from(BUCKET).createSignedUrl(path, 3600) : null
      if (active) setPhoto({ orgId, path, url: signed?.data?.signedUrl || '' })
    }
    load()
    const timer = setInterval(load, 45 * 60 * 1000)
    window.addEventListener('organization-photo-changed', load)
    return () => { active = false; clearInterval(timer); window.removeEventListener('organization-photo-changed', load) }
  }, [orgId])
  return photo.orgId === orgId ? photo : { path: null, url: '' }
}

export async function saveOrganizationPhoto(file, oldPath) {
  await validatePhoto(file)
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Please sign in again.')
  const bucket = supabase.storage.from(BUCKET)
  const path = `${user.id}/${crypto.randomUUID()}.${file.type === 'image/png' ? 'png' : 'jpg'}`
  const uploaded = await bucket.upload(path, file, { upsert: false, contentType: file.type })
  if (uploaded.error) throw uploaded.error
  const saved = await supabase.rpc('set_organization_profile_image', { path })
  if (saved.error) { await bucket.remove([path]); throw saved.error }
  if (oldPath) await bucket.remove([oldPath])
  window.dispatchEvent(new Event('organization-photo-changed'))
}
