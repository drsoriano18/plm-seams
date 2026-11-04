import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { WEEKDAY_LABELS, addDaysToKey, addMonths, buildMonthGrid, currentMonth, formatLongDate, formatManilaTime, formatMonthTitle, makeDayKey, monthRange, todayKey } from '../calendar/calendarDates.js'
import { daySlots, isPastDay } from '../calendar/availability.js'
import { fetchVenueBookings } from '../calendar/venueApi.js'
import { minStartMs } from './proposalDates.js'
import ProposalIcon from './ProposalIcon'
import './Proposals.css'

const OWN_ONLY_NOTICE = 'Showing only your organization’s bookings. Other organizations’ bookings will appear once venue availability sharing is enabled.'
const SELECT_HELPER = 'Select an available date to review venue booking details.'
const OCCUPIED_NOTICE = 'This date is occupied by another event. Please choose a different date.'
const TOO_SOON_NOTICE = 'Proposals must be scheduled at least 15 days in advance.'
const LOAD_ERROR = 'Venue availability could not be loaded. Please try again.'

// One day for a proposal: each block is bookable only if it is free and starts after the
// 15 day notice window. Day state: 'past' | 'open' | 'soon' | 'occupied'.
function describeDay(key, bookings, now, earliest) {
  const slots = daySlots(key, bookings, now).map((slot) => ({ ...slot, bookable: slot.kind === 'free' && Date.parse(slot.startsAt) >= earliest }))
  let state = 'soon'
  if (isPastDay(key, now)) state = 'past'
  else if (slots.some((slot) => slot.bookable)) state = 'open'
  else if (slots.some((slot) => slot.kind === 'free')) state = 'soon'
  else if (slots.some((slot) => slot.kind === 'occupied')) state = 'occupied'
  return { state, slots }
}

function SlotRow({ slot, allowBackup, onUse }) {
  const label = slot.bookable ? 'Available' : slot.kind === 'occupied' ? 'Occupied' : 'Unavailable'
  const tone = slot.bookable ? 'free' : slot.kind === 'occupied' ? 'occupied' : 'past'
  const range = `${formatManilaTime(slot.startsAt)} – ${formatManilaTime(slot.endsAt)}`
  return <li className="organization-proposal-slot">
    <div className="organization-proposal-slot-main">
      <strong>{range}</strong>
      <span className={`organization-proposal-slot-tag is-${tone}`}>{label}</span>
    </div>
    {slot.kind === 'occupied' && slot.events.length ? <p className="organization-proposal-slot-note">Booked: {[...new Set(slot.events.map((event) => event.eventName || 'Another event'))].join(', ')}</p> : null}
    {slot.bookable ? <div className="organization-proposal-slot-actions">
      <button type="button" onClick={() => onUse('primary', slot)} aria-label={`Use ${range} for Primary`}>Use for Primary</button>
      {allowBackup ? <button type="button" onClick={() => onUse('backup', slot)} aria-label={`Use ${range} for Backup`}>Use for Backup</button> : null}
    </div> : null}
  </li>
}

function DayGrid({ year, month, states, selectedKey, ready, onSelect, now }) {
  const gridRef = useRef(null)
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month])
  const today = todayKey(now)
  const tabStop = selectedKey && states.has(selectedKey) ? selectedKey : states.has(today) ? today : makeDayKey(year, month, 1)

  function onKeyDown(event, key) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key]
    if (!step) return
    const target = addDaysToKey(key, step)
    const node = states.has(target) ? gridRef.current?.querySelector(`[data-day="${target}"]`) : null
    if (node) { event.preventDefault(); node.focus() }
  }

  return <div className="organization-proposal-cal-grid" ref={gridRef} role="group" aria-label={`${formatMonthTitle(year, month)} dates`} aria-busy={!ready}>
    {WEEKDAY_LABELS.map((label) => <span className="organization-proposal-cal-weekday" key={label} aria-hidden="true">{label}</span>)}
    {cells.map((cell) => {
      if (!cell.inMonth) return <span className="organization-proposal-cal-cell is-outside" key={cell.key} aria-hidden="true">{cell.day}</span>
      const state = states.get(cell.key)
      const selected = cell.key === selectedKey
      const tone = state === 'open' ? 'is-open' : state === 'past' ? 'is-past' : state === 'loading' ? 'is-pending' : 'is-unavailable'
      const classes = ['organization-proposal-cal-cell', tone, selected && 'is-selected', cell.key === today && 'is-today'].filter(Boolean).join(' ')
      const status = state === 'open' ? 'available' : state === 'loading' ? 'loading' : 'unavailable'
      return <button
        key={cell.key}
        type="button"
        className={classes}
        data-day={cell.key}
        tabIndex={cell.key === tabStop ? 0 : -1}
        aria-label={`${formatLongDate(cell.key)}, ${selected ? 'selected, ' : ''}${status}${cell.key === today ? ', today' : ''}`}
        aria-pressed={selected}
        aria-current={cell.key === today ? 'date' : undefined}
        aria-disabled={state === 'past' || undefined}
        onClick={() => { if (state !== 'past' && ready) onSelect(cell.key) }}
        onKeyDown={(event) => onKeyDown(event, cell.key)}
      >{cell.day}</button>
    })}
  </div>
}

// Collapsible venue availability checker (Figma 233:10, 239:2, 239:8).
// venues: rows with venue_id and venue_name. primaryVenueId: default venue for the panel.
// onUse(kind, { venueId, startsAt, endsAt }) where kind is 'primary' | 'backup' and the times are ISO strings.
export default function AvailabilityPanel({ venues, primaryVenueId = '', allowBackup = true, onUse }) {
  const [open, setOpen] = useState(false)
  const [now] = useState(() => Date.now())
  const [chosenVenueId, setChosenVenueId] = useState('')
  const [month, setMonth] = useState(() => currentMonth())
  const [selectedKey, setSelectedKey] = useState(null)
  const [availability, setAvailability] = useState(null)
  const venueId = chosenVenueId || primaryVenueId
  const requestKey = open && venueId ? `${venueId}|${month.year}-${month.month}` : ''

  useEffect(() => {
    if (!requestKey) return undefined
    let active = true
    const { fromIso, toIso } = monthRange(month.year, month.month)
    fetchVenueBookings(supabase, venueId, fromIso, toIso)
      .then((result) => { if (active) setAvailability({ key: requestKey, error: '', ...result }) })
      .catch(() => { if (active) setAvailability({ key: requestKey, error: LOAD_ERROR, bookings: [], source: 'shared' }) })
    return () => { active = false }
  }, [requestKey, venueId, month.year, month.month])

  const ready = !!requestKey && availability?.key === requestKey
  const usable = ready && !availability.error
  const bookings = usable ? availability.bookings : null
  const earliest = minStartMs(now)
  const states = useMemo(() => {
    const map = new Map()
    for (const cell of buildMonthGrid(month.year, month.month)) {
      if (cell.inMonth) map.set(cell.key, bookings ? describeDay(cell.key, bookings, now, earliest).state : 'loading')
    }
    return map
  }, [month.year, month.month, bookings, now, earliest])
  const selected = selectedKey && bookings ? describeDay(selectedKey, bookings, now, earliest) : null

  function changeMonth(delta) {
    setMonth((current) => addMonths(current, delta))
    setSelectedKey(null)
  }

  function changeVenue(event) {
    setChosenVenueId(event.target.value)
    setSelectedKey(null)
  }

  let notice = ''
  if (selected?.state === 'occupied') notice = OCCUPIED_NOTICE
  else if (selected && selected.state !== 'open') notice = TOO_SOON_NOTICE

  return <div className="organization-proposal-avail">
    <button type="button" className="organization-proposal-avail-trigger" aria-expanded={open} aria-controls="proposal-availability-panel" onClick={() => setOpen((value) => !value)}>
      <ProposalIcon name="calendar" size={18} />
      <span>Check Calendar Availability</span>
      <span className={`organization-proposal-avail-chevron ${open ? 'is-open' : ''}`}><ProposalIcon name="chevron-down" size={18} /></span>
    </button>
    <div id="proposal-availability-panel" hidden={!open}>
      {open ? <section className="organization-proposal-avail-card" aria-labelledby="proposal-avail-heading">
        <div className="organization-proposal-avail-head">
          <div className="organization-proposal-avail-venue">
            <h3 id="proposal-avail-heading"><ProposalIcon name="calendar" size={18} />Venue Availability</h3>
            <label htmlFor="proposal-avail-venue">Venue</label>
            <select id="proposal-avail-venue" value={venueId} onChange={changeVenue} disabled={!venues.length}>
              <option value="">Venue Name Here</option>
              {venues.map((venue) => <option key={venue.venue_id} value={venue.venue_id}>{venue.venue_name}</option>)}
            </select>
          </div>
          <div className="organization-proposal-avail-month">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month"><ProposalIcon name="chevron-left" size={18} /></button>
            <h4 aria-live="polite">{formatMonthTitle(month.year, month.month)}</h4>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Next month"><ProposalIcon name="chevron-right" size={18} /></button>
          </div>
        </div>
        {availability?.key === requestKey && availability.error ? <p className="organization-proposal-error-line" role="alert">{availability.error}</p> : null}
        {ready && !availability.error && availability.source === 'own' ? <p className="organization-proposal-avail-notice" role="status">{OWN_ONLY_NOTICE}</p> : null}
        {venueId ? <>
          <div className={`organization-proposal-avail-body ${usable ? '' : 'is-loading'}`}>
            <DayGrid year={month.year} month={month.month} states={states} selectedKey={selectedKey} ready={usable} onSelect={setSelectedKey} now={now} />
          </div>
          <ul className="organization-proposal-avail-legend" aria-label="Legend">
            <li><i className="is-available" />Available</li><li><i className="is-selected" />Selected</li><li><i className="is-unavailable" />Unavailable</li>
          </ul>
        </> : <p className="organization-proposal-avail-empty" role="status">Select a venue to review its availability.</p>}
        {venueId ? <div className={`organization-proposal-avail-message ${selected && selected.state !== 'open' ? 'is-unavailable' : ''}`} aria-live="polite">
          {selected ? <div className="organization-proposal-avail-message-row">
            <strong>{formatLongDate(selectedKey)}</strong>
            <span className={`organization-proposal-avail-pill ${selected.state === 'open' ? 'is-available' : 'is-unavailable'}`}>{selected.state === 'open' ? 'Available' : 'Unavailable'}</span>
          </div> : null}
          <p>{SELECT_HELPER}</p>
          {notice ? <p className="organization-proposal-avail-alert"><ProposalIcon name="alert-circle" size={14} />{notice}</p> : null}
        </div> : null}
        {selected ? <div className="organization-proposal-avail-times">
          <h4>Select Time</h4>
          <p>Choose an available time slot for {formatLongDate(selectedKey)}.</p>
          <h5>Available Slots</h5>
          <ul>{selected.slots.map((slot) => <SlotRow key={slot.id} slot={slot} allowBackup={allowBackup} onUse={(kind) => onUse(kind, { venueId, startsAt: slot.startsAt, endsAt: slot.endsAt })} />)}</ul>
        </div> : null}
      </section> : null}
    </div>
  </div>
}
