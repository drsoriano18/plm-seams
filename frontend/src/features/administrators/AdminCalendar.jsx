import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import AdminShell from './AdminShell'
import { supabase } from '../../lib/supabase'
import { bookingOverlapsDate, dateKey, loadCalendarVenues, loadVenueBookings, monthDays, predefinedSlots, slotAvailability } from './calendarData'
import calendarIcon from './assets/calendar-nav.svg'
import './AdminCalendar.css'

const monthLabel = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'long', year: 'numeric' })
const timeLabel = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' })

export default function AdminCalendar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedDate = searchParams.get('date')
  const [today] = useState(() => dateKey(new Date()))
  const initialDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : today
  const requestedVenue = searchParams.get('venue') || ''
  const [venues, setVenues] = useState([])
  const [venueId, setVenueId] = useState('')
  const [month, setMonth] = useState(initialDate.slice(0, 7))
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [bookingState, setBookingState] = useState({ venueId: '', month: '', bookings: [], error: '' })
  const [venueError, setVenueError] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    loadCalendarVenues(supabase).then(data => {
      if (active) { setVenues(data); setVenueId(data.some(venue => venue.venue_id === requestedVenue) ? requestedVenue : data[0]?.venue_id || '') }
    }).catch(() => { if (active) setVenueError('Unable to load venues. Please try again.') })
    return () => { active = false }
  }, [requestedVenue, revision])
  useEffect(() => {
    if (!venueId) return
    let active = true
    loadVenueBookings(supabase, venueId, month).then(bookings => {
      if (active) setBookingState({ venueId, month, bookings, error: '' })
    }).catch(failure => {
      if (active) setBookingState({ venueId, month, bookings: [], error: `Unable to load venue availability. ${failure.message || 'Please try again.'}` })
    })
    return () => { active = false }
  }, [month, venueId, revision])

  const cells = useMemo(() => monthDays(month), [month])
  const loading = !venueId || bookingState.venueId !== venueId || bookingState.month !== month
  const error = venueError || bookingState.error
  const bookings = loading || error ? [] : bookingState.bookings
  const selectedVenue = venues.find(item => item.venue_id === venueId)
  const selectedBookings = bookings.filter(booking => bookingOverlapsDate(booking, selectedDate))
  const label = monthLabel.format(new Date(`${month}-01T12:00:00+08:00`))
  const reservedDays = cells.filter(day => day && bookings.some(booking => bookingOverlapsDate(booking, `${month}-${String(day.getDate()).padStart(2, '0')}`))).length
  function moveMonth(offset) {
    const [year, monthNumber] = month.split('-').map(Number)
    const next = new Date(Date.UTC(year, monthNumber - 1 + offset, 1))
    const nextMonth = next.toISOString().slice(0, 7)
    setMonth(nextMonth); setSelectedDate(`${nextMonth}-01`)
  }
  return <AdminShell mainClassName="admin-calendar-main">
    <div className="admin-calendar-title">Calendar</div>
    <div className="admin-calendar-workspace">
      <section className="admin-calendar-panel admin-venue-calendar" aria-busy={loading}>
        <header><div><h1><img src={calendarIcon} alt="" />Venue Availability</h1><label className="admin-calendar-venue-select"><span className="admin-sr-only">Venue</span><select value={venueId} onChange={event => setVenueId(event.target.value)}>{venues.map(venue => <option value={venue.venue_id} key={venue.venue_id}>{venue.venue_name}</option>)}</select></label></div><div className="admin-calendar-month"><strong>{label}</strong><button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}>‹</button><button type="button" aria-label="Next month" onClick={() => moveMonth(1)}>›</button></div></header>
        <p className="admin-calendar-booking-count" role="status">{error ? 'Availability could not be loaded.' : loading ? 'Loading confirmed bookings…' : `${reservedDays} reserved ${reservedDays === 1 ? 'date' : 'dates'} at ${selectedVenue?.venue_name} in ${label}.`}</p>
        <div className="admin-calendar-grid"><div className="admin-calendar-weekdays">{['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => <span key={day}>{day}</span>)}</div><div className="admin-calendar-days">{cells.map((day, index) => {
          const key = day ? `${month}-${String(day.getDate()).padStart(2, '0')}` : `blank-${index}`
          const unavailable = day && bookings.some(booking => bookingOverlapsDate(booking, key))
          return <button key={key} type="button" disabled={!day} data-date={day ? key : undefined} aria-label={day ? `${key}, ${loading || error ? 'availability unknown' : unavailable ? 'Unavailable, confirmed reservation' : 'Available'}` : undefined} aria-pressed={!!day && key === selectedDate} className={`${day && key === selectedDate ? 'is-selected' : ''} ${unavailable ? 'is-unavailable' : ''}`} onClick={() => day && setSelectedDate(key)}>{day?.getDate()}</button>
        })}</div></div>
        <div className="admin-calendar-legend"><span><i className="available" />Available</span><span><i className="selected" />Selected</span><span><i className="unavailable" />Unavailable</span></div>
      </section>
      <section className="admin-calendar-panel admin-time-slots"><header><h2><img src={calendarIcon} alt="" />Available Time Slots</h2><p>{selectedVenue?.venue_name || 'Select a venue'} · {selectedDate}</p></header>
        {selectedBookings.length > 0 && <div className="admin-calendar-reservations">{selectedBookings.map(booking => <p key={booking.booking_id}><strong>Confirmed reservation · {booking.event_id}</strong><span>{timeLabel.format(new Date(booking.starts_at))} – {timeLabel.format(new Date(booking.ends_at))}</span></p>)}</div>}
        <div className="admin-slot-table"><div className="admin-slot-row admin-slot-head"><span>Start time</span><span>End time</span><span>Status</span></div>{predefinedSlots.map(slot => {
          const status = loading || error ? 'Unavailable data' : slotAvailability(slot, selectedDate, bookings)
          return <div className="admin-slot-row" key={slot.id}><strong>{slot.label}</strong><span>{slot.endLabel}</span><span className={status === 'Available' ? 'slot-available' : status === 'Unavailable' ? 'slot-unavailable' : 'slot-unknown'}>{loading ? 'Loading…' : status}</span></div>
        })}</div>
      </section>
      {error && <div className="admin-calendar-error" role="alert"><p>{error}</p><button type="button" onClick={() => setRevision(value => value + 1)}>Try again</button></div>}
      <button className="admin-manage-events-button" type="button" onClick={() => navigate('/admin/calendar/events')}><img src={calendarIcon} alt="" />Manage Approved Events</button>
    </div>
  </AdminShell>
}
