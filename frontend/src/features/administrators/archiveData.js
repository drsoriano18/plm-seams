import { adminTimeZone } from './adminDashboardData'

const pageSize = 6
async function allRows(query) {
  const rows = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await query().range(offset, offset + 499)
    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < 500) return rows
  }
}

export const archiveDate = value => new Intl.DateTimeFormat('en-US', { timeZone: adminTimeZone, month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value))
export const archiveDateTime = value => new Intl.DateTimeFormat('en-US', { timeZone: adminTimeZone, month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))

const eventSelect = 'event_id,proposal_id,starts_at,ends_at,event_status,publication_status,registration_status,registration_capacity,org_id,archived_at,completed_at,cancellation_reason,proposal:event_proposal(event_name,description,objectives,expected_count_attendees,organization:student_organization(org_name)),bookings:venue_booking(booking_id,venue_id,starts_at,ends_at,booking_status,venue:venue(venue_name,building))'

export async function loadArchivedEvents(client) {
  return allRows(() => client.from('event').select(eventSelect).not('archived_at', 'is', null).in('event_status', ['Completed', 'Cancelled']).order('archived_at', { ascending: false }).order('event_id', { ascending: false }))
}

export async function loadArchivedEvent(client, eventId) {
  const { data, error } = await client.from('event').select(eventSelect).eq('event_id', eventId).not('archived_at', 'is', null).in('event_status', ['Completed', 'Cancelled']).maybeSingle()
  if (error || !data) throw error || new Error('Archived event unavailable.')
  return data
}

export async function loadArchivedRegistrations(client, eventId) {
  const { data, error } = await client.from('registration').select('reg_id,reg_date,reg_status,attendance_status,student:students(student_number,name,year_level,college,program)').eq('event_id', eventId).order('reg_date').order('reg_id')
  if (error) throw error
  return data || []
}

export { pageSize }
