import { useEffect } from 'react'
import { useAuth } from '../auth/authContext'
import { supabase } from '../../lib/supabase'

// Polling avoids requiring any live-project Realtime publication changes.
export default function useBellNotifications(setNotifications) {
  const { profile } = useAuth()
  useEffect(() => {
    if (!profile?.user_id) return
    let active = true, pending = false
    async function refresh() {
      if (pending || document.visibilityState === 'hidden') return
      pending = true
      try {
        const { data, error } = await supabase.from('notifications')
          .select('notification_id,notification_type,message,created_at,read_at,event_id')
          .eq('recipient_user_id', profile.user_id).order('created_at', { ascending: false }).limit(20)
        if (active && !error) setNotifications(data || [])
      } finally { pending = false }
    }
    const onRefresh = () => { void refresh().catch(() => {}) }
    const timer = setInterval(onRefresh, 15000)
    window.addEventListener('focus', onRefresh)
    window.addEventListener('student-notifications-changed', onRefresh)
    document.addEventListener('visibilitychange', onRefresh)
    return () => {
      active = false; clearInterval(timer)
      window.removeEventListener('focus', onRefresh)
      window.removeEventListener('student-notifications-changed', onRefresh)
      document.removeEventListener('visibilitychange', onRefresh)
    }
  }, [profile?.user_id, setNotifications])
}
