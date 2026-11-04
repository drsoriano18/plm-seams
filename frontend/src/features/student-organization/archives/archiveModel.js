// Pure label helpers and row mappers for the Archives pages.
import { manilaDayKey } from '../calendar/calendarDates.js'
import { formatArchiveDate, formatArchiveTime, isJustArchived } from './archiveDates.js'

export const ARCHIVED_STATUSES = ['Completed', 'Cancelled']
export const VENUE_HEADING = 'Physical Campus Venue'
export const NO_VENUE_NOTE = 'No physical venue recorded'
export const ARCHIVES_PATH = '/student-organization/archives'

const first = (value) => (Array.isArray(value) ? value[0] ?? null : value ?? null)
const list = (value) => (Array.isArray(value) ? value : value ? [value] : [])
const clean = (value) => (typeof value === 'string' ? value.trim() : value)
const na = (value) => {
  const text = value == null ? '' : String(clean(value))
  return text === '' ? 'N/A' : text
}

export function eventTitle(row) {
  return clean(first(row?.event_proposal)?.event_name) || clean(row?.post_caption) || row?.event_id || ''
}

export function orgLabel(org) {
  const name = clean(org?.org_name)
  const acronym = clean(org?.acronym)
  if (!name) return acronym || ''
  return acronym ? `${name} (${acronym})` : name
}

export function orgShortName(org) {
  return clean(org?.acronym) || clean(org?.org_name) || ''
}

export function scopeLine(org) {
  const label = orgLabel(org)
  return label ? `${label} • Events led by your organization` : 'Events led by your organization'
}

export const detailPath = (eventId) => `${ARCHIVES_PATH}/${encodeURIComponent(eventId)}`

export function toArchivedRow(row, now = Date.now()) {
  return {
    event_id: row.event_id,
    title: eventTitle(row),
    lead_org: orgLabel(first(row.student_organization)),
    starts_at: row.starts_at,
    event_day: manilaDayKey(row.starts_at),
    event_date_label: formatArchiveDate(row.starts_at),
    status: row.event_status,
    archived_at: row.archived_at,
    archived_date_label: formatArchiveDate(row.archived_at),
    just_archived: isJustArchived(row.archived_at, now),
    detail_path: detailPath(row.event_id),
  }
}

export function pickConfirmedVenue(bookings) {
  const booking = list(bookings).find((item) => item?.booking_status === 'Confirmed')
  return booking ? first(booking.venue) : null
}

// Modality is the stored text and is never remapped.
export function venueFields(venue, modality) {
  return {
    venueName: na(venue?.venue_name),
    building: na(venue?.building),
    floor: venue?.floor_number == null || venue.floor_number === '' ? 'N/A' : String(venue.floor_number).replaceAll('_', ' '),
    room: na(venue?.room_number),
    modality: na(modality),
  }
}

export function eventSubline(approvalStatus, modality, registrationStatus) {
  const registration = registrationStatus === 'Closed' ? 'Registration Concluded' : 'Registration Open'
  const head = [clean(approvalStatus), clean(modality), 'Event'].filter(Boolean).join(' ')
  return `${head} • ${registration}`
}

export function toArchivedDetail(row) {
  const proposal = first(row.event_proposal)
  const type = first(row.event_type)
  const org = first(row.student_organization)
  const venue = pickConfirmedVenue(row.venue_booking)
  return {
    event_id: row.event_id,
    title: eventTitle(row),
    status: row.event_status,
    proposal_id: row.proposal_id || proposal?.proposal_id || null,
    org,
    lead_org: orgLabel(org),
    archived_date_label: formatArchiveDate(row.archived_at),
    starts_date: formatArchiveDate(row.starts_at),
    starts_time: formatArchiveTime(row.starts_at),
    ends_date: formatArchiveDate(row.ends_at),
    ends_time: formatArchiveTime(row.ends_at),
    description: clean(proposal?.description) || '',
    objectives: clean(proposal?.objectives) || '',
    subline: eventSubline(proposal?.approval_status, type?.modality, row.registration_status),
    venue: venueFields(venue, type?.modality),
    has_venue: Boolean(venue),
  }
}

export function registrationsLabel(count) {
  if (count == null) return 'Unavailable'
  return `${count} ${count === 1 ? 'registration' : 'registrations'}`
}

export function attendedLabel(count) {
  return count == null ? 'Unavailable' : `${count} attended`
}

export function recordsLabel(org) {
  const short = orgShortName(org)
  return `${short || 'Organization'} Records • View-Only Access`
}
