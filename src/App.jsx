import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import DashboardPage from './pages/DashboardPage'
import EventsPage from './pages/EventsPage'
import ThreatsPage from './pages/ThreatsPage'
import IncidentsPage from './pages/IncidentsPage'
import RisksPage from './pages/RisksPage'
import ControlsPage from './pages/ControlsPage'
import CompliancePage from './pages/CompliancePage'
import EvidencePage from './pages/EvidencePage'
import PrivacyPage from './pages/PrivacyPage'
import InventoryPage from './pages/InventoryPage'
import AIPage from './pages/AIPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'
import { ShieldAlert } from 'lucide-react'
import CookieConsentBanner from './components/CookieConsentBanner'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: '80vh' }}>
        <div className="spinner" />
        Loading Cyber Sentinel Platform…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="panel animate-fade-in-up" style={{ maxWidth: 600, margin: '60px auto', padding: '36px 32px', textAlign: 'center' }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'rgba(185, 28, 28, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          color: 'var(--color-critical)'
        }}>
          <ShieldAlert size={28} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--charcoal-900)', margin: '0 0 8px 0' }}>
          Access Restricted
        </h2>
        <p style={{ color: 'var(--charcoal-600)', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 20px 0' }}>
          Your current account role (<strong>{user.role}</strong>) does not have authorization to view this module.
          Administrator privileges are required.
        </p>
        <a href="/dashboard" className="btn btn-primary btn-sm">
          Return to Dashboard
        </a>
      </div>
    )
  }

  return children
}

function MainLayout() {
  const { user, loading } = useAuth()

  return (
    <div className="app-shell-topnav">
      <Navbar />
      <main className="main-content-full">
        <div className="page-body-full">
          <Routes>
            {/* Home / Landing Page */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />

            {/* Protected Platform Routes */}
            <Route path="/dashboard"   element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/events"      element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
            <Route path="/threats"     element={<ProtectedRoute><ThreatsPage /></ProtectedRoute>} />
            <Route path="/incidents"   element={<ProtectedRoute><IncidentsPage /></ProtectedRoute>} />
            <Route path="/risks"       element={<ProtectedRoute><RisksPage /></ProtectedRoute>} />
            <Route path="/controls"    element={<ProtectedRoute><ControlsPage /></ProtectedRoute>} />
            <Route path="/compliance"  element={<ProtectedRoute><CompliancePage /></ProtectedRoute>} />
            <Route path="/evidence"    element={<ProtectedRoute><EvidencePage /></ProtectedRoute>} />
            <Route path="/privacy"     element={<ProtectedRoute><PrivacyPage /></ProtectedRoute>} />
            <Route path="/inventory"   element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
            <Route path="/ai"          element={<ProtectedRoute><AIPage /></ProtectedRoute>} />
            <Route path="/reports"     element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/users"       element={<ProtectedRoute allowedRoles={['ADMIN']}><UsersPage /></ProtectedRoute>} />


            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/signup"          element={<SignupPage />} />
        <Route path="/verify-email"    element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/*"               element={<MainLayout />} />
      </Routes>
      <CookieConsentBanner />
    </AuthProvider>
  )
}
