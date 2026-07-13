import CountdownTimer from './CountdownTimer'

function FilmStrip() {
  return (
    <div className="flex items-center gap-1 my-4 opacity-30">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="w-2 h-3 border border-[#f5e6d0] rounded-sm" />
      ))}
    </div>
  )
}

export default function WelcomeScreen({ event, guest, onOpenCamera }) {
  const revealAt = event?.revealAt?.toDate?.() ?? null
  const photos = guest?.photosRemaining ?? event?.photosPerGuest ?? 15

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center px-8 text-center">
      {/* App name */}
      <p className="text-[#888] font-mono text-xs tracking-[0.3em] uppercase mb-6">POV Camera</p>

      {/* Event name */}
      <h1
        className="text-[#f5e6d0] font-mono text-3xl font-bold leading-tight mb-2"
        style={{ textShadow: '0 0 40px rgba(245,230,208,0.2)' }}
      >
        {event?.name ?? 'Welcome'}
      </h1>

      <FilmStrip />

      {/* Photo count */}
      <p className="text-[#e8c97a] text-xl font-mono font-semibold mb-2">
        {photos === 9999 ? 'Unlimited photos' : `You have ${photos} photos`}
      </p>

      {/* Reveal time */}
      {revealAt && (
        <div className="mb-8">
          <CountdownTimer revealAt={revealAt} />
        </div>
      )}
      {!revealAt && <div className="mb-8" />}

      {/* CTA button */}
      <button
        onClick={onOpenCamera}
        className="pulse-cta w-full max-w-xs bg-[#f5e6d0] text-[#0a0a0a] font-mono font-bold text-lg py-4 rounded-2xl tracking-wide transition-transform active:scale-95"
      >
        Open Camera 📷
      </button>

      <p className="text-[#555] text-xs font-mono mt-4">No download needed • Works in your browser</p>
    </div>
  )
}
