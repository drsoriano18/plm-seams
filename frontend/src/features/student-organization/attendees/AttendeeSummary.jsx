import AttendeeIcon from './AttendeeIcon'
import { formatPct } from './attendeeModel.js'

function Bar({ value, label, tone }) {
  const pct = Math.max(0, Math.min(100, value ?? 0))
  return <div className="organization-attendees-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
    <span className={tone} style={{ width: `${pct}%` }} />
  </div>
}

function Card({ label, icon, children }) {
  return <article className="organization-attendees-card">
    <header><h2>{label}</h2><AttendeeIcon name={icon} size={16} /></header>
    {children}
  </article>
}

export default function AttendeeSummary({ summary }) {
  const s = summary
  return <section className="organization-attendees-summary" aria-label="Attendee Summary">
    <Card label="Total Registered" icon="users">
      <p className="organization-attendees-figure is-navy">{s.total}<small>/ {s.capacity}</small></p>
      <Bar value={s.totalPct} label="Total registered against capacity" tone="is-navy" />
      <p className="organization-attendees-caption">{s.totalPct == null ? '\u2014' : `${formatPct(s.totalPct)} Allocation Cap`}</p>
    </Card>
    <Card label="Confirmed Seats" icon="ticket">
      <p className="organization-attendees-figure is-navy">{s.confirmed}</p>
      <p><span className="organization-attendees-tag is-amber">{formatPct(s.confirmedPct)}</span></p>
    </Card>
    <Card label="Waitlisted Pool" icon="hourglass">
      <p className="organization-attendees-figure is-ink">{s.waitlisted}</p>
      <p className="organization-attendees-caption">Queued</p>
    </Card>
    <Card label="Present" icon="user-check">
      <p className="organization-attendees-figure is-gold">{s.present}</p>
      <p><span className="organization-attendees-tag is-gold">{formatPct(s.presentPct)}</span></p>
      <Bar value={s.presentPct} label="Present share of confirmed" tone="is-gold" />
    </Card>
    <Card label="Absent" icon="user-x">
      <p className="organization-attendees-figure is-red">{s.absent}</p>
      <p><span className="organization-attendees-tag is-red">{formatPct(s.absentPct)}</span></p>
    </Card>
    <Card label="Pre-Event Cancelled" icon="x-circle">
      <p className="organization-attendees-figure is-stone">{s.cancelled}</p>
      <p className="organization-attendees-caption is-faint">Audited</p>
    </Card>
  </section>
}
