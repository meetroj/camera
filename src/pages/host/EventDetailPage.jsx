import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { hostApi } from '../../services/api'
import {
  Screen, Spinner, Button, Card, StatusBadge, Countdown, BackLink, ErrorText,
} from '../../components/host/ui'

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [photos, setPhotos] = useState([])
  const [locked, setLocked] = useState(false) // gallery not yet revealed
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  // The guest URL this event's QR encodes.
  const joinUrl = event ? `${window.location.origin}/e/${event.joinCode}` : ''

  const load = useCallback(async () => {
    try {
      const { event } = await hostApi.getEvent(id)
      setEvent(event)

      // The host can always see the gallery — the reveal gate only applies to
      // guests. A 423 here would mean the server disagrees, so surface it.
      try {
        const { photos } = await hostApi.photos(id)
        setPhotos(photos)
        setLocked(false)
      } catch (err) {
        if (err.status === 423) setLocked(true)
        else throw err
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  // Guests joining and photos landing should appear without a refresh. Polling
  // is the honest simple option; the backend also emits Socket.io `event:stats`
  // if you'd rather wire that up.
  useEffect(() => {
    if (event?.status !== 'active') return
    const t = setInterval(load, 10_000)
    return () => clearInterval(t)
  }, [event?.status, load])

  const copyLink = async () => {
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQR = () => {
    const canvas = document.querySelector('#event-qr canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${event.joinCode}-qr.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const act = async (fn, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(true)
    setError('')
    try {
      await fn()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Screen><Spinner label="Loading event…" /></Screen>

  if (!event) {
    return (
      <Screen>
        <BackLink to="/host">Dashboard</BackLink>
        <Card className="border-red-900 text-center">
          <p className="font-mono text-sm text-red-400">{error || 'Event not found.'}</p>
        </Card>
      </Screen>
    )
  }

  return (
    <Screen>
      <BackLink to="/host">Dashboard</BackLink>

      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold text-film-cream">{event.name}</h1>
          <p className="font-mono text-xs capitalize text-film-muted">{event.eventType}</p>
        </div>
        <StatusBadge status={event.status} />
      </div>

      <ErrorText>{error}</ErrorText>

      {/* Unpaid draft */}
      {event.status === 'draft' && (
        <Card className="mb-5 border-[#f39c12]/50 bg-[#f39c12]/5">
          <p className="font-mono text-sm font-bold text-[#f39c12]">Payment needed</p>
          <p className="mt-1 font-mono text-xs leading-relaxed text-film-muted">
            This event stays a draft until payment clears. Guests can&apos;t join yet.
          </p>
          <Button
            variant="ghost"
            className="mt-3"
            disabled={busy}
            onClick={() =>
              act(async () => {
                const order = await hostApi.createOrder(event._id)
                // Razorpay Checkout isn't wired into the page yet — the order is
                // real, but the payment sheet needs the Razorpay script + keys.
                window.alert(
                  `Razorpay order created: ${order.orderId}\n₹${order.amount / 100}\n\n` +
                    'Checkout UI is not wired up yet — see README.'
                )
              })
            }
          >
            Pay ₹{event.planPrice}
          </Button>
        </Card>
      )}

      {/* Stats */}
      <div className="mb-5 grid grid-cols-3 gap-2.5">
        {[
          ['Guests', `${event.guestsJoined}/${event.maxGuests >= 9999 ? '∞' : event.maxGuests}`],
          ['Photos', event.totalPhotos],
          ['Shots each', event.photosPerGuest],
        ].map(([label, value]) => (
          <Card key={label} className="text-center">
            <p className="font-mono text-2xl font-bold text-film-cream">{value}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-film-muted">{label}</p>
          </Card>
        ))}
      </div>

      {/* Reveal countdown */}
      {event.status === 'active' && (
        <Card className="mb-5 border-film-gold/40 bg-film-gold/5 text-center">
          <p className="font-mono text-[11px] uppercase tracking-wider text-film-muted">
            Develops in
          </p>
          <p className="my-1 font-mono text-3xl font-bold text-film-gold">
            <Countdown to={event.revealAt} />
          </p>
          <p className="font-mono text-[11px] text-film-muted">
            {new Date(event.revealAt).toLocaleString()}
          </p>
          <Button
            variant="ghost"
            className="mt-3"
            disabled={busy}
            onClick={() =>
              act(
                () => hostApi.revealEvent(event._id),
                'Reveal now? Guests will be notified and the camera closes for good.'
              )
            }
          >
            Reveal now
          </Button>
        </Card>
      )}

      {/* QR — only useful once guests can actually join */}
      {event.status === 'active' && (
        <Card className="mb-5 flex flex-col items-center">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-film-muted">
            Guests scan this
          </p>

          <div id="event-qr" className="rounded-2xl bg-white p-4">
            <QRCodeCanvas value={joinUrl} size={200} level="M" includeMargin={false} />
          </div>

          <p className="mt-3 font-mono text-2xl font-bold tracking-widest text-film-gold">
            {event.joinCode}
          </p>
          <p className="mb-4 break-all text-center font-mono text-[11px] text-film-muted">{joinUrl}</p>

          <div className="grid w-full grid-cols-2 gap-2.5">
            <Button variant="ghost" onClick={copyLink}>
              {copied ? '✓ Copied' : 'Copy link'}
            </Button>
            <Button variant="ghost" onClick={downloadQR}>
              Download QR
            </Button>
          </div>
        </Card>
      )}

      {/* Gallery */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-sm font-bold text-film-cream">Gallery</h2>
        <span className="font-mono text-xs text-film-muted">{photos.length} photos</span>
      </div>

      {locked ? (
        <Card className="text-center">
          <p className="font-mono text-sm text-film-muted">
            Still developing — nothing to show yet.
          </p>
        </Card>
      ) : photos.length === 0 ? (
        <Card className="text-center">
          <p className="font-mono text-sm text-film-muted">
            No photos yet. Share the QR code to get started.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square">
              <img
                src={p.thumbUrl}
                alt={`by ${p.guestName}`}
                loading="lazy"
                className="h-full w-full rounded object-cover"
              />
              <button
                onClick={() =>
                  act(() => hostApi.deletePhoto(p.id), 'Delete this photo? This cannot be undone.')
                }
                className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white group-hover:flex"
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Danger zone */}
      <div className="mt-8 flex flex-col gap-2.5 border-t border-film-border pt-5">
        {event.status === 'active' && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() =>
              act(() => hostApi.endEvent(event._id), 'End the event? Guests can no longer take photos.')
            }
          >
            End event early
          </Button>
        )}
        <Button
          variant="danger"
          disabled={busy}
          onClick={() =>
            act(async () => {
              await hostApi.deleteEvent(event._id)
              navigate('/host', { replace: true })
            }, 'Delete this event? You have 30 days to recover it.')
          }
        >
          Delete event
        </Button>
      </div>
    </Screen>
  )
}
