const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' })
function format(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : formatter.format(date)
}
export default function NotificationDates({ notification }) {
  return <time dateTime={notification.created_at}>Sent: {format(notification.created_at)}</time>
}
