import { useCallback, useMemo, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import EventNotice from '../events/EventNotice'
import { stampLabel } from '../events/eventState.js'
import { useNow } from '../events/useEventSync.js'
import AttendeeBulkBar from './AttendeeBulkBar'
import AttendeeFilters from './AttendeeFilters'
import AttendeePagination from './AttendeePagination'
import AttendeeSummary from './AttendeeSummary'
import AttendeeTable from './AttendeeTable'
import { bulkNotice, markRow, markSequence } from './attendeeActions.js'
import { toAttendees } from './attendeeFormat.js'
import {
  DEFAULT_PAGE_SIZE, EMPTY_FILTERS, attendanceOpensText, canMarkNow, clampPage, collegeOptions, criteriaKey,
  filterAttendees, filtersActive, pageCount, pageSlice, summaryOf,
} from './attendeeModel.js'
import { useAttendees } from './useAttendees.js'

const HINT_ID = 'organization-attendees-hint'
const NO_RESULTS = {
  tone: 'info',
  title: 'No attendees match your filters.',
  text: 'Try adjusting the search, registration, attendance or college filters to broaden your list.',
}

export default function AttendeeBoard({ eventId, capacity, startsAt, readOnly = false }) {
  const { rows, status, error, reload, patchMark, beginMutation, endMutation } = useAttendees(eventId, { live: !readOnly })
  const now = useNow()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE)
  const [selected, setSelected] = useState(() => new Set())
  const [pending, setPending] = useState(() => new Set())
  const [notice, setNotice] = useState(null)
  const [dismissedKey, setDismissedKey] = useState('')
  const [progress, setProgress] = useState(null)
  const [announce, setAnnounce] = useState('')
  const noticeIdRef = useRef(0)
  const busyRef = useRef(new Set())
  const bulkRef = useRef(false)

  const attendees = useMemo(() => toAttendees(rows), [rows])
  const summary = useMemo(() => summaryOf(attendees, capacity), [attendees, capacity])
  const colleges = useMemo(() => collegeOptions(attendees, filters.college), [attendees, filters.college])
  const filtered = useMemo(() => filterAttendees(attendees, filters), [attendees, filters])
  const effectivePage = clampPage(page, filtered.length, size)
  const pages = pageCount(filtered.length, size)
  const visible = useMemo(() => pageSlice(filtered, effectivePage, size), [filtered, effectivePage, size])
  const confirmedIds = useMemo(() => new Set(attendees.filter((row) => row.reg_status === 'Confirmed').map((row) => row.reg_id)), [attendees])
  const chosen = useMemo(() => [...selected].filter((id) => confirmedIds.has(id)), [selected, confirmedIds])
  const canMark = !readOnly && canMarkNow(startsAt, now)

  const key = criteriaKey(filters)
  const showNoResults = filtered.length === 0 && attendees.length > 0 && filtersActive(filters) && dismissedKey !== key
  const noResults = showNoResults ? { id: `none-${key}`, ...NO_RESULTS } : null
  const shownNotice = notice ?? noResults
  const closeNotice = useCallback(() => {
    if (notice) setNotice(null)
    else setDismissedKey(key)
  }, [notice, key])
  const notify = (value) => setNotice({ id: ++noticeIdRef.current, ...value })

  const clearSelection = () => setSelected(new Set())
  const changeFilters = (patch) => {
    setFilters((previous) => ({ ...previous, ...patch }))
    setPage(1)
    clearSelection()
    setAnnounce('')
  }
  const changePage = (next) => { setPage(next); clearSelection() }
  const changeSize = (next) => { setSize(next); setPage(1); clearSelection() }
  const toggleOne = (regId) => setSelected((previous) => {
    const next = new Set(previous)
    if (next.has(regId)) next.delete(regId)
    else next.add(regId)
    return next
  })
  const pageSelectable = visible.filter((row) => row.reg_status === 'Confirmed')
  const toggleAll = () => {
    const all = pageSelectable.length > 0 && pageSelectable.every((row) => selected.has(row.reg_id))
    setSelected(all ? new Set() : new Set(pageSelectable.map((row) => row.reg_id)))
  }

  const setBusy = (ids, on) => {
    for (const id of ids) {
      if (on) busyRef.current.add(id)
      else busyRef.current.delete(id)
    }
    setPending(new Set(busyRef.current))
  }

  const markOne = async (row, nextStatus) => {
    if (!canMark || bulkRef.current || busyRef.current.has(row.reg_id)) return
    if (row.reg_status !== 'Confirmed' || row.attendance_status === nextStatus) return
    beginMutation()
    setBusy([row.reg_id], true)
    const result = await markRow(supabase, row, nextStatus, patchMark)
    if (result.ok) setAnnounce(`Marked ${row.name} ${nextStatus}.`)
    else notify({ tone: 'error', title: 'Attendance Not Saved', text: result.message })
    setBusy([row.reg_id], false)
    endMutation()
  }

  const markMany = async (nextStatus) => {
    if (!canMark || bulkRef.current || chosen.length === 0) return
    const targets = attendees.filter((row) => row.reg_status === 'Confirmed' && chosen.includes(row.reg_id))
    bulkRef.current = true
    beginMutation()
    const ids = targets.map((row) => row.reg_id)
    setBusy(ids, true)
    setProgress({ done: 0, total: targets.length })
    const outcome = await markSequence(supabase, targets, nextStatus, {
      patch: patchMark,
      onProgress: (done, total) => setProgress({ done, total }),
    })
    setSelected((previous) => new Set([...previous].filter((id) => !outcome.succeeded.includes(id))))
    notify(bulkNotice(nextStatus, outcome))
    setBusy(ids, false)
    setProgress(null)
    bulkRef.current = false
    endMutation()
  }

  if (status === 'loading') return <div className="organization-attendees-state" role="status"><h2>Loading attendees{'\u2026'}</h2></div>
  if (status === 'error') return <div className="organization-attendees-state is-error" role="alert">
    <h2>Attendees Unavailable</h2>
    <p>{error}</p>
    <button type="button" className="organization-attendees-retry" onClick={reload}>Try Again</button>
  </div>

  const hint = readOnly || canMark ? null : <p id={HINT_ID} className="organization-attendees-hint">{attendanceOpensText(stampLabel(startsAt))}</p>
  const liveText = announce || `${filtered.length} of ${attendees.length} attendees shown.`

  return <>
    {hint}
    <AttendeeSummary summary={summary} />
    <div className="organization-attendees-filter-block">
      <AttendeeFilters filters={filters} colleges={colleges} onChange={changeFilters} />
      <EventNotice notice={shownNotice} onClose={closeNotice} />
    </div>
    {!readOnly && chosen.length > 0 ? <AttendeeBulkBar count={chosen.length} canMark={canMark} hintId={HINT_ID} progress={progress} onMark={markMany} onClear={clearSelection} /> : null}
    {attendees.length === 0
      ? <div className="organization-attendees-state"><h2>No Registrations Yet</h2><p>Registrations will appear here once students register for this event.</p></div>
      : <section className="organization-attendees-table-card" aria-label="Attendee List">
        <AttendeeTable rows={visible} readOnly={readOnly} selected={selected} onToggle={toggleOne} onToggleAll={toggleAll} pending={pending} canMark={canMark} onMark={markOne} hintId={HINT_ID} filteredEmpty={filtered.length === 0} />
        <AttendeePagination page={effectivePage} pages={pages} total={filtered.length} size={size} confirmed={summary.confirmed} waitlisted={summary.waitlisted} readOnly={readOnly} onPage={changePage} onSize={changeSize} />
      </section>}
    <p className="organization-events-sr" role="status" aria-live="polite">{liveText}</p>
  </>
}
