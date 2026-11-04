import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { useAuth } from '../../auth/authContext'
import { supabase } from '../../../lib/supabase'
import OrganizationHeader from '../components/OrganizationHeader'
import OrganizationFooter from '../components/OrganizationFooter'
import { ARCHIVES_PATH, NO_VENUE_NOTE, VENUE_HEADING } from '../archives/archiveModel.js'
import ArchiveEventDialog from './ArchiveEventDialog'
import EventNotice from './EventNotice'
import EventsIcon from './EventsIcon'
import { archiveEvent, fetchDetailCounts, fetchEventDetail, publishEvent, saveCaption } from './eventsApi.js'
import { CALENDAR_PATH, DASHBOARD_PATH, STATE_LABEL, remainingSeats, toEventDetail } from './eventState.js'
import { useNow, useRefreshTriggers } from './useEventSync.js'
import '../OrganizationDashboard.css'
import './OrganizationEventPage.css'

const CAPTION_LIMIT = 2000
const HELPER = 'Edit your caption before publishing. This will appear on the student event page.'

function Shell({ active, skipTarget, children }) {
  return <main className="organization-portal-page organization-event-page">
    <OrganizationHeader active={active} skipTarget={skipTarget} />
    <div className="organization-main"><div className="organization-event-content">{children}</div></div>
    <OrganizationFooter />
  </main>
}

function Crumbs({ fromApproved, title }) {
  return <nav className="organization-events-breadcrumb" aria-label="Breadcrumb"><ol>
    <li><Link to={fromApproved ? CALENDAR_PATH : DASHBOARD_PATH}><EventsIcon name="arrow-left" size={14} />{fromApproved ? 'Calendar' : 'Events'}</Link></li>
    <li aria-hidden="true">/</li>
    <li><span aria-current="page">{title}</span></li>
  </ol></nav>
}

function Tile({ label, value }) {
  return <div className="organization-cap-tile"><dt>{label}</dt><dd>{value}</dd></div>
}

function Poster({ detail }) {
  const unpublished = detail.view === 'unpublished'
  const cancelled = detail.view === 'cancelled'
  return <section className="organization-event-poster" aria-label="Event poster">
    <p className="organization-event-poster-label">{detail.poster_label}</p>
    <div className="organization-event-badges">
      <span className={`organization-badge ${detail.publication_status === 'Published' ? 'is-green' : 'is-red'}`}>{detail.publication_status === 'Published' ? 'Published' : 'Unpublished'}</span>
      {unpublished ? null : <span className={`organization-badge ${cancelled ? 'is-red' : 'is-gold'}`}>{STATE_LABEL[detail.derived]}</span>}
      {detail.archived_at ? <span className="organization-badge is-grey">Archived</span> : null}
    </div>
    <div className="organization-event-poster-copy">
      {detail.org_short ? <p>{detail.org_short}</p> : null}
      <h2>{detail.title}</h2>
    </div>
    <span className="organization-event-reg-tag">{cancelled ? 'Event Cancelled' : detail.registration_open && detail.view !== 'completed' ? 'Reg Open' : 'Reg Closed'}</span>
  </section>
}

function CapacityCard({ detail }) {
  const unpublished = detail.view === 'unpublished'
  const dash = '\u2013'
  let tag = null
  if (detail.view === 'published' && detail.confirmed != null) tag = <span className="organization-badge is-red">{remainingSeats(detail.capacity, detail.confirmed)} Seats Remaining</span>
  if (detail.view === 'completed') tag = <span className="organization-badge is-green">Registration Closed</span>
  return <section className="organization-event-card" aria-labelledby="event-capacity-heading">
    <div className="organization-event-card-head"><h2 id="event-capacity-heading">Capacity &amp; Availability</h2>{tag}</div>
    <dl className={`organization-cap-tiles ${unpublished ? 'is-single' : ''}`}>
      <Tile label="Total Cap" value={detail.capacity} />
      {unpublished ? null : <><Tile label="Confirmed" value={detail.confirmed ?? dash} /><Tile label="Waitlist" value={detail.waitlisted ?? dash} /></>}
    </dl>
  </section>
}

function VenueCard({ detail }) {
  const { venue } = detail
  return <section className="organization-event-card" aria-labelledby="event-venue-heading">
    <div className="organization-event-card-head"><h2 id="event-venue-heading">{VENUE_HEADING}</h2></div>
    <dl className="organization-venue-rows">
      <div><dt>Primary Facility</dt><dd>{venue.venueName}</dd></div>
      <div><dt>Building</dt><dd>{venue.building}</dd></div>
      <div><dt>Floor Level</dt><dd>{venue.floor}</dd></div>
      <div><dt>Designated Room</dt><dd><span className="organization-pill is-gold">{venue.room}</span></dd></div>
      <div><dt>Modality</dt><dd><span className="organization-pill is-green">{venue.modality}</span></dd></div>
    </dl>
    {detail.has_venue ? null : <p className="organization-event-note">{NO_VENUE_NOTE}</p>}
  </section>
}

export default function OrganizationEventPage() {
  const { eventId } = useParams()
  const location = useLocation()
  const { profile } = useAuth()
  const orgId = profile.user_id
  const fromApproved = location.state?.from === 'approved-events'
  const active = fromApproved ? 'calendar' : 'events'
  const now = useNow()
  const [state, setState] = useState({ key: null, error: '', row: null, counts: null })
  const [notice, setNotice] = useState(null)
  const [draft, setDraft] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [archiveError, setArchiveError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const noticeIdRef = useRef(0)
  const savingRef = useRef(false)
  const autoArchiveRef = useRef(new URLSearchParams(location.search).get('archive') === '1')
  const refresh = useCallback(() => setReloadKey((key) => key + 1), [])

  useEffect(() => {
    let current = true
    async function run() {
      try {
        const row = await fetchEventDetail(supabase, orgId, eventId)
        const counts = row ? await fetchDetailCounts(supabase, row.event_id) : null
        if (!current) return
        setState({ key: eventId, error: '', row, counts })
        if (autoArchiveRef.current) {
          autoArchiveRef.current = false
          if (row && toEventDetail(row, counts, Date.now()).archivable) setDialogOpen(true)
        }
      } catch (error) {
        if (current) setState((previous) => (previous.key === eventId && previous.row ? previous : { key: eventId, error: error.message, row: null, counts: null }))
      }
    }
    run()
    return () => { current = false }
  }, [orgId, eventId, reloadKey])
  useRefreshTriggers(orgId, refresh)
  const detail = useMemo(() => (state.row && state.key === eventId ? toEventDetail(state.row, state.counts, now) : null), [state, eventId, now])
  const closeNotice = useCallback(() => setNotice(null), [])
  const notify = (value) => setNotice({ id: ++noticeIdRef.current, ...value })

  if (state.key !== eventId) return <Shell active={active} skipTarget="organization-event-state"><p id="organization-event-state" className="organization-events-state" role="status">Loading event&hellip;</p></Shell>
  if (state.error) return <Shell active={active} skipTarget="organization-event-state">
    <p id="organization-event-state" className="organization-events-state is-error" role="alert">{state.error}</p>
    <Link className="organization-event-back" to={fromApproved ? CALENDAR_PATH : DASHBOARD_PATH}>Go Back</Link>
  </Shell>
  if (!detail) return <Shell active={active} skipTarget="organization-event-state">
    <div className="organization-events-empty">
      <span><EventsIcon name="event" size={22} /></span>
      <h1 id="organization-event-state" tabIndex={-1}>Event not found</h1>
      <p>This event does not exist or is not led by your organization.</p>
      <Link className="organization-event-back" to={fromApproved ? CALENDAR_PATH : DASHBOARD_PATH}>Go Back</Link>
    </div>
  </Shell>

  const captionValue = draft ?? detail.caption
  const unpublished = detail.view === 'unpublished'
  const archived = Boolean(detail.archived_at)
  const canEditCaption = detail.view === 'published' && !archived

  const onPublish = async () => {
    const caption = captionValue.trim()
    if (savingRef.current || !detail.publishable || !caption) return
    savingRef.current = true
    setSaving(true)
    setFormError('')
    const result = await publishEvent(supabase, orgId, detail.event_id, caption)
    savingRef.current = false
    setSaving(false)
    if (!result.ok) { setFormError(result.message); return }
    setDraft(null)
    notify({ tone: 'success', title: 'Event published.', text: 'Registration is now open on the student event page.' })
    refresh()
  }

  const onSaveCaption = async () => {
    const caption = captionValue.trim()
    if (savingRef.current || !caption) return
    savingRef.current = true
    setSaving(true)
    setFormError('')
    const result = await saveCaption(supabase, orgId, detail.event_id, caption)
    savingRef.current = false
    setSaving(false)
    if (!result.ok) { setFormError(result.message); return }
    setDraft(null)
    setEditing(false)
    notify({ tone: 'success', title: 'Caption updated.' })
    refresh()
  }

  const onConfirmArchive = async () => {
    if (archiving) return
    setArchiving(true)
    setArchiveError('')
    const result = await archiveEvent(supabase, detail.event_id)
    setArchiving(false)
    if (!result.ok) { setArchiveError(result.message); return }
    setDialogOpen(false)
    notify({ tone: 'success', sticky: true, title: `${detail.title} has been archived.`, link: true })
    refresh()
  }

  const archiveHint = archived ? 'This event has already been archived.' : 'Available once the event is Completed or Cancelled.'
  const showAttendance = (detail.view === 'published' || detail.view === 'completed') && !archived

  return <Shell active={active} skipTarget="organization-event-title">
    <Crumbs fromApproved={fromApproved} title={detail.title} />
    <EventNotice notice={notice} onClose={closeNotice}>
      {notice?.link ? <Link className="organization-event-notice-link" to={ARCHIVES_PATH}>View Archived Events</Link> : null}
    </EventNotice>
    <div className="organization-event-grid">
      <aside className="organization-event-side">
        <Poster detail={detail} />
        <CapacityCard detail={detail} />
        <VenueCard detail={detail} />
      </aside>
      <div className="organization-event-main">
        <header className="organization-event-title">
          <p className="organization-event-org">{detail.org_label || 'Student Organization'}</p>
          <h1 id="organization-event-title" tabIndex={-1}>{detail.title}</h1>
          {detail.description ? <p className="organization-event-description">{detail.description}</p> : null}
        </header>
        <div className="organization-event-times">
          <section className="organization-event-card organization-event-time" aria-label="Event commencement">
            <h2><EventsIcon name="calendar" size={14} />Event Commencement</h2>
            <p className="organization-event-time-label">Starts</p>
            <p className="organization-event-time-date">{detail.starts_date || 'N/A'}</p>
            <p className="organization-event-time-clock"><EventsIcon name="clock" size={14} />{detail.starts_time || 'N/A'}</p>
          </section>
          <section className="organization-event-card organization-event-time" aria-label="Event conclusion">
            <h2><EventsIcon name="calendar" size={14} />Event Conclusion</h2>
            <p className="organization-event-time-label">Concludes</p>
            <p className="organization-event-time-date">{detail.ends_date || 'N/A'}</p>
            <p className="organization-event-time-clock"><EventsIcon name="clock" size={14} />{detail.ends_time || 'N/A'}</p>
          </section>
        </div>

        <section className="organization-event-caption" aria-labelledby="event-caption-label">
          {unpublished ? <>
            <label id="event-caption-label" htmlFor="event-caption">Post caption <span aria-hidden="true">*</span></label>
            <textarea id="event-caption" value={captionValue} onChange={(event) => setDraft(event.target.value)} maxLength={CAPTION_LIMIT} rows={5} required aria-required="true" aria-describedby="event-caption-help" disabled={saving} />
            <div className="organization-event-caption-meta"><p id="event-caption-help">{HELPER}</p><span>{captionValue.length}/{CAPTION_LIMIT}</span></div>
          </> : editing && canEditCaption ? <>
            <label id="event-caption-label" htmlFor="event-caption">Post caption <span aria-hidden="true">*</span></label>
            <textarea id="event-caption" value={captionValue} onChange={(event) => setDraft(event.target.value)} maxLength={CAPTION_LIMIT} rows={5} required aria-required="true" aria-describedby="event-caption-help" disabled={saving} />
            <div className="organization-event-caption-meta"><p id="event-caption-help">{HELPER}</p><span>{captionValue.length}/{CAPTION_LIMIT}</span></div>
            <div className="organization-event-caption-actions">
              <button type="button" className="organization-event-gold" onClick={onSaveCaption} disabled={saving || !captionValue.trim()}>{saving ? 'Saving\u2026' : 'Save Caption'}</button>
              <button type="button" className="organization-event-outline" onClick={() => { setEditing(false); setDraft(null); setFormError('') }} disabled={saving}>Cancel</button>
            </div>
          </> : <>
            <div className="organization-event-caption-head">
              <h2 id="event-caption-label">Post Caption</h2>
              {canEditCaption ? <button type="button" className="organization-event-gold is-small" onClick={() => { setEditing(true); setFormError('') }}><EventsIcon name="edit" size={14} />Edit Caption</button> : null}
            </div>
            <p className="organization-event-caption-text">{detail.caption || 'No caption was written for this event.'}</p>
          </>}
          <p className="organization-events-state is-error organization-event-form-error" role="alert">{formError}</p>
        </section>

        <section className="organization-event-records" aria-label="Event records">
          <dl>
            <div><dt>Original Publication Date</dt><dd>{detail.published_label}</dd></div>
            <div><dt>Rescheduling Record</dt><dd>{detail.rescheduled_label}</dd></div>
            <div><dt>Cancellation Record</dt><dd>{detail.cancelled_label}</dd></div>
          </dl>
        </section>

        <div className="organization-event-buttons">
          {unpublished && detail.publishable ? <button type="button" className="organization-event-gold is-large" onClick={onPublish} disabled={saving || !captionValue.trim()}><EventsIcon name="upload" size={16} />{saving ? 'Publishing\u2026' : 'Publish Event'}</button> : null}
          {showAttendance ? <Link className="organization-event-gold is-large" to={`/student-organization/events/${encodeURIComponent(detail.event_id)}/attendance`}><EventsIcon name="attendance" size={16} />Manage Attendance</Link> : null}
          {unpublished ? null : detail.archivable
            ? <button type="button" className="organization-event-archive" onClick={() => { setArchiveError(''); setDialogOpen(true) }}><EventsIcon name="archive" size={16} />Archive Event</button>
            : <button type="button" className="organization-event-archive is-disabled" aria-disabled="true" aria-describedby="event-archive-hint"><EventsIcon name="archive" size={16} />Archive Event</button>}
          <span id="event-archive-hint" className="organization-events-sr">{archiveHint}</span>
        </div>
      </div>
    </div>
    {dialogOpen && detail.archivable ? <ArchiveEventDialog detail={detail} busy={archiving} error={archiveError} onConfirm={onConfirmArchive} onClose={() => setDialogOpen(false)} /> : null}
  </Shell>
}
