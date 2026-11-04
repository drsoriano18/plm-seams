import ProposalIcon from './ProposalIcon'
import { formatProposalDateTime } from './proposalDates.js'
import { venueSpec } from './proposalModel.js'
import './Proposals.css'

// Form building blocks. They live at module level so inputs keep focus between renders.

// children is a function receiving the id and aria props to spread on the control.
export function Field({ id, label, required = false, help = '', error = '', className = '', children }) {
  const aria = {
    id,
    'aria-invalid': error ? 'true' : undefined,
    'aria-required': required ? 'true' : undefined,
    'aria-describedby': [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ') || undefined,
  }
  return <div className={`organization-proposal-field ${className}`.trim()}>
    <label htmlFor={id}>{label}{required ? <span aria-hidden="true"> *</span> : null}</label>
    {children(aria)}
    {help ? <p id={`${id}-help`} className="organization-proposal-help">{help}</p> : null}
    {error ? <p id={`${id}-error`} className="organization-proposal-error-line">{error}</p> : null}
  </div>
}

export function ReadOnlyField({ id, label, value, multiline = false, className = '' }) {
  const shared = { id, value, readOnly: true, 'aria-readonly': 'true', placeholder: 'Filled in from the venue', className: 'organization-proposal-control is-readonly' }
  return <div className={`organization-proposal-field ${className}`.trim()}>
    <label htmlFor={id}>{label}</label>
    {multiline ? <textarea {...shared} rows={2} /> : <input type="text" {...shared} />}
  </div>
}

export function Section({ id, title, intro, tag, tagTone = '', children }) {
  return <section className="organization-proposal-card" aria-labelledby={id}>
    <header className="organization-proposal-card-head">
      <div><h2 id={id}>{title}</h2><p>{intro}</p></div>
      <span className={`organization-proposal-tag ${tagTone}`.trim()}>{tag}</span>
    </header>
    {children}
  </section>
}

export function Warnings({ items }) {
  const list = items.filter(Boolean)
  return list.length ? <ul className="organization-proposal-warnings">{list.map((text) => <li key={text}><ProposalIcon name="alert-circle" size={14} />{text}</li>)}</ul> : null
}

export function ChoiceCard({ name, value, checked, disabled = false, title, text, tag, hint, onChange }) {
  return <label className={`organization-proposal-choice ${checked ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`}>
    <input type="radio" name={name} value={value} checked={checked} disabled={disabled} onChange={() => onChange(value)} />
    <span className="organization-proposal-choice-body">
      <span className="organization-proposal-choice-title">{title}{tag ? <em>{tag}</em> : null}</span>
      <span className="organization-proposal-choice-text">{text}</span>
      {disabled && hint ? <span className="organization-proposal-choice-hint">{hint}</span> : null}
    </span>
  </label>
}

// One reservation: venue, read-only venue details and the start and end times.
// online: no venue is needed, only the schedule is shown. optionalNote marks the backup reservation.
export function ReservationSection({ prefix, title, slot, venue, venues, errors, warnings, held, minStart, online = false, optionalNote = '', onChange, onClear }) {
  const spec = venueSpec(venue)
  const required = !optionalNote
  return <div className="organization-proposal-venue" role="group" aria-labelledby={`${prefix}-heading`}>
    <div className="organization-proposal-venue-head">
      <h3 id={`${prefix}-heading`}>{online ? 'Event Schedule' : title}</h3>
      {held ? <span className="organization-proposal-hold"><ProposalIcon name="check" size={14} />Calendar Slot Hold: Active</span> : null}
    </div>
    {optionalNote ? <p className="organization-proposal-help">{optionalNote}</p> : null}
    {online ? null : <div className="organization-proposal-grid">
      <Field id={`${prefix}-venue`} label="Venue Name" required={required} error={errors.venue} className="is-full">
        {(aria) => <select {...aria} className="organization-proposal-control" value={slot.venueId} onChange={(event) => onChange({ venueId: event.target.value })}>
          <option value="">{required ? 'Select a venue' : 'Select a backup venue'}</option>
          {venues.map((item) => <option key={item.venue_id} value={item.venue_id}>{item.venue_name}</option>)}
        </select>}
      </Field>
      <ReadOnlyField id={`${prefix}-building`} label="Building" value={spec.building} />
      <ReadOnlyField id={`${prefix}-floor`} label="Floor Number" value={spec.floor} />
      <ReadOnlyField id={`${prefix}-room`} label="Room Number" value={spec.room} />
      <ReadOnlyField id={`${prefix}-capacity`} label="Max Capacity" value={spec.capacity} />
      <ReadOnlyField id={`${prefix}-equipment`} label="Available Equipment" value={spec.equipment} multiline className="is-full" />
    </div>}
    <div className="organization-proposal-grid">
      <Field id={`${prefix}-starts`} label="Reservation Commencement (Starts At)" required={required} error={errors.start} help="Manila time. Must be at least 15 days from today.">
        {(aria) => <input {...aria} type="datetime-local" className="organization-proposal-control is-datetime" value={slot.startsAt} min={minStart} onChange={(event) => onChange({ startsAt: event.target.value })} />}
      </Field>
      <Field id={`${prefix}-ends`} label="Reservation Conclusion (Ends At)" required={required} error={errors.end}>
        {(aria) => <input {...aria} type="datetime-local" className="organization-proposal-control is-datetime" value={slot.endsAt} min={slot.startsAt || minStart} onChange={(event) => onChange({ endsAt: event.target.value })} />}
      </Field>
    </div>
    {slot.startsAt && slot.endsAt && !errors.start && !errors.end ? <p className="organization-proposal-range">{formatProposalDateTime(slot.startsAt)} to {formatProposalDateTime(slot.endsAt)}</p> : null}
    <Warnings items={warnings} />
    {onClear ? <button type="button" className="organization-proposal-link-button" onClick={onClear}>Clear Backup Venue</button> : null}
  </div>
}
