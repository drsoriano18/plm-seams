export default function AttendeeBulkBar({ count, canMark, hintId, progress, onMark, onClear }) {
  const busy = Boolean(progress)
  const disabled = !canMark || busy
  const aria = { 'aria-disabled': disabled ? 'true' : undefined, 'aria-describedby': !canMark ? hintId : undefined }
  const press = (status) => () => { if (!disabled) onMark(status) }
  return <div className="organization-attendees-bulk" role="region" aria-label="Bulk Attendance">
    <p><strong>{count} selected</strong>{progress ? <span role="status">Marking {progress.done} of {progress.total}{'\u2026'}</span> : null}</p>
    <div>
      <button type="button" className="is-present" onClick={press('Present')} {...aria}>Mark Present</button>
      <button type="button" className="is-absent" onClick={press('Absent')} {...aria}>Mark Absent</button>
      <button type="button" className="is-clear" aria-disabled={busy ? 'true' : undefined} onClick={() => { if (!busy) onClear() }}>Clear</button>
    </div>
  </div>
}
