// Full review screen checks use mocked APIs; no live decisions or notifications are sent.
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
const base = process.env.TEST_BASE_URL || 'http://localhost:5173'
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
const context = await browser.newContext({ viewport: { width: 1480, height: 1020 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'review-test@plm.edu.ph', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
const profile = { user_id: 'TEST-ADMIN', plm_email: user.email, auth_user_id: user.id, role: 'Admin' }
let status = 'Pending'
let failConflict = true
let staleDecision = false
let submittedRemarks = ''
let proposalsUnavailable = false
let programSpecific = false
const decisions = []
const venue = { venue_id: 'V-PRIMARY', venue_name: 'Bukod Tanging Bulwagan (BTB)', building: 'Gusaling Katipunan', floor_number: 'Third Floor', room_number: '301', max_capacity: 300, available_equipment: 'Chairs, Sound System, Projector, Airconditioning' }
const proposal = {
  proposal_id: 'PROP-2026-2039', org_id: 'ORG-1', event_name: 'PLM Inter-College Tech Symposium 2026', objectives: '1. Facilitate inter-collegiate dialogue on emerging software engineering disciplines.\n2. Provide applied machine learning exposure for at least 250 undergraduate students.\n3. Establish industry linkages between PLM CET/CS students and participating IT consortiums.',
  description: 'A collaborative full-day academic forum bringing together student developers, engineers, and\nfaculty mentors. Featuring 4 technical keynote tracks, a collegiate product showcase, and\nnetworking sessions under the joint supervision of college accredited councils.',
  expected_count_attendees: 250, eligibility_mode: 'College-Specific', allowed_college: 'College of Engineering and Technology\nCollege of Science\nPLM Business School (CBGM)\nCollege of Humanities, Arts, & Social Sciences (CHASS)\nCollege of Nursing (CN)', collaborating_organization_text: 'PLM Computer Science Society (CSS)\nCollege of Nursing (CN)',
  organization: { org_name: 'PLM Computer Science Society' }, event_type: { description: 'Academic Symposium', modality: 'On-Site', requires_venue: true }, submission_date: '2026-11-01T00:00:00Z',
  schedules: [{ schedule_id: 'S-PRIMARY', schedule_type: 'Primary', starts_at: '2026-12-15T00:00:00Z', ends_at: '2026-12-15T09:00:00Z', venue }, { schedule_id: 'S-BACKUP', schedule_type: 'Backup', starts_at: '2026-12-15T00:00:00Z', ends_at: '2026-12-15T09:00:00Z', venue: { ...venue, venue_id: 'V-BACKUP', venue_name: 'GEE Katipunan Lounge', building: 'Gusaling Ejercito Estrada', floor_number: 'Ground Floor', room_number: null, available_equipment: null } }],
  resource_requirements: 'Sound System & Microphones (4 Wireless)\nHigh-Lumen LED Projector & Stage Rig\n200 Monobloc Chairs & 10 Panel Tables\nAir Conditioning Extension Permit (Overtime)\nSecurity & University Guard Detail (2 Posts)', budget_information: 'Total requested budget: 42,500.00\nPrimary fund appropriation account: Recognized Student Org Account (PLM Trust Fund)', includes_sponsorship: true,
}
function detail() { return { ...proposal, ...(programSpecific ? { eligibility_mode: 'Program-Specific', allowed_programs: ['BSCS', 'BSIT'] } : {}), approval_status: status, reviews: status === 'Pending' ? [] : [{ review_id: 'R-1', review_decision: status, admin_remarks: submittedRemarks, reviewed_at: new Date().toISOString() }], events: status === 'Approved' ? [{ event_id: 'E-1', publication_status: 'Unpublished', bookings: [{ venue_id: 'V-PRIMARY', booking_status: 'Confirmed' }] }] : [] } }
await page.route('https://*.supabase.co/**', async route => {
  const request = route.request(), url = new URL(request.url())
  const headers = { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
  const reply = body => route.fulfill({ headers, body: JSON.stringify(body) })
  if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...headers, 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
  if (url.pathname === '/auth/v1/token') {
    const part = value => Buffer.from(JSON.stringify(value)).toString('base64url')
    return reply({ access_token: `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: user.id, role: 'authenticated', exp: 2145916800 })}.test`, refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer', user })
  }
  if (url.pathname === '/auth/v1/user') return reply(user)
  if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, headers })
  if (url.pathname === '/rest/v1/users') return reply([profile])
  if (url.pathname === '/rest/v1/notifications' || url.pathname === '/rest/v1/event') return reply([])
  if (url.pathname === '/rest/v1/event_proposal') {
    if (proposalsUnavailable) return route.fulfill({ status: 503, headers, body: JSON.stringify({ message: 'Unavailable' }) })
    if (url.searchParams.has('proposal_id')) return reply(detail())
    return reply(Array.from({ length: 6 }, (_, index) => ({ ...detail(), proposal_id: `P-${index}`, approval_status: 'Pending' })))
  }
  if (url.pathname === '/rest/v1/rpc/review_proposal') {
    const body = request.postDataJSON()
    decisions.push(body)
    assert.deepEqual(Object.keys(body).sort(), ['decision', 'pid', 'remarks'])
    if (staleDecision) { status = 'Approved'; staleDecision = false; return route.fulfill({ status: 409, headers, body: JSON.stringify({ code: '40001', message: 'This proposal has already been reviewed. Reload to see its current status.' }) }) }
    if (body.decision === 'Approved' && failConflict) return route.fulfill({ status: 409, headers, body: JSON.stringify({ code: '23P01', message: 'Venue conflict' }) })
    status = body.decision; submittedRemarks = body.remarks || ''
    return reply(null)
  }
  throw new Error(`Unexpected request ${request.method()} ${url.pathname}`)
})

async function openReview() {
  await page.goto(`${base}/admin/proposals/${proposal.proposal_id}`)
  await page.getByRole('heading', { name: 'Event Proposal Review', exact: true }).waitFor()
}
try {
  await page.goto(`${base}/admin/login`)
  await page.getByLabel('PLM Email').fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill('mock-password')
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await page.waitForURL('**/admin/dashboard')
  await page.getByRole('button', { name: `View ${proposal.event_name}`, exact: true }).first().click()
  await page.getByRole('heading', { name: 'Event Proposal Review', exact: true }).waitFor()
  assert.equal(await page.locator('input:not([disabled]), textarea:not([readonly])').count(), 1)
  const title = page.getByRole('textbox', { name: 'Full official event title', exact: true })
  assert.equal(await title.getAttribute('aria-readonly'), 'true')
  await title.focus(); await page.keyboard.type('Attempted edit')
  assert.equal(await title.innerText(), proposal.event_name)
  await title.evaluate(element => element.blur())
  await page.evaluate(() => window.scrollTo(0, 0))
  assert.ok(await page.getByText('MOA & Physical Legal Clearance Required', { exact: true }).isVisible())
  assert.equal(await page.getByText('Calendar Slot Hold: Not Reserved', { exact: true }).count(), 2)
  await page.evaluate(() => document.fonts.ready)
  await mkdir('verification.local', { recursive: true })
  await page.screenshot({ path: 'verification.local/proposal-review-desktop.png', fullPage: true })
  const assets = await page.locator('img').evaluateAll(images => images.map(image => ({ complete: image.complete, naturalWidth: image.naturalWidth, width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height })))
  assert.ok(assets.every(asset => asset.complete && asset.naturalWidth > 0 && asset.width > 0 && asset.height > 0))
  console.log(`PASS read-only proposal, dynamic submitted fields, sponsorship and ${assets.length} loaded images`)

  await page.getByRole('button', { name: 'Return for Revisions', exact: true }).click()
  await page.getByRole('alert').getByText('Enter admin remarks before returning or rejecting this proposal.').waitFor()
  assert.equal(decisions.length, 0)
  await page.getByRole('button', { name: 'Reject', exact: true }).click()
  assert.equal(decisions.length, 0)
  await page.getByRole('button', { name: 'Approve', exact: true }).click()
  await page.getByRole('dialog', { name: 'Approve proposal?' }).waitFor()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  assert.equal(decisions.length, 0)
  await page.getByRole('button', { name: 'Approve', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm Approve', exact: true }).click()
  await page.getByRole('dialog').getByRole('alert').getByText('The primary venue is already booked for this time. Return the proposal for revisions.').waitFor()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  assert.ok(await page.getByRole('heading', { name: 'Event Proposal Review', exact: true }).isVisible())
  assert.equal(status, 'Pending')
  console.log('PASS required rejection/revision remarks, confirmation cancellation and conflict recovery')

  failConflict = false
  await page.getByRole('button', { name: 'Approve', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm Approve', exact: true }).click()
  await page.getByRole('heading', { name: 'Event Proposal Review - Approved', exact: true }).waitFor()
  assert.ok(page.url().includes('/admin/proposals/'))
  assert.equal(await page.locator('.proposal-decision-bar').count(), 0)
  assert.ok(await page.getByRole('textbox', { name: 'Admin Remarks', exact: true }).evaluate(element => element.readOnly))
  assert.equal(decisions.at(-1).remarks, null)
  await page.getByText('Calendar Slot Hold: Active', { exact: true }).waitFor()
  assert.equal(await page.getByText('Calendar Slot Hold: Not Reserved', { exact: true }).count(), 1)
  await page.reload()
  await page.getByRole('heading', { name: 'Event Proposal Review - Approved', exact: true }).waitFor()
  assert.equal(await page.locator('.proposal-decision-bar').count(), 0)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'verification.local/proposal-review-approved.png', fullPage: true })
  console.log('PASS approval stays open, persists across reloads, hides decisions and reserves only the primary venue')

  for (const width of [1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Overflow at ${width}px`)
    if (width === 390) await page.screenshot({ path: 'verification.local/proposal-review-mobile.png', fullPage: true })
  }
  await page.getByRole('link', { name: 'Proposals', exact: true }).click()
  await page.getByRole('button', { name: 'Review All (6)', exact: true }).waitFor()
  assert.equal(await page.locator('.admin-proposal-card').count(), 4)
  console.log('PASS responsive review layout and Proposals returns to the first four')

  await page.setViewportSize({ width: 1480, height: 1020 })
  for (const [decision, action, text] of [['Revisions Required', 'Return for Revisions', 'Please revise the objectives.'], ['Rejected', 'Reject', 'The proposal is rejected for the stated reason.']]) {
    status = 'Pending'; submittedRemarks = ''
    await openReview()
    await page.getByRole('textbox', { name: /Admin Remarks/ }).fill(text)
    await page.getByRole('button', { name: action, exact: true }).click()
    await page.getByRole('button', { name: `Confirm ${action}`, exact: true }).click()
    await page.waitForURL('**/admin/dashboard')
    await page.getByRole('status').filter({ hasText: decision === 'Rejected' ? 'Proposal rejected.' : 'Proposal returned for revisions.' }).waitFor()
    await page.getByRole('button', { name: 'Review All (6)', exact: true }).waitFor()
    assert.equal(decisions.at(-1).decision, decision)
    assert.equal(decisions.at(-1).remarks, text)
    assert.equal(await page.locator('.admin-proposal-card').count(), 4)
  }
  await page.goto(`${base}/admin/proposals/${proposal.proposal_id}`)
  await page.getByRole('heading', { name: 'Event Proposal Review - Rejected', exact: true }).waitFor()
  assert.equal(await page.locator('.proposal-decision-bar').count(), 0)
  console.log('PASS return/reject decisions save remarks, return with a success message, and rejected records are final')

  status = 'Pending'; staleDecision = true
  await openReview()
  await page.getByRole('button', { name: 'Approve', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm Approve', exact: true }).click()
  await page.getByRole('heading', { name: 'Event Proposal Review - Approved', exact: true }).waitFor()
  assert.equal(await page.locator('.proposal-decision-bar').count(), 0)
  proposalsUnavailable = true
  await page.reload()
  await page.getByRole('heading', { name: 'Proposal unavailable', exact: true }).waitFor()
  proposalsUnavailable = false
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await page.getByRole('heading', { name: 'Event Proposal Review - Approved', exact: true }).waitFor()
  programSpecific = true
  await page.reload()
  await page.getByRole('heading', { name: 'Event Proposal Review - Approved', exact: true }).waitFor()
  assert.ok(await page.getByRole('radio', { name: /Program-Specific Eligibility/ }).isChecked())
  assert.equal(await page.getByRole('textbox', { name: 'Allowed programs', exact: true }).innerText(), 'BSCS\nBSIT')
  assert.deepEqual(errors, [])
  console.log('PASS concurrent-review stale response, load-error retry and zero browser runtime errors')
} finally { await browser.close() }
