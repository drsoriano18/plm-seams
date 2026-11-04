// Pure filter and pagination helpers (client-side over the loaded archived rows).
export const PAGE_SIZE = 5
export const STATUS_OPTIONS = ['All', 'Completed', 'Cancelled']
export const EMPTY_FILTERS = { query: '', status: 'All', from: '', to: '' }

export const isRangeInvalid = ({ from, to }) => Boolean(from && to && from > to)

export function filterArchived(rows, filters) {
  const needle = filters.query.trim().toLowerCase()
  const useDates = !isRangeInvalid(filters)
  const from = useDates ? filters.from : ''
  const to = useDates ? filters.to : ''
  return rows.filter((row) => {
    if (needle && !`${row.title}\n${row.event_id}`.toLowerCase().includes(needle)) return false
    if (filters.status !== 'All' && row.status !== filters.status) return false
    if (from || to) {
      if (!row.event_day) return false
      if (from && row.event_day < from) return false
      if (to && row.event_day > to) return false
    }
    return true
  })
}

export function filtersActive(filters) {
  return Boolean(filters.query.trim() || filters.status !== 'All' || filters.from || filters.to)
}

// Stable key of the criteria that actually filter (used to re-trigger the no-results notice).
export function criteriaKey(filters) {
  const useDates = !isRangeInvalid(filters)
  return JSON.stringify({
    query: filters.query.trim().toLowerCase(),
    status: filters.status,
    from: useDates ? filters.from : '',
    to: useDates ? filters.to : '',
  })
}

export const pageCount = (total) => Math.max(1, Math.ceil(total / PAGE_SIZE))
export const clampPage = (page, total) => Math.min(Math.max(1, page), pageCount(total))
export const pageSlice = (rows, page) => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

export function rangeLabel(page, total) {
  if (total === 0) return ''
  const start = (page - 1) * PAGE_SIZE + 1
  const end = Math.min(total, page * PAGE_SIZE)
  return `Showing ${start}–${end} of ${total} archived ${total === 1 ? 'event' : 'events'}`
}

// Numbers and 'gap' markers for the pagination control.
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
