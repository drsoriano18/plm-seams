import { useId } from 'react'
import { isResubmitted, relativeTime } from './adminDashboardData'
import arrowIcon from './assets/arrow.svg'
import dateIcon from './assets/date.svg'
import pinIcon from './assets/pin.svg'
import actionIcon from './assets/action-required.svg'
import manageIcon from './assets/manage.svg'
import resubmittedIcon from './assets/resubmitted.svg'

const adminTimeZone = 'Asia/Manila'
const dateFormatter = new Intl.DateTimeFormat('en-US', { timeZone: adminTimeZone, month: 'short', day: '2-digit', year: 'numeric' })
const Icon = ({ src }) => <img className="admin-icon" src={src} alt="" aria-hidden="true" />

function ProposalCard({ proposal, now, onReview }) {
  const resubmitted = isResubmitted(proposal)
  const statusLabel = proposal.approval_status === 'Pending' ? (resubmitted ? 'Resubmitted' : 'Action Required') : proposal.approval_status
  const schedules = (proposal.schedules || []).toSorted((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
  const primary = schedules.find(schedule => schedule.schedule_type === 'Primary') || schedules[0]
  const titleId = useId()
  return <article className="admin-proposal-card" aria-labelledby={titleId}>
    <div className={`admin-proposal-symbol ${resubmitted ? 'is-resubmitted' : ''}`}><Icon src={resubmitted ? resubmittedIcon : actionIcon} /></div>
    <div className="admin-proposal-copy">
      <div className="admin-proposal-meta"><span className={`admin-proposal-badge ${resubmitted ? 'is-resubmitted' : `is-${proposal.approval_status.toLowerCase().replaceAll(' ', '-')}`}`}>{statusLabel}</span><span className="admin-proposal-id">{proposal.proposal_id}</span></div>
      <h3 id={titleId}>{proposal.event_name}</h3>
      <p className="admin-organization-name">{proposal.organization?.org_name || 'Student Organization'}</p>
      <div className="admin-proposal-details">
        <span><Icon src={dateIcon} />{primary ? <time dateTime={primary.starts_at}>{dateFormatter.format(new Date(primary.starts_at))}</time> : 'Schedule to be confirmed'}</span>
        <span><Icon src={pinIcon} />{primary?.venue?.venue_name || 'Venue to be confirmed'}</span>
      </div>
    </div>
    <div className="admin-proposal-actions"><button className="admin-review-button" type="button" onClick={() => onReview(proposal)} aria-label={`View ${proposal.event_name}`}>View</button><time dateTime={proposal.submission_date}>Submitted {relativeTime(proposal.submission_date, now)}</time></div>
  </article>
}

export default function AdminProposalQueue({ proposals, loading, error, now, onReviewAll, onRetry, onReview }) {
  const proposalListId = useId()
  const visibleProposals = proposals.slice(0, 4)
  return <section className="admin-proposals" aria-labelledby="admin-proposals-heading">
    <div className="admin-section-heading">
      <h2 id="admin-proposals-heading">Events Proposals</h2>
      <button className="admin-review-all" type="button" aria-controls={proposalListId} disabled={loading || !!error} onClick={onReviewAll}>
        {`Review All (${proposals.length})`}<Icon src={arrowIcon} />
      </button>
    </div>
    <div id={proposalListId} className="admin-proposal-list" aria-busy={loading}>
      {loading ? <div className="admin-empty-state" role="status">Loading event proposals…</div> : error ? <div className="admin-empty-state" role="alert"><h3>Proposals unavailable</h3><p>{error}</p><button type="button" onClick={onRetry}>Try again</button></div> : proposals.length ? visibleProposals.map(proposal => <ProposalCard key={proposal.proposal_id} proposal={proposal} now={now} onReview={onReview} />) : <div className="admin-empty-state"><span className="admin-empty-symbol"><Icon src={manageIcon} /></span><h3>No proposals need your review</h3><p>New submissions and resubmitted proposals will appear here when they’re ready for admin action.</p></div>}
    </div>
    <p className="admin-sr-only" role="status">{!loading && !error ? `Showing ${visibleProposals.length} of ${proposals.length} proposals needing admin action.` : ''}</p>
  </section>
}
