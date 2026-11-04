import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateReviewDecision, saveProposalReview, loadProposalReview } from '../src/features/administrators/proposalReviewData.js'

test('remarks are optional for approval and required for rejection or revisions', () => {
  assert.equal(validateReviewDecision('Approved', ''), null)
  for (const decision of ['Rejected', 'Revisions Required']) {
    assert.match(validateReviewDecision(decision, '  '), /Enter admin remarks/)
    assert.equal(validateReviewDecision(decision, 'Reason'), null)
  }
  assert.match(validateReviewDecision('Unknown', 'Reason'), /valid review decision/)
  assert.match(validateReviewDecision('Approved', 'x'.repeat(2001)), /2000/)
})

test('decision submission sends only identity, decision and trimmed remarks to the atomic RPC', async () => {
  const client = { async rpc(name, args) {
    assert.equal(name, 'review_proposal')
    assert.deepEqual(args, { pid: 'P-1', decision: 'Revisions Required', remarks: 'Please revise' })
    return { error: null }
  } }
  await saveProposalReview(client, 'P-1', 'Revisions Required', ' Please revise ')
})

test('a booking conflict remains an error without retrying the decision', async () => {
  let calls = 0
  const client = { async rpc() { calls++; return { error: { code: '23P01', message: 'Raw constraint error' } } } }
  await assert.rejects(saveProposalReview(client, 'P-1', 'Approved', ''), error => error.code === '23P01' && error.message.includes('already booked'))
  assert.equal(calls, 1)
})

test('the unique proposal/event relationship is normalized for live PostgREST responses', async () => {
  const event = { event_id: 'E-1', bookings: [] }
  const query = { select() { return this }, eq() { return this }, async maybeSingle() { return { data: { proposal_id: 'P-1', events: event }, error: null } } }
  const result = await loadProposalReview({ from() { return query } }, 'P-1')
  assert.deepEqual(result.events, [event])
})
