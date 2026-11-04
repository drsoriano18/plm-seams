// Archive date formatting. Everything is rendered in Asia/Manila, never the viewer's timezone.
import { MANILA_TZ, DAY_MS } from '../calendar/calendarDates.js'

export const ARCHIVE_NEW_DAYS = 7

const dateFormat = new Intl.DateTimeFormat('en-US', { timeZone: MANILA_TZ, month: 'long', day: 'numeric', year: 'numeric' })
const timeFormat = new Intl.DateTimeFormat('en-US', { timeZone: MANILA_TZ, hour: '2-digit', minute: '2-digit', hour12: true })

const toMs = (value) => (value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value))

// "March 14, 2025"
export function formatArchiveDate(value) {
  const ms = value == null ? NaN : toMs(value)
  return Number.isFinite(ms) ? dateFormat.format(ms) : ''
}

// "09:00 AM" (narrow no-break spaces replaced with a plain space)
export function formatArchiveTime(value) {
  const ms = value == null ? NaN : toMs(value)
  return Number.isFinite(ms) ? timeFormat.format(ms).replace(/\s/g, ' ') : ''
}

// True when the archive happened within the last 7 days (elapsed time, so it is timezone independent).
export function isJustArchived(archivedAt, now = Date.now()) {
  const ms = archivedAt == null ? NaN : toMs(archivedAt)
  if (!Number.isFinite(ms)) return false
  const elapsed = now - ms
  return elapsed >= 0 && elapsed <= ARCHIVE_NEW_DAYS * DAY_MS
}
