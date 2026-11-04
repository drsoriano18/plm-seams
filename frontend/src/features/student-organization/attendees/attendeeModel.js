export const REGISTRATION_OPTIONS = ['All', 'Confirmed', 'Waitlisted', 'Cancelled']
export const ATTENDANCE_OPTIONS = ['All', 'Present', 'Absent', 'Unmarked']
export const EMPTY_FILTERS = { query: '', registration: 'All', attendance: 'All', college: 'All' }
export const PAGE_SIZES = [10, 25, 50]
export const DEFAULT_PAGE_SIZE = 10

export const isMarked = (row) => row.attendance_status === 'Present' || row.attendance_status === 'Absent'

export function filterAttendees(rows, filters) {
  const query = (filters.query ?? '').trim().toLowerCase()
  return rows.filter((row) => {
    if (query && !`${row.name}\n${row.student_number}`.toLowerCase().includes(query)) return false
    if (filters.registration !== 'All' && row.reg_status !== filters.registration) return false
    if (filters.college !== 'All' && row.college !== filters.college) return false
    if (filters.attendance === 'Unmarked') return row.reg_status === 'Confirmed' && !isMarked(row)
    if (filters.attendance !== 'All') return row.attendance_status === filters.attendance
    return true
  })
}

export function collegeOptions(rows, selected = 'All') {
  const set = new Set(rows.map((row) => row.college).filter(Boolean))
  if (selected && selected !== 'All') set.add(selected)
  return [...set].sort((a, b) => a.localeCompare(b))
}

export const filtersActive = (f) => Boolean(f.query.trim()) || f.registration !== 'All' || f.attendance !== 'All' || f.college !== 'All'
export const criteriaKey = (f) => JSON.stringify([f.query.trim().toLowerCase(), f.registration, f.attendance, f.college])

export function summaryOf(rows, capacity) {
  let confirmed = 0
  let waitlisted = 0
  let cancelled = 0
  let present = 0
  let absent = 0
  for (const row of rows) {
    if (row.reg_status === 'Confirmed') {
      confirmed += 1
      if (row.attendance_status === 'Present') present += 1
      else if (row.attendance_status === 'Absent') absent += 1
    } else if (row.reg_status === 'Waitlisted') waitlisted += 1
    else if (row.reg_status === 'Cancelled') cancelled += 1
  }
  const cap = Number(capacity) || 0
  const total = confirmed + waitlisted
  return {
    confirmed,
    waitlisted,
    cancelled,
    total,
    present,
    absent,
    capacity: cap,
    totalPct: cap > 0 ? Math.min(100, (total / cap) * 100) : null,
    confirmedPct: cap > 0 ? (confirmed / cap) * 100 : null,
    presentPct: confirmed > 0 ? (present / confirmed) * 100 : 0,
    absentPct: confirmed > 0 ? (absent / confirmed) * 100 : 0,
  }
}

export const formatPct = (n) => (n == null || !Number.isFinite(n) ? '\u2014' : `${Number(n.toFixed(1))}%`)

export const pageCount = (total, size) => Math.max(1, Math.ceil(total / size))
export const clampPage = (page, total, size) => Math.min(Math.max(1, page), pageCount(total, size))
export const pageSlice = (rows, page, size) => rows.slice((page - 1) * size, page * size)

export function rangeBounds(page, total, size) {
  if (total === 0) return { start: 0, end: 0 }
  return { start: (page - 1) * size + 1, end: Math.min(total, page * size) }
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

// Marking opens at the event start. Missing or invalid start keeps it closed.
export function canMarkNow(startsAt, now) {
  const start = startsAt ? Date.parse(startsAt) : NaN
  return Number.isFinite(start) && now >= start
}

export const attendanceOpensText = (label) => (label ? `Attendance opens when the event starts on ${label}.` : 'Attendance opens when the event starts.')

// Returns new rows. status = null reverts to unmarked.
export function applyMarks(rows, regIds, status, at = null) {
  const ids = new Set(regIds)
  return rows.map((row) => (ids.has(row.reg_id) ? { ...row, attendance_status: status, attendance_marked_at: status ? at : null } : row))
}

export function archivedAttendanceText(row) {
  if (row.reg_status === 'Confirmed') {
    if (row.attendance_status === 'Present') return 'PRESENT'
    if (row.attendance_status === 'Absent') return 'ABSENT'
    return 'Not Recorded'
  }
  if (row.reg_status === 'Waitlisted') return 'Not applicable \u2022 Waitlisted'
  return '-'
}
