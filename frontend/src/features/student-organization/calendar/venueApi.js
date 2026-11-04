import { DAY_MS } from './calendarDates.js'

const first = (value) => (Array.isArray(value) ? value[0] : value) ?? null
const clean = (value) => (typeof value === 'string' && value.trim() ? value.trim() : '')
const humanize = (value) => clean(value).replace(/_/g, ' ')

// 'Main Hall' or 'Main Hall (Room 301)'. Safe with missing fields.
export function venueLabel(venue) {
  const name = clean(venue?.venue_name)
  if (!name) return 'To be announced'
  const room = humanize(venue.room_number)
  return room ? `${name} (Room ${room})` : name
}

// 'Main Hall - Main Building, Third Floor, Room 301 - Capacity 200' (empty parts skipped).
export function venueDetails(venue) {
  const parts = [humanize(venue?.building), humanize(venue?.floor_number), humanize(venue?.room_number) && `Room ${humanize(venue.room_number)}`].filter(Boolean)
  const capacity = Number(venue?.max_capacity)
  return [parts.join(', '), Number.isFinite(capacity) && capacity > 0 ? `Capacity ${capacity}` : ''].filter(Boolean).join(' - ')
}

// All venues, ordered by name. Throws a friendly Error on failure.
export async function fetchVenues(client) {
  const { data, error } = await client
    .from('venue')
    .select('venue_id, venue_name, building, room_number, floor_number, max_capacity')
    .order('venue_name', { ascending: true })
  if (error) throw new Error('Venues could not be loaded. Please try again.')
  return data ?? []
}

export function isFunctionMissing(error) {
  return !!error && (error.code === 'PGRST202' || /could not find the function|function .* does not exist/i.test(error.message || ''))
}

// One row shape for both sources.
export function normalizeBooking(row) {
  const event = first(row.event)
  const proposal = first(event?.event_proposal)
  return {
    booking_id: row.booking_id ?? null,
    venue_id: row.venue_id ?? null,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    buffer_minutes: Number(row.buffer_minutes) || 0,
    booking_status: row.booking_status,
    event_name: row.event_name ?? proposal?.event_name ?? null,
    organization_name: row.organization_name ?? null,
  }
}

// Bookings overlapping [fromIso, toIso) for a venue. The range is widened by one day
// before it so a booking whose buffer runs into the range is not missed.
// Returns { bookings, source: 'shared' | 'own' }; 'own' means the RPC does not exist yet and
// only the signed-in organization's bookings (RLS) are visible.
export async function fetchVenueBookings(client, venueId, fromIso, toIso) {
  const from = new Date(Date.parse(fromIso) - DAY_MS).toISOString()
  const rpc = await client.rpc('get_venue_availability', { venue_id: venueId, from_ts: from, to_ts: toIso })
  if (!rpc.error) return { bookings: (rpc.data ?? []).map(normalizeBooking), source: 'shared' }
  if (!isFunctionMissing(rpc.error)) throw new Error('Venue availability could not be loaded. Please try again.')

  const own = await client
    .from('venue_booking')
    .select('booking_id, venue_id, starts_at, ends_at, buffer_minutes, booking_status, event(org_id, event_proposal(event_name))')
    .eq('venue_id', venueId)
    .lt('starts_at', toIso)
    .gt('ends_at', from)
    .order('starts_at', { ascending: true })
  if (own.error) throw new Error('Venue availability could not be loaded. Please try again.')
  return { bookings: (own.data ?? []).map(normalizeBooking), source: 'own' }
}
