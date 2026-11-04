import { stampLabel } from '../events/eventState.js'

export const first = (value) => (Array.isArray(value) ? value[0] ?? null : value ?? null)

const clean = (value) => (typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim())

function ordinal(n) {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  const mod10 = n % 10
  if (mod10 === 1) return `${n}st`
  if (mod10 === 2) return `${n}nd`
  if (mod10 === 3) return `${n}rd`
  return `${n}th`
}

// '3' -> '3rd Year', '2nd Year' kept, '' / null -> ''. Unrecognised text is returned as stored.
export function formatYearLevel(value) {
  const text = clean(value)
  if (!text) return ''
  if (/year/i.test(text)) return text
  const digits = text.match(/\d+/)
  if (digits) {
    const n = Number(digits[0])
    if (n > 0) return `${ordinal(n)} Year`
  }
  return text
}

export function detailParts(student) {
  const college = clean(student?.college)
  const rest = [clean(student?.program), formatYearLevel(student?.year_level)].filter(Boolean).join(' \u2022 ')
  return { college, rest }
}

const compareIds = (a, b) => {
  const x = Number(a)
  const y = Number(b)
  if (Number.isFinite(x) && Number.isFinite(y) && x !== y) return x < y ? -1 : 1
  if (Number.isFinite(x) && Number.isFinite(y)) return 0
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

const compareWaitlist = (a, b) => {
  const x = a.reg_date ? Date.parse(a.reg_date) : NaN
  const y = b.reg_date ? Date.parse(b.reg_date) : NaN
  if (Number.isFinite(x) && Number.isFinite(y) && x !== y) return x < y ? -1 : 1
  return compareIds(a.reg_id, b.reg_id)
}

// Output keeps the fetched order. Waitlist rank follows the backend promotion order (reg_date, then reg_id).
export function toAttendees(rows) {
  const list = (rows ?? []).map((row) => {
    const student = first(row.students)
    const { college, rest } = detailParts(student)
    return {
      reg_id: row.reg_id,
      student_number: clean(row.student_number),
      name: clean(student?.name) || clean(row.student_number) || 'Unknown Student',
      college,
      rest,
      reg_date: row.reg_date ?? null,
      reg_label: stampLabel(row.reg_date),
      source: 'Web Portal',
      reg_status: row.reg_status,
      attendance_status: row.attendance_status ?? null,
      attendance_marked_at: row.attendance_marked_at ?? null,
      cancelled_at: row.cancelled_at ?? null,
      rank: null,
    }
  })
  list.filter((row) => row.reg_status === 'Waitlisted').sort(compareWaitlist).forEach((row, index) => { row.rank = index + 1 })
  return list
}

export function statusLabel(row) {
  if (row.reg_status === 'Confirmed') return 'CONFIRMED'
  if (row.reg_status === 'Waitlisted') return row.rank ? `WAITLISTED (RANK #${row.rank})` : 'WAITLISTED'
  if (row.reg_status === 'Cancelled') return 'CANCELLED'
  return String(row.reg_status ?? '').toUpperCase()
}
