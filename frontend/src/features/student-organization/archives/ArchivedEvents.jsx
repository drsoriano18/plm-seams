import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/authContext'
import { supabase } from '../../../lib/supabase'
import OrganizationHeader from '../components/OrganizationHeader'
import OrganizationFooter from '../components/OrganizationFooter'
import ArchiveIcon from './ArchiveIcon'
import ArchiveNotice from './ArchiveNotice'
import ArchivePagination from './ArchivePagination'
import { fetchArchivedEvents, fetchOrganization } from './archiveApi.js'
import { EMPTY_FILTERS, STATUS_OPTIONS, clampPage, criteriaKey, filterArchived, isRangeInvalid, pageSlice } from './archiveFilters.js'
import { scopeLine, toArchivedRow } from './archiveModel.js'
import '../OrganizationDashboard.css'
import '../calendar/OrganizationCalendar.css'
import './Archives.css'

const NOTICE_MS = 6000
const COLUMNS = ['Event Name', 'Lead Organization', 'Event Date', 'Status', 'Date Archived']

export default function ArchivedEvents() {
  const { profile } = useAuth()
  const orgId = profile.user_id
  const [now] = useState(() => Date.now())
  const [org, setOrg] = useState(null)
  const [data, setData] = useState({ loading: true, error: '', rows: [] })
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [dismissedKey, setDismissedKey] = useState(null)

  useEffect(() => {
    let active = true
    fetchOrganization(supabase, orgId).then((value) => { if (active) setOrg(value) })
    fetchArchivedEvents(supabase, orgId)
      .then((rows) => { if (active) setData({ loading: false, error: '', rows }) })
      .catch((error) => { if (active) setData({ loading: false, error: error.message, rows: [] }) })
    return () => { active = false }
  }, [orgId])

  const rows = useMemo(() => data.rows.map((row) => toArchivedRow(row, now)), [data.rows, now])
  const filtered = useMemo(() => filterArchived(rows, filters), [rows, filters])
  const safePage = clampPage(page, filtered.length)
  const pageRows = useMemo(() => pageSlice(filtered, safePage), [filtered, safePage])
  const hasRecords = rows.length > 0
  const noMatch = hasRecords && filtered.length === 0
  const key = criteriaKey(filters)
  const noticeVisible = noMatch && dismissedKey !== key
  const rangeInvalid = isRangeInvalid(filters)

  useEffect(() => {
    if (!noticeVisible) return undefined
    const timer = setTimeout(() => setDismissedKey(key), NOTICE_MS)
    return () => clearTimeout(timer)
  }, [noticeVisible, key])

  function updateFilters(patch) {
    setFilters((current) => ({ ...current, ...patch }))
    setPage(1)
  }

  let body
  if (data.loading) body = <p className="organization-loading" role="status">Loading archived events…</p>
  else if (data.error) body = <p className="organization-inline-error" role="alert">{data.error}</p>
  else if (!hasRecords) body = <div className="organization-archive-empty">
    <span className="organization-archive-empty-icon"><ArchiveIcon name="archive" size={22} /></span>
    <h2>No archived events yet</h2>
    <p>Events you archive will appear here.</p>
  </div>
  else if (noMatch) body = <div className="organization-archive-empty">
    <span className="organization-archive-empty-icon"><ArchiveIcon name="search" size={22} /></span>
    <h2>No archived events match your filters.</h2>
    <p>Try adjusting the event name, status or date filters to broaden your search.</p>
  </div>
  else body = <>
    <div className="organization-archive-table-wrap">
      <table className="organization-archive-table">
        <thead><tr>
          {COLUMNS.map((column) => <th key={column} scope="col">{column}</th>)}
          <th scope="col"><span className="organization-archive-visually-hidden">Actions</span></th>
        </tr></thead>
        <tbody>
          {pageRows.map((row) => <tr key={row.event_id} className={row.just_archived ? 'is-new' : undefined}>
            <td data-label="Event Name">
              <strong className="organization-archive-name">{row.title}</strong>
              <span className="organization-archive-id">{row.event_id}</span>
              {row.just_archived ? <span className="organization-archive-new">Just archived</span> : null}
            </td>
            <td data-label="Lead Organization">{row.lead_org || 'N/A'}</td>
            <td data-label="Event Date">{row.event_date_label || 'N/A'}</td>
            <td data-label="Status"><span className={`organization-archive-status is-${String(row.status).toLowerCase()}`}>{row.status}</span></td>
            <td data-label="Date Archived">{row.archived_date_label || 'N/A'}</td>
            <td data-label="Actions" className="organization-archive-action"><Link to={row.detail_path} aria-label={`View details for ${row.title}`}>View Details</Link></td>
          </tr>)}
        </tbody>
      </table>
    </div>
    <ArchivePagination page={safePage} total={filtered.length} onPage={(next) => setPage(clampPage(next, filtered.length))} />
    <p className="organization-archive-note">Your organization’s proposal, registration and attendance records are available through View Details.</p>
  </>

  return <main className="organization-portal-page organization-archive-page">
    <OrganizationHeader active="archives" skipTarget="organization-archives-heading" />
    <section className="organization-context-bar" aria-labelledby="organization-archives-heading"><div className="organization-context-inner organization-calendar-title">
      <h1 id="organization-archives-heading">Archived Events</h1>
      <p>{scopeLine(org)}</p>
      <p>Archived events retain their Completed or Cancelled status. Event details and associated records remain available.</p>
    </div></section>
    <div className="organization-main"><div className="organization-archive-content">
      <div className="organization-archive-filter-wrap">
        <form className="organization-archive-filters" role="search" aria-label="Filter archived events" onSubmit={(event) => event.preventDefault()}>
          <div className="organization-archive-field">
            <label htmlFor="archive-query">Event Name</label>
            <div className="organization-archive-control">
              <span className="organization-archive-control-icon"><ArchiveIcon name="search" /></span>
              <input id="archive-query" type="search" value={filters.query} placeholder="Search by event name…" autoComplete="off" onChange={(event) => updateFilters({ query: event.target.value })} />
            </div>
          </div>
          <div className="organization-archive-field">
            <label htmlFor="archive-status">Status</label>
            <div className="organization-archive-control is-select">
              <select id="archive-status" value={filters.status} onChange={(event) => updateFilters({ status: event.target.value })}>
                {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <span className="organization-archive-control-icon is-end"><ArchiveIcon name="chevron-down" /></span>
            </div>
          </div>
          <div className="organization-archive-field">
            <label htmlFor="archive-from">Event Date From</label>
            <div className="organization-archive-control is-date">
              <input id="archive-from" type="date" value={filters.from} onChange={(event) => updateFilters({ from: event.target.value })} />
              <span className="organization-archive-control-icon is-end"><ArchiveIcon name="calendar-days" /></span>
            </div>
          </div>
          <div className="organization-archive-field">
            <label htmlFor="archive-to">Event Date To</label>
            <div className="organization-archive-control is-date">
              <input id="archive-to" type="date" value={filters.to} onChange={(event) => updateFilters({ to: event.target.value })} />
              <span className="organization-archive-control-icon is-end"><ArchiveIcon name="calendar-days" /></span>
            </div>
          </div>
          <p className="organization-archive-helper">Status options: All, Completed, Cancelled</p>
          {rangeInvalid ? <p className="organization-archive-range-hint" role="status">Event Date From must be on or before Event Date To. Date filters are ignored until this is fixed.</p> : null}
        </form>
        <ArchiveNotice visible={noticeVisible} onClose={() => setDismissedKey(key)} />
      </div>
      <section className="organization-archive-list" aria-label="Archived events">{body}</section>
    </div></div>
    <OrganizationFooter />
  </main>
}
