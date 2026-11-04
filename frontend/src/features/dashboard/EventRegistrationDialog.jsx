import { useEffect, useRef } from 'react'
import './EventRegistrationDialog.css'

const icons = import.meta.glob('../../assets/event-ui/*.svg', { eager: true, query: '?url', import: 'default' })
const states = {
  confirmed: { title: 'Registration Confirmed', message: 'You have successfully registered for this event!' },
  waitlisted: { title: 'You’re on the waitlist', message: 'You are in the waitlist for this event.' },
  'cancel-confirm': { title: 'Cancel Registration?', message: 'Are you sure you want to cancel your registration for this event? Your registration will be cancelled and any confirmed slot will be released.' },
  cancelled: { title: 'Registration Cancelled', message: 'You have cancelled your registration for this event.' },
  ineligible: { title: 'Not Eligible to Register', message: 'Unfortunately, your college is not eligible for this event. Eligibility is subject to selected colleges.' },
}

export default function EventRegistrationDialog({ state, reason, onReasonChange, busy, onConfirm, onClose }) {
  const ref = useRef(null)
  const content = states[state]
  useEffect(() => {
    const previous = document.activeElement
    ref.current.showModal()
    return () => { previous?.focus() }
  }, [])
  return <dialog ref={ref} className={`student-event-dialog is-${state}`} aria-labelledby="event-dialog-title" aria-describedby="event-dialog-message" onCancel={e => { e.preventDefault(); if (!busy) onClose() }} onKeyDown={e => {
    if (e.key !== 'Tab') return
    const buttons = [...ref.current.querySelectorAll('button:not(:disabled), textarea')]
    const first = buttons[0], last = buttons.at(-1)
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
    if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
  }}>
    <div className="event-dialog-content">
      <div className="event-dialog-heading">
        <span className="event-dialog-symbol"><img src={icons[`../../assets/event-ui/${state}.svg`]} alt="" /></span>
        <h2 id="event-dialog-title">{content.title}</h2>
      </div>
      <p id="event-dialog-message">{content.message}</p>
      {state === 'cancel-confirm' && <div className="event-dialog-reason">
        <label htmlFor="event-cancellation-reason">Please state the reason for your cancellation here:</label>
        <textarea id="event-cancellation-reason" value={reason} onChange={e => onReasonChange(e.target.value)} placeholder="Cancellation reason...." aria-label="Cancellation reason" />
      </div>}
    </div>
    <div className="event-dialog-actions">
      {state === 'cancel-confirm' ? <><button className="is-danger" type="button" onClick={onConfirm} disabled={busy}>Yes</button><button className="is-secondary" type="button" onClick={onClose} disabled={busy}>No</button></> : <button type="button" onClick={onClose}>OK</button>}
    </div>
  </dialog>
}
