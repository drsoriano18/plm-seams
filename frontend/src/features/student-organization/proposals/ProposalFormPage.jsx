import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../auth/authContext'
import { supabase } from '../../../lib/supabase'
import { DASHBOARD_PATH } from '../events/eventState.js'
import { fetchVenueBookings } from '../calendar/venueApi.js'
import AvailabilityPanel from './AvailabilityPanel'
import ProposalDialog from './ProposalDialog'
import ProposalIcon from './ProposalIcon'
import { ChoiceCard, Field, ReservationSection, Section } from './ProposalFields'
import { deleteProposal, resubmitRevision, saveProposalDraft, submitNewProposal, updateProposal } from './proposalApi.js'
import { capacityWarning, checkSchedule, formatProposalDateTime, formatSubmitted, isoToManilaInput, manilaInputToIso, minStartMs, outsideDayWarning, overlapWarning, sameVenueWarning } from './proposalDates.js'
import {
  COLLEGES, ELIGIBILITY_COLLEGE, ELIGIBILITY_UNIVERSITY, EVENT_NAME_MAX, MODALITIES, MULTI_COLLEGE_MESSAGE,
  buildProposalPayload, buildScheduleRows, formFromProposal, groupEventTypes, isBackupStarted, modalityAvailable, multiCollegeBlocked, validateForm,
} from './proposalModel.js'
import { proposalPath } from './proposalStatus.js'
import './Proposals.css'

const NOT_CONNECTED = 'The portal isn’t connected right now. Please try again later.'
const GENERIC_ERROR = 'Something went wrong. Please try again.'
const EMPTY = []
const FOCUS_IDS = {
  eventName: 'proposal-event-name', objectives: 'proposal-objectives', description: 'proposal-description', expectedAttendees: 'proposal-attendees',
  colleges: 'proposal-colleges', eventType: 'proposal-event-type', modality: 'proposal-modality',
  primaryVenue: 'proposal-primary-venue', primaryStartsAt: 'proposal-primary-starts', primaryEndsAt: 'proposal-primary-ends',
  backupVenue: 'proposal-backup-venue', backupStartsAt: 'proposal-backup-starts', backupEndsAt: 'proposal-backup-ends',
}
const TITLES = { create: 'Create an Event Proposal', draft: 'Continue Your Event Proposal', revision: 'Revise Your Event Proposal' }
const SUBTITLE = 'Pamantasan ng Lungsod ng Maynila • Office of Student Development and Services (OSDS) Proposal Form • AY 2026-2027'
const REQUIRED_NOTE = 'Note: All fields marked with * must be completed before the form can be saved as a draft.'
const SPONSORSHIP_NOTICE = 'Legal & Compliance Advisory: For event proposals involving merchandise sales, commercial sponsorships or the like, institutional policies mandate that official Memorandums of Agreement (MOA) and physical permits must be submitted face-to-face to the Office of Student Development and Services (OSDS) and the Physical Facilities Management Office (PFMO) at Gusaling Villegas prior to final resolution endorsement.'

function toDraftPayload(form, eventTypes) {
  const payload = buildProposalPayload(form, eventTypes)
  if (!Number.isFinite(payload.expected_count_attendees)) payload.expected_count_attendees = null
  return payload
}

// Drafts keep whatever was entered, so unfinished schedule rows are allowed.
function draftSchedules(form) {
  const online = form.modality === 'Online'
  const rows = []
  const add = (type, slot, withVenue) => {
    if (!slot.venueId && !slot.startsAt && !slot.endsAt) return
    rows.push({ schedule_type: type, venue_id: withVenue ? slot.venueId || null : null, starts_at: manilaInputToIso(slot.startsAt) || null, ends_at: manilaInputToIso(slot.endsAt) || null })
  }
  add('Primary', form.primary, !online)
  if (!online) add('Backup', form.backup, true)
  return rows
}

// Schedule problems shown as soon as both times are filled: { start, end } messages.
function liveSchedule(slot, label, now) {
  const message = checkSchedule({ startsAt: slot.startsAt, endsAt: slot.endsAt, now, label })
  if (!message) return { start: '', end: '' }
  return message.includes(' end ') ? { start: '', end: message } : { start: message, end: '' }
}

const slotIsHeld = (slot, now) => !!(slot.venueId && slot.startsAt && slot.endsAt && !checkSchedule({ startsAt: slot.startsAt, endsAt: slot.endsAt, now }))

// Known bookings for a slot's venue and time range, used for the overlap warning only.
function useSlotBookings(slot, enabled) {
  const startIso = manilaInputToIso(slot.startsAt)
  const endIso = manilaInputToIso(slot.endsAt)
  const valid = enabled && !!slot.venueId && !!startIso && !!endIso && Date.parse(endIso) > Date.parse(startIso)
  const key = valid ? `${slot.venueId}|${startIso}|${endIso}` : ''
  const [loaded, setLoaded] = useState({ key: '', bookings: EMPTY })
  useEffect(() => {
    if (!key || !supabase) return undefined
    let active = true
    fetchVenueBookings(supabase, slot.venueId, startIso, endIso)
      .then((result) => { if (active) setLoaded({ key, bookings: result.bookings }) })
      .catch(() => { if (active) setLoaded({ key, bookings: EMPTY }) })
    return () => { active = false }
  }, [key, slot.venueId, startIso, endIso])
  return loaded.key === key ? loaded.bookings : EMPTY
}

// Editable proposal form for new proposals, saved drafts and proposals returned for revision.
// mode: 'create' | 'draft' | 'revision'. proposal: normalized detail (normalizeDetail) for draft and revision.
// eventTypes and venues: rows fetched by the route page.
export default function ProposalFormPage({ mode = 'create', proposal = null, eventTypes, venues }) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const orgId = profile.user_id
  const [now] = useState(() => Date.now())
  const [form, setForm] = useState(() => formFromProposal(proposal))
  const [dirty, setDirty] = useState(false)
  const [attempt, setAttempt] = useState(null)
  const [message, setMessage] = useState(null)
  const [scheduleServerError, setScheduleServerError] = useState('')
  const [dialog, setDialog] = useState(null)
  const [dialogError, setDialogError] = useState('')
  const [busy, setBusy] = useState('')
  const [submitted, setSubmitted] = useState(null)
  const busyRef = useRef(false)

  const groups = useMemo(() => groupEventTypes(eventTypes), [eventTypes])
  const venueById = useMemo(() => new Map(venues.map((item) => [item.venue_id, item])), [venues])
  const selectedGroup = groups.find((group) => group.description === form.eventTypeDescription) ?? null
  const online = form.modality === 'Online'
  const primaryVenue = venueById.get(form.primary.venueId) ?? null
  const backupVenue = venueById.get(form.backup.venueId) ?? null
  const backupStarted = isBackupStarted(form.backup)
  const minStart = isoToManilaInput(new Date(minStartMs(now)).toISOString())
  const remarks = proposal?.latest_review ?? null

  const errors = useMemo(() => (attempt ? validateForm(form, { eventTypes, now: attempt.at }).errors : {}), [attempt, form, eventTypes])
  const livePrimary = liveSchedule(form.primary, 'The event', now)
  const liveBackup = online || !backupStarted ? { start: '', end: '' } : liveSchedule(form.backup, 'The backup reservation', now)
  const collegeError = errors.colleges || (multiCollegeBlocked(form) ? MULTI_COLLEGE_MESSAGE : '')

  const primaryBookings = useSlotBookings(form.primary, !online)
  const backupBookings = useSlotBookings(form.backup, !online && backupStarted)
  const primaryWarnings = [
    outsideDayWarning(form.primary.startsAt, form.primary.endsAt),
    overlapWarning(manilaInputToIso(form.primary.startsAt), manilaInputToIso(form.primary.endsAt), primaryBookings),
    online ? '' : capacityWarning(form.expectedAttendees, primaryVenue),
  ]
  const backupWarnings = [
    outsideDayWarning(form.backup.startsAt, form.backup.endsAt),
    overlapWarning(manilaInputToIso(form.backup.startsAt), manilaInputToIso(form.backup.endsAt), backupBookings),
    capacityWarning(form.expectedAttendees, backupVenue),
    sameVenueWarning(form.primary.venueId, form.backup.venueId),
  ]

  useEffect(() => {
    if (!dirty) return undefined
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const update = (change) => {
    setForm((previous) => ({ ...previous, ...(typeof change === 'function' ? change(previous) : change) }))
    setDirty(true)
  }
  const updateSlot = (name, patch) => {
    if (name === 'primary') setScheduleServerError('')
    update((previous) => ({ [name]: { ...previous[name], ...patch } }))
  }
  const changeType = (description) => update((previous) => {
    const group = groups.find((item) => item.description === description)
    return { eventTypeDescription: description, modality: group && !modalityAvailable(group, previous.modality) ? '' : previous.modality }
  })
  const toggleCollege = (code) => update((previous) => ({ colleges: previous.colleges.includes(code) ? previous.colleges.filter((item) => item !== code) : [...previous.colleges, code] }))
  const focusField = (key) => { document.getElementById(FOCUS_IDS[key])?.focus() }

  const applyAvailability = (kind, { venueId, startsAt, endsAt }) => {
    const patch = { startsAt: isoToManilaInput(startsAt), endsAt: isoToManilaInput(endsAt) }
    if (!online) patch.venueId = venueId
    updateSlot(kind, patch)
    const venueName = venueById.get(venueId)?.venue_name
    setMessage({ tone: 'info', text: `${kind === 'primary' ? 'Primary' : 'Backup'} reservation set${online || !venueName ? '' : ` at ${venueName}`}: ${formatProposalDateTime(startsAt)} to ${formatProposalDateTime(endsAt)}.` })
  }

  const leave = () => { setDirty(false); navigate(DASHBOARD_PATH) }

  const saveDraft = async () => {
    if (busyRef.current) return
    setMessage(null)
    if (!supabase) { setMessage({ tone: 'error', text: NOT_CONNECTED }); return }
    busyRef.current = true
    setBusy('draft')
    const args = { proposal: toDraftPayload(form, eventTypes), schedules: draftSchedules(form) }
    let outcome
    try {
      outcome = mode === 'draft'
        ? await updateProposal(supabase, { ...args, proposalId: proposal.proposal_id, submit: false })
        : await saveProposalDraft(supabase, args)
    } catch {
      outcome = { ok: false, error: GENERIC_ERROR }
    }
    busyRef.current = false
    setBusy('')
    if (outcome.ok) { leave(); return }
    setMessage({ tone: 'error', text: outcome.error })
  }

  const startSubmit = (event) => {
    event.preventDefault()
    setMessage(null)
    const at = Date.now()
    const check = validateForm(form, { eventTypes, now: at })
    setAttempt({ at })
    if (check.firstKey) {
      setMessage({ tone: 'error', text: 'Some required details are missing or need fixing. Review the highlighted fields.' })
      focusField(check.firstKey)
      return
    }
    setDialogError('')
    setDialog('submit')
  }

  const confirmSubmit = async () => {
    if (busyRef.current) return
    if (!supabase) { setDialogError(NOT_CONNECTED); return }
    busyRef.current = true
    setBusy('submit')
    setDialogError('')
    const payload = buildProposalPayload(form, eventTypes)
    const { primary, backup } = buildScheduleRows(form)
    let outcome
    try {
      if (mode === 'revision') outcome = await resubmitRevision(supabase, { orgId, proposalId: proposal.proposal_id, proposal: payload, primary, backup, existing: proposal.schedules })
      else if (mode === 'draft') outcome = await updateProposal(supabase, { proposalId: proposal.proposal_id, proposal: payload, schedules: [primary, backup].filter(Boolean), submit: true })
      else outcome = await submitNewProposal(supabase, { proposal: payload, primary, backup })
    } catch {
      outcome = { ok: false, error: GENERIC_ERROR }
    }
    busyRef.current = false
    setBusy('')
    if (!outcome.ok) {
      if (outcome.kind === 'schedule-notice' || outcome.kind === 'schedule-missing') {
        setDialog(null)
        setScheduleServerError(outcome.error)
        setMessage({ tone: 'error', text: outcome.error })
        focusField('primaryStartsAt')
        return
      }
      setDialogError(outcome.error)
      return
    }
    setDirty(false)
    setDialog(null)
    if (outcome.backupSaved === false) { setSubmitted({ proposalId: outcome.proposalId, backupError: outcome.backupError }); return }
    navigate(DASHBOARD_PATH)
  }

  const confirmDelete = async () => {
    if (mode !== 'draft') { leave(); return }
    if (busyRef.current) return
    if (!supabase) { setDialogError(NOT_CONNECTED); return }
    busyRef.current = true
    setBusy('delete')
    setDialogError('')
    let outcome
    try {
      outcome = await deleteProposal(supabase, proposal.proposal_id)
    } catch {
      outcome = { ok: false, error: GENERIC_ERROR }
    }
    busyRef.current = false
    setBusy('')
    if (outcome.ok) { leave(); return }
    setDialogError(outcome.error)
  }

  const closeDialog = () => { if (!busyRef.current) setDialog(null) }

  if (submitted) {
    return <section className="organization-proposal-card organization-proposal-result" aria-labelledby="organization-proposal-title">
      <h1 id="organization-proposal-title" tabIndex={-1}>Proposal Submitted</h1>
      <p>Your proposal was submitted for evaluation, but the backup venue could not be saved.</p>
      <p className="organization-proposal-error-line">{submitted.backupError}</p>
      <div className="organization-proposal-result-actions">
        <Link className="organization-proposal-primary" to={proposalPath(submitted.proposalId)}>View Proposal</Link>
        <Link className="organization-proposal-secondary" to={DASHBOARD_PATH}>Back to Events</Link>
      </div>
    </section>
  }

  const canDelete = mode === 'create' || mode === 'draft'
  const canSaveDraft = mode === 'create' || mode === 'draft'
  const primaryErrors = { venue: errors.primaryVenue, start: errors.primaryStartsAt || scheduleServerError || livePrimary.start, end: errors.primaryEndsAt || livePrimary.end }
  const backupErrors = { venue: errors.backupVenue, start: errors.backupStartsAt || liveBackup.start, end: errors.backupEndsAt || liveBackup.end }
  const deleteText = mode === 'draft'
    ? 'This permanently removes the draft from the portal and the database. This can’t be undone.'
    : 'Everything you entered on this form will be discarded. This can’t be undone.'

  return <>
    <header className="organization-proposal-head">
      <h1 id="organization-proposal-title" tabIndex={-1}>{TITLES[mode] ?? TITLES.create}</h1>
      <p className="organization-proposal-subtitle">{SUBTITLE}</p>
      <p className="organization-proposal-required-note">{REQUIRED_NOTE}</p>
    </header>

    {mode === 'draft' ? <aside className="organization-proposal-banner is-draft" aria-label="Proposal status">
      <ProposalIcon name="info" size={18} /><div><strong>Saved as Draft</strong><p>This proposal has not been submitted yet. Submit it when you are ready.</p></div>
    </aside> : null}
    {mode === 'revision' ? <aside className="organization-proposal-banner is-revision" aria-label="Proposal status">
      <ProposalIcon name="alert-circle" size={18} />
      <div>
        <strong>Returned for Revision</strong>
        <p>{remarks?.admin_remarks?.trim() || 'No remarks were provided with this revision request.'}</p>
        {remarks?.reviewed_at ? <p className="organization-proposal-banner-meta">Reviewed {formatSubmitted(remarks.reviewed_at)}</p> : null}
      </div>
    </aside> : null}

    <form className="organization-proposal-form" noValidate aria-labelledby="organization-proposal-title" onSubmit={startSubmit}>
      <Section id="proposal-section-general" title="General Event Information & Concept" intro="Articulate core institutional outcomes, measurable objectives, and participant boundaries." tag="Required">
        <div className="organization-proposal-grid">
          <Field id="proposal-event-name" label="Full Official Event Title" required error={errors.eventName} className="is-full" help={`${form.eventName.length}/${EVENT_NAME_MAX} characters`}>
            {(aria) => <input {...aria} type="text" autoComplete="off" className="organization-proposal-control" maxLength={EVENT_NAME_MAX} value={form.eventName} onChange={(event) => update({ eventName: event.target.value })} />}
          </Field>
          <Field id="proposal-objectives" label="Academic & Organizational Objectives" required error={errors.objectives} className="is-full">
            {(aria) => <textarea {...aria} rows={4} className="organization-proposal-control" value={form.objectives} onChange={(event) => update({ objectives: event.target.value })} />}
          </Field>
          <Field id="proposal-description" label="Comprehensive Event Scope & Description" required error={errors.description} className="is-full">
            {(aria) => <textarea {...aria} rows={5} className="organization-proposal-control" value={form.description} onChange={(event) => update({ description: event.target.value })} />}
          </Field>
          <Field id="proposal-attendees" label="Expected Count of Attendees" required error={errors.expectedAttendees}>
            {(aria) => <div className="organization-proposal-suffix">
              <input {...aria} type="text" inputMode="numeric" autoComplete="off" className="organization-proposal-control" value={form.expectedAttendees} onChange={(event) => update({ expectedAttendees: event.target.value })} />
              <span aria-hidden="true">PAX</span>
            </div>}
          </Field>
        </div>

        <fieldset className="organization-proposal-fieldset">
          <legend>Audience Eligibility Scope</legend>
          <div className="organization-proposal-choices is-two">
            <ChoiceCard name="proposal-eligibility" value={ELIGIBILITY_UNIVERSITY} checked={form.eligibilityMode === ELIGIBILITY_UNIVERSITY} title="University-Wide Eligibility" text="Open to all officially enrolled PLM undergraduate & postgraduate students." onChange={(value) => update({ eligibilityMode: value })} />
            <ChoiceCard name="proposal-eligibility" value={ELIGIBILITY_COLLEGE} checked={form.eligibilityMode === ELIGIBILITY_COLLEGE} title="College-Specific Eligibility" text="Restricted strictly to pre-selected PLM academic colleges and departments." onChange={(value) => update({ eligibilityMode: value })} />
          </div>
        </fieldset>

        {form.eligibilityMode === ELIGIBILITY_COLLEGE ? <fieldset id="proposal-colleges" tabIndex={-1} className="organization-proposal-fieldset" aria-invalid={collegeError ? 'true' : undefined} aria-describedby={collegeError ? 'proposal-colleges-error proposal-colleges-help' : 'proposal-colleges-help'}>
          <legend>Allowed Colleges & Faculties <span aria-hidden="true">*</span></legend>
          <div className="organization-proposal-colleges">
            {COLLEGES.map((college) => <label key={college.code} className="organization-proposal-check">
              <input type="checkbox" checked={form.colleges.includes(college.code)} onChange={() => toggleCollege(college.code)} />
              <span>{college.label}</span>
            </label>)}
          </div>
          <p id="proposal-colleges-help" className="organization-proposal-help">Students holding non-qualifying collegiate student IDs will be denied event registration.</p>
          {collegeError ? <p id="proposal-colleges-error" className="organization-proposal-error-line">{collegeError}</p> : null}
        </fieldset> : null}

        <div className="organization-proposal-grid">
          <Field id="proposal-collaborators" label="Co-Presenting Student Organizations" className="is-full" help="All named student organizations must submit signed counter-endorsements from their respective advisers.">
            {(aria) => <textarea {...aria} rows={2} className="organization-proposal-control" value={form.collaboratingOrganizations} onChange={(event) => update({ collaboratingOrganizations: event.target.value })} />}
          </Field>
        </div>
      </Section>

      <Section id="proposal-section-type" title="Event Type & Modality Structure" intro="Logistical execution format and physical university infrastructure reservation." tag="Required">
        <div className="organization-proposal-grid">
          <Field id="proposal-event-type" label="Event Type Classification" required error={errors.eventType} className="is-full">
            {(aria) => <select {...aria} className="organization-proposal-control" value={form.eventTypeDescription} onChange={(event) => changeType(event.target.value)}>
              <option value="">Select an event type</option>
              {groups.map((group) => <option key={group.description} value={group.description}>{group.description}</option>)}
            </select>}
          </Field>
        </div>
        <fieldset id="proposal-modality" tabIndex={-1} className="organization-proposal-fieldset" aria-invalid={errors.modality ? 'true' : undefined} aria-describedby={errors.modality ? 'proposal-modality-error' : undefined}>
          <legend>Event Modality <span aria-hidden="true">*</span></legend>
          <div className="organization-proposal-choices is-three">
            {MODALITIES.map((item) => <ChoiceCard key={item.value} name="proposal-modality" value={item.value} checked={form.modality === item.value} disabled={!!selectedGroup && !modalityAvailable(selectedGroup, item.value)} title={item.title} text={item.text} tag={item.value} hint={`Not offered for ${form.eventTypeDescription}.`} onChange={(value) => update({ modality: value })} />)}
          </div>
          {errors.modality ? <p id="proposal-modality-error" className="organization-proposal-error-line">{errors.modality}</p> : null}
        </fieldset>

        {online ? null : <AvailabilityPanel venues={venues} primaryVenueId={form.primary.venueId} onUse={applyAvailability} />}
        {online ? <p className="organization-proposal-help">Online events do not need a venue. Choose when the event starts and ends.</p> : null}

        <ReservationSection prefix="proposal-primary" title="Venue Booking Specification" slot={form.primary} venue={primaryVenue} venues={venues} errors={primaryErrors} warnings={primaryWarnings} held={slotIsHeld(form.primary, now)} minStart={minStart} online={online} onChange={(patch) => updateSlot('primary', patch)} />
        {online ? null : <ReservationSection prefix="proposal-backup" title="Backup Venue Booking Specification" optionalNote="Optional. If you add a backup, choose the venue and both times." slot={form.backup} venue={backupVenue} venues={venues} errors={backupErrors} warnings={backupWarnings} held={backupStarted && slotIsHeld(form.backup, now)} minStart={minStart} onChange={(patch) => updateSlot('backup', patch)} onClear={backupStarted ? () => updateSlot('backup', { venueId: '', startsAt: '', endsAt: '' }) : null} />}
      </Section>

      <Section id="proposal-section-budget" title="Budget & Resource Requirements" intro="PFMO equipment reservation, custodial service requisitions, and fiscal allocation." tag="Optional" tagTone="is-optional">
        <div className="organization-proposal-grid">
          <Field id="proposal-resources" label="Resource Requirement" className="is-full" help="Facilities, equipment, and other resources requested for the event. State None if no additional resources are required.">
            {(aria) => <textarea {...aria} rows={3} className="organization-proposal-control" value={form.resourceRequirements} onChange={(event) => update({ resourceRequirements: event.target.value })} />}
          </Field>
          <Field id="proposal-budget" label="Budget Information" className="is-full" help="Summary of the proposed budget and planned resource costs. State No budget required if applicable.">
            {(aria) => <textarea {...aria} rows={3} className="organization-proposal-control" value={form.budgetInformation} onChange={(event) => update({ budgetInformation: event.target.value })} />}
          </Field>
        </div>
        <label className="organization-proposal-check is-sponsorship">
          <input id="proposal-sponsorship" type="checkbox" checked={form.includesSponsorship} aria-describedby="proposal-sponsorship-help" onChange={(event) => update({ includesSponsorship: event.target.checked })} />
          <span>
            <strong>Event Includes External Commercial Sponsorship or Merchandise Sale</strong>
            <span id="proposal-sponsorship-help" className="organization-proposal-help">Financial grants, branded booth collaterals, freebies, or corporate marketing.</span>
          </span>
        </label>
        {form.includesSponsorship ? <div className="organization-proposal-advisory" role="note">
          <ProposalIcon name="alert-circle" size={18} />
          <div>
            <p className="organization-proposal-advisory-title">Legal & Statutory Compliance Advisory</p>
            <strong>MOA & Physical Legal Clearance Required</strong>
            <p>{SPONSORSHIP_NOTICE}</p>
          </div>
        </div> : null}
      </Section>

      <div className="organization-proposal-messages">
        <p className="organization-proposal-message" role="status" aria-live="polite">{message?.tone === 'info' ? message.text : ''}</p>
        <p className="organization-proposal-message is-error" role="alert">{message?.tone === 'error' ? message.text : ''}</p>
      </div>

      <div className="organization-proposal-actions">
        {canDelete ? <button type="button" className="organization-proposal-danger" onClick={() => { setDialogError(''); setDialog('delete') }} disabled={!!busy}><ProposalIcon name="trash" size={16} />Delete Draft</button> : null}
        <div className="organization-proposal-actions-main">
          {canSaveDraft ? <button type="button" className="organization-proposal-secondary" onClick={saveDraft} disabled={!!busy}>{busy === 'draft' ? 'Saving…' : 'Save as Draft'}</button> : null}
          <button type="submit" className="organization-proposal-primary" disabled={!!busy}><ProposalIcon name="send" size={16} />Submit Event Proposal for OSDS Endorsement</button>
        </div>
      </div>
    </form>

    {dialog === 'submit' ? <ProposalDialog title="Submit this proposal?" confirmLabel="Confirm Submission" busyLabel="Submitting…" busy={busy === 'submit'} error={dialogError} onConfirm={confirmSubmit} onClose={closeDialog}>
      <p>Your proposal will be submitted for evaluation. Once submitted, it cannot be edited further.</p>
    </ProposalDialog> : null}
    {dialog === 'delete' ? <ProposalDialog title="Delete this draft?" confirmLabel="Confirm Delete" busyLabel="Deleting…" tone="danger" busy={busy === 'delete'} error={dialogError} onConfirm={confirmDelete} onClose={closeDialog}>
      <p>{deleteText}</p>
    </ProposalDialog> : null}
  </>
}
