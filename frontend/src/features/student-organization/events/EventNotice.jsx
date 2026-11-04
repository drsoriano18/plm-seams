import { useEffect } from 'react'
import EventsIcon from './EventsIcon'

const DISMISS_MS = 6000

// The live region stays mounted so screen readers announce the card when it appears.
// notice: { id, tone: 'info' | 'success' | 'error', title, text, link?: { to, label } } or null.
export default function EventNotice({ notice, onClose, children }) {
  const id = notice?.id
  const sticky = Boolean(notice?.sticky)
  useEffect(() => {
    if (id == null || sticky) return undefined
    const timer = setTimeout(onClose, DISMISS_MS)
    return () => clearTimeout(timer)
  }, [id, sticky, onClose])
  return <div className="organization-events-notice-slot" role="status" aria-live="polite">
    {notice ? <div className={`organization-events-notice is-${notice.tone || 'info'}`}>
      <div>
        <strong>{notice.title}</strong>
        {notice.text ? <p>{notice.text}</p> : null}
        {children}
      </div>
      <button type="button" onClick={onClose} aria-label="Dismiss notification"><EventsIcon name="close" size={16} /></button>
    </div> : null}
  </div>
}
