import { MINUTE_MS, manilaDayStartMs, todayKey } from './calendarDates.js'

// Fixed daily time blocks, minutes after 00:00 Asia/Manila. One hour apart.
export const TIME_BLOCK_1 = { id: 'block-1', startMinutes: 7 * 60 + 30, endMinutes: 9 * 60 + 30 }
export const TIME_BLOCK_2 = { id: 'block-2', startMinutes: 10 * 60 + 30, endMinutes: 13 * 60 + 30 }
export const TIME_BLOCK_3 = { id: 'block-3', startMinutes: 14 * 60 + 30, endMinutes: 18 * 60 + 30 }
export const TIME_BLOCK_4 = { id: 'block-4', startMinutes: 19 * 60 + 30, endMinutes: 21 * 60 }
export const TIME_BLOCKS = [TIME_BLOCK_1, TIME_BLOCK_2, TIME_BLOCK_3, TIME_BLOCK_4]
// Business rule: every booking blocks the venue for 60 minutes after it ends.
export const BUFFER_AFTER_MINUTES = 60
export const OCCUPYING_STATUSES = ['Confirmed', 'Pending']

// Blocking intervals are half-open: [starts_at, ends_at + BUFFER_AFTER_MINUTES).
// The booking's own buffer_minutes value is ignored.
export function occupiedIntervals(bookings) {
  const out = []
  for (const booking of bookings || []) {
    if (!OCCUPYING_STATUSES.includes(booking.booking_status)) continue
    const start = Date.parse(booking.starts_at)
    const end = Date.parse(booking.ends_at) + BUFFER_AFTER_MINUTES * MINUTE_MS
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) out.push({ start, end, booking })
  }
  return out
}

const iso = (ms) => new Date(ms).toISOString()

export const isPastDay = (key, now = Date.now()) => key < todayKey(now)

// The four blocks of one Manila day, chronological.
// Block: { id, kind: 'free'|'occupied'|'past', status: 'Available'|'Occupied'|'Unavailable',
//          startsAt, endsAt (ISO), events: [{ id, eventName, organizationName, bookingStatus, startsAt, endsAt }] }
// A booking appears in every block it overlaps (buffer included). Occupied wins over past.
// Blocks of today that have already started, and all blocks of past days, are 'past' unless occupied.
export function daySlots(key, bookings, now = Date.now()) {
  const intervals = occupiedIntervals(bookings)
  return TIME_BLOCKS.map((block) => {
    const start = manilaDayStartMs(key, block.startMinutes)
    const end = manilaDayStartMs(key, block.endMinutes)
    const events = intervals
      .filter((item) => start < item.end && end > item.start)
      .sort((a, b) => a.start - b.start)
      .map(({ booking: b, start: bookingStart }) => ({
        id: `${b.booking_id ?? bookingStart}-${block.id}`,
        eventName: b.event_name ?? null,
        organizationName: b.organization_name ?? null,
        bookingStatus: b.booking_status,
        startsAt: b.starts_at,
        endsAt: b.ends_at,
      }))
    const kind = events.length ? 'occupied' : isPastDay(key, now) || start <= now ? 'past' : 'free'
    const status = kind === 'occupied' ? 'Occupied' : kind === 'past' ? 'Unavailable' : 'Available'
    return { id: `${key}-${block.id}`, kind, status, startsAt: iso(start), endsAt: iso(end), events }
  })
}

// 'unavailable' (past, or no Available block left) or 'available'.
export function dayStatus(key, bookings, now = Date.now()) {
  if (isPastDay(key, now)) return 'unavailable'
  return daySlots(key, bookings, now).some((slot) => slot.kind === 'free') ? 'available' : 'unavailable'
}
