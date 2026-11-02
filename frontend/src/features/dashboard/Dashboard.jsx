import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/authContext'
import { profileColumns } from '../auth/access'
import { supabase } from '../../lib/supabase'
import './Dashboard.css'

const sections = {
  Student: [['Events', 'event'], ['My registrations', 'registration'], ['My profile', 'students'], ['Notifications', 'notifications']],
  'Student Organization': [['Proposals', 'event_proposal'], ['Schedule options', 'proposal_schedule'], ['Reviews', 'proposal_review'], ['My events', 'event'], ['Event registrations', 'registration'], ['Participants', 'students'], ['Venue bookings', 'venue_booking'], ['Venues', 'venue'], ['Event types', 'event_type'], ['Notifications', 'notifications']],
  Admin: [['Proposals', 'event_proposal'], ['Reviews', 'proposal_review'], ['Schedules', 'proposal_schedule'], ['Events', 'event'], ['Registrations', 'registration'], ['Venue bookings', 'venue_booking'], ['Venues', 'venue'], ['Event types', 'event_type'], ['Users', 'users'], ['Students', 'students'], ['Organizations', 'student_organization'], ['Notifications', 'notifications']],
}
const primaryKeys = { event: 'event_id', event_proposal: 'proposal_id', proposal_schedule: 'schedule_id', proposal_review: 'review_id', registration: 'reg_id', venue_booking: 'booking_id', venue: 'venue_id', event_type: 'event_type_id', notifications: 'notification_id', users: 'user_id', students: 'student_number', student_organization: 'org_id' }
const fields = {
  event_proposal: [['event_name','Event name'],['objectives','Objectives'],['description','Description'],['event_type_id','Event type'],['expected_count_attendees','Expected attendees','number'],['eligibility_mode','Who can attend',['University-Wide','College-Specific']],['allowed_college','Allowed college (for college-specific events)','optional'],['resource_requirements','Resources','optional'],['budget_information','Budget information','optional']],
  proposal_schedule: [['proposal_id','Proposal'],['venue_id','Venue (optional for online events)','optional'],['starts_at','Starts at','datetime-local'],['ends_at','Ends at','datetime-local'],['schedule_type','Schedule option',['Primary','Backup']]],
  venue: [['venue_name','Venue name'],['building','Building'],['max_capacity','Maximum capacity','number'],['floor_number','Floor','optional'],['room_number','Room','optional'],['available_equipment','Equipment','optional']],
  event_type: [['description','Event type name'],['modality','Modality',['On-Site','Online','Hybrid']],['requires_venue','Requires venue',['true','false']]],
  event: [['proposal_id','Approved proposal'],['event_type_id','Event type'],['org_id','Organization'],['starts_at','Starts at','datetime-local'],['ends_at','Ends at','datetime-local'],['registration_capacity','Registration capacity','number']],
  venue_booking: [['event_id','Event'],['venue_id','Venue'],['starts_at','Starts at','datetime-local'],['ends_at','Ends at','datetime-local'],['buffer_minutes','Buffer minutes','number'],['booking_status','Booking status',['Pending','Confirmed','Cancelled','Replaced','Rejected']],['change_reason','Reason','optional']],
}
const label = text => text.replaceAll('_', ' ')
const newId = prefix => `${prefix}-${crypto.randomUUID().replaceAll('-','').slice(0,prefix === 'T' ? 18 : 24)}`

function EntryForm({ table, onSave, onCancel, initial, lookups, now }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const formFields = table === 'event_proposal' && !initial ? [...fields[table], ...fields.proposal_schedule.filter(([name]) => ['venue_id','starts_at','ends_at'].includes(name))] : fields[table]
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true)
    const data = Object.fromEntries(new FormData(event.currentTarget))
    for (const [name,,type] of formFields) {
      if (type === 'number') data[name] = Number(data[name])
      if (type === 'datetime-local') data[name] = new Date(data[name]).toISOString()
      if (type === 'optional' && !data[name]) data[name] = null
      if (name === 'requires_venue') data[name] = data[name] === 'true'
    }
    if (data.eligibility_mode === 'College-Specific' && !data.allowed_college) { setError('Enter the allowed college.'); setBusy(false); return }
    if (data.eligibility_mode === 'University-Wide') data.allowed_college = null
    if (['event_proposal','proposal_schedule'].includes(table) && data.starts_at && Date.parse(data.starts_at) < now + 15*24*60*60*1000) { setError('Choose an event start at least 15 full days from now.'); setBusy(false); return }
    if (data.ends_at && Date.parse(data.ends_at) <= Date.parse(data.starts_at)) { setError('The end must be after the start.'); setBusy(false); return }
    try { await onSave(data) } catch (error) { setError(error.message) } finally { setBusy(false) }
  }
  return <form className="entry-form" onSubmit={submit}><h2>{initial ? 'Edit' : 'Create'} {label(table)}</h2>{['event_proposal','proposal_schedule'].includes(table) && <p>Every schedule must start at least 15 full days from submission or schedule change. New proposals include a primary schedule.</p>}{formFields.map(([name,title,type]) => {
    const options = lookups[name]
    return <label key={name}>{title}{Array.isArray(type) ? <select name={name} defaultValue={initial?.[name] ?? type[0]}>{type.map(value => <option key={value}>{value}</option>)}</select> : options ? <select name={name} required={type !== 'optional'} defaultValue={initial?.[name] ?? ''}><option value="">Choose…</option>{options.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select> : <input name={name} type={type === 'optional' ? 'text' : type ?? 'text'} min={type === 'number' ? 0 : undefined} required={type !== 'optional'} defaultValue={type === 'datetime-local' && initial?.[name] ? new Date(new Date(initial[name]).getTime() - new Date(initial[name]).getTimezoneOffset()*60000).toISOString().slice(0,16) : initial?.[name] ?? ''} />}</label>
  })}{error && <p role="alert">{error}</p>}<div className="actions"><button disabled={busy}>{busy ? 'Saving…' : 'Save'}</button><button type="button" onClick={onCancel}>Cancel</button></div></form>
}
export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [table, setTable] = useState(sections[profile.role][0][1])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const [entry, setEntry] = useState(null)
  const [lookups, setLookups] = useState({})
  const [cancelTarget, setCancelTarget] = useState(null)
  const [reviewTarget, setReviewTarget] = useState(null)
  const [notice, setNotice] = useState('')
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer) }, [])
  const isAdmin = profile.role === 'Admin'
  const isOrganization = profile.role === 'Student Organization'
  useEffect(() => {
    let active = true
    async function loadRows() {
    await Promise.resolve()
    if (!active) return
    setLoading(true); setError(''); setRows([]); setEntry(null); setCancelTarget(null); setReviewTarget(null)
    const query = supabase.from(table).select(table === 'users' ? profileColumns : '*').limit(200)
    query.then(({ data, error }) => {
      if (!active) return
      setError(error ? error.message : ''); setRows(data ?? []); setLoading(false)
    })
    }
    loadRows()
    return () => { active = false }
  }, [table, revision, profile.user_id])
  useEffect(() => {
    let active = true
    async function load() {
      const results = await Promise.all(['event_type','event_proposal','venue', ...(isAdmin ? ['student_organization','event'] : [])].map(name => supabase.from(name).select('*').limit(1000)))
      if (!active) return
      const [types, proposals, venues, organizations, events] = results
      setLookups({ event_type_id: (types.data ?? []).map(r => ({ id: r.event_type_id, name: r.description })),
        proposal_id: (proposals.data ?? []).filter(r => table !== 'event' || r.approval_status === 'Approved').map(r => ({ id: r.proposal_id, name: r.event_name })),
        venue_id: (venues.data ?? []).map(r => ({ id: r.venue_id, name: r.venue_name })),
        org_id: (organizations?.data ?? []).map(r => ({ id: r.org_id, name: r.org_name })),
        event_id: (events?.data ?? []).map(r => ({ id: r.event_id, name: r.event_id })),
      })
    }
    if (profile.role !== 'Student') load()
    return () => { active = false }
  }, [isAdmin, profile.role, table, revision])
  async function run(operation) {
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await operation()
      if (result.error) throw result.error
      if (Array.isArray(result.data) && result.data.length === 0) throw new Error('No record changed. Your access or this record may have changed; refresh and try again.')
      setNotice('Saved successfully.'); setRevision(v => v + 1)
      return true
    } catch (error) { setError(error.message); return false } finally { setBusy(false) }
  }
  async function save(data) {
    const key = primaryKeys[table]
    let result
    if (table === 'event_proposal' && !entry?.proposal_id) {
      const { starts_at, ends_at, venue_id, ...proposal } = data
      result = await supabase.rpc('submit_proposal', { proposal, schedule: { starts_at, ends_at, venue_id } })
      if (result.error) throw new Error(result.error.message)
      setEntry(null); setNotice('Proposal and primary schedule submitted successfully.'); setRevision(v => v + 1)
      return
    }
    if (entry?.[key]) {
      if (table === 'event_proposal') data.approval_status = 'Pending'
      result = await supabase.from(table).update(data).eq(key,entry[key]).select()
    } else {
      data[key] = newId(table === 'event_proposal' ? 'P' : table === 'proposal_schedule' ? 'S' : table === 'venue_booking' ? 'B' : table === 'event_type' ? 'T' : table === 'venue' ? 'V' : 'E')
      if (table === 'event_proposal') Object.assign(data,{ org_id: profile.user_id, approval_status:'Pending', submission_date: new Date().toISOString(), includes_sponsorship:false })
      if (table === 'event') Object.assign(data,{ publication_status:'Draft', registration_status:'Closed', event_status:'Upcoming' })
      if (table === 'venue_booking') data.authorized_by = profile.user_id
      result = await supabase.from(table).insert(data).select()
    }
    if (result.error) throw new Error(result.error.message)
    if (!result.data?.length) throw new Error('No record changed. Check your access.')
    setEntry(null); setNotice('Saved successfully.'); setRevision(v => v + 1)
  }
  const canCreate = !!fields[table] && ((isAdmin && table !== 'event_proposal') || (isOrganization && ['event_proposal','proposal_schedule'].includes(table)))
  const columns = Object.keys(rows[0] ?? {}).filter(c => !['password','auth_user_id'].includes(c))
  return <main className="workspace"><header className="workspace-header"><div><p className="workspace-brand">PLM SEAMS</p><h1>{profile.role} workspace</h1><p>{profile.plm_email}</p></div><button onClick={async () => { const { error } = await supabase.auth.signOut({ scope:'local' }); if (error) setError(error.message); else navigate('/',{ replace:true }) }}>Sign out</button></header>
    <nav className="workspace-tabs" aria-label="Workspace sections">{sections[profile.role].map(([name,value]) => <button className={table===value?'selected':''} key={value} onClick={() => { setTable(value); setNotice('') }}>{name}</button>)}</nav>
    <section className="workspace-panel"><div className="section-header"><h2>{sections[profile.role].find(([,value]) => value===table)?.[0]}</h2><div className="actions"><button disabled={loading || busy} onClick={() => setRevision(v => v+1)}>Refresh</button>{canCreate && <button onClick={() => setEntry({})}>Create</button>}</div></div>
      {error && <p role="alert" className="workspace-error">{error}</p>}{notice && <p role="status">{notice}</p>}
      {entry && <EntryForm key={`${table}-${entry[primaryKeys[table]] ?? 'new'}`} table={table} initial={entry[primaryKeys[table]] ? entry : null} lookups={lookups} now={now} onSave={save} onCancel={() => setEntry(null)} />}
      {cancelTarget && <form className="entry-form" onSubmit={async e => { e.preventDefault(); const reason = new FormData(e.currentTarget).get('reason'); if (await run(() => supabase.rpc('cancel_registration',{ rid:cancelTarget.reg_id, reason }))) setCancelTarget(null) }}><h3>Cancel registration</h3><label>Reason<input name="reason" maxLength={500} required /></label><button disabled={busy}>Confirm cancellation</button><button type="button" onClick={() => setCancelTarget(null)}>Keep registration</button></form>}
      {reviewTarget && <form className="entry-form" onSubmit={async e => { e.preventDefault(); const values=Object.fromEntries(new FormData(e.currentTarget)); if (await run(() => supabase.rpc('review_proposal',{ pid:reviewTarget.proposal_id,...values }))) setReviewTarget(null) }}><h3>Review {reviewTarget.event_name}</h3><label>Decision<select name="decision"><option>Approved</option><option>Rejected</option><option>Revisions Required</option></select></label><label>Remarks<textarea name="remarks" maxLength={2000} /></label><button disabled={busy}>Save review</button><button type="button" onClick={() => setReviewTarget(null)}>Cancel</button></form>}
      {loading ? <p role="status">Loading…</p> : !rows.length ? <p>No records available for your account.</p> : <><p className="record-count">Showing up to 200 records permitted for your account.</p><div className="workspace-table"><table><thead><tr>{columns.map(c => <th key={c}>{label(c)}</th>)}<th>Actions</th></tr></thead><tbody>{rows.map(row => <tr key={row[primaryKeys[table]]}>{columns.map(c => <td key={c}>{row[c] == null ? '—' : String(row[c])}</td>)}<td><div className="actions">
        {table==='event' && profile.role==='Student' && row.registration_status==='Open' && row.event_status==='Upcoming' && Date.parse(row.starts_at)>now && <button disabled={busy} onClick={() => run(() => supabase.rpc('register_event',{ eid:row.event_id }))}>Register</button>}
        {table==='registration' && profile.role==='Student' && row.reg_status!=='Cancelled' && <button disabled={busy} onClick={() => setCancelTarget(row)}>Cancel registration</button>}
        {table==='registration' && isOrganization && row.reg_status==='Confirmed' && ['Present','Absent'].map(status => <button disabled={busy} key={status} onClick={() => run(() => supabase.rpc('mark_attendance',{ rid:row.reg_id,status }))}>{status}</button>)}
        {table==='event_proposal' && isAdmin && <button onClick={() => setReviewTarget(row)}>Review</button>}
        {table==='event_proposal' && isOrganization && ['Pending','Revisions Required'].includes(row.approval_status) && <><button onClick={() => setEntry(row)}>Edit</button><button disabled={busy} onClick={() => { if (window.confirm('Delete this proposal? Proposals with linked records must be kept.')) run(() => supabase.from(table).delete().eq('proposal_id',row.proposal_id).select()) }}>Delete</button></>}
        {table==='proposal_schedule' && isOrganization && <><button onClick={() => setEntry(row)}>Edit</button><button disabled={busy} onClick={() => { if (window.confirm('Delete this schedule option?')) run(() => supabase.from(table).delete().eq('schedule_id',row.schedule_id).select()) }}>Delete</button></>}
        {isAdmin && fields[table] && table!=='event_proposal' && <button onClick={() => setEntry(row)}>Edit</button>}
        {table==='event' && (isOrganization || isAdmin) && <><button disabled={busy} onClick={() => run(() => supabase.from('event').update({ publication_status:row.publication_status==='Published'?'Unpublished':'Published' }).eq('event_id',row.event_id).select())}>{row.publication_status==='Published'?'Unpublish':'Publish'}</button><button disabled={busy} onClick={() => run(() => supabase.from('event').update({ registration_status:row.registration_status==='Open'?'Closed':'Open' }).eq('event_id',row.event_id).select())}>{row.registration_status==='Open'?'Close registration':'Open registration'}</button></>}
        {table==='notifications' && <><button disabled={busy} onClick={() => run(() => supabase.from(table).update({read_at:new Date().toISOString()}).eq('notification_id',row.notification_id).select())}>Mark read</button><button disabled={busy} onClick={() => run(() => supabase.from(table).delete().eq('notification_id',row.notification_id).select())}>Delete</button></>}
      </div></td></tr>)}</tbody></table></div></>}
    </section></main>
}
