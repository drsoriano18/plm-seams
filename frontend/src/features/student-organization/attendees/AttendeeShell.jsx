import { Link } from 'react-router'
import OrganizationHeader from '../components/OrganizationHeader'
import OrganizationFooter from '../components/OrganizationFooter'
import AttendeeIcon from './AttendeeIcon'

export default function Shell({ active, skipTarget, children }) {
  return <main className="organization-portal-page organization-attendees-page">
    <OrganizationHeader active={active} skipTarget={skipTarget} />
    <div className="organization-main"><div className="organization-attendees-content">{children}</div></div>
    <OrganizationFooter />
  </main>
}

// role: 'status' for loading, 'alert' for errors, omitted for plain states.
export function StatePanel({ id, title, text, role, tone, children }) {
  return <div className={`organization-attendees-state ${tone === 'error' ? 'is-error' : ''}`} role={role}>
    <h1 id={id} tabIndex={-1}>{title}</h1>
    {text ? <p>{text}</p> : null}
    {children}
  </div>
}

// items: [{ label, to? }]. The first item gets the back arrow; the item without `to` is the current page.
export function Breadcrumb({ items }) {
  return <nav className="organization-attendees-breadcrumb" aria-label="Breadcrumb"><ol>
    {items.map((item, index) => <li key={`${index}-${item.label}`}>
      {index > 0 ? <span className="organization-attendees-crumb-sep" aria-hidden="true">/</span> : null}
      {item.to
        ? <Link to={item.to}>{index === 0 ? <AttendeeIcon name="arrow-left" size={11} /> : null}{item.label}</Link>
        : <span aria-current="page">{item.label}</span>}
    </li>)}
  </ol></nav>
}
