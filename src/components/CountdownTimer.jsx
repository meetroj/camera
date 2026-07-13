import { useState, useEffect } from 'react'

function getDiff(revealAt) {
  const now = Date.now()
  const target = revealAt instanceof Date ? revealAt.getTime() : Number(revealAt)
  return Math.max(0, target - now)
}

function format(ms) {
  if (ms <= 0) return null
  const totalSecs = Math.floor(ms / 1000)
  const days = Math.floor(totalSecs / 86400)
  const hours = Math.floor((totalSecs % 86400) / 3600)
  const mins = Math.floor((totalSecs % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export default function CountdownTimer({ revealAt, compact = false }) {
  const [diff, setDiff] = useState(() => getDiff(revealAt))

  useEffect(() => {
    if (!revealAt) return
    const id = setInterval(() => setDiff(getDiff(revealAt)), 60_000)
    return () => clearInterval(id)
  }, [revealAt])

  if (!revealAt) return null

  if (diff <= 0) {
    return compact ? (
      <span className="text-[#e8c97a] text-xs font-mono animate-pulse">Now!</span>
    ) : (
      <div className="flex items-center gap-2 text-[#e8c97a]">
        <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
        <span className="font-mono text-sm">Revealing now...</span>
      </div>
    )
  }

  const label = format(diff)

  if (compact) {
    return (
      <span className="text-[#e8c97a] text-xs font-mono leading-tight">
        {label}
      </span>
    )
  }

  return (
    <div className="text-center">
      <p className="text-film-muted text-xs mb-1">Reveals in</p>
      <p className="text-[#e8c97a] font-mono text-2xl font-bold">{label}</p>
    </div>
  )
}
