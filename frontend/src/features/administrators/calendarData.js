export const calendarTimeZone = 'Asia/Manila'
export const predefinedSlots = Object.freeze([
  { id: 'morning', label: '08:00 AM', endLabel: '10:00 AM', start: '08:00', end: '10:00' },
  { id: 'midday', label: '10:30 AM', endLabel: '01:30 PM', start: '10:30', end: '13:30' },
  { id: 'afternoon', label: '02:00 PM', endLabel: '06:00 PM', start: '14:00', end: '18:00' },
  { id: 'evening', label: '06:30 PM', endLabel: '08:30 PM', start: '18:30', end: '20:30' },
])

export function dateKey(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = value instanceof Date ? value : new Date(value)
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: calendarTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date).map(part => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthDays(month) {
  const [year, monthNumber] = month.split('-').map(Number)
  const first = new Date(year, monthNumber - 1, 1)
  const count = new Date(year, monthNumber, 0).getDate()
  const cells = []
  for (let index = 0; index < first.getDay(); index += 1) cells.push(null)
  for (let day = 1; day <= count; day += 1) cells.push(new Date(year, monthNumber - 1, day))
  while (cells.length % 7) cells.push(null)
  return cells
}

export function localDateTimeIso(date, time) {
  return new Date(`${date}T${time}:00+08:00`).toISOString()
}

export function overlaps(startA, endA, startB, endB) {
  return Date.parse(startA) < Date.parse(endB) && Date.parse(endA) > Date.parse(startB)
}

export function slotAvailability(slot, selectedDate, bookings) {
  const start = localDateTimeIso(selectedDate, slot.start)
  const end = localDateTimeIso(selectedDate, slot.end)
  return bookings.some(booking => overlaps(start, end, booking.starts_at, booking.ends_at)) ? 'Unavailable' : 'Available'
}

export function bookingOverlapsDate(booking, day) {
  const start = localDateTimeIso(day, '00:00')
  const next = new Date(Date.parse(start) + 86400000).toISOString()
  return overlaps(booking.starts_at, booking.ends_at, start, next)
}

export function eventBooking(event) {
  const bookings = event.bookings || []
  return bookings.find(booking => booking.booking_status === 'Confirmed') || bookings.filter(booking => booking.booking_status === 'Cancelled').toSorted((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at))[0] || null
}

export function eventDisplayState(event) {
  if (event.event_status === 'Upcoming' && (event.rescheduled_at || event.rescheduled_reason)) return 'Rescheduled'
  return event.event_status
}

async function fetchAll(queryPage) {
  const rows = []
  const size = 500
  for (let offset = 0; ; offset += size) {
    const { data, error } = await queryPage().range(offset, offset + size - 1)
    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < size) return rows
  }
}

export async function loadCalendarVenues(client) {
  const { data, error } = await client.from('venue').select('venue_id,venue_name,building').order('venue_name')
  if (error) throw error
  return data || []
}

export async function loadVenueBookings(client, venueId, month) {
  const [year, monthNumber] = month.split('-').map(Number)
  const start = new Date(`${year}-${String(monthNumber).padStart(2, '0')}-01T00:00:00+08:00`).toISOString()
  const end = new Date(Date.UTC(year, monthNumber, 1) - 8 * 3600000).toISOString()
  return fetchAll(() => client.from('venue_booking').select('booking_id,event_id,venue_id,starts_at,ends_at,booking_status').eq('venue_id', venueId).eq('booking_status', 'Confirmed').lt('starts_at', end).gt('ends_at', start).order('starts_at').order('booking_id'))
}

export async function loadApprovedEvents(client) {
  return fetchAll(() => client.from('event').select('event_id,proposal_id,starts_at,ends_at,event_status,publication_status,registration_status,registration_capacity,org_id,cancellation_reason,rescheduled_at,rescheduled_reason,archived_at,proposal:event_proposal!inner(event_name,approval_status,organization:student_organization(org_name)),bookings:venue_booking(booking_id,venue_id,starts_at,ends_at,booking_status,venue:venue(venue_id,venue_name,building))').eq('proposal.approval_status', 'Approved').is('archived_at', null).order('starts_at', { ascending: true }).order('event_id', { ascending: true }))
}

export async function cancelAdminEvent(client, event, reason, adminId) {
  const { error } = await client.rpc('admin_cancel_event', { eid: event.event_id, reason: reason.trim() })
  if (error) throw error
}

export async function rescheduleAdminEvent(client, event, values, adminId) {
  const startsAt = localDateTimeIso(values.date, values.start)
  const endsAt = localDateTimeIso(values.endDate || values.date, values.end)
  if (Date.parse(endsAt) <= Date.parse(startsAt)) throw new Error('The end time must be after the start time.')
  const booking = eventBooking(event)
  const { error } = await client.rpc('admin_reschedule_event', { eid: event.event_id, new_starts_at: startsAt, new_ends_at: endsAt, new_venue_id: values.venueId || booking?.venue_id || null, reason: values.reason.trim() })
  if (error) throw error
}

export async function archiveAdminEvent(client, event, adminId) {
  const { error } = await client.rpc('archive_event', { eid: event.event_id })
  if (error) throw error
  return adminId
}
