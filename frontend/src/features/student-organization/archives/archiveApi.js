// Read-only Supabase queries for the Archives pages. Callers pass the client in.
import { ARCHIVED_STATUSES } from './archiveModel.js'

const LIST_COLUMNS = 'event_id, org_id, starts_at, ends_at, event_status, archived_at, completed_at, cancelled_at, proposal_id, post_caption, event_proposal(event_name), student_organization(org_name, acronym)'
const DETAIL_COLUMNS = 'event_id, org_id, starts_at, ends_at, event_status, archived_at, registration_status, proposal_id, post_caption, event_proposal(proposal_id, event_name, description, objectives, approval_status), event_type(modality, description, requires_venue), student_organization(org_name, acronym), venue_booking(booking_status, venue(venue_name, building, floor_number, room_number))'

export async function fetchOrganization(client, orgId) {
  const { data, error } = await client.from('student_organization').select('org_id, org_name, acronym').eq('org_id', orgId).maybeSingle()
  return error ? null : data
}

export async function fetchArchivedEvents(client, orgId) {
  const { data, error } = await client
    .from('event')
    .select(LIST_COLUMNS)
    .eq('org_id', orgId)
    .not('archived_at', 'is', null)
    .in('event_status', ARCHIVED_STATUSES)
    .order('archived_at', { ascending: false })
  if (error) throw new Error('Archived events could not be loaded. Please try again.')
  return data ?? []
}

export async function fetchArchivedEvent(client, orgId, eventId) {
  const { data, error } = await client
    .from('event')
    .select(DETAIL_COLUMNS)
    .eq('event_id', eventId)
    .eq('org_id', orgId)
    .not('archived_at', 'is', null)
    .in('event_status', ARCHIVED_STATUSES)
    .maybeSingle()
  if (error) throw new Error('This archived event could not be loaded. Please try again.')
  return data ?? null
}

// Head counts never throw; a failed count is returned as null.
export async function fetchRecordCounts(client, eventId) {
  const base = () => client.from('registration').select('reg_id', { count: 'exact', head: true }).eq('event_id', eventId).eq('reg_status', 'Confirmed')
  const settle = (result) => (result.error || typeof result.count !== 'number' ? null : result.count)
  try {
    const [registrations, attended] = await Promise.all([base(), base().eq('attendance_status', 'Present')])
    return { registrations: settle(registrations), attended: settle(attended) }
  } catch {
    return { registrations: null, attended: null }
  }
}
