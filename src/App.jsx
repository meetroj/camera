import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Spinner } from './components/host/ui'

// Guest (existing)
import EventPage from './pages/EventPage'
import GalleryPage from './pages/GalleryPage'
import DonePage from './pages/DonePage'
import NotFoundPage from './pages/NotFoundPage'

// Host (new)
import LoginPage from './pages/host/LoginPage'
import SignupPage from './pages/host/SignupPage'
import DashboardPage from './pages/host/DashboardPage'
import CreateEventPage from './pages/host/CreateEventPage'
import EventDetailPage from './pages/host/EventDetailPage'

/** Sends you to the login page unless the server says you have a session. */
function RequireHost({ children }) {
  const { user, loading } = useAuth()

  // Don't decide anything until /auth/me has answered — otherwise a signed-in
  // host gets bounced to the login screen for a frame on every hard refresh.
  if (loading) {
    return (
      <div className="fixed inset-0 bg-film-bg">
        <Spinner label="Loading…" />
      </div>
    )
  }
  return user ? children : <Navigate to="/host/login" replace />
}

/** Already signed in? Skip the login page. */
function RedirectIfHost({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="fixed inset-0 bg-film-bg" />
  return user ? <Navigate to="/host" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Host ─────────────────────────────────────────────────── */}
          <Route path="/" element={<Navigate to="/host" replace />} />

          <Route
            path="/host/login"
            element={<RedirectIfHost><LoginPage /></RedirectIfHost>}
          />
          <Route
            path="/host/signup"
            element={<RedirectIfHost><SignupPage /></RedirectIfHost>}
          />
          <Route
            path="/host"
            element={<RequireHost><DashboardPage /></RequireHost>}
          />
          <Route
            path="/host/create"
            element={<RequireHost><CreateEventPage /></RequireHost>}
          />
          <Route
            path="/host/events/:id"
            element={<RequireHost><EventDetailPage /></RequireHost>}
          />

          {/* ── Guest ────────────────────────────────────────────────── */}
          {/* /e/:joinCode is what the QR encodes and what the backend expects. */}
          <Route path="/e/:eventId" element={<EventPage />} />
          <Route path="/e/:eventId/gallery" element={<GalleryPage />} />
          <Route path="/e/:eventId/done" element={<DonePage />} />

          {/* Old guest URLs, kept so existing links don't break. */}
          <Route path="/event/:eventId" element={<EventPage />} />
          <Route path="/event/:eventId/gallery" element={<GalleryPage />} />
          <Route path="/event/:eventId/done" element={<DonePage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
