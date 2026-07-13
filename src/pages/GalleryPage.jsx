import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getGallery, getEvent } from '../services/firebase'

export default function GalleryPage() {
  const { eventId } = useParams()
  const [photos, setPhotos] = useState([])
  const [event, setEvent] = useState(null)
  const [status, setStatus] = useState('loading')
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const eventData = await getEvent(eventId)
        setEvent(eventData)
        if (!eventData?.revealed) {
          setStatus('notRevealed')
          return
        }
        const gallery = await getGallery(eventId)
        setPhotos(gallery)
        setStatus('ready')
      } catch {
        setStatus('error')
      }
    }
    load()
  }, [eventId])

  if (status === 'loading') {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  if (status === 'notRevealed') {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center px-8 text-center">
        <div className="text-6xl mb-5">🎞️</div>
        <h2 className="text-[#f5e6d0] font-mono text-2xl font-bold mb-3">Not revealed yet</h2>
        <p className="text-[#888] font-mono text-sm">Photos will appear here once the host reveals the gallery.</p>
        <Link
          to={`/event/${eventId}`}
          className="mt-6 text-[#e8c97a] font-mono text-sm underline"
        >
          Back to camera
        </Link>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center px-8 text-center">
        <div className="text-6xl mb-5">📷</div>
        <h2 className="text-[#f5e6d0] font-mono text-xl font-bold mb-3">No photos yet</h2>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pb-3 border-b border-[#1f1f1f]"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 12px)' }}
      >
        <Link to={`/event/${eventId}`} className="text-[#888] font-mono text-sm">
          ← Back
        </Link>
        <div className="text-center">
          <p className="text-[#f5e6d0] font-mono text-sm font-bold truncate max-w-[180px]">
            {event?.name}
          </p>
          <p className="text-[#888] font-mono text-xs">{photos.length} photos</p>
        </div>
        <div className="w-12" />
      </div>

      {/* Photo grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-0.5">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="aspect-square overflow-hidden bg-[#1a1a1a]"
            >
              <img
                src={photo.cloudinaryUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Full-screen photo viewer */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto.cloudinaryUrl}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-5 right-5 text-white/60 text-3xl font-light"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
