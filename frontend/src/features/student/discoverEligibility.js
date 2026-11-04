export function eligibilityLabel(event) {
  if (event.eligibility_mode === 'University-Wide') return 'Open to All'
  if (event.eligibility_mode === 'College-Specific') return event.eligible_college ? `${event.eligible_college} Only` : 'Eligible Colleges Only'
  if (event.eligibility_mode === 'Program-Specific') return 'Eligible Programs Only'
  return 'Restricted Eligibility'
}
export function isRestrictedEvent(event) {
  return ['College-Specific', 'Program-Specific'].includes(event.eligibility_mode)
}
