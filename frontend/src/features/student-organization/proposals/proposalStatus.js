// Pure status helpers for event proposals. The database stores approval_status as
// Pending, Approved, Rejected or Revisions Required. 'Draft' is a front-end status that
// becomes real once the backend supports saving drafts.
export const PROPOSALS_PATH = '/student-organization/proposals'
export const CREATE_PROPOSAL_PATH = `${PROPOSALS_PATH}/create`

export const STATUS_DRAFT = 'Draft'
export const STATUS_PENDING = 'Pending'
export const STATUS_APPROVED = 'Approved'
export const STATUS_REJECTED = 'Rejected'
export const STATUS_REVISIONS = 'Revisions Required'

const EDITABLE = [STATUS_DRAFT, STATUS_REVISIONS]

// 'editable' for Draft and Revisions Required. Everything else, including unknown values, is read-only.
export function proposalMode(status) {
  return EDITABLE.includes(status) ? 'editable' : 'readonly'
}

export const isEditableStatus = (status) => proposalMode(status) === 'editable'

export const proposalPath = (id) => `${PROPOSALS_PATH}/${encodeURIComponent(id)}`

export function proposalActionLabel(status) {
  if (status === STATUS_DRAFT) return 'Continue Draft'
  if (status === STATUS_REVISIONS) return 'Submit Revision'
  return 'View'
}

// { label, tone } where tone is one of: draft, pending, approved, rejected, revision, unknown.
export function statusBadge(status) {
  switch (status) {
    case STATUS_DRAFT: return { label: 'Saved as Draft', tone: 'draft' }
    case STATUS_REVISIONS: return { label: 'Returned for Revision', tone: 'revision' }
    case STATUS_PENDING: return { label: 'Pending Review', tone: 'pending' }
    case STATUS_APPROVED: return { label: 'Approved', tone: 'approved' }
    case STATUS_REJECTED: return { label: 'Rejected', tone: 'rejected' }
    default: return { label: typeof status === 'string' && status.trim() ? status.trim() : 'Unknown', tone: 'unknown' }
  }
}
