import { useRef, useEffect, useState } from 'react'
import CaptureButton from './CaptureButton'
import PhotoCounter from './PhotoCounter'
import UploadProgress from './UploadProgress'
import CountdownTimer from './CountdownTimer'

export default function Camera({
  event,
  guest,
  guestToken,
  stream,
  capturePhoto,
  switchCamera,
  uploadPhoto,
  isUploading,
  uploadProgress,
  onPhotoDone,
}) {
  const videoRef = useRef(null)
  const [photosRemaining, setPhotosRemaining] = useState(guest?.photosRemaining ?? 0)
  const [lastPhotoUrl, setLastPhotoUrl] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [flashVisible, setFlashVisible] = useState(false)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [stream])

  // Revoke object URLs to avoid memory leak
  useEffect(() => {
    return () => {
      if (lastPhotoUrl) URL.revokeObjectURL(lastPhotoUrl)
    }
  }, [lastPhotoUrl])

  const handleCapture = async () => {
    if (isCapturing || photosRemaining <= 0) return
    setIsCapturing(true)

    setFlashVisible(true)
    setTimeout(() => setFlashVisible(false), 150)

    try {
      const blob = await capturePhoto(videoRef)
      if (lastPhotoUrl) URL.revokeObjectURL(lastPhotoUrl)
      setLastPhotoUrl(URL.createObjectURL(blob))

      const newRemaining = photosRemaining - 1
      setPhotosRemaining(newRemaining)

      // Fire-and-forget upload — queue handles it
      uploadPhoto(blob, event.id, guestToken)

      if (newRemaining <= 0) {
        setTimeout(() => onPhotoDone(), 900)
      }
    } catch (err) {
      console.error('Capture error:', err)
    } finally {
      setIsCapturing(false)
    }
  }

  const revealAt = event?.revealAt?.toDate?.() ?? null

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col overflow-hidden select-none">
      {/* Upload progress bar */}
      <UploadProgress progress={uploadProgress} visible={isUploading} />

      {/* Shutter flash overlay */}
      {flashVisible && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none shutter-flash" />
      )}

      {/* Top bar */}
      <div
        className="relative z-10 flex items-center justify-between px-4 bg-gradient-to-b from-black/70 to-transparent"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 12px)', paddingBottom: 12 }}
      >
        <button
          onClick={switchCamera}
          className="w-10 h-10 flex items-center justify-center text-[#f5e6d0] text-xl rounded-full bg-black/30"
          aria-label="Switch camera"
        >
          ⟳
        </button>

        <span className="text-[#f5e6d0] font-mono text-sm font-medium truncate max-w-[180px] text-center">
          {event?.name}
        </span>

        <PhotoCounter remaining={photosRemaining} />
      </div>

      {/* Video viewfinder */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)',
          }}
        />

        {/* LIVE indicator */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-xs font-mono tracking-widest">LIVE</span>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="relative z-10 flex items-center justify-between px-6 bg-gradient-to-t from-black/80 to-transparent"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 24px)',
          paddingTop: 20,
        }}
      >
        {/* Last photo thumbnail */}
        <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/20 bg-white/5 flex items-center justify-center">
          {lastPhotoUrl ? (
            <img src={lastPhotoUrl} alt="Last capture" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white/20 text-2xl">📷</span>
          )}
        </div>

        <CaptureButton onCapture={handleCapture} disabled={isCapturing || photosRemaining <= 0} />

        {/* Reveal countdown */}
        <div className="w-14 flex flex-col items-end">
          {revealAt ? (
            <>
              <p className="text-[#888] text-[10px] font-mono mb-0.5">reveals</p>
              <CountdownTimer revealAt={revealAt} compact />
            </>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  )
}
