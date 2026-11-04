import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { useAuth } from '../../auth/authContext'
import { supabase } from '../../../lib/supabase'
import { ARCHIVES_PATH } from '../archives/archiveModel.js'
import AttendeeBoard from '../attendees/AttendeeBoard'
import Shell, { Breadcrumb, StatePanel } from '../attendees/AttendeeShell'
import { fetchEventDetail } from './eventsApi.js'
import { DASHBOARD_PATH, EVENT_PATH, toEventDetail } from './eventState.js'
import { useNow, useRefreshTriggers } from './useEventSync.js'
import '../OrganizationDashboard.css'
import './EventsShared.css'
import '../attendees/Attendees.css'

const BLOCKED_VIEWS = ['unpublished', 'cancelled']

export default function OrganizationEventAttendance() {
  const { eventId } = useParams()
  const { profile } = useAuth()
  const orgId = profile.user_id
  const now = useNow()
  const [state, setState] = useState({ key: null, error: '', row: null })
  const [reloadKey, setReloadKey] = useState(0)
  const refresh = useCallback(() => setReloadKey((key) => key + 1), [])

  useEffect(() => {
    let current = true
    async function run() {
      try {
        const row = await fetchEventDetail(supabase, orgId, eventId)
        if (current) setState({ key: eventId, error: '', row })
      } catch (error) {
        if (current) setState((previous) => (previous.key === eventId && previous.row ? previous : { key: eventId, error: error.message, row: null }))
      }
    }
    run()
    return () => { current = false }
  }, [orgId, eventId, reloadKey])
  useRefreshTriggers(orgId, refresh)
  const detail = useMemo(() => (state.row && state.key === eventId ? toEventDetail(state.row, null, now) : null), [state, eventId, now])

  const target = 'organization-attendees-title'
  if (state.key !== eventId) return <Shell active="events" skipTarget={target}><StatePanel id={target} role="status" title={'Loading attendees\u2026'} /></Shell>
  if (state.error) return <Shell active="events" skipTarget={target}>
    <StatePanel id={target} role="alert" tone="error" title="Attendees Unavailable" text={state.error}>
      <Link className="organization-attendees-back" to={DASHBOARD_PATH}>Back to Events</Link>
    </StatePanel>
  </Shell>
  if (!detail) return <Shell active="events" skipTarget={target}>
    <StatePanel id={target} title="Event not found" text="This event does not exist or is not led by your organization.">
      <Link className="organization-attendees-back" to={DASHBOARD_PATH}>Back to Events</Link>
    </StatePanel>
  </Shell>
  if (detail.archived_at) return <Navigate replace to={`${ARCHIVES_PATH}/${encodeURIComponent(eventId)}/registrations`} />
  if (BLOCKED_VIEWS.includes(detail.view)) return <Shell active="events" skipTarget={target}>
    <StatePanel id={target} title="Attendance isn't available for this event.">
      <Link className="organization-attendees-back" to={EVENT_PATH(eventId)}>Back to Event</Link>
    </StatePanel>
  </Shell>

  return <Shell active="events" skipTarget={target}>
    <Breadcrumb items={[{ label: 'Events', to: DASHBOARD_PATH }, { label: detail.title, to: EVENT_PATH(eventId) }, { label: 'Attendees' }]} />
    <div className="organization-attendees-titlebar"><h1 id={target} tabIndex={-1}>Attendees</h1></div>
    <AttendeeBoard eventId={state.row.event_id} capacity={detail.capacity} startsAt={state.row.starts_at} />
  </Shell>
}
