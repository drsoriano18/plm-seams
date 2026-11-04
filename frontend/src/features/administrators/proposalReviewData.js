export const proposalReviewDecisions = Object.freeze(['Approved', 'Revisions Required', 'Rejected'])

export function validateReviewDecision(decision, remarks) {
  if (!proposalReviewDecisions.includes(decision)) return 'Choose a valid review decision.'
  if (decision !== 'Approved' && !remarks.trim()) return 'Enter admin remarks before returning or rejecting this proposal.'
  if (remarks.trim().length > 2000) return 'Admin remarks must be 2000 characters or fewer.'
  return null
}

export function latestReview(proposal) {
  return (proposal.reviews || []).toSorted((a, b) => Date.parse(b.reviewed_at) - Date.parse(a.reviewed_at))[0]
}

export async function loadProposalReview(client, proposalId) {
  const { data, error } = await client.from('event_proposal')
    .select('*,organization:student_organization(org_name),event_type:event_type(description,modality,requires_venue),schedules:proposal_schedule(schedule_id,schedule_type,starts_at,ends_at,venue:venue(venue_id,venue_name,building,floor_number,room_number,max_capacity,available_equipment)),reviews:proposal_review(review_id,review_decision,admin_remarks,reviewed_at),events:event(event_id,publication_status,bookings:venue_booking(venue_id,booking_status))')
    .eq('proposal_id', proposalId).maybeSingle()
  if (error) throw new Error('Unable to load the proposal. Please try again.')
  if (!data) throw new Error('This proposal was not found or is unavailable to your account.')
  // The unique event.proposal_id makes this reverse relationship one-to-one in PostgREST.
  return { ...data, events: Array.isArray(data.events) ? data.events : data.events ? [data.events] : [] }
}

export async function saveProposalReview(client, proposalId, decision, remarks) {
  const validationError = validateReviewDecision(decision, remarks)
  if (validationError) throw new Error(validationError)
  const { error } = await client.rpc('review_proposal', { pid: proposalId, decision, remarks: remarks.trim() || null })
  if (error) {
    const failure = new Error(error.code === '23P01'
      ? 'The primary venue is already booked for this time. Return the proposal for revisions.'
      : error.message || 'Unable to save the decision. Please try again.')
    failure.code = error.code
    throw failure
  }
}
