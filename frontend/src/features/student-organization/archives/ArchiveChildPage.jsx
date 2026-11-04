import { Link } from 'react-router'
import OrganizationHeader from '../components/OrganizationHeader'
import OrganizationFooter from '../components/OrganizationFooter'
import { ARCHIVES_PATH } from './archiveModel.js'
import '../OrganizationDashboard.css'
import '../calendar/OrganizationCalendar.css'
import './Archives.css'
import './ArchiveDetails.css'

export default function ArchiveChildPage({ eventId, title, description }) {
  return <main className="organization-portal-page organization-archive-page">
    <OrganizationHeader active="archives" skipTarget="organization-archive-child-heading" />
    <section className="organization-context-bar" aria-labelledby="organization-archive-child-heading"><div className="organization-context-inner organization-calendar-title">
      <h1 id="organization-archive-child-heading">{title}</h1>
      <p>Event {eventId}</p>
    </div></section>
    <div className="organization-main"><div className="organization-archive-detail-content">
      <div className="organization-archive-empty">
        <p>{description}</p>
        <Link className="organization-archive-back" to={`${ARCHIVES_PATH}/${encodeURIComponent(eventId)}`}>Back to Event Details</Link>
      </div>
    </div></div>
    <OrganizationFooter />
  </main>
}
