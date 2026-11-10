import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyForm, buildProposalPayload, formFromProposal, validateForm } from '../src/features/student-organization/proposals/proposalModel.js'

test('multiple selected colleges including CA validate and round trip', () => {
  const form = { ...emptyForm(), eligibilityMode: 'College-Specific', colleges: ['CA', 'CHASS', 'CISTM'] }
  assert.equal(validateForm(form, { eventTypes: [], now: Date.now() }).errors.colleges, undefined)
  const payload = buildProposalPayload(form, [])
  assert.equal(payload.allowed_college, 'CA, CHASS, CISTM')
  assert.deepEqual(formFromProposal(payload).colleges, form.colleges)
})

test('single-college compatibility and University-Wide clearing', () => {
  const form = { ...emptyForm(), eligibilityMode: 'College-Specific', colleges: ['CN'] }
  assert.equal(buildProposalPayload(form, []).allowed_college, 'CN')
  assert.equal(buildProposalPayload({ ...form, eligibilityMode: 'University-Wide' }, []).allowed_college, null)
  assert.ok(validateForm({ ...form, colleges: ['INVALID'] }, { eventTypes: [], now: Date.now() }).errors.colleges)
})
