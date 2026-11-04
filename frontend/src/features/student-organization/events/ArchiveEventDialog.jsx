import { useEffect, useRef } from 'react'
import EventsIcon from './EventsIcon'
import { STATE_LABEL } from './eventState.js'

// Native <dialog> opened with showModal(): focus is trapped by the browser, restored on unmount,
// and ESC / Cancel / the close icon dismiss it unless an archive request is in flight.
export default function ArchiveEventDialog({ detail, busy, error, onConfirm, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    const dialog = ref.current
    if (!dialog.open) dialog.showModal()
    return () => { previous?.focus?.() }
  }, [])
  const trapTab = (event) => {
    if (event.key !== 'Tab') return
    const buttons = [...ref.current.querySelectorAll('button:not(:disabled)')]
    const firstButton = buttons[0]
    const lastButton = buttons.at(-1)
    if (event.shiftKey && document.activeElement === firstButton) { event.preventDefault(); lastButton?.focus() }
    if (!event.shiftKey && document.activeElement === lastButton) { event.preventDefault(); firstButton?.focus() }
  }
  return <dialog ref={ref} className="organization-archive-dialog" aria-labelledby="archive-dialog-title" aria-describedby="archive-dialog-text" onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }} onKeyDown={trapTab}>
    <header className="organization-archive-dialog-head">
      <div>
        <p className="organization-archive-dialog-eyebrow">Archive Confirmation</p>
        <h2 id="archive-dialog-title">Archive {detail.title}?</h2>
        <p id="archive-dialog-text">Are you sure you want to archive this event?</p>
      </div>
      <button type="button" className="organization-archive-dialog-close" onClick={onClose} disabled={busy} aria-label="Close archive confirmation"><EventsIcon name="close" size={18} /></button>
    </header>
    <div className="organization-archive-dialog-body">
      <section className="organization-archive-dialog-event" aria-label="Event to archive">
        <div>
          <p className="organization-archive-dialog-label">Event to Archive</p>
          <p className="organization-archive-dialog-name">{detail.title}</p>
        </div>
        <span className={`organization-state-pill is-${detail.derived.toLowerCase()}`}>{STATE_LABEL[detail.derived]}</span>
      </section>
      <dl className="organization-archive-dialog-times">
        <div><dt>Starts</dt><dd>{detail.starts_date || 'N/A'}</dd><dd>{detail.starts_time}</dd></div>
        <div><dt>Concludes</dt><dd>{detail.ends_date || 'N/A'}</dd><dd>{detail.ends_time}</dd></div>
      </dl>
      <p className="organization-archive-dialog-error" role="alert">{error}</p>
      <div className="organization-archive-dialog-actions">
        <button type="button" className="organization-archive-dialog-confirm" onClick={onConfirm} disabled={busy}><EventsIcon name="archive" size={16} />{busy ? 'Archiving\u2026' : 'Confirm Archive'}</button>
        <button type="button" className="organization-archive-dialog-cancel" onClick={onClose} disabled={busy}>Cancel</button>
      </div>
    </div>
  </dialog>
}
