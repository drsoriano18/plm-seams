// Dashboard behavior and visual checks use local fixtures, with no live database writes.
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.TEST_BASE_URL || 'http://localhost:5173'
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
const context = await browser.newContext({ viewport: { width: 1480, height: 1020 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
await page.clock.install({ time: new Date('2026-11-04T02:00:00Z') })

const uid = '11111111-1111-4111-8111-111111111111'
const user = { id: uid, aud: 'authenticated', role: 'authenticated', email: 'admin-test@plm.edu.ph', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
const profile = { user_id: 'TEST-ADMIN', plm_email: user.email, role: 'Admin', auth_user_id: uid }
const titles = ['Annual Engineering Innovation Summit 2026', 'Harana sa Pamantasan: Cultural Choral Night', 'ByteCon: Algorithmic Hackathon & Tech Talk', 'Tugtugang Haribon: Battle of the Bands', 'Student Leadership Forum', 'Campus Research Showcase']
const proposals = titles.map((title, index) => ({
  proposal_id: `PROP-2026-${89 - index}`, event_name: title, approval_status: 'Pending', submission_date: new Date(Date.parse('2026-11-04T01:00:00Z') - index * 86400000).toISOString(),
  organization: { org_name: ['Association of Civil Engineering Students (ACES)', 'PLM Magwayen Creative Collective', 'Computer Science Society', 'PLM Music Society'][index % 4] },
  schedules: [{ schedule_id: `S-${index}`, schedule_type: 'Primary', starts_at: '2026-11-28T01:00:00Z', venue: { venue_name: ['Justo Albert Auditorium', 'University Activity Center', 'Gusaling Katipunan AVR', 'University Gym'][index % 4] } }],
  reviews: index === 3 ? [{ review_decision: 'Revisions Required', reviewed_at: '2026-10-30T01:00:00Z' }] : [],
}))
const events = [
  ['E-1', 'National Midwifery Seminar', '2026-11-04T01:00:00Z', '2026-11-04T04:00:00Z', 'Justo Albert Auditorium'],
  ['E-2', 'Inter-College Debate Cup Round 1', '2026-11-04T05:00:00Z', '2026-11-04T09:00:00Z', 'Gusaling Villegas Rm 302'],
  ['E-3', 'Himig Haribon Rehearsal', '2026-11-04T10:00:00Z', '2026-11-04T12:30:00Z', 'Audio-Visual Theater'],
  ['E-4', 'Red Cross Blood Donation Drive', '2026-11-05T00:00:00Z', '2026-11-05T02:00:00Z', 'University Gym Lobby'],
].map(([id, title, start, end, venue]) => ({ event_id: id, publication_status: 'Published', event_status: 'Upcoming', starts_at: start, ends_at: end, proposal: { event_name: title, approval_status: 'Approved' }, bookings: [{ booking_status: 'Confirmed', venue: { venue_name: venue } }] }))
const notifications = [{ notification_id: 1, notification_type: 'New proposal', message: 'A student organization submitted a proposal for your review.', created_at: '2026-11-04T01:00:00Z', read_at: null }]
let mode = 'populated'
let failNotificationWrite = true
const requests = []
await page.route('https://*.supabase.co/**', async route => {
  const request = route.request()
  const url = new URL(request.url())
  const headers = { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
  const reply = body => route.fulfill({ headers, body: JSON.stringify(body) })
  if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...headers, 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
  if (url.pathname === '/auth/v1/token') {
    const part = data => Buffer.from(JSON.stringify(data)).toString('base64url')
    return reply({ access_token: `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: uid, role: 'authenticated', exp: 2145916800 })}.test`, refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer', user })
  }
  if (url.pathname === '/auth/v1/user') return reply(user)
  if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, headers })
  requests.push({ path: url.pathname, query: url.searchParams, method: request.method() })
  if (url.pathname === '/rest/v1/users') return reply([profile])
  if (url.pathname === '/rest/v1/event_proposal') {
    if (url.searchParams.has('proposal_id')) {
      const id = url.searchParams.get('proposal_id').replace('eq.', '')
      const proposal = proposals.find(item => item.proposal_id === id)
      return reply({ ...proposal, objectives: 'Read-only objectives', description: 'Read-only description', expected_count_attendees: 250, eligibility_mode: 'University-Wide', event_type: { description: 'Seminar', modality: 'On-Site', requires_venue: true }, schedules: proposal.schedules.map(item => ({ ...item, ends_at: '2026-11-28T03:00:00Z' })) })
    }
    if (mode === 'error') return route.fulfill({ status: 503, headers, body: JSON.stringify({ message: 'Temporary failure' }) })
    return reply(mode === 'empty' ? [] : [...proposals, { ...proposals[0], proposal_id: 'RETURNED', event_name: 'Awaiting organization revisions', approval_status: 'Revisions Required' }])
  }
  if (url.pathname === '/rest/v1/event') return reply(mode === 'empty' ? [] : [...events, { ...events[0], event_id: 'DRAFT', publication_status: 'Draft', proposal: { event_name: 'Unpublished test event', approval_status: 'Approved' } }])
  if (url.pathname === '/rest/v1/notifications') {
    if (request.method() === 'PATCH') {
      if (failNotificationWrite) { failNotificationWrite = false; return route.fulfill({ status: 503, headers, body: JSON.stringify({ message: 'Try again' }) }) }
      notifications[0].read_at = request.postDataJSON().read_at
      return reply({ notification_id: 1, read_at: notifications[0].read_at })
    }
    return reply(mode === 'empty' ? [] : notifications)
  }
  throw new Error(`Unexpected API call ${request.method()} ${url.pathname}`)
})

try {
  await page.goto(`${base}/admin/login`)
  await page.getByLabel('PLM Email').fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill('mock-password')
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await page.waitForURL('**/admin/dashboard')
  await page.getByRole('button', { name: 'Review All (7)', exact: true }).waitFor()
  assert.equal(await page.locator('.admin-proposal-card').count(), 4)
  assert.deepEqual(await page.locator('.admin-proposal-card h3').allTextContents(), [titles[0], 'Awaiting organization revisions', titles[1], titles[2]])
  assert.equal(await page.getByText('Resubmitted', { exact: true }).count(), 0)
  assert.equal(await page.getByText('Action Required', { exact: true }).count(), 3)
  assert.equal(await page.getByText('Awaiting organization revisions').count(), 1)
  assert.equal(await page.locator('.admin-agenda-item').count(), 4)
  assert.equal(await page.getByText('Unpublished test event').count(), 0)
  await page.getByText('In Progress', { exact: true }).waitFor()
  await page.getByText('Tomorrow · 08:00 AM', { exact: true }).waitFor()
  assert.equal(requests.find(request => request.path.endsWith('/event_proposal')).query.get('approval_status'), null)
  assert.equal(requests.find(request => request.path.endsWith('/event')).query.get('publication_status'), 'eq.Published')
  assert.equal(requests.find(request => request.path.endsWith('/notifications')).query.get('recipient_user_id'), 'eq.TEST-ADMIN')
  console.log('PASS populated dashboard: queue filtering, labels, newest first, published agenda and Manila times')

  await page.evaluate(() => document.fonts.ready)
  await mkdir('verification.local', { recursive: true })
  await page.screenshot({ path: 'verification.local/admin-desktop.png', fullPage: true })
  const assets = await page.locator('.admin-dashboard img').evaluateAll(images => images.map(image => ({ asset: image.src.startsWith('data:') ? 'bundled SVG' : new URL(image.src).pathname, complete: image.complete, naturalWidth: image.naturalWidth, width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height })))
  assert.ok(assets.every(asset => asset.complete && asset.naturalWidth > 0 && asset.width > 0 && asset.height > 0))
  console.log('ASSET GEOMETRY', JSON.stringify(assets))

  await page.getByRole('button', { name: 'Review All (7)', exact: true }).click()
  await page.getByRole('heading', { name: 'Event Proposals Review', exact: true }).waitFor()
  assert.equal(await page.locator('.all-proposal-card').count(), 7)
  await page.locator('.all-proposal-view').first().click()
  await page.getByRole('heading', { name: 'Event Proposal Review', exact: true }).waitFor()
  await page.getByRole('textbox', { name: 'Full official event title' }).getByText(titles[0], { exact: true }).waitFor()
  await page.getByRole('link', { name: 'Proposals', exact: true }).click()
  await page.getByRole('heading', { name: 'Event Proposals Review', exact: true }).waitFor()
  assert.equal(await page.locator('.all-proposal-card').count(), 7)
  for (const title of ['Calendar', 'Archives']) {
    await page.getByRole('button', { name: title, exact: true }).click()
    await page.getByRole('dialog', { name: title, exact: true }).waitFor()
    await page.getByRole('button', { name: 'Back to dashboard' }).click()
  }
  console.log('PASS Review All page, proposal cards, and review/calendar/archive placeholders')

  await page.getByRole('button', { name: 'Notifications, 1 unread', exact: true }).click()
  await page.getByRole('button', { name: 'Mark as read', exact: true }).click()
  await page.getByRole('alert').getByText('Unable to mark the notification as read. Please try again.').waitFor()
  assert.ok(await page.getByRole('button', { name: 'Notifications, 1 unread', exact: true }).isVisible())
  await page.getByRole('button', { name: 'Mark as read', exact: true }).click()
  await page.getByText('0 unread', { exact: true }).waitFor()
  assert.equal(await page.locator('.admin-unread-dot').count(), 0)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Open profile menu' }).focus()
  await page.keyboard.press('ArrowDown')
  await page.waitForFunction(() => document.activeElement?.textContent === 'View Profile')
  assert.ok(await page.getByRole('menuitem', { name: 'View Profile' }).evaluate(element => element === document.activeElement))
  await page.keyboard.press('ArrowDown')
  assert.ok(await page.getByRole('menuitem', { name: 'Account Settings' }).evaluate(element => element === document.activeElement))
  await page.keyboard.press('ArrowDown')
  assert.ok(await page.getByRole('menuitem', { name: 'Sign Out' }).evaluate(element => element === document.activeElement))
  await page.keyboard.press('Home')
  await page.keyboard.press('Enter')
  await page.getByRole('dialog', { name: 'Profile', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await page.getByRole('button', { name: 'Open profile menu' }).click()
  await page.getByRole('menuitem', { name: 'Account Settings' }).click()
  await page.getByRole('heading', { name: 'Account Settings', exact: true }).waitFor()
  assert.ok(await page.getByLabel('Current password', { exact: true }).isVisible())
  assert.ok(await page.getByRole('button', { name: 'Save password', exact: true }).isVisible())
  await page.getByRole('link', { name: 'Manage', exact: true }).click()
  await page.getByRole('button', { name: 'Review All (7)', exact: true }).waitFor()
  console.log('PASS notifications, failed-write recovery, read indicator and keyboard profile navigation')

  for (const width of [1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Horizontal overflow at ${width}px`)
    if (width === 390) await page.screenshot({ path: 'verification.local/admin-mobile.png', fullPage: true })
  }
  await page.getByRole('button', { name: 'Notifications', exact: true }).click()
  assert.ok(await page.getByRole('dialog', { name: 'Notifications' }).evaluate(element => { const r = element.getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth }))
  await page.keyboard.press('Escape')
  console.log('PASS responsive layouts at 1024, 768, 390 and 320 pixels')

  mode = 'error'
  await page.reload()
  await page.getByRole('heading', { name: 'Proposals unavailable' }).waitFor()
  mode = 'empty'
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await page.getByRole('heading', { name: 'No proposals need your review' }).waitFor()
  await page.getByRole('heading', { name: 'No events scheduled' }).waitFor()
  await page.setViewportSize({ width: 1480, height: 1020 })
  await page.screenshot({ path: 'verification.local/admin-empty.png', fullPage: true })
  await page.getByRole('button', { name: 'Open profile menu' }).click()
  await page.getByRole('menuitem', { name: 'Sign Out' }).click()
  await page.waitForURL(`${base}/`)
  assert.deepEqual(errors, [])
  console.log('PASS error retry, empty dashboard, sign out and zero browser runtime errors')
} finally { await browser.close() }
