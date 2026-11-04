import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { subscribeToEvents } from './eventsApi.js'

// Re-evaluates the clock-derived state without polling the database. Only ticks while the tab is visible.
export function useNow(intervalMs = 45000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') setNow(Date.now()) }
    const timer = setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [intervalMs])
  return now
}

// Refetch when the window regains focus and when Realtime reports a change (silent if Realtime is off).
export function useRefreshTriggers(orgId, refresh) {
  useEffect(() => {
    const onFocus = () => { refresh() }
    window.addEventListener('focus', onFocus)
    const unsubscribe = subscribeToEvents(supabase, orgId, refresh)
    return () => {
      window.removeEventListener('focus', onFocus)
      unsubscribe()
    }
  }, [orgId, refresh])
}
