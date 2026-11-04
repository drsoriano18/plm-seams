import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import AdminShell from './AdminShell'
import { supabase } from '../../lib/supabase'
import { adminTimeZone } from './adminDashboardData'
import { latestReview, loadProposalReview, saveProposalReview, validateReviewDecision } from './proposalReviewData'
import backIcon from './assets/review/back.svg'
import classificationIcon from './assets/review/classification-chevron.svg'
import campusIcon from './assets/review/campus.svg'
import onlineIcon from './assets/review/online.svg'
import hybridIcon from './assets/review/hybrid.svg'
import venueIcon from './assets/review/venue.svg'
import startIcon from './assets/review/starts-at.svg'
import endIcon from './assets/review/ends-at.svg'
import clearanceIcon from './assets/review/clearance.svg'
import returnIcon from './assets/review/return.svg'
import rejectIcon from './assets/review/reject.svg'
import './ProposalReview.css'

const Icon = ({ src }) => <img className="admin-icon" src={src} alt="" aria-hidden="true" />
const dateFormatter = new Intl.DateTimeFormat('en-US', { timeZone: adminTimeZone, month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const notProvided = value => value === null || value === undefined || value === '' ? 'Not provided' : value

function ReadOnlyField({ label, value, required, suffix, icon, className = '' }) {
  const id = useId()
  return <div className={`proposal-field ${className}`}>
    <span id={id} className="proposal-field-label">{label}{required && <span aria-hidden="true"> *</span>}</span>
    <div className={`proposal-readonly ${icon ? 'has-icon' : ''}`} role="textbox" aria-readonly="true" aria-labelledby={id} tabIndex={0}>
      {icon && <Icon src={icon} />}<span>{notProvided(value)}</span>{suffix && <span className="proposal-field-suffix">{suffix}</span>}
    </div>
  </div>
}

function SectionHeading({ number, children }) {
  return <div className="proposal-section-heading"><span>{number}</span><h2>{children}</h2></div>
}

function VenueSpecification({ schedule, backup, reserved }) {
  const venue = schedule?.venue
  return <section className="proposal-venue-section" aria-label={backup ? 'Backup venue booking specification' : 'Venue booking specification'}>
    <div className="proposal-venue-heading"><h3><Icon src={venueIcon} />{backup ? 'Backup Venue Booking Specification' : 'Venue Booking Specification'}</h3><span>Calendar Slot Hold: {reserved ? 'Active' : 'Not Reserved'}</span></div>
    {schedule ? <div className="proposal-venue-grid">
      <ReadOnlyField label="Venue name" value={venue?.venue_name || 'No physical venue specified'} required />
      <ReadOnlyField label="Building" value={venue?.building} required />
      <ReadOnlyField label="Floor number" value={venue?.floor_number} required />
      <ReadOnlyField label="Room number" value={venue?.room_number} required />
      <ReadOnlyField label="Max capacity" value={venue?.max_capacity} required />
      <ReadOnlyField label="Available equipment" value={venue?.available_equipment} required />
      <ReadOnlyField label="Reservation commencement (starts at)" value={dateFormatter.format(new Date(schedule.starts_at))} icon={startIcon} required />
      <ReadOnlyField label="Reservation conclusion (ends at)" value={dateFormatter.format(new Date(schedule.ends_at))} icon={endIcon} required />
    </div> : <p className="proposal-no-schedule">{backup ? 'No backup schedule was submitted.' : 'No primary schedule was submitted.'}</p>}
  </section>
}

const decisionLabels = { Approved: 'Approve', 'Revisions Required': 'Return for Revisions', Rejected: 'Reject' }
function ConfirmDecision({ decision, proposal, remarks, busy, error, onCancel, onConfirm }) {
  const dialog = useRef(null)
  const headingId = useId()
  const bodyId = useId()
  useEffect(() => { const element = dialog.current; element.showModal(); return () => element.close() }, [])
  return <dialog ref={dialog} className="admin-placeholder-dialog proposal-confirm-dialog" aria-labelledby={headingId} aria-describedby={bodyId} onCancel={event => { event.preventDefault(); if (!busy) onCancel() }}>
    <h2 id={headingId}>{decisionLabels[decision]} proposal?</h2>
    <p className="proposal-confirm-name">{proposal.event_name}</p>
    <p id={bodyId}>{decision === 'Approved' ? 'This will create an unpublished event using the primary schedule. Its primary venue will be reserved, and the organization will be notified.' : decision === 'Rejected' ? 'This rejection is final. The organization will receive your remarks and must submit a new proposal to apply again.' : 'The organization will receive your remarks and can revise and resubmit this proposal.'}</p>
    {remarks.trim() && <blockquote><strong>Admin remarks</strong><p>{remarks.trim()}</p></blockquote>}
    {error && <p className="proposal-error" role="alert">{error}</p>}
    <div className="proposal-confirm-actions"><button type="button" className="proposal-cancel" disabled={busy} onClick={onCancel} autoFocus>Cancel</button><button type="button" className={`proposal-decision-button decision-${decision === 'Approved' ? 'approve' : decision === 'Rejected' ? 'reject' : 'return'}`} disabled={busy} onClick={onConfirm}>{busy ? 'Saving…' : `Confirm ${decisionLabels[decision]}`}</button></div>
  </dialog>
}

export default function ProposalReview() {
  const { proposalId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [proposal, setProposal] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [revision, setRevision] = useState(0)
  const [decision, setDecision] = useState(null)
  const [saving, setSaving] = useState(false)
  const [decisionError, setDecisionError] = useState('')
  const headingRef = useRef(null)
  const remarksRef = useRef(null)
  const submitting = useRef(false)
  useEffect(() => {
    let active = true
    async function load() {
      await Promise.resolve()
      if (!active) return
      setLoading(true); setError(''); setProposal(null); setNotice(''); setDecision(null)
      try {
        const data = await loadProposalReview(supabase, proposalId)
        if (active) { setProposal(data); setRemarks(data.approval_status === 'Pending' ? '' : latestReview(data)?.admin_remarks || '') }
      } catch (failure) { if (active) setError(failure.message) }
      finally { if (active) setLoading(false) }
    }
    load()
    window.scrollTo(0, 0)
    return () => { active = false }
  }, [proposalId, revision])
  const editable = proposal?.approval_status === 'Pending'
  function requestDecision(value) {
    const validation = validateReviewDecision(value, remarks)
    setError(''); setDecisionError('')
    if (validation) { setError(validation); remarksRef.current?.focus(); return }
    setDecision(value)
  }
  async function confirmDecision() {
    if (submitting.current) return
    submitting.current = true; setSaving(true); setDecisionError('')
    try {
      await saveProposalReview(supabase, proposal.proposal_id, decision, remarks)
      const savedDecision = decision
      setDecision(null)
      if (savedDecision === 'Approved') {
        setProposal(current => ({ ...current, approval_status: 'Approved' }))
        setNotice('Proposal approved. The organization has been notified and can publish its event from its dashboard.')
        window.scrollTo({ top: 0, behavior: 'instant' })
        window.requestAnimationFrame(() => headingRef.current?.focus())
        // Refresh the reservation details without undoing the successful saved status if the read fails.
        loadProposalReview(supabase, proposal.proposal_id).then(data => setProposal(current => current?.proposal_id === data.proposal_id ? data : current)).catch(() => {})
      } else {
        navigate('/admin/dashboard', { replace: true, state: { notice: savedDecision === 'Rejected' ? 'Proposal rejected. The organization has been notified.' : 'Proposal returned for revisions. The organization has been notified.' } })
      }
    } catch (failure) {
      if (failure.code === '40001') {
        try {
          const current = await loadProposalReview(supabase, proposal.proposal_id)
          if (current.approval_status !== 'Pending') { setProposal(current); setRemarks(latestReview(current)?.admin_remarks || ''); setDecision(null); setError(failure.message) }
          else setDecisionError(failure.message)
        } catch { setDecisionError(failure.message) }
      } else setDecisionError(failure.message)
    } finally { submitting.current = false; setSaving(false) }
  }
  const schedules = (proposal?.schedules || []).toSorted((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
  const primary = schedules.find(item => item.schedule_type === 'Primary')
  const backups = schedules.filter(item => item.schedule_type === 'Backup')
  const proposalsPath = location.state?.from === '/admin/proposals' ? '/admin/proposals' : '/admin/dashboard'
  const calendarOrigin = location.state?.from === '/admin/calendar/events'
  const archiveOrigin = location.state?.from === '/admin/archives'
  const reservedVenues = new Set((proposal?.events || []).flatMap(event => event.bookings || []).filter(booking => booking.booking_status === 'Confirmed').map(booking => booking.venue_id))
  const heading = `Event Proposal Review${proposal && proposal.approval_status !== 'Pending' ? ` - ${proposal.approval_status}` : ''}`
  const modalities = [
    ['On-Site', 'In-Person Campus', 'Full physical gathering within designated PLM campus grounds.', campusIcon],
    ['Online', 'Online / Virtual', 'Conducted via MS Teams, Zoom, or university streaming channels.', onlineIcon],
    ['Hybrid', 'Hybrid Modality', 'Simultaneous auditorium session broadcasted to virtual attendees.', hybridIcon],
  ]
  return <AdminShell mainClassName="proposal-review-main">
    <nav className="proposal-breadcrumb" aria-label="Breadcrumb">{archiveOrigin ? <><Link to="/admin/archives"><Icon src={backIcon} />Archived Events</Link><span aria-hidden="true">/</span><Link to={proposal?.events?.[0]?.event_id ? `/admin/archives/${encodeURIComponent(proposal.events[0].event_id)}` : '/admin/archives'}>{proposal?.event_name || location.state?.eventName || 'Event'}</Link><span aria-hidden="true">/</span><span aria-current="page">Event Proposal</span></> : calendarOrigin ? <><Link to="/admin/calendar"><Icon src={backIcon} />Calendar</Link><span aria-hidden="true">/</span><Link to="/admin/calendar/events">Manage Approved Events</Link><span aria-hidden="true">/</span><span aria-current="page">{proposal?.event_name || location.state?.eventName || 'Event'}</span></> : <><Link to={proposalsPath}><Icon src={backIcon} />Proposals</Link><span aria-hidden="true">/</span><span aria-current="page">Proposal Review</span></>}</nav>
    {loading ? <div className="proposal-load-state" role="status">Loading event proposal…</div> : !proposal ? <div className="proposal-load-state" role="alert"><h1>Proposal unavailable</h1><p>{error}</p><button type="button" onClick={() => setRevision(value => value + 1)}>Try again</button></div> : <>
      <header className="proposal-title-banner"><h1 ref={headingRef} tabIndex={-1}>{heading}</h1><p>{proposal.proposal_id}<span aria-hidden="true"> | | </span>Submitted By: {proposal.organization?.org_name || 'Student Organization'} (Leading Organization)</p></header>
      {notice && <p className="admin-success-message" role="status">{notice}</p>}
      <section className="proposal-review-section">
        <SectionHeading number="1">General Event Information &amp; Concept</SectionHeading>
        <ReadOnlyField label="Full official event title" value={proposal.event_name} required />
        <ReadOnlyField label="Academic & organizational objectives" value={proposal.objectives} required />
        <ReadOnlyField label="Comprehensive event scope & description" value={proposal.description} required className="proposal-description-field" />
        <ReadOnlyField label="Expected count of attendees" value={proposal.expected_count_attendees} suffix="PAX" required className="proposal-attendance-field" />
        <fieldset className="proposal-eligibility"><legend className="proposal-field-label">Audience eligibility scope <span aria-hidden="true">*</span></legend><div className="proposal-eligibility-options">{[['University-Wide', 'University-Wide Eligibility', 'Open to all officially enrolled PLM undergraduate & postgraduate students.'], ['College-Specific', 'College-Specific Eligibility', 'Restricted strictly to pre-selected PLM academic colleges and departments.'], ...(proposal.eligibility_mode === 'Program-Specific' ? [['Program-Specific', 'Program-Specific Eligibility', 'Restricted to the selected PLM degree programs.']] : [])].map(([value, label, description]) => <label className={proposal.eligibility_mode === value ? 'is-selected' : ''} key={value}><input type="radio" name="review-eligibility" checked={proposal.eligibility_mode === value} disabled /><span><strong>{label}</strong><span>{description}</span></span></label>)}</div></fieldset>
        {proposal.eligibility_mode === 'College-Specific' && <ReadOnlyField label="Allowed colleges & faculties" value={proposal.allowed_college} required />}
        {proposal.allowed_programs?.length > 0 && <ReadOnlyField label="Allowed programs" value={proposal.allowed_programs.join('\n')} />}
        <ReadOnlyField label="Co-presenting student organizations" value={proposal.collaborating_organization_text || 'None specified'} />
      </section>
      <section className="proposal-review-section">
        <SectionHeading number="2">Event Type &amp; Modality Structure</SectionHeading>
        <div className="proposal-classification"><span>Event Type Classification: <strong>{proposal.event_type?.description || 'Not provided'}</strong></span><Icon src={classificationIcon} /></div>
        <fieldset className="proposal-modality"><legend className="admin-sr-only">Submitted event modality</legend>{modalities.map(([value, title, description, icon]) => <label className={proposal.event_type?.modality === value ? 'is-selected' : ''} key={value}><span className="proposal-modality-top"><Icon src={icon} /><input type="radio" name="review-modality" checked={proposal.event_type?.modality === value} disabled /></span><strong>{title}</strong><span>{description}</span></label>)}</fieldset>
        <VenueSpecification schedule={primary} reserved={reservedVenues.has(primary?.venue?.venue_id)} />
        {backups.length ? backups.map(schedule => <VenueSpecification key={schedule.schedule_id} schedule={schedule} backup reserved={false} />) : <VenueSpecification backup reserved={false} />}
      </section>
      <section className="proposal-review-section">
        <SectionHeading number="3">Budget &amp; Resource Requirements</SectionHeading>
        <ReadOnlyField label="Resource requirement" value={proposal.resource_requirements} className="proposal-resources-field" />
        <ReadOnlyField label="Budget information" value={proposal.budget_information} className="proposal-budget-field" />
        <div className="proposal-sponsorship"><label><input type="checkbox" checked={proposal.includes_sponsorship} disabled /><span><strong>Event Includes External Commercial or Institutional Sponsorship</strong><span>Financial grants, branded booth collaterals, freebies, or corporate marketing.</span></span></label>{proposal.includes_sponsorship && <span className="proposal-clearance-badge"><Icon src={clearanceIcon} />MOA &amp; Physical Legal Clearance Required</span>}</div>
      </section>
      <section className="proposal-remarks-section" aria-labelledby="proposal-remarks-label"><label id="proposal-remarks-label" htmlFor="proposal-admin-remarks"><span aria-hidden="true" />Admin Remarks{editable && <span className="proposal-remarks-hint">Required for revisions or rejection</span>}</label><textarea ref={remarksRef} id="proposal-admin-remarks" value={remarks} onChange={event => setRemarks(event.target.value)} readOnly={!editable || saving} maxLength={2000} placeholder="Enter admin remarks for the student organization…" aria-describedby={error ? 'proposal-review-error' : undefined} /></section>
      {error && <p id="proposal-review-error" className="proposal-error" role="alert">{error}</p>}
      {editable && <div className="proposal-decision-bar"><button className="proposal-decision-button decision-approve" type="button" disabled={saving} onClick={() => requestDecision('Approved')}>Approve</button><button className="proposal-decision-button decision-return" type="button" disabled={saving} onClick={() => requestDecision('Revisions Required')}><Icon src={returnIcon} />Return for Revisions</button><button className="proposal-decision-button decision-reject" type="button" disabled={saving} onClick={() => requestDecision('Rejected')}><Icon src={rejectIcon} />Reject</button></div>}
      {decision && <ConfirmDecision decision={decision} proposal={proposal} remarks={remarks} busy={saving} error={decisionError} onCancel={() => setDecision(null)} onConfirm={confirmDecision} />}
    </>}
  </AdminShell>
}
