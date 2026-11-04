import { formatManilaDate } from './calendarDates.js'
import { venueLabel } from './venueApi.js'

const first = (value) => (Array.isArray(value) ? value[0] : value) ?? null
const list = (value) => (Array.isArray(value) ? value : value ? [value] : [])
const UNPUBLISHED = ['Draft', 'Unpublished']

// Maps one event_proposal row (with embeds) to a table row, or null when it is not an
// unpublished approved event. `event` and `event_type` may be an object or an array.
export function toUnpublishedRow(proposal) {
  if (proposal.approval_status && proposal.approval_status !== 'Approved') return null
  const event = first(proposal.event)
  if (event && !UNPUBLISHED.includes(event.publication_status)) return null
  const type = first(proposal.event_type)
  const schedules = list(proposal.proposal_schedule)
  const schedule = schedules.find((s) => s.schedule_type === 'Primary') ?? null

  const booking = list(event?.venue_booking).find((b) => b.booking_status === 'Confirmed') ?? null
  const venue = first(booking?.venue) ?? first(schedule?.venue)
  const startsAt = event?.starts_at ?? schedule?.starts_at ?? null
  const endsAt = event?.ends_at ?? schedule?.ends_at ?? null
  const eventId = event?.event_id ?? null

  return {
    proposal_id: proposal.proposal_id,
    event_id: eventId,
    event_name: proposal.event_name || 'Untitled event',
    event_type: type?.description ?? null,
    starts_at: startsAt,
    ends_at: endsAt,
    date_label: startsAt ? formatManilaDate(startsAt) : 'To be announced',
    venue_label: venue ? venueLabel(venue) : type?.requires_venue === false ? 'Online' : 'To be announced',
    publication_status: event?.publication_status ?? null,
    review_path: eventId ? `/student-organization/events/${eventId}` : `/student-organization/proposals/${proposal.proposal_id}`,
  }
}

// Approved proposals of the organization with no event yet, or a Draft/Unpublished event,
// sorted by date ascending (undated last). Throws a friendly Error on failure.
export async function fetchUnpublishedApprovedEvents(client, orgId) {
  const { data, error } = await client
    .from('event_proposal')
    .select(`proposal_id, event_name, approval_status,
      event_type(description, requires_venue),
      event(event_id, publication_status, starts_at, ends_at, venue_booking(booking_status, venue(venue_name, room_number))),
      proposal_schedule(schedule_type, starts_at, ends_at, venue(venue_name, room_number))`)
    .eq('approval_status', 'Approved')
    .eq('org_id', orgId)
  if (error) throw new Error('Unpublished approved events could not be loaded. Please try again.')
  return (data ?? [])
    .map(toUnpublishedRow)
    .filter(Boolean)
    .sort((a, b) => (a.starts_at ? Date.parse(a.starts_at) : Infinity) - (b.starts_at ? Date.parse(b.starts_at) : Infinity))
}
