import { MANILA_OFFSET_MS, MANILA_TZ, MINUTE_MS, manilaDayKey, manilaDayStartMs } from '../calendar/calendarDates.js'
import { TIME_BLOCKS, occupiedIntervals } from '../calendar/availability.js'

// Form values are `datetime-local` strings read as Asia/Manila time (+08:00, no DST),
// never as the browser's local time.
const INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
const NOTICE_MS = 360 * 60 * MINUTE_MS + 5 * MINUTE_MS

// 'YYYY-MM-DDTHH:mm' -> 'YYYY-MM-DDTHH:mm:00+08:00'. Returns '' for anything invalid.
export function manilaInputToIso(value) {
  const match = INPUT_PATTERN.exec(value || '')
  if (!match) return ''
  const [, , month, day, hour, minute] = match
  if (Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > 31 || Number(hour) > 23 || Number(minute) > 59) return ''
  const iso = `${value}:00+08:00`
  return Number.isFinite(Date.parse(iso)) ? iso : ''
}

// Any ISO timestamp -> 'YYYY-MM-DDTHH:mm' in Manila time. Returns '' for invalid input.
export function isoToManilaInput(iso) {
  const ms = Date.parse(iso)
  return Number.isFinite(ms) ? new Date(ms + MANILA_OFFSET_MS).toISOString().slice(0, 16) : ''
}

// Accepts a datetime-local value or any ISO string. Returns epoch ms or NaN.
function toMs(value) {
  if (typeof value === 'number') return value
  if (INPUT_PATTERN.test(value || '')) return Date.parse(manilaInputToIso(value))
  return Date.parse(value)
}

const dateTimeFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: MANILA_TZ, month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
})
const dateFmt = new Intl.DateTimeFormat('en-US', { timeZone: MANILA_TZ, month: 'long', day: 'numeric', year: 'numeric' })

// 'May 15, 2025 - 08:00 AM' (Manila). Returns '' for invalid input.
export function formatProposalDateTime(value) {
  const ms = toMs(value)
  if (!Number.isFinite(ms)) return ''
  const p = Object.fromEntries(dateTimeFmt.formatToParts(new Date(ms)).map((part) => [part.type, part.value]))
  return `${p.month} ${p.day}, ${p.year} - ${p.hour}:${p.minute} ${p.dayPeriod}`
}

// 'May 15, 2025' (Manila). Returns '' for invalid input.
export function formatSubmitted(value) {
  const ms = toMs(value)
  return Number.isFinite(ms) ? dateFmt.format(new Date(ms)) : ''
}

// Earliest allowed start: 15 full days (360 hours) plus a 5 minute margin after now.
export const minStartMs = (now = Date.now()) => now + NOTICE_MS

// Returns an error message, or '' when the pair is fine or still incomplete
// (required-field checks live in validateForm).
export function checkSchedule({ startsAt, endsAt, now = Date.now(), label = 'Event' }) {
  const start = toMs(startsAt)
  const end = toMs(endsAt)
  if (startsAt && !Number.isFinite(start)) return `${label} start must be a valid date and time.`
  if (endsAt && !Number.isFinite(end)) return `${label} end must be a valid date and time.`
  if (!Number.isFinite(start) || !Number.isFinite(end)) return ''
  if (end <= start) return `${label} end must be after the start.`
  if (start < minStartMs(now)) return `${label} must start at least 15 days from today. Choose a start on or after ${formatProposalDateTime(minStartMs(now))}.`
  return ''
}

const DAY_START_MINUTES = TIME_BLOCKS[0].startMinutes
const DAY_END_MINUTES = TIME_BLOCKS[TIME_BLOCKS.length - 1].endMinutes

// Soft warning: reservation is not within one day's 7:30 AM to 9:00 PM block range.
export function outsideDayWarning(startsAt, endsAt) {
  const start = toMs(startsAt)
  const end = toMs(endsAt)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return ''
  const startKey = manilaDayKey(start)
  if (startKey !== manilaDayKey(end)) return 'This reservation runs past midnight. Venue bookings are normally within a single day.'
  const dayStart = manilaDayStartMs(startKey)
  const startMinutes = Math.round((start - dayStart) / MINUTE_MS)
  const endMinutes = Math.round((end - dayStart) / MINUTE_MS)
  return startMinutes < DAY_START_MINUTES || endMinutes > DAY_END_MINUTES
    ? 'This reservation is outside the usual venue hours of 7:30 AM to 9:00 PM.'
    : ''
}

// Soft warning: the range overlaps a known booking or its 60 minute buffer.
export function overlapWarning(startIso, endIso, bookings) {
  const start = toMs(startIso)
  const end = toMs(endIso)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return ''
  const hit = occupiedIntervals(bookings).some((item) => start < item.end && end > item.start)
  return hit ? 'This time overlaps an existing booking at this venue or its 60 minute buffer. Choose another time or confirm with OSDS.' : ''
}

// Soft warning: expected attendees exceed the venue's maximum capacity.
export function capacityWarning(attendees, venue) {
  const count = Number(attendees)
  const capacity = Number(venue?.max_capacity)
  if (!Number.isFinite(count) || !Number.isFinite(capacity) || capacity <= 0) return ''
  return count > capacity ? `Expected attendees (${count}) exceed this venue's capacity of ${capacity}.` : ''
}

// Soft warning: backup venue is the same as the primary venue.
export function sameVenueWarning(primaryVenueId, backupVenueId) {
  return primaryVenueId && backupVenueId && primaryVenueId === backupVenueId
    ? 'The backup venue is the same as the primary venue. Choose a different venue for a useful backup.'
    : ''
}
