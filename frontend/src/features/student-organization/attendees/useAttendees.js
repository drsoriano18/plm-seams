import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { fetchAttendees, MESSAGES, subscribeToRegistrations } from './attendeesApi.js'
import { applyMarks } from './attendeeModel.js'

// Loads every registration for the event. Refetches on focus and Realtime changes when live.
export function useAttendees(eventId, { live }) {
  const [state, setState] = useState({ key: null, rows: [], error: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const mutations = useRef(0)
  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  useEffect(() => {
    let current = true
    async function run() {
      try {
        const rows = await fetchAttendees(supabase, eventId)
        if (!current || mutations.current > 0) return
        setState({ key: eventId, rows, error: '' })
      } catch (error) {
        if (!current) return
        setState((previous) => (previous.key === eventId ? previous : { key: eventId, rows: [], error: error.message || MESSAGES.load }))
      }
    }
    run()
    return () => { current = false }
  }, [eventId, reloadKey])

  useEffect(() => {
    if (!live) return undefined
    const onFocus = () => { reload() }
    window.addEventListener('focus', onFocus)
    const unsubscribe = subscribeToRegistrations(supabase, eventId, reload)
    return () => {
      window.removeEventListener('focus', onFocus)
      unsubscribe()
    }
  }, [eventId, live, reload])

  const patchMark = useCallback((regId, status, at) => {
    setState((previous) => ({ ...previous, rows: applyMarks(previous.rows, [regId], status, at) }))
  }, [])
  const beginMutation = useCallback(() => { mutations.current += 1 }, [])
  const endMutation = useCallback(() => {
    mutations.current = Math.max(0, mutations.current - 1)
    if (mutations.current === 0) reload()
  }, [reload])

  const loaded = state.key === eventId
  return {
    rows: loaded ? state.rows : [],
    status: !loaded ? 'loading' : state.error ? 'error' : 'ready',
    error: state.error,
    reload,
    patchMark,
    beginMutation,
    endMutation,
  }
}
