import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' })
function format(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : formatter.format(date)
}
export default function NotificationDates({ notification }) {
  const [eventDate, setEventDate] = useState(null)
  useEffect(() => {
    let active = true
    if (!notification.event_id) return
    async function load() {
      try {
        const { data, error } = await supabase.rpc('get_student_event_details', { eid: notification.event_id })
        const event = Array.isArray(data) ? data[0] : data
        if (active && !error) setEventDate({ id: notification.event_id, starts: event?.starts_at })
      } catch { /* Keep the original sent date when event access is unavailable. */ }
    }
    load()
    return () => { active = false }
  }, [notification.event_id])
  const starts = eventDate?.id === notification.event_id ? eventDate.starts : null
  return <>{starts && <time dateTime={starts}>Event: {format(starts)}</time>}<time dateTime={notification.created_at}>Sent: {format(notification.created_at)}</time></>
}
