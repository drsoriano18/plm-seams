// Supabase access for Manage Approved Events and the Event page. Callers pass the client in.
// Allowed writes: event.post_caption / publication_status / registration_status for the
// organization's own event, and the archive_event RPC (owned by the backend team).
import { isFunctionMissing } from '../calendar/venueApi.js'

const LIST_COLUMNS = 'event_id, org_id, starts_at, ends_at, event_status, publication_status, registration_status, registration_capacity, rescheduled_at, rescheduled_reason, cancelled_at, cancellation_reason, archived_at, post_caption, event_proposal(event_name), student_organization(org_name, acronym), event_type(modality), venue_booking(booking_status, venue_id, change_reason, venue(venue_name))'
const DETAIL_COLUMNS = 'event_id, org_id, starts_at, ends_at, event_status, publication_status, registration_status, registration_capacity, rescheduled_at, rescheduled_reason, cancelled_at, cancellation_reason, archived_at, published_at, post_caption, proposal_id, event_proposal(event_name, description), student_organization(org_name, acronym), event_type(modality, description, requires_venue), venue_booking(booking_status, venue_id, change_reason, venue(venue_name, building, floor_number, room_number))'

export const MESSAGES = {
  load: 'Approved events could not be loaded. Please try again.',
  detail: 'This event could not be loaded. Please try again.',
  publish: "This event can't be published right now.",
  caption: "The caption can't be saved right now.",
  archiveMissing: 'Archiving is not available yet. It will work once the backend enables it.',
  archiveDenied: "This event can't be archived right now.",
}

export async function fetchOrgEvents(client, orgId) {
  const { data, error } = await client
    .from('event')
    .select(LIST_COLUMNS)
    .eq('org_id', orgId)
    .is('archived_at', null)
  if (error) throw new Error(MESSAGES.load)
  return data ?? []
}

// Head counts never throw; a failed count is null. One request per event, run together.
async function headCount(client, eventId, regStatus) {
  try {
    const result = await client.from('registration').select('reg_id', { count: 'exact', head: true }).eq('event_id', eventId).eq('reg_status', regStatus)
    return result.error || typeof result.count !== 'number' ? null : result.count
  } catch {
    return null
  }
}

export async function fetchConfirmedCounts(client, eventIds) {
  const ids = [...new Set(eventIds)]
  const counts = await Promise.all(ids.map((id) => headCount(client, id, 'Confirmed')))
  return Object.fromEntries(ids.map((id, index) => [id, counts[index]]))
}

// Bookings of this organization's events that still wait for confirmation. Null when unavailable.
export async function fetchPendingBookings(client, orgId) {
  try {
    const { count, error } = await client
      .from('venue_booking')
      .select('booking_id, event!inner(org_id)', { count: 'exact', head: true })
      .eq('booking_status', 'Pending')
      .eq('event.org_id', orgId)
    return error || typeof count !== 'number' ? null : count
  } catch {
    return null
  }
}

export async function fetchEventDetail(client, orgId, eventId) {
  const { data, error } = await client
    .from('event')
    .select(DETAIL_COLUMNS)
    .eq('event_id', eventId)
    .eq('org_id', orgId)
    .maybeSingle()
  if (error) throw new Error(MESSAGES.detail)
  return data ?? null
}

export async function fetchDetailCounts(client, eventId) {
  const [confirmed, waitlisted] = await Promise.all([headCount(client, eventId, 'Confirmed'), headCount(client, eventId, 'Waitlisted')])
  return { confirmed, waitlisted }
}

async function updateOwnEvent(client, orgId, eventId, values, message) {
  try {
    const { data, error } = await client
      .from('event')
      .update(values)
      .eq('event_id', eventId)
      .eq('org_id', orgId)
      .select('event_id')
    if (error || !Array.isArray(data) || data.length !== 1) return { ok: false, message }
    return { ok: true }
  } catch {
    return { ok: false, message }
  }
}

// Publishing also opens registration. published_at is stamped by the database.
export function publishEvent(client, orgId, eventId, caption) {
  return updateOwnEvent(client, orgId, eventId, { post_caption: caption, publication_status: 'Published', registration_status: 'Open' }, MESSAGES.publish)
}

export function saveCaption(client, orgId, eventId, caption) {
  return updateOwnEvent(client, orgId, eventId, { post_caption: caption }, MESSAGES.caption)
}

// archive_event(eid) does not exist until the backend adds it; never fake success.
export async function archiveEvent(client, eventId) {
  try {
    const { error } = await client.rpc('archive_event', { eid: eventId })
    if (!error) return { ok: true }
    if (isFunctionMissing(error)) return { ok: false, code: 'missing', message: MESSAGES.archiveMissing }
    return { ok: false, code: 'denied', message: MESSAGES.archiveDenied }
  } catch {
    return { ok: false, code: 'denied', message: MESSAGES.archiveDenied }
  }
}

// Optional Realtime refresh. Failure to subscribe (Realtime not enabled) is silent.
// Each subscription gets a unique topic so the list page and the event page never collide.
let subscriptionCounter = 0

export function subscribeToEvents(client, orgId, onChange) {
  let channel = null
  try {
    subscriptionCounter += 1
    channel = client
      .channel(`organization-events-${orgId}-${subscriptionCounter}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event', filter: `org_id=eq.${orgId}` }, () => onChange())
      .subscribe()
  } catch {
    channel = null
  }
  return () => {
    try {
      if (channel) client.removeChannel(channel)
    } catch {
      // Nothing to clean up.
    }
  }
}
