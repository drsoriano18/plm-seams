import ArchiveIcon from './ArchiveIcon'

// The live region stays mounted so screen readers announce the card when it appears.
export default function ArchiveNotice({ visible, onClose }) {
  return <div className="organization-archive-notice-slot" role="status" aria-live="polite">
    {visible ? <div className="organization-archive-notice">
      <div>
        <strong>No archived events match your filters.</strong>
        <p>Try adjusting the event name, status or date filters to broaden your search.</p>
      </div>
      <button type="button" onClick={onClose} aria-label="Dismiss notification"><ArchiveIcon name="close" size={16} /></button>
    </div> : null}
  </div>
}
