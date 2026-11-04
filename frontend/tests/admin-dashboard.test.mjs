import { test } from 'node:test'
import assert from 'node:assert/strict'
import { actionableProposals, agendaEvents, agendaWindow, allProposals, isResubmitted, loadAdminProposals } from '../src/features/administrators/adminDashboardData.js'

test('review queue excludes returned and decided proposals and puts newest submissions first', () => {
  const proposals = [
    { proposal_id: 'old', approval_status: 'Pending', submission_date: '2026-11-01T00:00:00Z' },
    { proposal_id: 'returned', approval_status: 'Revisions Required', submission_date: '2026-11-04T00:00:00Z' },
    { proposal_id: 'approved', approval_status: 'Approved', submission_date: '2026-11-04T00:00:00Z' },
    { proposal_id: 'rejected', approval_status: 'Rejected', submission_date: '2026-11-04T00:00:00Z' },
    { proposal_id: 'new', approval_status: 'Pending', submission_date: '2026-11-03T00:00:00Z' },
  ]
  assert.deepEqual(actionableProposals(proposals).map(row => row.proposal_id), ['new', 'old'])
})

test('all proposals sorts every approval status newest first', () => {
  const proposals = [
    { proposal_id: 'approved', approval_status: 'Approved', submission_date: '2026-11-04T00:00:00Z' },
    { proposal_id: 'pending', approval_status: 'Pending', submission_date: '2026-11-05T00:00:00Z' },
    { proposal_id: 'rejected', approval_status: 'Rejected', submission_date: '2026-11-03T00:00:00Z' },
    { proposal_id: 'revisions', approval_status: 'Revisions Required', submission_date: '2026-11-04T01:00:00Z' },
  ]
  assert.deepEqual(allProposals(proposals).map(row => row.proposal_id), ['pending', 'revisions', 'approved', 'rejected'])
})

test('resubmitted means back in Pending after the most recent return for revisions', () => {
  const reviews = [{ review_decision: 'Approved', reviewed_at: '2026-10-01T00:00:00Z' }, { review_decision: 'Revisions Required', reviewed_at: '2026-11-01T00:00:00Z' }]
  assert.equal(isResubmitted({ approval_status: 'Pending', reviews }), true)
  assert.equal(isResubmitted({ approval_status: 'Revisions Required', reviews }), false)
  assert.equal(isResubmitted({ approval_status: 'Pending', reviews: [] }), false)
  assert.equal(isResubmitted({ approval_status: 'Pending', reviews: [...reviews, { review_decision: 'Approved', reviewed_at: '2026-11-03T00:00:00Z' }] }), false)
})

test('agenda uses Manila midnight even when the UTC date is still yesterday', () => {
  const now = Date.parse('2026-11-03T16:01:00Z')
  const window = agendaWindow(now)
  assert.equal(new Date(window.start).toISOString(), '2026-11-03T16:00:00.000Z')
  assert.equal(new Date(window.tomorrow).toISOString(), '2026-11-04T16:00:00.000Z')
  assert.equal(new Date(window.end).toISOString(), '2026-11-05T16:00:00.000Z')
})

test('agenda includes ongoing and tomorrow, excluding ended, unpublished, unapproved, cancelled and later events', () => {
  const now = Date.parse('2026-11-04T02:00:00Z')
  const event = { event_id: 'today', publication_status: 'Published', event_status: 'Upcoming', proposal: { approval_status: 'Approved' }, starts_at: '2026-11-04T04:00:00Z', ends_at: '2026-11-04T05:00:00Z' }
  const events = [event,
    { ...event, event_id: 'ongoing', starts_at: '2026-11-03T15:00:00Z', ends_at: '2026-11-04T03:00:00Z' },
    { ...event, event_id: 'tomorrow', starts_at: '2026-11-05T15:00:00Z', ends_at: '2026-11-05T17:00:00Z' },
    { ...event, event_id: 'ended', ends_at: new Date(now).toISOString() },
    { ...event, event_id: 'draft', publication_status: 'Draft' },
    { ...event, event_id: 'unpublished', publication_status: 'Unpublished' },
    { ...event, event_id: 'cancelled', event_status: 'Cancelled' },
    { ...event, event_id: 'unapproved', proposal: { approval_status: 'Pending' } },
    { ...event, event_id: 'later', starts_at: '2026-11-05T16:00:00Z', ends_at: '2026-11-05T17:00:00Z' },
  ]
  assert.deepEqual(agendaEvents(events, now).map(row => row.event_id), ['ongoing', 'today', 'tomorrow'])
})

test('Review All loads beyond Supabase response limits', async () => {
  const rows = Array.from({ length: 503 }, (_, index) => ({ proposal_id: `P-${index}`, approval_status: 'Pending', submission_date: '2026-11-04T00:00:00Z' }))
  const ranges = []
  const query = { select() { return this }, eq() { return this }, order() { return this }, async range(from, to) { ranges.push([from, to]); return { data: rows.slice(from, to + 1), error: null } } }
  const result = await loadAdminProposals({ from() { return query } })
  assert.equal(result.length, 503)
  assert.deepEqual(ranges, [[0, 499], [500, 999]])
})
