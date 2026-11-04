import { Link } from 'react-router'
import OrganizationHeader from '../components/OrganizationHeader'
import OrganizationFooter from '../components/OrganizationFooter'
import ProposalIcon from './ProposalIcon'
import '../OrganizationDashboard.css'
import './Proposals.css'

// Page frame shared by the proposal pages: organization header, centered content, footer.
// active: the header tab to highlight ('events' | 'calendar' | 'archives').
export default function ProposalShell({ active = 'events', skipTarget = 'organization-proposal-title', children }) {
  return <main className="organization-portal-page organization-proposal-page">
    <OrganizationHeader active={active} skipTarget={skipTarget} />
    <div className="organization-main"><div className="organization-proposal-content">{children}</div></div>
    <OrganizationFooter />
  </main>
}

// "← Back Label / Current Title", or just "← Back Label" when current is omitted.
// The back link underlines on hover and keyboard focus.
export function ProposalBreadcrumb({ to, backLabel, current = '' }) {
  return <nav className="organization-proposal-breadcrumb" aria-label="Breadcrumb"><ol>
    <li><Link to={to}><ProposalIcon name="arrow-left" size={14} />{backLabel}</Link></li>
    {current ? <>
      <li aria-hidden="true">/</li>
      <li><span aria-current="page">{current}</span></li>
    </> : null}
  </ol></nav>
}
