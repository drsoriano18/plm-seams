import { markAttendance } from './attendeesApi.js'

// Optimistic mark: patch(regId, status, at) updates local rows. Reverts to the previous status on failure.
export async function markRow(client, row, status, patch) {
  const previous = { status: row.attendance_status ?? null, at: row.attendance_marked_at ?? null }
  patch(row.reg_id, status, new Date().toISOString())
  const result = await markAttendance(client, row.reg_id, status)
  if (!result.ok) patch(row.reg_id, previous.status, previous.at)
  return result
}

// Runs strictly one at a time and continues after a failure.
export async function markSequence(client, rows, status, { patch, onProgress }) {
  const succeeded = []
  const failed = []
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const result = await markRow(client, row, status, patch)
    if (result.ok) succeeded.push(row.reg_id)
    else failed.push({ reg_id: row.reg_id, code: result.code, message: result.message })
    if (onProgress) onProgress(index + 1, rows.length)
  }
  return { succeeded, failed }
}

export function bulkNotice(status, { succeeded, failed }) {
  const text = `${succeeded.length} marked ${status}.${failed.length ? ` ${failed.length} failed.` : ''}`
  if (!failed.length) return { tone: 'success', title: text }
  if (!succeeded.length) return { tone: 'error', title: text, text: failed[0].message }
  return { tone: 'info', title: text, text: failed[0].message }
}
