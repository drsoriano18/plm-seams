import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router'
import './App.css'
import { AuthProvider, ProtectedRoute } from './features/auth/AuthProvider'
import { lazy, Suspense } from 'react'
const Dashboard = lazy(() => import('./features/dashboard/Dashboard'))
const OrganizationCalendar = lazy(() => import('./features/student-organization/calendar/OrganizationCalendar'))
const OrganizationApprovedEvents = lazy(() => import('./features/student-organization/calendar/OrganizationApprovedEvents'))
const ArchivedEvents = lazy(() => import('./features/student-organization/archives/ArchivedEvents'))
const ArchivedEventDetails = lazy(() => import('./features/student-organization/archives/ArchivedEventDetails'))
const ArchiveRegistrations = lazy(() => import('./features/student-organization/archives/ArchiveRegistrations'))
const OrganizationEventPage = lazy(() => import('./features/student-organization/events/OrganizationEventPage'))
const OrganizationEventAttendance = lazy(() => import('./features/student-organization/events/OrganizationEventAttendance'))
const OrganizationDashboard = lazy(() => import('./features/student-organization/OrganizationDashboard'))
const CreateEventProposal = lazy(() => import('./features/student-organization/proposals/CreateEventProposal'))
const ProposalDetailPage = lazy(() => import('./features/student-organization/proposals/ProposalDetailPage'))
const OrganizationProfile = lazy(() => import('./features/student-organization/OrganizationProfile'))
const OrganizationSettings = lazy(() => import('./features/student-organization/OrganizationSettings'))
const StudentDashboard = lazy(() => import('./features/student/StudentDashboard'))
const StudentProfile = lazy(() => import('./features/student/StudentProfile'))
const StudentProfileSettings = lazy(() => import('./features/student/StudentProfileSettings'))
const StudentEventDetails = lazy(() => import('./features/student/StudentEventDetails'))
const DiscoverEvents = lazy(() => import('./features/student/DiscoverEvents'))
import LoginPage from './features/auth/LoginPage'
import backgroundImage from './assets/landing/background.png'
import logoImage from './assets/landing/plm-seams-logo.png'
import studentIcon from './assets/landing/student.svg'
import organizationIcon from './assets/landing/organization.svg'
import administratorIcon from './assets/landing/administrator.svg'
import chevronIcon from './assets/landing/chevron.svg'
import footerMark from './assets/landing/footer-mark.svg'

function ArchiveAttendanceRedirect() {
  const { eventId } = useParams()
  return <Navigate replace to={`/student-organization/archives/${encodeURIComponent(eventId)}/registrations`} />
}

const portals = [
  { title: 'Student', description: 'Registrations', path: '/student/login', icon: studentIcon, alt: 'Student portal icon' },
  { title: 'Student Organization', description: 'Events & proposals', path: '/student-organization/login', icon: organizationIcon, alt: 'Student organization portal icon' },
  { title: 'Administrators', description: 'Monitoring & clearance', path: '/admin/login', icon: administratorIcon, alt: 'Administrator portal icon' },
]

function LandingPage() {
  return (
    <main className="landing-page">
      <div className="landing-background" style={{ backgroundImage: `url(${backgroundImage})` }} aria-hidden="true" />
      <div className="landing-overlay" aria-hidden="true" />
      <section className="landing-content" aria-labelledby="welcome-heading">
        <img className="seams-logo" src={logoImage} alt="PLM SEAMS" />
        <div className="welcome-copy">
          <h1 id="welcome-heading">Welcome to PLM SEAMS!</h1>
          <p>Sign in as:</p>
        </div>
        <nav className="portal-list" aria-label="Choose a portal">
          {portals.map((portal) => (
            <a className="portal-card" href={portal.path} key={portal.title} aria-label={`${portal.title} portal`}>
              <span className="portal-icon-wrap"><img className="portal-icon" src={portal.icon} alt={portal.alt} /></span>
              <span className="portal-copy"><span className="portal-title">{portal.title}</span><span className="portal-description">{portal.description}</span></span>
              <img className="portal-chevron" src={chevronIcon} alt="" aria-hidden="true" />
            </a>
          ))}
        </nav>
      </section>
      <footer className="landing-footer">
        <img src={footerMark} alt="" aria-hidden="true" />
        <p>Pamantasan ng Lungsod ng Maynila Student Events and Administration Management System</p>
      </footer>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider><Suspense fallback={<p role="status">Loading workspaceâ€¦</p>}><Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/student/login" element={<LoginPage portal="student" />} />
        <Route path="/student-organization/login" element={<LoginPage portal="organization" />} />
        <Route path="/admin/login" element={<LoginPage portal="administrator" />} />
        <Route path="/student/dashboard" element={<ProtectedRoute role="Student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/discover" element={<ProtectedRoute role="Student"><DiscoverEvents /></ProtectedRoute>} />
        <Route path="/student/profile" element={<ProtectedRoute role="Student"><StudentProfile /></ProtectedRoute>} />
        <Route path="/student/profile/settings" element={<ProtectedRoute role="Student"><StudentProfileSettings /></ProtectedRoute>} />
        <Route path="/student/events/:eventId" element={<ProtectedRoute role="Student"><StudentEventDetails /></ProtectedRoute>} />
        <Route path="/student-organization/dashboard" element={<ProtectedRoute role="Student Organization"><OrganizationDashboard /></ProtectedRoute>} />
        <Route path="/student-organization/calendar" element={<ProtectedRoute role="Student Organization"><OrganizationCalendar /></ProtectedRoute>} />
        <Route path="/student-organization/calendar/approved-events" element={<ProtectedRoute role="Student Organization"><OrganizationApprovedEvents /></ProtectedRoute>} />
        <Route path="/student-organization/archives" element={<ProtectedRoute role="Student Organization"><ArchivedEvents /></ProtectedRoute>} />
        <Route path="/student-organization/archives/:eventId" element={<ProtectedRoute role="Student Organization"><ArchivedEventDetails /></ProtectedRoute>} />
        <Route path="/student-organization/archives/:eventId/registrations" element={<ProtectedRoute role="Student Organization"><ArchiveRegistrations /></ProtectedRoute>} />
        <Route path="/student-organization/archives/:eventId/attendance" element={<ProtectedRoute role="Student Organization"><ArchiveAttendanceRedirect /></ProtectedRoute>} />
        <Route path="/student-organization/profile" element={<ProtectedRoute role="Student Organization"><OrganizationProfile /></ProtectedRoute>} />
        <Route path="/student-organization/profile/settings" element={<ProtectedRoute role="Student Organization"><OrganizationSettings /></ProtectedRoute>} />
        <Route path="/student-organization/proposals/create" element={<ProtectedRoute role="Student Organization"><CreateEventProposal /></ProtectedRoute>} />
        <Route path="/student-organization/proposals/:proposalId" element={<ProtectedRoute role="Student Organization"><ProposalDetailPage /></ProtectedRoute>} />
        <Route path="/student-organization/events/:eventId" element={<ProtectedRoute role="Student Organization"><OrganizationEventPage /></ProtectedRoute>} />
        <Route path="/student-organization/events/:eventId/attendance" element={<ProtectedRoute role="Student Organization"><OrganizationEventAttendance /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute role="Admin"><Dashboard /></ProtectedRoute>} />
        <Route path="*" element={<LandingPage />} />
      </Routes></Suspense></AuthProvider>
    </BrowserRouter>
  )
}

export default App
