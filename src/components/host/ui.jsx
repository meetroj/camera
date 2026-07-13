// Shared primitives for the host app. The look is ported from the React Native
// app: near-black ground, cream text, gold accent, monospace.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function Screen({ children, className = '' }) {
  return (
    <div className="fixed inset-0 bg-film-bg overflow-y-auto">
      <div className={`mx-auto w-full max-w-2xl px-5 py-6 pb-24 ${className}`}>{children}</div>
    </div>
  )
}

export function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="spinner" />
      {label && <p className="font-mono text-sm text-film-muted">{label}</p>}
    </div>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-film-cream text-film-bg hover:opacity-90',
    ghost: 'bg-film-surface text-film-cream border border-film-border hover:border-film-muted',
    danger: 'bg-transparent text-red-400 border border-red-900 hover:bg-red-950',
  }
  return (
    <button
      className={`w-full rounded-xl px-5 py-3.5 font-mono text-[15px] font-bold transition
                  disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block font-mono text-xs text-film-muted">{label}</span>}
      <input
        className={`w-full rounded-xl border bg-film-surface px-4 py-3.5 font-mono text-[15px]
                    text-film-cream placeholder:text-film-muted focus:outline-none
                    ${error ? 'border-red-800' : 'border-film-border focus:border-film-gold'} ${className}`}
        {...props}
      />
    </label>
  )
}

export function ErrorText({ children }) {
  if (!children) return null
  return <p className="text-center font-mono text-xs text-red-400">{children}</p>
}

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-2xl border border-film-border bg-film-surface p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

const STATUS_STYLES = {
  draft: { label: 'Unpaid', color: '#f39c12' },
  active: { label: 'Live', color: '#27ae60' },
  revealed: { label: 'Revealed', color: '#3498db' },
  ended: { label: 'Ended', color: '#888888' },
  expired: { label: 'Expired', color: '#888888' },
}

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.ended
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-[11px] font-semibold"
      style={{ color: s.color, borderColor: `${s.color}66`, backgroundColor: `${s.color}1f` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
      {s.label}
    </span>
  )
}

/** Live countdown to a reveal. Ticks every second. */
export function Countdown({ to, className = '' }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const target = new Date(to).getTime()
  if (Number.isNaN(target)) return null

  const diff = target - now
  if (diff <= 0) return <span className={className}>Ready to develop</span>

  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1000)

  const text = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`
  return <span className={className}>{text}</span>
}

export function BackLink({ to, children = 'Back' }) {
  return (
    <Link to={to} className="mb-5 inline-flex items-center gap-1.5 font-mono text-sm text-film-muted hover:text-film-cream">
      ← {children}
    </Link>
  )
}
