import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { hostApi } from '../../services/api'
import { Screen, Spinner, Button, Card, StatusBadge, Countdown } from '../../components/host/ui'

function EventCard({ event }) {
  return (
    <Link to={`/host/events/${event._id}`} className="block">
      <Card className="transition hover:border-film-muted">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="font-mono text-lg font-bold leading-tight text-film-cream">{event.name}</h3>
          <StatusBadge status={event.status} />
        </div>

        <div className="mb-3 inline-block rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] capitalize text-film-muted">
          {event.eventType}
        </div>

        <div className="flex items-center justify-between font-mono text-xs text-film-muted">
          <span>
            👥 {event.guestsJoined}/{event.maxGuests} · 🖼 {event.totalPhotos}
          </span>

          {event.status === 'active' && (
            <span className="text-film-gold">
              ⏱ <Countdown to={event.revealAt} />
            </span>
          )}
          {event.status === 'revealed' && <span className="text-[#3498db]">Developed</span>}
          {event.status === 'draft' && <span className="text-[#f39c12]">Payment needed</span>}
        </div>
      </Card>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-film-gold/30 bg-film-gold/10 text-4xl">
        📷
      </div>
      <h2 className="mb-2 font-mono text-xl font-bold text-film-cream">No events yet</h2>
      <p className="mb-8 max-w-xs font-mono text-sm leading-relaxed text-film-muted">
        Create your first event and share the QR code with your guests.
      </p>
      <Link to="/host/create" className="w-full max-w-xs">
        <Button>+ Create Event</Button>
      </Link>
    </div>
  )
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    hostApi
      .listEvents()
      .then(({ events }) => setEvents(events))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/host/login', { replace: true })
  }

  const initials = (user?.name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Screen>
      <header className="mb-6 flex items-center justify-between border-b border-film-border pb-5">
        <div>
          <h1 className="font-mono text-2xl font-bold text-film-cream">Your Events</h1>
          <p className="font-mono text-xs text-film-muted">{user?.email}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/host/create"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-film-border bg-film-surface font-mono text-xl text-film-cream hover:border-film-gold"
            title="Create event"
          >
            +
          </Link>
          <button
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-film-gold font-mono text-xs font-bold text-film-bg"
            title="Sign out"
          >
            {initials}
          </button>
        </div>
      </header>

      {loading ? (
        <Spinner label="Loading your events…" />
      ) : error ? (
        <Card className="border-red-900 text-center">
          <p className="font-mono text-sm text-red-400">{error}</p>
          <p className="mt-2 font-mono text-xs text-film-muted">
            Make sure the backend is running: <code>cd camera-b &amp;&amp; npm run dev</code>
          </p>
        </Card>
      ) : events.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((e) => (
            <EventCard key={e._id} event={e} />
          ))}
        </div>
      )}
    </Screen>
  )
}
