import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { bookingOverlapsDate, dateKey, eventBooking, eventDisplayState, loadApprovedEvents, loadVenueBookings, predefinedSlots, slotAvailability } from '../src/features/administrators/calendarData.js'

test('Manila dates and reserved slots agree across UTC midnight', () => {
  const booking = { starts_at: '2026-11-26T23:30:00Z', ends_at: '2026-11-27T04:00:00Z' }
  assert.equal(dateKey(booking.starts_at), '2026-11-27')
  assert.equal(bookingOverlapsDate(booking, '2026-11-27'), true)
  assert.equal(bookingOverlapsDate(booking, '2026-11-26'), false)
  assert.deepEqual(predefinedSlots.map(slot => slotAvailability(slot, '2026-11-27', [booking])), ['Unavailable', 'Unavailable', 'Available', 'Available'])
  assert.equal(bookingOverlapsDate({ starts_at: '2026-11-26T16:00:00Z', ends_at: '2026-11-27T16:00:00Z' }, '2026-11-28'), false)
})

test('December booking query ends at Manila midnight on January 1', async () => {
  let requested
  const client = createClient('https://test.supabase.co', 'test-key', { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: async url => { requested = new URL(url); return new Response('[]', { headers: { 'Content-Type': 'application/json' } }) } } })
  await loadVenueBookings(client, 'GEE-AVR', '2026-12')
  assert.equal(requested.searchParams.get('venue_id'), 'eq.GEE-AVR')
  assert.equal(requested.searchParams.get('booking_status'), 'eq.Confirmed')
  assert.equal(requested.searchParams.get('starts_at'), 'lt.2026-12-31T16:00:00.000Z')
  assert.equal(requested.searchParams.get('ends_at'), 'gt.2026-11-30T16:00:00.000Z')
})

test('rescheduled events and cancelled venues remain available to table filters', () => {
  const oldBooking = { venue_id: 'old', booking_status: 'Replaced', starts_at: '2026-02-20T01:00:00Z' }
  const booking = { venue_id: 'current', booking_status: 'Confirmed', starts_at: '2026-11-27T01:00:00Z' }
  assert.equal(eventBooking({ bookings: [oldBooking, booking] }).venue_id, 'current')
  assert.equal(eventBooking({ bookings: [oldBooking, { ...booking, booking_status: 'Cancelled' }] }).venue_id, 'current')
  assert.equal(eventDisplayState({ event_status: 'Upcoming', rescheduled_at: '2026-11-01T01:00:00Z' }), 'Rescheduled')
  assert.equal(eventDisplayState({ event_status: 'Cancelled', rescheduled_at: '2026-11-01T01:00:00Z' }), 'Cancelled')
})

test('approved events request earliest scheduled dates first without grouping by status', async () => {
  let requested
  const client = createClient('https://test.supabase.co', 'test-key', { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: async url => { requested = new URL(url); return new Response('[]', { headers: { 'Content-Type': 'application/json' } }) } } })
  await loadApprovedEvents(client)
  assert.equal(requested.searchParams.get('order'), 'starts_at.asc,event_id.asc')
  assert.equal(requested.searchParams.has('event_status'), false)
})
