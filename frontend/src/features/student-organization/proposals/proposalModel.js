import { checkSchedule, manilaInputToIso, isoToManilaInput } from './proposalDates.js'

// Limits come from the database: event_proposal.event_name is varchar(200). Every other
// proposal text column is unbounded text, so nothing else is capped.
export const EVENT_NAME_MAX = 200
// expected_count_attendees is a Postgres integer (also CHECK >= 0).
const INTEGER_MAX = 2147483647

export const ELIGIBILITY_UNIVERSITY = 'University-Wide'
export const ELIGIBILITY_COLLEGE = 'College-Specific'


export const MODALITIES = [
  { value: 'On-Site', title: 'In-Person Campus', text: 'Full physical gathering within designated PLM campus grounds.' },
  { value: 'Online', title: 'Online / Virtual', text: 'Conducted via MS Teams, Zoom, or university streaming channels.' },
  { value: 'Hybrid', title: 'Hybrid Modality', text: 'Simultaneous auditorium session broadcasted to virtual attendees.' },
]

// Names come from supabase/seed.sql (student_organization). No official name was found
// for CBA, CS and CPT, so their code is the label. There is no college lookup table.
export const COLLEGES = [
  { code: 'CA', label: 'College of Accountancy (CA)' },
  { code: 'CASBE', label: 'College of Architecture and Sustainable Built Environments (CASBE)' },
  { code: 'CBA', label: 'CBA' },
  { code: 'CE', label: 'College of Engineering (CE)' },
  { code: 'CED', label: 'College of Education (CED)' },
  { code: 'CHASS', label: 'College of Humanities, Arts and Social Sciences (CHASS)' },
  { code: 'CISTM', label: 'College of Information Systems and Technology Management (CISTM)' },
  { code: 'CM', label: 'College of Medicine (CM)' },
  { code: 'CN', label: 'College of Nursing (CN)' },
  { code: 'CPA', label: 'College of Public Administration (CPA)' },
  { code: 'CPT', label: 'CPT' },
  { code: 'CS', label: 'CS' },
  { code: 'CTHM', label: 'College of Tourism and Hospitality Management (CTHM)' },
].sort((a, b) => a.label.localeCompare(b.label))

const first = (value) => (Array.isArray(value) ? value[0] : value) ?? null
const list = (value) => (Array.isArray(value) ? value : value ? [value] : [])
const text = (value) => (typeof value === 'string' ? value.trim() : '')
const orNull = (value) => text(value) || null

export const collegeLabel = (code) => COLLEGES.find((item) => item.code === code)?.label ?? code

// ---------- Event types ----------

// Distinct event type descriptions in database order. Each group has the modalities that
// exist for it: { description, modalities: ['On-Site', ...], byModality: { 'On-Site': row } }.
export function groupEventTypes(rows) {
  const groups = new Map()
  for (const row of rows || []) {
    const description = text(row?.description)
    if (!description) continue
    if (!groups.has(description)) groups.set(description, { description, modalities: [], byModality: {} })
    const group = groups.get(description)
    if (!group.byModality[row.modality]) {
      group.byModality[row.modality] = row
      group.modalities.push(row.modality)
    }
  }
  return [...groups.values()]
}

export const modalityAvailable = (group, modality) => !!group?.byModality?.[modality]

export function resolveEventTypeRow(rows, description, modality) {
  return (rows || []).find((row) => row.description === description && row.modality === modality) ?? null
}

export const resolveEventTypeId = (rows, description, modality) => resolveEventTypeRow(rows, description, modality)?.event_type_id ?? ''

// ---------- Venues ----------

const humanize = (value) => text(value).replace(/_/g, ' ')

// Read-only venue fields. Missing values show 'N/A'. No venue gives empty strings.
export function venueSpec(venue) {
  if (!venue) return { building: '', floor: '', room: '', capacity: '', equipment: '' }
  const capacity = Number(venue.max_capacity)
  return {
    building: humanize(venue.building) || 'N/A',
    floor: humanize(venue.floor_number) || 'N/A',
    room: humanize(venue.room_number) || 'N/A',
    capacity: Number.isFinite(capacity) && capacity > 0 ? String(capacity) : 'N/A',
    equipment: text(venue.available_equipment) || 'N/A',
  }
}

// ---------- Form ----------

const emptySlot = () => ({ venueId: '', startsAt: '', endsAt: '' })

export function emptyForm() {
  return {
    eventName: '',
    objectives: '',
    description: '',
    expectedAttendees: '',
    eligibilityMode: ELIGIBILITY_UNIVERSITY,
    colleges: [],
    collaboratingOrganizations: '',
    eventTypeDescription: '',
    modality: '',
    resourceRequirements: '',
    budgetInformation: '',
    includesSponsorship: false,
    primary: emptySlot(),
    backup: emptySlot(),
  }
}

function slotFromSchedule(schedule) {
  return schedule
    ? { venueId: schedule.venue_id ?? '', startsAt: isoToManilaInput(schedule.starts_at), endsAt: isoToManilaInput(schedule.ends_at) }
    : emptySlot()
}

// Builds form state from a normalized proposal (see normalizeDetail).
export function formFromProposal(row) {
  const base = emptyForm()
  if (!row) return base
  const colleges = row.eligibility_mode === ELIGIBILITY_COLLEGE && row.allowed_college
    ? row.allowed_college.split(',').map((item) => item.trim()).filter(Boolean)
    : []
  return {
    ...base,
    eventName: row.event_name ?? '',
    objectives: row.objectives ?? '',
    description: row.description ?? '',
    expectedAttendees: row.expected_count_attendees == null ? '' : String(row.expected_count_attendees),
    eligibilityMode: row.eligibility_mode === ELIGIBILITY_COLLEGE ? ELIGIBILITY_COLLEGE : ELIGIBILITY_UNIVERSITY,
    colleges,
    collaboratingOrganizations: row.collaborating_organization_text ?? '',
    eventTypeDescription: row.event_type?.description ?? '',
    modality: row.event_type?.modality ?? '',
    resourceRequirements: row.resource_requirements ?? '',
    budgetInformation: row.budget_information ?? '',
    includesSponsorship: !!row.includes_sponsorship,
    primary: slotFromSchedule(row.primary_schedule),
    backup: slotFromSchedule(row.backup_schedule),
  }
}

// True when College-Specific has two or more colleges selected (not supported by the backend yet).

export const isBackupStarted = (backup) => !!(backup?.venueId || backup?.startsAt || backup?.endsAt)

// Field keys in page order, used to focus the first invalid field.
export const FIELD_ORDER = [
  'eventName', 'objectives', 'description', 'expectedAttendees', 'colleges', 'eventType', 'modality',
  'primaryVenue', 'primaryStartsAt', 'primaryEndsAt', 'backupVenue', 'backupStartsAt', 'backupEndsAt',
]

// checkSchedule messages about the end time contain ' end '; all others belong to the start field.
const scheduleErrorKey = (message, startKey, endKey) => (message.includes(' end ') ? endKey : startKey)

// ctx: { eventTypes (rows), now }. Returns { errors: { fieldKey: message }, firstKey }.
export function validateForm(form, ctx = {}) {
  const errors = {}
  const now = ctx.now ?? Date.now()
  const required = (key, value, message) => { if (!text(value)) errors[key] = message }

  required('eventName', form.eventName, 'Enter the official event title.')
  if (text(form.eventName).length > EVENT_NAME_MAX) errors.eventName = `The title can be at most ${EVENT_NAME_MAX} characters.`
  required('objectives', form.objectives, 'Enter the objectives.')
  required('description', form.description, 'Enter the event scope and description.')

  const attendees = text(form.expectedAttendees)
  if (!attendees) errors.expectedAttendees = 'Enter the expected number of attendees.'
  else if (!/^\d+$/.test(attendees) || Number(attendees) > INTEGER_MAX) errors.expectedAttendees = 'Enter a whole number of 0 or more (up to 2,147,483,647).'

  if (form.eligibilityMode === ELIGIBILITY_COLLEGE) {
    const colleges = form.colleges || []
    if (!colleges.length) errors.colleges = 'Select the allowed college.'
    else if (!colleges.every((code) => COLLEGES.some((item) => item.code === code))) errors.colleges = 'Select a valid college.'
  }

  if (!text(form.eventTypeDescription)) errors.eventType = 'Choose an event type.'
  let typeRow = null
  if (!text(form.modality)) errors.modality = 'Choose how the event is held.'
  else if (!errors.eventType) {
    typeRow = resolveEventTypeRow(ctx.eventTypes, form.eventTypeDescription, form.modality)
    if (!typeRow) errors.modality = 'This event type is not available in the chosen format.'
  }

  const online = form.modality === 'Online'
  const needsVenue = typeRow ? typeRow.requires_venue !== false : !online
  const primary = form.primary || emptySlot()
  if (needsVenue && !primary.venueId) errors.primaryVenue = 'Choose a venue.'
  if (!primary.startsAt) errors.primaryStartsAt = 'Choose when the reservation starts.'
  if (!primary.endsAt) errors.primaryEndsAt = 'Choose when the reservation ends.'
  const primaryError = checkSchedule({ startsAt: primary.startsAt, endsAt: primary.endsAt, now, label: 'The event' })
  if (primaryError) errors[scheduleErrorKey(primaryError, 'primaryStartsAt', 'primaryEndsAt')] = primaryError

  // Backup is all or nothing and only applies to events that use a venue.
  const backup = form.backup || emptySlot()
  if (!online && isBackupStarted(backup)) {
    if (!backup.venueId) errors.backupVenue = 'Choose a backup venue or clear the backup times.'
    if (!backup.startsAt) errors.backupStartsAt = 'Choose when the backup reservation starts.'
    if (!backup.endsAt) errors.backupEndsAt = 'Choose when the backup reservation ends.'
    const backupError = checkSchedule({ startsAt: backup.startsAt, endsAt: backup.endsAt, now, label: 'The backup reservation' })
    if (backupError) errors[scheduleErrorKey(backupError, 'backupStartsAt', 'backupEndsAt')] = backupError
  }

  const firstKey = FIELD_ORDER.find((key) => errors[key]) ?? null
  return { errors, firstKey }
}

// ---------- Payloads ----------

// Columns of event_proposal. Empty optional text becomes null. allowed_programs is always [].
export function buildProposalPayload(form, eventTypes) {
  const college = form.eligibilityMode === ELIGIBILITY_COLLEGE
  return {
    event_name: text(form.eventName),
    objectives: text(form.objectives),
    description: text(form.description),
    event_type_id: resolveEventTypeId(eventTypes, form.eventTypeDescription, form.modality) || null,
    expected_count_attendees: Number.parseInt(text(form.expectedAttendees), 10),
    eligibility_mode: college ? ELIGIBILITY_COLLEGE : ELIGIBILITY_UNIVERSITY,
    allowed_college: college ? ([...new Set(form.colleges || [])].join(', ') || null) : null,
    allowed_programs: [],
    resource_requirements: orNull(form.resourceRequirements),
    budget_information: orNull(form.budgetInformation),
    includes_sponsorship: !!form.includesSponsorship,
    collaborating_organization_text: orNull(form.collaboratingOrganizations),
  }
}

function scheduleRow(type, slot, online) {
  return {
    schedule_type: type,
    venue_id: online ? null : slot.venueId || null,
    starts_at: manilaInputToIso(slot.startsAt) || null,
    ends_at: manilaInputToIso(slot.endsAt) || null,
  }
}

// { primary, backup } schedule rows. Online events have no venue and no backup.
// backup is null unless a backup venue and both times are filled.
export function buildScheduleRows(form) {
  const online = form.modality === 'Online'
  const primary = scheduleRow('Primary', form.primary, online)
  const backup = !online && form.backup?.venueId && form.backup.startsAt && form.backup.endsAt
    ? scheduleRow('Backup', form.backup, false)
    : null
  return { primary, backup }
}

// ---------- Fetched rows ----------

// Latest review by reviewed_at, or null.
export function pickLatestReview(reviews) {
  const rows = list(reviews).filter(Boolean)
  if (!rows.length) return null
  return rows.reduce((best, row) => (Date.parse(row.reviewed_at) > Date.parse(best.reviewed_at) || !Number.isFinite(Date.parse(best.reviewed_at)) ? row : best))
}

// Accepts embeds that arrive as an object or as an array. Returns null for no row.
export function normalizeDetail(row) {
  if (!row) return null
  const schedules = list(row.proposal_schedule).filter(Boolean).map((item) => ({ ...item, venue: first(item.venue) }))
  const reviews = list(row.proposal_review).filter(Boolean)
  return {
    ...row,
    organization: first(row.student_organization),
    event_type: first(row.event_type),
    schedules,
    reviews,
    latest_review: pickLatestReview(reviews),
    primary_schedule: schedules.find((item) => item.schedule_type === 'Primary') ?? null,
    backup_schedule: schedules.find((item) => item.schedule_type === 'Backup') ?? null,
  }
}
