import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { DASHBOARD_PATH } from '../events/eventState.js'
import ProposalFormPage from './ProposalFormPage'
import ProposalShell, { ProposalBreadcrumb } from './ProposalShell'
import { fetchEventTypes, fetchProposalVenues } from './proposalApi.js'

const NOT_CONNECTED = 'The portal isn’t connected right now. Please try again later.'

// Route page for /student-organization/proposals/create.
export default function CreateEventProposal() {
  const [state, setState] = useState({ loading: true, error: '', eventTypes: [], venues: [] })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    async function load() {
      if (!supabase) { setState({ loading: false, error: NOT_CONNECTED, eventTypes: [], venues: [] }); return }
      try {
        const [eventTypes, venues] = await Promise.all([fetchEventTypes(supabase), fetchProposalVenues(supabase)])
        if (active) setState({ loading: false, error: '', eventTypes, venues })
      } catch (error) {
        if (active) setState({ loading: false, error: error.message, eventTypes: [], venues: [] })
      }
    }
    load()
    return () => { active = false }
  }, [reloadKey])

  let content
  if (state.loading) content = <p id="organization-proposal-title" className="organization-proposal-state" role="status">Loading the proposal form…</p>
  else if (state.error) content = <div className="organization-proposal-state is-error">
    <p id="organization-proposal-title" tabIndex={-1} role="alert">{state.error}</p>
    <button type="button" className="organization-proposal-secondary" onClick={() => { setState({ loading: true, error: '', eventTypes: [], venues: [] }); setReloadKey((key) => key + 1) }}>Try Again</button>
  </div>
  else content = <ProposalFormPage mode="create" eventTypes={state.eventTypes} venues={state.venues} />

  return <ProposalShell active="events">
    <ProposalBreadcrumb to={DASHBOARD_PATH} backLabel="Events" current="Create Event Proposal" />
    {content}
  </ProposalShell>
}
