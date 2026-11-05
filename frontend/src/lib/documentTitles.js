export const LANDING_TITLE = 'PLM SEAMS | Student Events and Administration Management System'

// Ordered list: the first matching pattern wins. ":name" matches one path segment.
// To title a new route, add one entry here.
export const documentTitles = [
  { pattern: '/', title: LANDING_TITLE },
  { pattern: '/student/login', title: 'Student Login' },
  { pattern: '/student-organization/login', title: 'Organization Login' },
  { pattern: '/admin/login', title: 'Admin Login' },

  { pattern: '/student/dashboard', title: 'Student Dashboard' },
  { pattern: '/student/discover', title: 'Discover Events' },
  { pattern: '/student/profile', title: 'Student Profile' },
  { pattern: '/student/profile/settings', title: 'Student Account Settings' },
  { pattern: '/student/events/:eventId', title: 'Event Details' },

  { pattern: '/student-organization/dashboard', title: 'Organization Dashboard' },
  { pattern: '/student-organization/calendar', title: 'Calendar' },
  { pattern: '/student-organization/calendar/approved-events', title: 'Approved Events' },
  { pattern: '/student-organization/archives', title: 'Archived Events' },
  { pattern: '/student-organization/archives/:eventId', title: 'Archived Event Details' },
  { pattern: '/student-organization/archives/:eventId/registrations', title: 'Registrations & Attendees' },
  { pattern: '/student-organization/archives/:eventId/attendance', title: 'Registrations & Attendees' },
  { pattern: '/student-organization/profile', title: 'Organization Profile' },
  { pattern: '/student-organization/profile/settings', title: 'Organization Settings' },
  { pattern: '/student-organization/proposals/create', title: 'Create Event Proposal' },
  { pattern: '/student-organization/proposals/:proposalId', title: 'Event Proposal' },
  { pattern: '/student-organization/events/:eventId', title: 'Organization Event Details' },
  { pattern: '/student-organization/events/:eventId/attendance', title: 'Event Attendees' },

  { pattern: '/admin/dashboard', title: 'Admin Dashboard' },
  { pattern: '/admin/account', title: 'Admin Account Settings' },
  { pattern: '/admin/profile', title: 'Admin Profile' },
  { pattern: '/admin/calendar', title: 'Admin Calendar' },
  { pattern: '/admin/calendar/events', title: 'Manage Approved Events' },
  { pattern: '/admin/archives', title: 'Admin Archived Events' },
  { pattern: '/admin/archives/:eventId', title: 'Admin Archived Event' },
  { pattern: '/admin/archives/:eventId/attendees', title: 'Manage Attendees' },
  { pattern: '/admin/proposals', title: 'Event Proposals Review' },
  { pattern: '/admin/proposals/:proposalId', title: 'Proposal Review' },
]

const segments = (path) => path.split('/').filter(Boolean)

function matches(pattern, pathname) {
  const want = segments(pattern)
  const have = segments(pathname)
  return want.length === have.length && want.every((part, i) => part.startsWith(':') ? have[i].length > 0 : part === have[i])
}

export function getDocumentTitle(pathname) {
  const entry = documentTitles.find(({ pattern }) => matches(pattern, pathname))
  return entry ? entry.title : LANDING_TITLE
}
