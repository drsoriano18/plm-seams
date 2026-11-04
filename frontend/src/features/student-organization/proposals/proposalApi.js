import { isFunctionMissing } from '../calendar/venueApi.js'
import { normalizeDetail } from './proposalModel.js'
import { STATUS_PENDING } from './proposalStatus.js'

// Every function takes the Supabase client first so tests can pass a fake.
// Fetchers throw a friendly Error. Writers return { ok, ... } and never fake success.

export const NOT_AVAILABLE_MESSAGE = 'This isn’t available yet. It will work once the backend enables it.'
export const SCHEDULE_NOTICE_MESSAGE = 'Every event schedule must start at least 15 days from today. Choose a later start.'
export const SCHEDULE_MISSING_MESSAGE = 'Add a primary event schedule before submitting.'

const GENERIC_MESSAGE = 'Something went wrong. Please try again.'

const DETAIL_SELECT = [
  'proposal_id', 'org_id', 'event_name', 'objectives', 'description', 'submission_date', 'approval_status',
  'expected_count_attendees', 'event_type_id', 'allowed_college', 'eligibility_mode', 'allowed_programs',
  'resource_requirements', 'budget_information', 'includes_sponsorship', 'collaborating_organization_text',
  'student_organization(org_id,org_name,acronym)',
  'event_type(event_type_id,description,modality,requires_venue)',
  'proposal_schedule(schedule_id,schedule_type,venue_id,starts_at,ends_at,venue(venue_id,venue_name,building,floor_number,room_number,max_capacity,available_equipment))',
  'proposal_review(review_id,review_decision,admin_remarks,reviewed_at)',
].join(',')

const VENUE_SELECT = 'venue_id, venue_name, building, floor_number, room_number, max_capacity, available_equipment'

// ---------- Errors ----------

// 'missing-function' | 'schedule-notice' | 'schedule-missing' | 'required' | 'permission' | 'invalid' | 'generic'
export function errorKind(error) {
  if (!error) return 'generic'
  if (isFunctionMissing(error)) return 'missing-function'
  const message = String(error.message || '')
  if (error.code === '23514') {
    if (/15 full days/i.test(message)) return 'schedule-notice'
    if (/at least one event schedule/i.test(message)) return 'schedule-missing'
    return 'invalid'
  }
  if (error.code === '23502') return 'required'
  if (error.code === '42501') return 'permission'
  return 'generic'
}

// Plain-language text for a Supabase error. Raw database messages are never returned.
export function friendlyError(error) {
  switch (errorKind(error)) {
    case 'missing-function': return NOT_AVAILABLE_MESSAGE
    case 'schedule-notice': return SCHEDULE_NOTICE_MESSAGE
    case 'schedule-missing': return SCHEDULE_MISSING_MESSAGE
    case 'required': return 'Some required information is missing. Please complete all required fields.'
    case 'permission': return 'You don’t have permission to do that. This proposal may no longer be editable.'
    case 'invalid': return 'Some details are not valid. Please review the form and try again.'
    default: return GENERIC_MESSAGE
  }
}

const failure = (error) => ({ ok: false, error: friendlyError(error), kind: errorKind(error) })

// ---------- Reads ----------

// The organization's own proposal, normalized, or null when it does not exist.
export async function fetchProposalDetail(client, orgId, proposalId) {
  const { data, error } = await client
    .from('event_proposal')
    .select(DETAIL_SELECT)
    .eq('proposal_id', proposalId)
    .eq('org_id', orgId)
    .maybeSingle()
  if (error) throw new Error('The proposal could not be loaded. Please try again.')
  return normalizeDetail(data)
}

export async function fetchEventTypes(client) {
  const { data, error } = await client
    .from('event_type')
    .select('event_type_id, description, modality, requires_venue')
    .order('event_type_id', { ascending: true })
  if (error) throw new Error('Event types could not be loaded. Please try again.')
  return data ?? []
}

// Like calendar/venueApi fetchVenues, plus available_equipment.
export async function fetchProposalVenues(client) {
  const { data, error } = await client.from('venue').select(VENUE_SELECT).order('venue_name', { ascending: true })
  if (error) throw new Error('Venues could not be loaded. Please try again.')
  return data ?? []
}

// The event created from this proposal, or null.
export async function fetchLinkedEvent(client, orgId, proposalId) {
  const { data, error } = await client
    .from('event')
    .select('event_id, archived_at, event_status')
    .eq('proposal_id', proposalId)
    .eq('org_id', orgId)
    .maybeSingle()
  if (error) throw new Error('The linked event could not be loaded. Please try again.')
  return data ?? null
}

// ---------- Writes ----------

const newScheduleId = () => `S-${crypto.randomUUID().replaceAll('-', '').slice(0, 24)}`

// Creates a Pending proposal with the Primary schedule through the submit_proposal RPC, then
// inserts the optional Backup schedule. A Backup failure keeps the proposal:
// { ok: true, proposalId, backupSaved: false, backupError }.
export async function submitNewProposal(client, { proposal, primary, backup }) {
  const created = await client.rpc('submit_proposal', { proposal, schedule: primary })
  if (created.error) return failure(created.error)
  const proposalId = created.data
  if (!backup) return { ok: true, proposalId, backupSaved: null, backupError: '' }
  const inserted = await client.from('proposal_schedule').insert({ ...backup, schedule_id: newScheduleId(), proposal_id: proposalId })
  if (inserted.error) return { ok: true, proposalId, backupSaved: false, backupError: friendlyError(inserted.error) }
  return { ok: true, proposalId, backupSaved: true, backupError: '' }
}

const scheduleFields = (row) => ({ venue_id: row.venue_id, starts_at: row.starts_at, ends_at: row.ends_at })

// Edits a proposal returned for revision and sends it back for review. Order: old Backup removed,
// Primary row updated, new Backup inserted, then the proposal itself with approval_status 'Pending'.
// existing: the proposal's current schedule rows ({ schedule_id, schedule_type }).
export async function resubmitRevision(client, { orgId, proposalId, proposal, primary, backup, existing = [] }) {
  const oldPrimary = existing.find((item) => item.schedule_type === 'Primary')
  const oldBackup = existing.find((item) => item.schedule_type === 'Backup')
  const table = () => client.from('proposal_schedule')

  // The database checks the 15 day notice against the earliest schedule after every statement.
  // A stale old Backup would fail that check while the Primary is updated, so it is removed first
  // and the new Backup (if any) is inserted after the Primary is valid.
  if (oldBackup) {
    const result = await table().delete().eq('schedule_id', oldBackup.schedule_id).eq('proposal_id', proposalId)
    if (result.error) return failure(result.error)
  }

  if (oldPrimary) {
    const result = await table().update(scheduleFields(primary)).eq('schedule_id', oldPrimary.schedule_id).eq('proposal_id', proposalId).select('schedule_id')
    if (result.error) return failure(result.error)
    if ((result.data ?? []).length !== 1) return { ok: false, error: 'The schedule could not be updated. The proposal may no longer be editable.', kind: 'permission' }
  } else {
    const result = await table().insert({ ...primary, schedule_id: newScheduleId(), proposal_id: proposalId })
    if (result.error) return failure(result.error)
  }

  if (backup) {
    const result = await table().insert({ ...backup, schedule_id: newScheduleId(), proposal_id: proposalId })
    if (result.error) return failure(result.error)
  }

  const updated = await client
    .from('event_proposal')
    .update({ ...proposal, approval_status: STATUS_PENDING })
    .eq('proposal_id', proposalId)
    .eq('org_id', orgId)
    .select('proposal_id')
  if (updated.error) return failure(updated.error)
  if ((updated.data ?? []).length !== 1) return { ok: false, error: 'The proposal could not be updated. It may no longer be editable.', kind: 'permission' }
  return { ok: true, proposalId }
}

// ---------- Placeholders for backend functions that do not exist yet ----------
// schedules: array of { schedule_type, venue_id, starts_at, ends_at }.

async function callRpc(client, name, args) {
  const { data, error } = await client.rpc(name, args)
  return error ? failure(error) : { ok: true, data }
}

// save_proposal_draft(proposal jsonb, schedules jsonb, pid text default null) returns text
export const saveProposalDraft = (client, { proposal, schedules, proposalId = null }) =>
  callRpc(client, 'save_proposal_draft', { proposal, schedules, pid: proposalId })

// update_proposal(pid text, proposal jsonb, schedules jsonb, submit boolean)
export const updateProposal = (client, { proposalId, proposal, schedules, submit = false }) =>
  callRpc(client, 'update_proposal', { pid: proposalId, proposal, schedules, submit })

// delete_proposal(pid text)
export const deleteProposal = (client, proposalId) => callRpc(client, 'delete_proposal', { pid: proposalId })
