import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../../auth/authContext'
import { supabase } from '../../../lib/supabase'
import OrganizationHeader from '../components/OrganizationHeader'
import OrganizationFooter from '../components/OrganizationFooter'
import ArchiveIcon from './ArchiveIcon'
import { fetchArchivedEvent, fetchRecordCounts } from './archiveApi.js'
import { ARCHIVES_PATH, NO_VENUE_NOTE, VENUE_HEADING, attendedLabel, orgLabel, orgShortName, recordsLabel, registrationsLabel, toArchivedDetail } from './archiveModel.js'
import '../OrganizationDashboard.css'
import './Archives.css'
import './ArchiveDetails.css'

function Shell({ children, skipTarget }) {
  return <main className="organization-portal-page organization-archive-page organization-archive-detail-page">
    <OrganizationHeader active="archives" skipTarget={skipTarget} />
    <div className="organization-main">{children}</div>
    <OrganizationFooter />
  </main>
}

function Field({ label, value }) {
  return <div className="organization-archive-tile"><dt>{label}</dt><dd>{value}</dd></div>
}

function RecordCard({ icon, title, value, note, text, to, action }) {
  return <article className="organization-archive-record">
    <span className="organization-archive-record-icon"><ArchiveIcon name={icon} size={18} /></span>
    <h3>{title}</h3>
    <p className="organization-archive-record-value">{value}</p>
    {note ? <p className="organization-archive-record-note">{note}</p> : null}
    <p className="organization-archive-record-text">{text}</p>
    {to ? <Link className="organization-archive-record-button" to={to}>{action}</Link> : <span className="organization-archive-record-button is-disabled" aria-disabled="true">{action}</span>}
  </article>
}

export default function ArchivedEventDetails() {
  const { eventId } = useParams()
  const { profile } = useAuth()
  const orgId = profile.user_id
  const [state, setState] = useState({ key: null, error: '', row: null, counts: null })

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const row = await fetchArchivedEvent(supabase, orgId, eventId)
        const counts = row ? await fetchRecordCounts(supabase, row.event_id) : null
        if (active) setState({ key: eventId, error: '', row, counts })
      } catch (error) {
        if (active) setState({ key: eventId, error: error.message, row: null, counts: null })
      }
    }
    load()
    return () => { active = false }
  }, [orgId, eventId])

  if (state.key !== eventId) return <Shell skipTarget="organization-archive-state"><div className="organization-archive-detail-content"><p id="organization-archive-state" className="organization-loading" role="status">Loading archived event…</p></div></Shell>
  if (state.error) return <Shell skipTarget="organization-archive-state"><div className="organization-archive-detail-content"><p id="organization-archive-state" className="organization-inline-error" role="alert">{state.error}</p><Link className="organization-archive-back" to={ARCHIVES_PATH}>Back to Archive Events</Link></div></Shell>
  if (!state.row) return <Shell skipTarget="organization-archive-state"><div className="organization-archive-detail-content">
    <div className="organization-archive-empty">
      <span className="organization-archive-empty-icon"><ArchiveIcon name="archive" size={22} /></span>
      <h1 id="organization-archive-state" tabIndex={-1}>Archived event not found</h1>
      <p>This event does not exist, is not archived, or is not led by your organization.</p>
      <Link className="organization-archive-back" to={ARCHIVES_PATH}>Back to Archive Events</Link>
    </div>
  </div></Shell>

  const detail = toArchivedDetail(state.row)
  const { venue, counts } = { venue: detail.venue, counts: state.counts }
  const proposalPath = detail.proposal_id ? `/student-organization/proposals/${encodeURIComponent(detail.proposal_id)}` : null
  const base = `${ARCHIVES_PATH}/${encodeURIComponent(detail.event_id)}`
  const unavailable = 'Count could not be loaded.'

  return <Shell skipTarget="organization-archive-event-title">
    <div className="organization-archive-detail-content">
      <nav className="organization-archive-breadcrumb" aria-label="Breadcrumb"><ol>
        <li><Link to={ARCHIVES_PATH}>Archive Events</Link></li>
        <li aria-hidden="true"><ArchiveIcon name="arrow-left" size={14} /></li>
        <li><span aria-current="page">{detail.title}</span></li>
      </ol></nav>
      <p className="organization-archive-access">Lead Organization Access • {orgShortName(detail.org) || 'N/A'}</p>

      <div className="organization-archive-banner">
        <span className="organization-archive-banner-icon"><ArchiveIcon name="archive" size={18} /></span>
        <div>
          <strong>Date Archived: {detail.archived_date_label}</strong>
          <p>Hidden from the default event list. Original event information and associated records are preserved.</p>
        </div>
        <span className="organization-archive-banner-label">Historical Record</span>
      </div>

      <div className="organization-archive-detail-grid">
        <aside className="organization-archive-side">
          <section className="organization-archive-card" aria-labelledby="archive-record-heading">
            <div className="organization-archive-card-head">
              <h2 id="archive-record-heading">Event Record</h2>
              <span className={`organization-archive-status is-${String(detail.status).toLowerCase()}`}>{detail.status}</span>
            </div>
            <dl className="organization-archive-tiles">
              <Field label="Original Event ID" value={detail.event_id} />
              <Field label="Lead Organization" value={detail.lead_org || 'N/A'} />
              <Field label="Associated Proposal" value={detail.proposal_id || 'N/A'} />
              <Field label="Visibility" value="Available in Archived Events" />
            </dl>
          </section>
          <section className="organization-archive-card" aria-labelledby="archive-venue-heading">
            <div className="organization-archive-card-head">
              <h2 id="archive-venue-heading"><ArchiveIcon name="pin" size={16} /> {VENUE_HEADING}</h2>
            </div>
            <dl className="organization-archive-venue">
              <div><dt>Venue Name</dt><dd>{venue.venueName}</dd></div>
              <div><dt>Building</dt><dd>{venue.building}</dd></div>
              <div><dt>Floor Level</dt><dd>{venue.floor}</dd></div>
              <div><dt>Room Number</dt><dd>{venue.room}</dd></div>
              <div><dt>Modality</dt><dd><span className="organization-archive-modality-badge">{venue.modality}</span></dd></div>
            </dl>
            {detail.has_venue ? null : <p className="organization-archive-venue-note">{NO_VENUE_NOTE}</p>}
          </section>
        </aside>

        <div className="organization-archive-main">
          <header className="organization-archive-title">
            <p className="organization-archive-org">{orgLabel(detail.org)}</p>
            <h1 id="organization-archive-event-title">{detail.title}</h1>
            <p className="organization-archive-subline">{detail.subline}</p>
          </header>
          <div className="organization-archive-times">
            <section className="organization-archive-card organization-archive-time"><h2>Starts</h2><p className="organization-archive-time-date">{detail.starts_date || 'N/A'}</p><p>{detail.starts_time}</p></section>
            <section className="organization-archive-card organization-archive-time"><h2>Concludes</h2><p className="organization-archive-time-date">{detail.ends_date || 'N/A'}</p><p>{detail.ends_time}</p></section>
          </div>
          <section className="organization-archive-card organization-archive-info" aria-labelledby="archive-info-heading">
            <h2 id="archive-info-heading">Event Information</h2>
            <p>{detail.description || 'No description was provided.'}</p>
            {detail.objectives ? <p className="organization-archive-objectives">Objectives: {detail.objectives}</p> : null}
          </section>
        </div>
      </div>

      <section className="organization-archive-records" aria-labelledby="archive-records-heading">
        <div className="organization-archive-records-head">
          <h2 id="archive-records-heading">Associated Records</h2>
          <span>{recordsLabel(detail.org)}</span>
        </div>
        <div className="organization-archive-records-grid">
          <RecordCard icon="file" title="Event Proposal" value={detail.proposal_id || 'N/A'} text="Approved proposal and supporting documents. Original proposal relationship retained." to={proposalPath} action="View Proposal" />
          <RecordCard icon="users" title="Registrations & Attendance" value={`${registrationsLabel(counts?.registrations ?? null)} \u2022 ${attendedLabel(counts?.attended ?? null)}`} note={counts?.registrations == null || counts?.attended == null ? unavailable : null} text="Concluded registration roster. Original participant records remain available. Preserved attendance log for this event. Historical records, not live check-in." to={`${base}/registrations`} action="View Registrations & Attendees" />
        </div>
      </section>
    </div>
  </Shell>
}
