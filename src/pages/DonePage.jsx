import { useParams, useLocation, Link } from 'react-router-dom'
import CountdownTimer from '../components/CountdownTimer'

export default function DonePage() {
  const { eventId } = useParams()
  const { state } = useLocation()
  const event = state?.event
  const guest = state?.guest

  const revealAt = event?.revealAt?.toDate?.() ?? null
  const photoCount = guest?.photosUploaded ?? 0

  const shareUrl = `${window.location.origin}/event/${eventId}`

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: event?.name, url: shareUrl }).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareUrl)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center px-8 text-center slide-up">
      <div className="text-7xl mb-6">🎞️</div>

      <h1 className="text-[#f5e6d0] font-mono text-3xl font-bold mb-3">You&apos;re all done!</h1>

      {photoCount > 0 && (
        <p className="text-[#888] font-mono text-sm mb-8">
          Your {photoCount} photo{photoCount !== 1 ? 's' : ''} have been saved.
        </p>
      )}

      {revealAt && (
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#333] w-full max-w-xs mb-8">
          <p className="text-[#888] font-mono text-xs mb-3">Gallery reveals in</p>
          <CountdownTimer revealAt={revealAt} />
        </div>
      )}

      <p className="text-[#e8c97a] font-mono text-lg font-medium mb-8">See you at the reveal! ✨</p>

      <button
        onClick={handleShare}
        className="w-full max-w-xs border border-[#333] text-[#f5e6d0] font-mono text-sm py-3 rounded-xl transition-opacity active:opacity-60"
      >
        Share event link
      </button>

      {event?.galleryType === 'shared' && (
        <Link
          to={`/event/${eventId}/gallery`}
          className="mt-4 text-[#888] font-mono text-sm underline"
        >
          View gallery
        </Link>
      )}
    </div>
  )
}
