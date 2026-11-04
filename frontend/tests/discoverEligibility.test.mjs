import test from 'node:test'
import assert from 'node:assert/strict'
import { eligibilityLabel, isRestrictedEvent } from '../src/features/student/discoverEligibility.js'
test('college eligibility label does not depend on available capacity', () => {
  assert.equal(eligibilityLabel({eligibility_mode:'College-Specific',eligible_college:'CISTM',registration_capacity:120,confirmed_registrations:10}), 'CISTM Only')
})
test('only university-wide events claim open to all', () => {
  assert.equal(eligibilityLabel({eligibility_mode:'University-Wide'}),'Open to All')
  assert.equal(eligibilityLabel({eligibility_mode:'Program-Specific'}),'Eligible Programs Only')
  assert.equal(eligibilityLabel({}),'Restricted Eligibility')
})
test('restricted filter includes college/program restrictions only', () => {
  assert.equal(isRestrictedEvent({eligibility_mode:'College-Specific'}),true)
  assert.equal(isRestrictedEvent({eligibility_mode:'Program-Specific'}),true)
  assert.equal(isRestrictedEvent({eligibility_mode:'University-Wide',eligible_college:'All Colleges'}),false)
})
