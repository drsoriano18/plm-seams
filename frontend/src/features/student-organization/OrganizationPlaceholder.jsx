import { Link } from 'react-router'
import logoImage from '../../assets/landing/seams-wordmark.png'
import './OrganizationDashboard.css'

export default function OrganizationPlaceholder({ title, description = 'This organization workspace is prepared for the next implementation phase.' }) {
  return <main className="organization-portal-page organization-placeholder-page"><header className="organization-header"><Link to="/student-organization/dashboard" className="organization-brand" aria-label="Return to organization dashboard"><img src={logoImage} alt="PLM SEAMS" width="112" height="40" /></Link><nav className="organization-primary-nav" aria-label="Student organization sections"><Link to="/student-organization/dashboard">Events</Link><Link to="/student-organization/calendar">Calendar</Link><Link to="/student-organization/archives">Archives</Link></nav></header><section className="organization-placeholder-content"><p className="organization-placeholder-kicker">Student Organization</p><h1>{title}</h1><p>{description}</p><Link className="organization-create-button" to="/student-organization/dashboard">Return to dashboard</Link></section><footer className="organization-footer"><strong>Pamantasan ng Lungsod ng Maynila · SEAMS</strong><span>© 2026 PLM Student Event Administration &amp; Management System.</span></footer></main>
}
