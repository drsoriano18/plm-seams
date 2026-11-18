import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/authContext'
import { BANNER_BUCKET } from './eventBannerApi'

export function useEventBanner(eventId) {
  const { profile } = useAuth()
  const [banner, setBanner] = useState({ key: '', url: '' })
  const key = `${profile?.user_id}:${eventId}`
  useEffect(() => {
    let active = true
    async function load() {
      const result = await supabase.from('event').select('banner_image_path').eq('event_id', eventId).maybeSingle()
      const path = result.data?.banner_image_path
      const signed = path ? await supabase.storage.from(BANNER_BUCKET).createSignedUrl(path, 3600) : null
      if (active) setBanner({ key, url: signed?.data?.signedUrl || '' })
    }
    load()
    const changed = event => { if (event.detail === eventId) load() }
    const timer = setInterval(load, 45 * 60 * 1000)
    window.addEventListener('event-banner-changed', changed)
    return () => { active = false; clearInterval(timer); window.removeEventListener('event-banner-changed', changed) }
  }, [eventId, key])
  const url = banner.key === key ? banner.url : ''
  return url ? { backgroundImage: `linear-gradient(180deg, rgba(4,26,64,.35), rgba(4,26,64,.85)), url("${url}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined
}

