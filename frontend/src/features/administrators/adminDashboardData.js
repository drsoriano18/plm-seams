const day = 24 * 60 * 60 * 1000
export const adminTimeZone = 'Asia/Manila'
const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: adminTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' })

export function agendaWindow(now = Date.now()) {
  const start = Date.parse(`${dateKeyFormatter.format(now)}T00:00:00+08:00`)
  return { start, tomorrow: start + day, end: start + 2 * day }
}

export function actionableProposals(proposals) {
  return proposals.filter(proposal => proposal.approval_status === 'Pending')
    .toSorted((a, b) => Date.parse(b.submission_date) - Date.parse(a.submission_date) || a.proposal_id.localeCompare(b.proposal_id))
}

export function allProposals(proposals) {
  return proposals.toSorted((a, b) => Date.parse(b.submission_date) - Date.parse(a.submission_date) || a.proposal_id.localeCompare(b.proposal_id))
}

export function isResubmitted(proposal) {
  const latestReview = (proposal.reviews || []).toSorted((a, b) => Date.parse(b.reviewed_at) - Date.parse(a.reviewed_at))[0]
  return proposal.approval_status === 'Pending' && latestReview?.review_decision === 'Revisions Required'
}

export function agendaEvents(events, now = Date.now()) {
  const { end } = agendaWindow(now)
  return events.filter(event => event.publication_status === 'Published'
    && event.proposal?.approval_status === 'Approved'
    && ['Upcoming', 'Ongoing'].includes(event.event_status)
    && Date.parse(event.starts_at) < end && Date.parse(event.ends_at) > now)
    .toSorted((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at) || a.event_id.localeCompare(b.event_id))
}

export function relativeTime(value, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - Date.parse(value)) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

// Supabase caps each response. Paginate so Review All includes the complete queue.
async function allRows(query) {
  const rows = []
  const pageSize = 500
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await query().range(offset, offset + pageSize - 1)
    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < pageSize) return rows
  }
}

export async function loadAdminProposals(client) {
  const proposals = await allRows(() => client.from('event_proposal')
    .select('proposal_id,event_name,submission_date,approval_status,expected_count_attendees,allowed_college,organization:student_organization(org_name,college),schedules:proposal_schedule(schedule_id,starts_at,ends_at,schedule_type,venue:venue(venue_id,venue_name)),reviews:proposal_review(review_decision,reviewed_at),events:event(event_id)')
    .order('submission_date', { ascending: false }).order('proposal_id'))
  return allProposals(proposals.map(proposal => ({ ...proposal, events: Array.isArray(proposal.events) ? proposal.events : proposal.events ? [proposal.events] : [] })))
}

export async function loadAdminAgenda(client, now = Date.now()) {
  const { end } = agendaWindow(now)
  return agendaEvents(await allRows(() => client.from('event')
    .select('event_id,starts_at,ends_at,event_status,publication_status,proposal:event_proposal!inner(event_name,approval_status),bookings:venue_booking(booking_status,venue:venue(venue_name))')
    .eq('publication_status', 'Published').eq('proposal.approval_status', 'Approved')
    .in('event_status', ['Upcoming', 'Ongoing'])
    .gt('ends_at', new Date(now).toISOString()).lt('starts_at', new Date(end).toISOString())
    .order('starts_at').order('event_id')), now)
}

export async function loadAdminNotifications(client, userId) {
  return allRows(() => client.from('notifications')
    .select('notification_id,notification_type,message,created_at,read_at')
    .eq('recipient_user_id', userId).order('created_at', { ascending: false }).order('notification_id'))
}

export async function markAdminNotificationRead(client, userId, notificationId) {
  const { data, error } = await client.from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('notification_id', notificationId).eq('recipient_user_id', userId)
    .select('notification_id,read_at').maybeSingle()
  if (error || !data) throw error || new Error('Notification unavailable')
  return data
}

export async function deleteAdminNotification(client, userId, notificationId) {
  const { error } = await client.from('notifications').delete().eq('notification_id', notificationId).eq('recipient_user_id', userId)
  if (error) throw error
}

export async function loadAdminProfile(client, userId) {
  const { data, error } = await client.from('administrators').select('admin_id,name,position,office_assigned,profile_image_path').eq('admin_id', userId).maybeSingle()
  if (error) throw new Error('Unable to load administrator profile. Please try again.')
  return data
}
