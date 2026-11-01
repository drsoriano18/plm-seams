import { BrowserRouter, Route, Routes } from 'react-router'
import './App.css'
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
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/student/login" element={<LoginPage portal="student" />} />
        <Route path="/student-organization/login" element={<LoginPage portal="organization" />} />
        <Route path="/admin/login" element={<LoginPage portal="administrator" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
