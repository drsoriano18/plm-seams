import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../../auth/authContext'
import { supabase } from '../../../lib/supabase'
import { detailPath } from '../archives/archiveModel.js'
import { DASHBOARD_PATH } from '../events/eventState.js'
import EventProposalReview from './EventProposalReview'
import ProposalFormPage from './ProposalFormPage'
import ProposalShell, { ProposalBreadcrumb } from './ProposalShell'
import { fetchEventTypes, fetchLinkedEvent, fetchProposalDetail, fetchProposalVenues } from './proposalApi.js'
import { STATUS_DRAFT, isEditableStatus } from './proposalStatus.js'

const NOT_CONNECTED = 'The portal isn’t connected right now. Please try again later.'
const GENERIC_ERROR = 'The proposal could not be loaded. Please try again.'
const ARCHIVED_STATUSES = ['Completed', 'Cancelled']
const noop = () => {}

// Drafts and proposals returned for revision are editable. Everything else is a read-only review.
async function loadProposal(orgId, proposalId) {
  if (!supabase) throw new Error(NOT_CONNECTED)
  // Event types and venues are only needed for editing, so start them now and wait for them later.
  const typesRequest = fetchEventTypes(supabase)
  const venuesRequest = fetchProposalVenues(supabase)
  typesRequest.catch(noop)
  venuesRequest.catch(noop)
  const [proposal, linkedEvent] = await Promise.all([
    fetchProposalDetail(supabase, orgId, proposalId),
    fetchLinkedEvent(supabase, orgId, proposalId).catch(() => null),
  ])
  if (!proposal) return { proposal: null, linkedEvent: null, eventTypes: [], venues: [] }
  if (!isEditableStatus(proposal.approval_status)) return { proposal, linkedEvent, eventTypes: [], venues: [] }
  const [eventTypes, venues] = await Promise.all([typesRequest, venuesRequest])
  return { proposal, linkedEvent, eventTypes, venues }
}

// Route page for /student-organization/proposals/:proposalId.
export default function ProposalDetailPage() {
  const { proposalId } = useParams()
  const { profile } = useAuth()
  const orgId = profile.user_id
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState({ key: '', error: '', data: null })
  const loadKey = `${proposalId}|${reloadKey}`

  useEffect(() => {
    let active = true
    loadProposal(orgId, proposalId)
      .then((data) => { if (active) setState({ key: loadKey, error: '', data }) })
      .catch((error) => { if (active) setState({ key: loadKey, error: error?.message || GENERIC_ERROR, data: null }) })
    return () => { active = false }
  }, [orgId, proposalId, loadKey])

  const loading = state.key !== loadKey
  const data = loading ? null : state.data
  const proposal = data?.proposal ?? null
  const linkedEvent = data?.linkedEvent ?? null

  if (loading) {
    return <ProposalShell active="events">
      <ProposalBreadcrumb to={DASHBOARD_PATH} backLabel="Events" />
      <p id="organization-proposal-title" className="organization-proposal-state" role="status">Loading the proposal…</p>
    </ProposalShell>
  }

  if (state.error) {
    return <ProposalShell active="events">
      <ProposalBreadcrumb to={DASHBOARD_PATH} backLabel="Events" />
      <div className="organization-proposal-state is-error">
        <p id="organization-proposal-title" tabIndex={-1} role="alert">{state.error}</p>
        <button type="button" className="organization-proposal-secondary" onClick={() => setReloadKey((key) => key + 1)}>Try Again</button>
      </div>
    </ProposalShell>
  }

  if (!proposal) {
    return <ProposalShell active="events">
      <ProposalBreadcrumb to={DASHBOARD_PATH} backLabel="Events" />
      <div className="organization-proposal-state">
        <h1 id="organization-proposal-title" tabIndex={-1}>Proposal Not Found</h1>
        <p>This proposal doesn’t exist, or it doesn’t belong to your organization.</p>
        <Link className="organization-proposal-secondary" to={DASHBOARD_PATH}>Back to Events</Link>
      </div>
    </ProposalShell>
  }

  if (isEditableStatus(proposal.approval_status)) {
    return <ProposalShell active="events">
      <ProposalBreadcrumb to={DASHBOARD_PATH} backLabel="Events" current={proposal.event_name || 'Event Proposal'} />
      <ProposalFormPage key={proposal.proposal_id} mode={proposal.approval_status === STATUS_DRAFT ? 'draft' : 'revision'} proposal={proposal} eventTypes={data.eventTypes} venues={data.venues} />
    </ProposalShell>
  }

  const archived = !!linkedEvent?.archived_at && ARCHIVED_STATUSES.includes(linkedEvent.event_status)
  return <ProposalShell active={archived ? 'archives' : 'events'}>
    {archived
      ? <ProposalBreadcrumb to={detailPath(linkedEvent.event_id)} backLabel={proposal.event_name || 'Archived Event'} />
      : <ProposalBreadcrumb to={DASHBOARD_PATH} backLabel="Events" />}
    <EventProposalReview proposal={proposal} linkedEvent={linkedEvent} />
  </ProposalShell>
}
