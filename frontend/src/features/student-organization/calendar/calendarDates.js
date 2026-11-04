// Pure date helpers. Everything is computed in Asia/Manila (UTC+8, no DST),
// never in the viewer's local timezone.
export const MANILA_TZ = 'Asia/Manila'
export const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000
export const MINUTE_MS = 60 * 1000
export const DAY_MS = 24 * 60 * MINUTE_MS
export const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const pad = (n, width = 2) => String(n).padStart(width, '0')
const toMs = (value) => (value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value))

// 'YYYY-MM-DD' of the Manila calendar day containing the instant.
export function manilaDayKey(value) {
  const ms = toMs(value)
  if (!Number.isFinite(ms)) return null
  return new Date(ms + MANILA_OFFSET_MS).toISOString().slice(0, 10)
}

export const todayKey = (now = Date.now()) => manilaDayKey(now)

export function parseDayKey(key) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || '')
  return match ? { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) } : null
}

export const makeDayKey = (year, month, day) => `${pad(year, 4)}-${pad(month)}-${pad(day)}`

// Epoch ms of 00:00 Manila on the day, plus optional minutes into the day.
export function manilaDayStartMs(key, minutes = 0) {
  return Date.parse(`${key}T00:00:00+08:00`) + minutes * MINUTE_MS
}

export function addDaysToKey(key, days) {
  return manilaDayKey(manilaDayStartMs(key) + days * DAY_MS)
}

export function currentMonth(now = Date.now()) {
  const { year, month } = parseDayKey(todayKey(now))
  return { year, month }
}

// Month is 1-12. Handles any number of months across year boundaries.
export function addMonths({ year, month }, delta) {
  const index = year * 12 + (month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12 + 12) % 12 + 1 }
}

export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

// Weekday of a day key, 0 = Sunday.
export function weekdayOfKey(key) {
  const { year, month, day } = parseDayKey(key)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

// 42 cells (6 rows x 7 columns, Sunday first): { key, day, inMonth, weekday }.
export function buildMonthGrid(year, month) {
  const offset = weekdayOfKey(makeDayKey(year, month, 1))
  const firstKey = makeDayKey(year, month, 1)
  const cells = []
  for (let i = 0; i < 42; i += 1) {
    const key = addDaysToKey(firstKey, i - offset)
    const parts = parseDayKey(key)
    cells.push({ key, day: parts.day, inMonth: parts.year === year && parts.month === month, weekday: i % 7 })
  }
  return cells
}

// ISO range covering the month in Manila: [first day 00:00, next month's first day 00:00).
export function monthRange(year, month) {
  const next = addMonths({ year, month }, 1)
  return {
    fromIso: new Date(manilaDayStartMs(makeDayKey(year, month, 1))).toISOString(),
    toIso: new Date(manilaDayStartMs(makeDayKey(next.year, next.month, 1))).toISOString(),
  }
}

const fmt = (options) => new Intl.DateTimeFormat('en-US', { timeZone: MANILA_TZ, ...options })
const monthTitleFmt = fmt({ month: 'long', year: 'numeric' })
const timeFmt = fmt({ hour: 'numeric', minute: '2-digit', hour12: true })
const shortDateFmt = fmt({ day: 'numeric', month: 'short', year: 'numeric' })
const longDateFmt = fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

// 'November 2026'
export const formatMonthTitle = (year, month) => monthTitleFmt.format(new Date(manilaDayStartMs(makeDayKey(year, month, 1))))
// '8:00 AM' (Manila). Returns '' for invalid input.
export function formatManilaTime(value) {
  const ms = toMs(value)
  return Number.isFinite(ms) ? timeFmt.format(new Date(ms)) : ''
}
// '15 Nov 2026' (Manila). Returns '' for invalid input.
export function formatManilaDate(value) {
  const ms = toMs(value)
  if (!Number.isFinite(ms)) return ''
  const parts = Object.fromEntries(shortDateFmt.formatToParts(new Date(ms)).map((p) => [p.type, p.value]))
  return `${parts.day} ${parts.month} ${parts.year}`
}
// 'Saturday, 7 November 2026' from a day key.
export function formatLongDate(key) {
  const parts = Object.fromEntries(longDateFmt.formatToParts(new Date(manilaDayStartMs(key))).map((p) => [p.type, p.value]))
  return `${parts.weekday}, ${parts.day} ${parts.month} ${parts.year}`
}
