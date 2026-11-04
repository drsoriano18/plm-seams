import { isFunctionMissing } from '../calendar/venueApi.js'

const PAGE = 1000
const MAX_PAGES = 200
const COLUMNS = 'reg_id, student_number, reg_date, reg_status, attendance_status, attendance_marked_at, cancelled_at, cancellation_reason, students(name, college, program, year_level)'

export const MESSAGES = {
  load: "Attendees couldn't be loaded. Please try again.",
  missing: "Attendance marking isn't available yet. It will work once the backend enables it.",
  denied: "This attendance mark couldn't be saved. The registration may not be confirmed or the event isn't yours.",
  error: "Attendance couldn't be saved. Please try again.",
}

// Reads every registration row for the event, 1000 at a time.
export async function fetchAttendees(client, eventId) {
  const all = []
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE
    const { data, error } = await client
      .from('registration')
      .select(COLUMNS)
      .eq('event_id', eventId)
      .order('reg_date', { ascending: true })
      .order('reg_id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw new Error(MESSAGES.load)
    const rows = data ?? []
    all.push(...rows)
    if (rows.length < PAGE) break
  }
  return all
}

// Read-only. Used where the event row on hand has no capacity column.
export async function fetchEventCapacity(client, eventId) {
  try {
    const { data, error } = await client.from('event').select('registration_capacity').eq('event_id', eventId).maybeSingle()
    if (error) return 0
    return Number(data?.registration_capacity) || 0
  } catch {
    return 0
  }
}

// The only write: the existing mark_attendance RPC. Never fakes success.
export async function markAttendance(client, regId, status) {
  if (status !== 'Present' && status !== 'Absent') return { ok: false, code: 'error', message: MESSAGES.error }
  try {
    const { error } = await client.rpc('mark_attendance', { rid: regId, status })
    if (!error) return { ok: true }
    if (isFunctionMissing(error)) return { ok: false, code: 'missing', message: MESSAGES.missing }
    if (error.code === '42501') return { ok: false, code: 'denied', message: MESSAGES.denied }
    return { ok: false, code: 'error', message: MESSAGES.error }
  } catch {
    return { ok: false, code: 'error', message: MESSAGES.error }
  }
}

// Optional Realtime refresh; failure to subscribe is silent. Unique topic per call.
let subscriptionCounter = 0

export function subscribeToRegistrations(client, eventId, onChange, debounceMs = 400) {
  let channel = null
  let timer = null
  try {
    subscriptionCounter += 1
    channel = client
      .channel(`attendees-${eventId}-${subscriptionCounter}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registration', filter: `event_id=eq.${eventId}` }, () => {
        clearTimeout(timer)
        timer = setTimeout(onChange, debounceMs)
      })
      .subscribe()
  } catch {
    channel = null
  }
  return () => {
    clearTimeout(timer)
    try {
      if (channel) client.removeChannel(channel)
    } catch {
      // Nothing to clean up.
    }
  }
}
