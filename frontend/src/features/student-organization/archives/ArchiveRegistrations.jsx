import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../../auth/authContext'
import { supabase } from '../../../lib/supabase'
import AttendeeBoard from '../attendees/AttendeeBoard'
import Shell, { Breadcrumb, StatePanel } from '../attendees/AttendeeShell'
import { fetchEventCapacity } from '../attendees/attendeesApi.js'
import { fetchArchivedEvent } from './archiveApi.js'
import { ARCHIVES_PATH, detailPath, toArchivedDetail } from './archiveModel.js'
import '../OrganizationDashboard.css'
import '../events/EventsShared.css'
import '../attendees/Attendees.css'

const TARGET = 'organization-attendees-title'

export default function ArchiveRegistrations() {
  const { eventId } = useParams()
  const { profile } = useAuth()
  const orgId = profile.user_id
  const [state, setState] = useState({ key: null, error: '', row: null, capacity: 0 })

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const row = await fetchArchivedEvent(supabase, orgId, eventId)
        const capacity = row ? await fetchEventCapacity(supabase, row.event_id) : 0
        if (active) setState({ key: eventId, error: '', row, capacity })
      } catch (error) {
        if (active) setState({ key: eventId, error: error.message, row: null, capacity: 0 })
      }
    }
    load()
    return () => { active = false }
  }, [orgId, eventId])

  if (state.key !== eventId) return <Shell active="archives" skipTarget={TARGET}><StatePanel id={TARGET} role="status" title={'Loading archived event\u2026'} /></Shell>
  if (state.error) return <Shell active="archives" skipTarget={TARGET}>
    <StatePanel id={TARGET} role="alert" tone="error" title="Registrations Unavailable" text={state.error}>
      <Link className="organization-attendees-back" to={ARCHIVES_PATH}>Back to Archive Events</Link>
    </StatePanel>
  </Shell>
  if (!state.row) return <Shell active="archives" skipTarget={TARGET}>
    <StatePanel id={TARGET} title="Archived event not found" text="This event does not exist, is not archived, or is not led by your organization.">
      <Link className="organization-attendees-back" to={ARCHIVES_PATH}>Back to Archive Events</Link>
    </StatePanel>
  </Shell>

  const detail = toArchivedDetail(state.row)
  return <Shell active="archives" skipTarget={TARGET}>
    <Breadcrumb items={[{ label: detail.title, to: detailPath(detail.event_id) }, { label: 'View Registrations & Attendees' }]} />
    <div className="organization-attendees-titlebar">
      <h1 id={TARGET} tabIndex={-1}>Registrations &amp; Attendees</h1>
      <p className="organization-attendees-note">Archived Event {'\u2022'} Read-Only Access</p>
    </div>
    <AttendeeBoard eventId={state.row.event_id} capacity={state.capacity} readOnly />
  </Shell>
}
