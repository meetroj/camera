import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hostApi } from '../../services/api'
import { Screen, Button, Input, ErrorText, Card, BackLink, Spinner } from '../../components/host/ui'

const EVENT_TYPES = [
  { id: 'wedding', label: 'Wedding', emoji: '💍' },
  { id: 'birthday', label: 'Birthday', emoji: '🎂' },
  { id: 'party', label: 'Party', emoji: '🎉' },
  { id: 'concert', label: 'Concert', emoji: '🎵' },
  { id: 'graduation', label: 'Graduation', emoji: '🎓' },
  { id: 'other', label: 'Other', emoji: '📦' },
]

const REVEAL_OPTIONS = [
  { id: 'immediate', label: 'Right away', desc: 'Photos visible immediately', emoji: '🔴' },
  { id: '1hour', label: '1 hour after', desc: 'Build anticipation', emoji: '⏱️' },
  { id: 'nextday', label: 'Next morning', desc: 'Like developing film', emoji: '🌅', popular: true },
  { id: 'custom', label: 'Custom time', desc: 'Pick an exact date & time', emoji: '📅' },
]

const TOTAL_STEPS = 4

export default function CreateEventPage() {
  const navigate = useNavigate()

  const [plans, setPlans] = useState([])
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    eventType: 'other',
    plan: 'free',
    photosPerGuest: 10,
    galleryType: 'shared',
    revealOption: 'nextday',
    customAt: '',
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // The plan catalogue comes from the server so prices can never drift out of
  // sync with what actually gets charged.
  useEffect(() => {
    hostApi
      .plans()
      .then(({ plans }) => setPlans(plans))
      .catch((err) => setError(err.message))
  }, [])

  const plan = plans.find((p) => p.id === form.plan)

  // A plan's photosPerGuest is a ceiling; the server clamps to it regardless.
  const shotChoices = [5, 10, 15, 20, 30].filter((n) => !plan || n <= plan.photosPerGuest)

  const canNext = step === 1 ? form.name.trim().length > 0 : true

  const handleCreate = async () => {
    setError('')
    setSaving(true)
    try {
      const { event, requiresPayment } = await hostApi.createEvent({
        name: form.name.trim(),
        eventType: form.eventType,
        plan: form.plan,
        photosPerGuest: Number(form.photosPerGuest),
        galleryType: form.galleryType,
        revealOption: form.revealOption,
        customAt: form.revealOption === 'custom' ? new Date(form.customAt).toISOString() : undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })

      // Paid events land as drafts — the Razorpay webhook is the only thing
      // that may activate them. The detail page handles the payment prompt.
      navigate(`/host/events/${event._id}${requiresPayment ? '?pay=1' : ''}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!plans.length && !error) return <Screen><Spinner label="Loading plans…" /></Screen>

  return (
    <Screen>
      <BackLink to="/host">Dashboard</BackLink>

      <div className="mb-6">
        <div className="h-[3px] w-full rounded bg-film-border">
          <div
            className="h-full rounded bg-film-gold transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-center font-mono text-[10px] text-film-muted">
          Step {step} of {TOTAL_STEPS}
        </p>
      </div>

      {/* ── Step 1 — Identity ── */}
      {step === 1 && (
        <div className="slide-up">
          <h2 className="mb-6 font-mono text-2xl font-bold text-film-cream">What&apos;s the occasion?</h2>

          <Input
            placeholder="Event name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            maxLength={60}
            autoFocus
          />

          <p className="mb-2.5 mt-6 font-mono text-xs text-film-muted">Event type</p>
          <div className="grid grid-cols-3 gap-2.5">
            {EVENT_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => set('eventType', t.id)}
                className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border transition
                  ${form.eventType === t.id
                    ? 'border-film-gold bg-film-gold/10 text-film-gold'
                    : 'border-film-border bg-film-surface text-film-muted hover:border-film-muted'}`}
              >
                <span className="text-2xl">{t.emoji}</span>
                <span className="font-mono text-[11px]">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2 — Camera rules ── */}
      {step === 2 && (
        <div className="slide-up">
          <h2 className="mb-6 font-mono text-2xl font-bold text-film-cream">Set the camera rules</h2>

          <p className="mb-2.5 font-mono text-xs text-film-muted">
            Photos per guest — fewer shots means more intentional ones
          </p>
          <div className="mb-6 flex flex-wrap gap-2">
            {shotChoices.map((n) => (
              <button
                key={n}
                onClick={() => set('photosPerGuest', n)}
                className={`rounded-full border px-5 py-2.5 font-mono text-[15px] transition
                  ${Number(form.photosPerGuest) === n
                    ? 'border-film-gold bg-film-gold/20 font-bold text-film-gold'
                    : 'border-film-border bg-film-surface text-film-muted hover:border-film-muted'}`}
              >
                {n}
              </button>
            ))}
          </div>

          <p className="mb-2.5 font-mono text-xs text-film-muted">Max guests</p>
          <div className="flex flex-col gap-2.5">
            {plans.map((p) => {
              const selected = form.plan === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    set('plan', p.id)
                    // Keep the shot count inside the new plan's ceiling.
                    if (Number(form.photosPerGuest) > p.photosPerGuest) {
                      set('photosPerGuest', p.photosPerGuest)
                    }
                  }}
                  className={`flex items-center justify-between rounded-xl border p-4 text-left transition
                    ${selected ? 'border-film-cream' : 'border-film-border hover:border-film-muted'} bg-film-surface`}
                >
                  <div>
                    <p className="font-mono text-[15px] font-bold text-film-cream">
                      {p.maxGuests >= 9999 ? 'Unlimited' : `Up to ${p.maxGuests}`} guests
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-film-muted">
                      {p.label} · up to {p.photosPerGuest >= 9999 ? '∞' : p.photosPerGuest} shots each
                    </p>
                  </div>
                  <span
                    className={`font-mono text-[15px] font-bold ${p.priceInr === 0 ? 'text-green-500' : 'text-film-gold'}`}
                  >
                    {p.priceInr === 0 ? 'Free' : `₹${p.priceInr}`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Step 3 — The reveal ── */}
      {step === 3 && (
        <div className="slide-up">
          <h2 className="mb-6 font-mono text-2xl font-bold text-film-cream">When do photos reveal?</h2>

          <div className="flex flex-col gap-2.5">
            {REVEAL_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => set('revealOption', o.id)}
                className={`flex items-center gap-3 rounded-xl border bg-film-surface p-4 text-left transition
                  ${form.revealOption === o.id ? 'border-film-cream' : 'border-film-border hover:border-film-muted'}`}
              >
                <span className="text-2xl">{o.emoji}</span>
                <span className="flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[15px] font-semibold text-film-cream">{o.label}</span>
                    {o.popular && (
                      <span className="rounded bg-film-gold/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-film-gold">
                        Popular
                      </span>
                    )}
                  </span>
                  <span className="block font-mono text-xs text-film-muted">{o.desc}</span>
                </span>
              </button>
            ))}
          </div>

          {form.revealOption === 'custom' && (
            <div className="mt-4">
              <Input
                type="datetime-local"
                label="Reveal at"
                value={form.customAt}
                onChange={(e) => set('customAt', e.target.value)}
              />
            </div>
          )}

          <p className="mb-2.5 mt-6 font-mono text-xs text-film-muted">Gallery type</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'shared', icon: '👥', label: 'Shared', desc: 'All guests see all photos' },
              { id: 'private', icon: '🔒', label: 'Private', desc: 'Only you see the photos' },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => set('galleryType', o.id)}
                className={`rounded-xl border bg-film-surface p-3.5 text-left transition
                  ${form.galleryType === o.id ? 'border-film-cream bg-film-cream/5' : 'border-film-border hover:border-film-muted'}`}
              >
                <span className="text-lg">{o.icon}</span>
                <p className="mt-1.5 font-mono text-sm font-semibold text-film-cream">{o.label}</p>
                <p className="font-mono text-[11px] text-film-muted">{o.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 4 — Review ── */}
      {step === 4 && (
        <div className="slide-up">
          <h2 className="mb-6 font-mono text-2xl font-bold text-film-cream">Almost ready!</h2>

          <Card className="mb-5 flex flex-col gap-3">
            {[
              ['Event', form.name],
              ['Type', EVENT_TYPES.find((t) => t.id === form.eventType)?.label],
              ['Guests', plan?.maxGuests >= 9999 ? 'Unlimited' : `Up to ${plan?.maxGuests}`],
              ['Photos', `${form.photosPerGuest} each`],
              ['Reveal', REVEAL_OPTIONS.find((o) => o.id === form.revealOption)?.label],
              ['Gallery', form.galleryType === 'shared' ? 'Shared' : 'Private'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between font-mono text-[13px]">
                <span className="text-film-muted">{k}</span>
                <span className="font-semibold text-film-cream">{v}</span>
              </div>
            ))}
          </Card>

          <div className="mb-5 flex items-center justify-between">
            <span className="font-mono text-sm text-film-muted">Total</span>
            <span
              className={`font-mono text-3xl font-bold ${plan?.priceInr === 0 ? 'text-green-500' : 'text-film-cream'}`}
            >
              {plan?.priceInr === 0 ? 'Free' : `₹${plan?.priceInr}`}
            </span>
          </div>

          <ErrorText>{error}</ErrorText>

          <Button onClick={handleCreate} disabled={saving} className="mt-2">
            {saving ? 'Creating…' : plan?.priceInr === 0 ? 'Create Event' : 'Continue to Payment'}
          </Button>
        </div>
      )}

      {/* Nav */}
      {step < TOTAL_STEPS && (
        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            Next →
          </Button>
        </div>
      )}
      {step === TOTAL_STEPS && (
        <Button variant="ghost" className="mt-3" onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
      )}
    </Screen>
  )
}
