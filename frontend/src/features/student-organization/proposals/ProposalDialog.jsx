import { useEffect, useId, useRef } from 'react'
import ProposalIcon from './ProposalIcon'
import './Proposals.css'

// Native <dialog> opened with showModal(): the browser traps focus, focus returns to the
// opener on unmount, and ESC / Cancel / the close icon dismiss it unless a request is in flight.
// tone: 'default' (gold confirm) or 'danger' (red confirm).
export default function ProposalDialog({ title, children, confirmLabel, busyLabel = 'Working\u2026', cancelLabel = 'Cancel', tone = 'default', busy = false, error = '', onConfirm, onClose }) {
  const ref = useRef(null)
  const id = useId()
  useEffect(() => {
    const previous = document.activeElement
    const dialog = ref.current
    if (!dialog.open) dialog.showModal()
    dialog.querySelector('[data-initial-focus]')?.focus()
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
  return <dialog ref={ref} className="organization-proposal-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-text`} onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }} onKeyDown={trapTab}>
    <header className="organization-proposal-dialog-head">
      <div>
        <h2 id={`${id}-title`}>{title}</h2>
        <div id={`${id}-text`} className="organization-proposal-dialog-text">{children}</div>
      </div>
      <button type="button" className="organization-proposal-dialog-close" onClick={onClose} disabled={busy} aria-label="Close dialog"><ProposalIcon name="close" size={18} /></button>
    </header>
    <div className="organization-proposal-dialog-body">
      <p className="organization-proposal-dialog-error" role="alert">{error}</p>
      <div className="organization-proposal-dialog-actions">
        <button type="button" className={`organization-proposal-dialog-confirm ${tone === 'danger' ? 'is-danger' : ''}`} onClick={onConfirm} disabled={busy}>{busy ? busyLabel : confirmLabel}</button>
        <button type="button" className="organization-proposal-dialog-cancel" onClick={onClose} disabled={busy} data-initial-focus>{cancelLabel}</button>
      </div>
    </div>
  </dialog>
}
