export async function eventDetails(client, eid) {
  const result = await client.rpc('get_student_event_details', { eid })
  if (result.error) throw new Error(result.error.code === 'PGRST202' ? 'Event details are temporarily unavailable. Please try again later.' : result.error.message)
  const event = Array.isArray(result.data) ? result.data[0] : result.data
  if (!event) throw new Error('This event is unavailable or your account does not have access.')
  return event
}
export function registrationState(event, now) {
  if (event.event_status === 'Cancelled') return 'cancelled-event'
  if (event.event_status !== 'Upcoming' || Date.parse(event.starts_at) <= now) return 'expired'
  if (['Confirmed','Waitlisted'].includes(event.student_reg_status)) return event.student_reg_status.toLowerCase()
  if (!event.can_register) return 'closed'
  return Number(event.confirmed_registrations) >= Number(event.registration_capacity) ? 'waitlist-open' : 'open'
}
export function canCancel(event, now) { return !!event.can_cancel && event.event_status === 'Upcoming' && Date.parse(event.starts_at)>now }
