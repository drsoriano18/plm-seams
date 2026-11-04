// Pure model helpers for Manage Approved Events and the Event page.
// The database never persists Ongoing/Completed, so the state is derived from the clock.
import { MANILA_TZ, manilaDayKey, todayKey } from '../calendar/calendarDates.js'
import { formatArchiveDate, formatArchiveTime } from '../archives/archiveDates.js'
import { eventTitle, orgLabel, orgShortName, pickConfirmedVenue, venueFields } from '../archives/archiveModel.js'

export const PAGE_SIZE = 5
export const EVENT_PATH = (eventId) => `/student-organization/events/${encodeURIComponent(eventId)}`
export const APPROVED_EVENTS_PATH = '/student-organization/calendar/approved-events'
export const CALENDAR_PATH = '/student-organization/calendar'
export const DASHBOARD_PATH = '/student-organization/dashboard'

export const STATES = ['Ongoing', 'Upcoming', 'Completed', 'Cancelled', 'Rescheduled']
export const STATE_FILTERS = ['All', ...STATES]
export const STATE_LABEL = { Ongoing: 'ONGOING', Upcoming: 'UPCOMING', Completed: 'COMPLETED', Cancelled: 'CANCELLED', Rescheduled: 'RESCHEDULED' }
export const ARCHIVABLE_STATES = ['Completed', 'Cancelled']

const first = (value) => (Array.isArray(value) ? value[0] ?? null : value ?? null)
const list = (value) => (Array.isArray(value) ? value : value ? [value] : [])
const clean = (value) => (typeof value === 'string' ? value.trim() : value)
const toMs = (value) => (value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value))

// Cancelled > Completed > Ongoing > Rescheduled > Upcoming.
export function deriveState(row, now = Date.now()) {
  if (row.event_status === 'Cancelled' || row.cancelled_at) return 'Cancelled'
  const start = row.starts_at ? toMs(row.starts_at) : NaN
  const end = row.ends_at ? toMs(row.ends_at) : NaN
  if (row.event_status === 'Completed' || (Number.isFinite(end) && end <= now)) return 'Completed'
  if (Number.isFinite(start) && Number.isFinite(end) && start <= now && now < end) return 'Ongoing'
  if (row.rescheduled_at) return 'Rescheduled'
  return 'Upcoming'
}

export const isUnpublished = (publicationStatus) => publicationStatus === 'Draft' || publicationStatus === 'Unpublished'
export const portalVisibility = (publicationStatus) => (publicationStatus === 'Published' ? 'Published' : 'Unpublished')
export const canArchive = (derived, archivedAt) => ARCHIVABLE_STATES.includes(derived) && !archivedAt
export const canPublish = (derived, publicationStatus) => isUnpublished(publicationStatus) && !ARCHIVABLE_STATES.includes(derived)

// 'unpublished' | 'published' | 'completed' | 'cancelled'
export function viewFor(publicationStatus, derived) {
  if (derived === 'Cancelled') return 'cancelled'
  if (derived === 'Completed') return 'completed'
  return isUnpublished(publicationStatus) ? 'unpublished' : 'published'
}

// N is the Confirmed registration count (null when it could not be loaded).
export function capacityLabel({ derived, registration_status: registrationStatus, registration_capacity: capacity, confirmed }) {
  const n = confirmed == null ? '\u2013' : confirmed
  if (derived === 'Cancelled') return `Void (${n})`
  if (derived === 'Completed') return `Concluded (${n})`
  const cap = Number(capacity)
  const hasCap = Number.isFinite(cap)
  if (registrationStatus === 'Open') {
    const full = hasCap && cap > 0 && confirmed != null && confirmed >= cap
    return full ? 'Closed / Full' : `Open (${n} Reg)`
  }
  const full = !hasCap || cap <= 0 || (confirmed != null && confirmed >= cap)
  return full ? 'Closed / Full' : `Closed (${n} Reg)`
}

export const remainingSeats = (capacity, confirmed) => Math.max(0, (Number(capacity) || 0) - (confirmed || 0))

const dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: MANILA_TZ, month: 'short', day: 'numeric' })
const dayYearFmt = new Intl.DateTimeFormat('en-US', { timeZone: MANILA_TZ, month: 'short', day: 'numeric', year: 'numeric' })

// "Today, Mar 24 • 09:00 AM - 12:00 PM" or "Mar 26, 2026 • 04:00 PM - 08:00 PM".
export function slotLabel(startsAt, endsAt, now = Date.now()) {
  const start = startsAt ? toMs(startsAt) : NaN
  if (!Number.isFinite(start)) return 'Schedule to be announced'
  const today = manilaDayKey(start) === todayKey(now)
  const date = today ? `Today, ${dayFmt.format(start)}` : dayYearFmt.format(start)
  const startTime = formatArchiveTime(start)
  const endTime = endsAt ? formatArchiveTime(endsAt) : ''
  return `${date} \u2022 ${startTime}${endTime ? ` - ${endTime}` : ''}`
}

// "Feb 18, 2025 • 02:30 PM" or '' for missing values.
export function stampLabel(value) {
  const ms = value ? toMs(value) : NaN
  return Number.isFinite(ms) ? `${dayYearFmt.format(ms)} \u2022 ${formatArchiveTime(ms)}` : ''
}

function bookingReason(bookings) {
  const match = list(bookings).find((b) => (b?.booking_status === 'Confirmed' || b?.booking_status === 'Replaced') && clean(b?.change_reason))
  return match ? clean(match.change_reason) : ''
}

export function rescheduleNote(row) {
  const reason = clean(row.rescheduled_reason) || bookingReason(row.venue_booking)
  return reason || 'No reason was recorded for this schedule change.'
}

export function cancelNote(row) {
  return clean(row.cancellation_reason) || 'No cancellation reason was recorded.'
}

function venueOf(row) {
  const confirmed = list(row.venue_booking).find((b) => b?.booking_status === 'Confirmed')
  return { venue: confirmed ? first(confirmed.venue) : null, venueId: confirmed?.venue_id ?? null }
}

export function venueText(row) {
  const { venue } = venueOf(row)
  const name = clean(venue?.venue_name)
  if (name) return name
  return first(row.event_type)?.modality === 'Online' ? 'Online' : 'To be announced'
}

export function toRow(row, now = Date.now()) {
  const derived = deriveState(row, now)
  const org = first(row.student_organization)
  const { venueId } = venueOf(row)
  return {
    event_id: row.event_id,
    title: eventTitle(row),
    organizer: orgLabel(org),
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    derived,
    publication_status: row.publication_status,
    registration_status: row.registration_status,
    registration_capacity: row.registration_capacity,
    portal: portalVisibility(row.publication_status),
    unpublished: isUnpublished(row.publication_status),
    rescheduled_at: row.rescheduled_at ?? null,
    cancelled_at: row.cancelled_at ?? null,
    venue_id: venueId == null ? '' : String(venueId),
    venue_text: venueText(row),
    note: derived === 'Cancelled' ? { tone: 'cancelled', title: 'Cancelled', text: cancelNote(row) }
      : row.rescheduled_at ? { tone: 'rescheduled', title: 'Rescheduled', text: rescheduleNote(row) } : null,
    archivable: canArchive(derived, row.archived_at),
  }
}

const ORDER = { Ongoing: 0, Upcoming: 1, Rescheduled: 1, Completed: 2, Cancelled: 2 }

export function sortRows(rows) {
  const time = (row) => (row.starts_at ? toMs(row.starts_at) : 0)
  return [...rows].sort((a, b) => {
    const group = ORDER[a.derived] - ORDER[b.derived]
    if (group !== 0) return group
    const diff = time(a) - time(b)
    return ORDER[a.derived] === 2 ? -diff : diff
  })
}

export function filterRows(rows, { state = 'All', venueId = '' } = {}) {
  return rows.filter((row) => (state === 'All' || row.derived === state) && (!venueId || row.venue_id === String(venueId)))
}

export const pageCount = (total, size = PAGE_SIZE) => Math.max(1, Math.ceil(total / size))
export const clampPage = (page, total, size = PAGE_SIZE) => Math.min(Math.max(1, page), pageCount(total, size))

export function paginate(rows, page, size = PAGE_SIZE) {
  const current = clampPage(page, rows.length, size)
  return { page: current, pages: pageCount(rows.length, size), items: rows.slice((current - 1) * size, current * size) }
}

export function rangeLabel(page, total, size = PAGE_SIZE) {
  if (total === 0) return ''
  const start = (page - 1) * size + 1
  const end = Math.min(total, page * size)
  return `Displaying ${start}\u2013${end} of ${total} approved ${total === 1 ? 'event' : 'events'}`
}

export function pageItems(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const keep = new Set([1, pages, page - 1, page, page + 1])
  const items = []
  let last = 0
  for (let n = 1; n <= pages; n += 1) {
    if (!keep.has(n)) continue
    if (n - last > 1) items.push('gap')
    items.push(n)
    last = n
  }
  return items
}

// rows are toRow() results.
export function summaryCounts(rows, pendingBookings = 0) {
  const active = rows.filter((r) => r.derived === 'Upcoming' || r.derived === 'Rescheduled' || r.derived === 'Ongoing').length
  const ongoing = rows.filter((r) => r.derived === 'Ongoing').length
  const overrides = rows.filter((r) => r.rescheduled_at || r.cancelled_at).length
  return { active, ongoing, overrides, pending: pendingBookings ?? null }
}

export function toEventDetail(row, counts, now = Date.now()) {
  const derived = deriveState(row, now)
  const type = first(row.event_type)
  const proposal = first(row.event_proposal)
  const org = first(row.student_organization)
  const venue = pickConfirmedVenue(row.venue_booking)
  const registrationStatus = row.registration_status
  return {
    event_id: row.event_id,
    title: eventTitle(row),
    description: clean(proposal?.description) || '',
    org,
    org_label: orgLabel(org),
    org_short: orgShortName(org),
    poster_label: clean(type?.description) || 'Campus Event',
    derived,
    view: viewFor(row.publication_status, derived),
    publication_status: row.publication_status,
    registration_status: registrationStatus,
    registration_open: registrationStatus === 'Open',
    capacity: Number(row.registration_capacity) || 0,
    confirmed: counts?.confirmed ?? null,
    waitlisted: counts?.waitlisted ?? null,
    caption: row.post_caption ?? '',
    archived_at: row.archived_at ?? null,
    archivable: canArchive(derived, row.archived_at),
    publishable: canPublish(derived, row.publication_status) && !row.archived_at,
    starts_date: formatArchiveDate(row.starts_at),
    starts_time: formatArchiveTime(row.starts_at),
    ends_date: formatArchiveDate(row.ends_at),
    ends_time: formatArchiveTime(row.ends_at),
    published_label: stampLabel(row.published_at) || 'N/A',
    rescheduled_label: row.rescheduled_at ? `${stampLabel(row.rescheduled_at)}${clean(row.rescheduled_reason) ? ` \u2022 ${clean(row.rescheduled_reason)}` : ''}` : 'N/A',
    cancelled_label: row.cancelled_at ? `${stampLabel(row.cancelled_at)}${clean(row.cancellation_reason) ? ` \u2022 ${clean(row.cancellation_reason)}` : ''}` : 'N/A',
    venue: venueFields(venue, type?.modality),
    has_venue: Boolean(venue),
  }
}
