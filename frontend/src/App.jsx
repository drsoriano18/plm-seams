import { BrowserRouter, Route, Routes } from 'react-router'
import './App.css'
import { AuthProvider, ProtectedRoute } from './features/auth/AuthProvider'
import { lazy, Suspense } from 'react'
const Dashboard = lazy(() => import('./features/dashboard/Dashboard'))
const AdminDashboard = lazy(() => import('./features/administrators/AdminDashboard'))
const AdminAccount = lazy(() => import('./features/administrators/AdminAccount'))
const AdminProfile = lazy(() => import('./features/administrators/AdminProfile'))
const AdminCalendar = lazy(() => import('./features/administrators/AdminCalendar'))
const ApprovedEvents = lazy(() => import('./features/administrators/ApprovedEvents'))
const AllProposals = lazy(() => import('./features/administrators/AllProposals'))
const ProposalReview = lazy(() => import('./features/administrators/ProposalReview'))
const ArchivedEvents = lazy(() => import('./features/administrators/ArchivedEvents'))
const ArchivedEventDetail = lazy(() => import('./features/administrators/ArchivedEventDetail'))
const ArchivedEventAttendees = lazy(() => import('./features/administrators/ArchivedEventAttendees'))
const StudentDashboard = lazy(() => import('./features/dashboard/StudentDashboard'))
const StudentProfile = lazy(() => import('./features/dashboard/StudentProfile'))
const StudentProfileSettings = lazy(() => import('./features/dashboard/StudentProfileSettings'))
const StudentEventDetails = lazy(() => import('./features/dashboard/StudentEventDetails'))
const DiscoverEvents = lazy(() => import('./features/dashboard/DiscoverEvents'))
import LoginPage from './features/auth/LoginPage'
import backgroundImage from './assets/landing/background.png'
import logoImage from './assets/landing/plm-seams-logo.png'
import studentIcon from './assets/landing/student.svg'
import organizationIcon from './assets/landing/organization.svg'
import administratorIcon from './assets/landing/administrator.svg'
import chevronIcon from './assets/landing/chevron.svg'
import footerMark from './assets/landing/footer-mark.svg'

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
      <AuthProvider><Suspense fallback={<p role="status">Loading workspace…</p>}><Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/student/login" element={<LoginPage portal="student" />} />
        <Route path="/student-organization/login" element={<LoginPage portal="organization" />} />
        <Route path="/admin/login" element={<LoginPage portal="administrator" />} />
        <Route path="/student/dashboard" element={<ProtectedRoute role="Student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/discover" element={<ProtectedRoute role="Student"><DiscoverEvents /></ProtectedRoute>} />
        <Route path="/student/profile" element={<ProtectedRoute role="Student"><StudentProfile /></ProtectedRoute>} />
        <Route path="/student/profile/settings" element={<ProtectedRoute role="Student"><StudentProfileSettings /></ProtectedRoute>} />
        <Route path="/student/events/:eventId" element={<ProtectedRoute role="Student"><StudentEventDetails /></ProtectedRoute>} />
        <Route path="/student-organization/dashboard" element={<ProtectedRoute role="Student Organization"><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute role="Admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/account" element={<ProtectedRoute role="Admin"><AdminAccount /></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute role="Admin"><AdminProfile /></ProtectedRoute>} />
        <Route path="/admin/calendar" element={<ProtectedRoute role="Admin"><AdminCalendar /></ProtectedRoute>} />
        <Route path="/admin/calendar/events" element={<ProtectedRoute role="Admin"><ApprovedEvents /></ProtectedRoute>} />
        <Route path="/admin/archives" element={<ProtectedRoute role="Admin"><ArchivedEvents /></ProtectedRoute>} />
        <Route path="/admin/archives/:eventId/attendees" element={<ProtectedRoute role="Admin"><ArchivedEventAttendees /></ProtectedRoute>} />
        <Route path="/admin/archives/:eventId" element={<ProtectedRoute role="Admin"><ArchivedEventDetail /></ProtectedRoute>} />
        <Route path="/admin/proposals" element={<ProtectedRoute role="Admin"><AllProposals /></ProtectedRoute>} />
        <Route path="/admin/proposals/:proposalId" element={<ProtectedRoute role="Admin"><ProposalReview /></ProtectedRoute>} />
        <Route path="*" element={<LandingPage />} />
      </Routes></Suspense></AuthProvider>
    </BrowserRouter>
  )
}

export default App
