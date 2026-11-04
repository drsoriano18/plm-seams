import test from 'node:test'
import assert from 'node:assert/strict'
import { daySlots, dayStatus } from '../src/features/student-organization/calendar/availability.js'
import { formatManilaTime } from '../src/features/student-organization/calendar/calendarDates.js'

const DAY = '2026-11-11'
const NOW = Date.parse('2026-01-01T00:00:00+08:00')
const manila = (time) => `${DAY}T${time}:00+08:00`
const booking = (from, to, extra = {}) => ({
  booking_id: 'b1',
  starts_at: manila(from),
  ends_at: manila(to),
  booking_status: 'Confirmed',
  ...extra,
})
const statuses = (bookings) => daySlots(DAY, bookings, NOW).map((slot) => slot.status)

test('no bookings gives four Available blocks with the exact Manila times', () => {
  const slots = daySlots(DAY, [], NOW)
  assert.deepEqual(statuses([]), ['Available', 'Available', 'Available', 'Available'])
  assert.deepEqual(slots.map((s) => s.startsAt), [manila('07:30'), manila('10:30'), manila('14:30'), manila('19:30')].map((v) => new Date(v).toISOString()))
  assert.deepEqual(slots.map((s) => s.endsAt), [manila('09:30'), manila('13:30'), manila('18:30'), manila('21:00')].map((v) => new Date(v).toISOString()))
})

test('a 1-hour event 10:00-11:00 AM takes the whole of Block 2', () => {
  const slots = daySlots(DAY, [booking('10:00', '11:00')], NOW)
  assert.deepEqual(slots.map((s) => s.status), ['Available', 'Occupied', 'Available', 'Available'])
  assert.equal(formatManilaTime(slots[1].startsAt), '10:30 AM')
  assert.equal(formatManilaTime(slots[1].endsAt), '1:30 PM')
})

test('a 30-minute event 2:30-3:00 PM takes the whole of Block 3', () => {
  const slots = daySlots(DAY, [booking('14:30', '15:00')], NOW)
  assert.deepEqual(slots.map((s) => s.status), ['Available', 'Available', 'Occupied', 'Available'])
  assert.equal(formatManilaTime(slots[2].startsAt), '2:30 PM')
  assert.equal(formatManilaTime(slots[2].endsAt), '6:30 PM')
})

test('UTC ISO timestamps convert to Manila time', () => {
  const utc = { booking_id: 'u1', starts_at: '2026-11-11T02:00:00Z', ends_at: '2026-11-11T03:00:00Z', booking_status: 'Confirmed' }
  assert.equal(formatManilaTime(utc.starts_at), '10:00 AM')
  assert.equal(formatManilaTime(utc.ends_at), '11:00 AM')
  assert.deepEqual(statuses([utc]), ['Available', 'Occupied', 'Available', 'Available'])
})

test('a long event 8:00 AM-7:00 PM occupies Blocks 1 to 4 (Block 4 through the buffer to 8:00 PM)', () => {
  assert.deepEqual(statuses([booking('08:00', '19:00')]), ['Occupied', 'Occupied', 'Occupied', 'Occupied'])
})

test('an event ending exactly 6:30 PM leaves Block 4 Available (buffer ends 7:30 PM)', () => {
  assert.deepEqual(statuses([booking('16:00', '18:30')]), ['Available', 'Available', 'Occupied', 'Available'])
})

test('an event 7:00-9:30 AM occupies Block 1 and leaves Block 2 Available (buffer ends 10:30 AM)', () => {
  assert.deepEqual(statuses([booking('07:00', '09:30')]), ['Occupied', 'Available', 'Available', 'Available'])
})

test('stored buffer_minutes is ignored and the fixed 60-minute buffer applies', () => {
  for (const buffer_minutes of [0, 30, 120]) {
    assert.deepEqual(statuses([booking('07:00', '09:30', { buffer_minutes })]), ['Occupied', 'Available', 'Available', 'Available'])
  }
  // Ends 6:45 PM: only a 60-minute buffer (to 7:45 PM) reaches Block 4, which starts 7:30 PM.
  for (const buffer_minutes of [0, 30]) {
    assert.deepEqual(statuses([booking('16:00', '18:45', { buffer_minutes })]), ['Available', 'Available', 'Occupied', 'Occupied'])
  }
})

test('Cancelled, Replaced and Rejected bookings do not occupy blocks', () => {
  for (const booking_status of ['Cancelled', 'Replaced', 'Rejected']) {
    assert.deepEqual(statuses([booking('10:00', '11:00', { booking_status })]), ['Available', 'Available', 'Available', 'Available'])
  }
})

test('Confirmed and Pending bookings occupy blocks', () => {
  for (const booking_status of ['Confirmed', 'Pending']) {
    assert.deepEqual(statuses([booking('10:00', '11:00', { booking_status })]), ['Available', 'Occupied', 'Available', 'Available'])
  }
})

test('a date is Unavailable when all four blocks are occupied and Available when one is free', () => {
  assert.equal(dayStatus(DAY, [booking('08:00', '19:00')], NOW), 'unavailable')
  assert.equal(dayStatus(DAY, [booking('08:00', '18:30')], NOW), 'available')
  assert.equal(dayStatus(DAY, [], NOW), 'available')
})
