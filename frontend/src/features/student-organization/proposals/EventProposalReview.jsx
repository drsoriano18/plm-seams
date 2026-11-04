import ProposalIcon from './ProposalIcon'
import { formatProposalDateTime, formatSubmitted } from './proposalDates.js'
import { COLLEGES, ELIGIBILITY_COLLEGE, ELIGIBILITY_UNIVERSITY, MODALITIES, collegeLabel, venueSpec } from './proposalModel.js'
import { STATUS_APPROVED, STATUS_PENDING, statusBadge } from './proposalStatus.js'
import './Proposals.css'
import './ProposalReview.css'

const NOT_PROVIDED = 'Not Provided'
const SPONSORSHIP_NOTICE = 'Legal & Compliance Advisory: For event proposals involving merchandise sales, commercial sponsorships or the like, institutional policies mandate that official Memorandums of Agreement (MOA) and physical permits must be submitted face-to-face to the Office of Student Development and Services (OSDS) and the Physical Facilities Management Office (PFMO) at Gusaling Villegas prior to final resolution endorsement.'
const ELIGIBILITY_CHOICES = [
  { value: ELIGIBILITY_UNIVERSITY, title: 'University-Wide Eligibility', text: 'Open to all officially enrolled PLM undergraduate & postgraduate students.' },
  { value: ELIGIBILITY_COLLEGE, title: 'College-Specific Eligibility', text: 'Restricted strictly to pre-selected PLM academic colleges and departments.' },
]

const hasText = (value) => typeof value === 'string' && value.trim() !== ''

// Allowed colleges are stored as codes (one value today, possibly a comma list later).
function allowedColleges(value) {
  if (!hasText(value)) return []
  return value.split(',').map((code) => code.trim()).filter(Boolean).map((code) => (COLLEGES.some((item) => item.code === code) ? collegeLabel(code) : code))
}

function ReviewSection({ id, title, intro, children }) {
  return <section className="organization-proposal-card" aria-labelledby={id}>
    <header className="organization-proposal-card-head">
      <div><h2 id={id}>{title}</h2><p>{intro}</p></div>
    </header>
    {children}
  </section>
}

// One read-only label and value pair. text: long text that keeps its line breaks.
function Value({ label, children, text = false, full = false }) {
  return <div className={`organization-proposal-value ${full ? 'is-full' : ''}`.trim()}>
    <dt>{label}</dt>
    <dd className={text ? 'is-text' : undefined}>{children}</dd>
  </div>
}

function ChoiceList({ label, choices, selected }) {
  return <div className="organization-proposal-review-group">
    <h3>{label}</h3>
    <ul className={`organization-proposal-review-choices ${choices.length === 3 ? 'is-three' : 'is-two'}`}>
      {choices.map((choice) => {
        const on = choice.value === selected
        return <li key={choice.value} className={`organization-proposal-review-choice ${on ? 'is-selected' : ''}`.trim()} aria-current={on ? 'true' : undefined}>
          <span className="organization-proposal-choice-title">{choice.title}{choice.tag ? <em>{choice.tag}</em> : null}</span>
          <span className="organization-proposal-choice-text">{choice.text}</span>
          {on ? <span className="organization-proposal-review-selected"><ProposalIcon name="check" size={14} />Selected</span> : null}
        </li>
      })}
    </ul>
  </div>
}

function Reservation({ title, schedule, online = false, missingText = '' }) {
  if (!schedule) {
    return <div className="organization-proposal-venue" role="group" aria-label={title}>
      <div className="organization-proposal-venue-head"><h3>{title}</h3></div>
      <p className="organization-proposal-review-empty">{missingText}</p>
    </div>
  }
  const venue = schedule.venue ?? null
  const spec = venueSpec(venue)
  return <div className="organization-proposal-venue" role="group" aria-label={title}>
    <div className="organization-proposal-venue-head"><h3>{online ? 'Event Schedule' : title}</h3></div>
    <dl className="organization-proposal-review-grid">
      {online ? null : <>
        <Value label="Venue Name" full>{venue?.venue_name || 'N/A'}</Value>
        <Value label="Building">{spec.building || 'N/A'}</Value>
        <Value label="Floor Number">{spec.floor || 'N/A'}</Value>
        <Value label="Room Number">{spec.room || 'N/A'}</Value>
        <Value label="Max Capacity">{spec.capacity || 'N/A'}</Value>
        <Value label="Available Equipment" full text>{spec.equipment || 'N/A'}</Value>
      </>}
      <Value label="Reservation Commencement (Starts At)">{schedule.starts_at ? formatProposalDateTime(schedule.starts_at) : 'N/A'}</Value>
      <Value label="Reservation Conclusion (Ends At)">{schedule.ends_at ? formatProposalDateTime(schedule.ends_at) : 'N/A'}</Value>
    </dl>
  </div>
}

// Read-only mirror of a submitted proposal (Figma 621:30).
// proposal: normalizeDetail output. linkedEvent: { event_status } or null.
export default function EventProposalReview({ proposal, linkedEvent = null }) {
  const badge = statusBadge(proposal.approval_status)
  const organization = proposal.organization
  const review = proposal.latest_review
  const eventType = proposal.event_type
  const online = eventType?.modality === 'Online'
  const university = proposal.eligibility_mode !== ELIGIBILITY_COLLEGE
  const colleges = university ? [] : allowedColleges(proposal.allowed_college)
  const completed = proposal.approval_status === STATUS_APPROVED && linkedEvent?.event_status === 'Completed'
  const modalityChoices = MODALITIES.map((item) => ({ ...item, tag: item.value }))

  return <>
    <header className="organization-proposal-head">
      <div className="organization-proposal-review-title">
        <h1 id="organization-proposal-title" tabIndex={-1}>Event Proposal Review</h1>
        <span className={`organization-proposal-badge is-${badge.tone}`}>{badge.label}</span>
        {completed ? <span className="organization-proposal-badge is-completed">Event Completed</span> : null}
      </div>
      <p className="organization-proposal-subtitle">
        {proposal.proposal_id}
        {organization?.org_name ? <> &nbsp;|&nbsp; Submitted By: {organization.org_name} (Leading Organization)</> : null}
        {proposal.submission_date ? <> &nbsp;|&nbsp; Submitted {formatSubmitted(proposal.submission_date)}</> : null}
      </p>
    </header>

    {proposal.approval_status === STATUS_PENDING ? <aside className="organization-proposal-banner is-draft" aria-label="Proposal status">
      <ProposalIcon name="info" size={18} /><div><strong>Pending Review</strong><p>Submitted for evaluation. This proposal can no longer be edited.</p></div>
    </aside> : null}

    <ReviewSection id="review-section-general" title="General Event Information & Concept" intro="Articulate core institutional outcomes, measurable objectives, and participant boundaries.">
      <dl className="organization-proposal-review-grid">
        <Value label="Full Official Event Title" full>{proposal.event_name || NOT_PROVIDED}</Value>
        <Value label="Academic & Organizational Objectives" full text>{proposal.objectives || NOT_PROVIDED}</Value>
        <Value label="Comprehensive Event Scope & Description" full text>{proposal.description || NOT_PROVIDED}</Value>
        <Value label="Expected Count of Attendees">{proposal.expected_count_attendees == null ? NOT_PROVIDED : <>{proposal.expected_count_attendees} <span className="organization-proposal-review-unit">PAX</span></>}</Value>
      </dl>
      <ChoiceList label="Audience Eligibility Scope" choices={ELIGIBILITY_CHOICES} selected={university ? ELIGIBILITY_UNIVERSITY : ELIGIBILITY_COLLEGE} />
      {university ? null : <div className="organization-proposal-review-group">
        <h3>Allowed Colleges & Faculties</h3>
        {colleges.length
          ? <ul className="organization-proposal-review-tags">{colleges.map((label) => <li key={label}>{label}</li>)}</ul>
          : <p className="organization-proposal-review-empty">{NOT_PROVIDED}</p>}
        <p className="organization-proposal-help">Students holding non-qualifying collegiate student IDs will be denied event registration.</p>
      </div>}
      <dl className="organization-proposal-review-grid">
        <Value label="Co-Presenting Student Organizations" full text>{proposal.collaborating_organization_text || 'None'}</Value>
      </dl>
    </ReviewSection>

    <ReviewSection id="review-section-type" title="Event Type & Modality Structure" intro="Logistical execution format and physical university infrastructure reservation.">
      <dl className="organization-proposal-review-grid">
        <Value label="Event Type Classification" full>{eventType?.description || NOT_PROVIDED}</Value>
      </dl>
      <ChoiceList label="Event Modality" choices={modalityChoices} selected={eventType?.modality} />
      <Reservation title="Venue Booking Specification" schedule={proposal.primary_schedule} online={online} missingText="No primary reservation was recorded." />
      {online ? null : <Reservation title="Backup Venue Booking Specification" schedule={proposal.backup_schedule} missingText="No backup venue was reserved." />}
    </ReviewSection>

    <ReviewSection id="review-section-budget" title="Budget & Resource Requirements" intro="PFMO equipment reservation, custodial service requisitions, and fiscal allocation.">
      <dl className="organization-proposal-review-grid">
        <Value label="Resource Requirement" full text>{proposal.resource_requirements || NOT_PROVIDED}</Value>
        <Value label="Budget Information" full text>{proposal.budget_information || NOT_PROVIDED}</Value>
      </dl>
      <div className="organization-proposal-review-sponsorship">
        <span className={`organization-proposal-review-box ${proposal.includes_sponsorship ? 'is-checked' : ''}`.trim()} aria-hidden="true">{proposal.includes_sponsorship ? <ProposalIcon name="check" size={14} /> : null}</span>
        <div>
          <strong>Event Includes External Commercial or Institutional Sponsorship</strong>
          <p className="organization-proposal-help">Financial grants, branded booth collaterals, freebies, or corporate marketing.</p>
          <p className="organization-proposal-review-answer">{proposal.includes_sponsorship ? 'Yes, this event includes sponsorship or merchandise sales.' : 'No, this event does not include sponsorship or merchandise sales.'}</p>
        </div>
      </div>
      {proposal.includes_sponsorship ? <div className="organization-proposal-advisory" role="note">
        <ProposalIcon name="alert-circle" size={18} />
        <div>
          <p className="organization-proposal-advisory-title">Legal & Statutory Compliance Advisory</p>
          <strong>MOA & Physical Legal Clearance Required</strong>
          <p>{SPONSORSHIP_NOTICE}</p>
        </div>
      </div> : null}
    </ReviewSection>

    <ReviewSection id="review-section-remarks" title="Admin Remarks" intro="The latest decision and remarks from the Office of Student Development and Services.">
      {review ? <dl className="organization-proposal-review-grid">
        <Value label="Decision">{review.review_decision || NOT_PROVIDED}</Value>
        <Value label="Reviewed">{review.reviewed_at ? formatSubmitted(review.reviewed_at) : NOT_PROVIDED}</Value>
        <Value label="Remarks" full text>{hasText(review.admin_remarks) ? review.admin_remarks : 'No remarks were provided.'}</Value>
      </dl> : <p className="organization-proposal-review-empty">No Review Yet</p>}
    </ReviewSection>
  </>
}
