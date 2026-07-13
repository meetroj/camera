import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEvent } from '../hooks/useEvent'
import { useCamera } from '../hooks/useCamera'
import { useUpload } from '../hooks/useUpload'
import Camera from '../components/Camera'
import WelcomeScreen from '../components/WelcomeScreen'
import PermissionGuide from '../components/PermissionGuide'

function FullScreenMessage({ emoji, title, subtitle }) {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center px-8 text-center">
      <div className="text-6xl mb-5">{emoji}</div>
      <h2 className="text-[#f5e6d0] font-mono text-2xl font-bold mb-3">{title}</h2>
      <p className="text-[#888] font-mono text-sm leading-relaxed">{subtitle}</p>
    </div>
  )
}

function Loader() {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      <div className="spinner" />
      <p className="text-[#888] font-mono text-sm">Loading your camera...</p>
    </div>
  )
}

export default function EventPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { event, guest, status } = useEvent(eventId)

  const {
    stream,
    hasPermission,
    isLoading: cameraLoading,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
  } = useCamera()

  const { uploadPhoto, isUploading, uploadProgress } = useUpload()

  // Cleanup camera on unmount
  useEffect(() => () => stopCamera(), [stopCamera])

  const handleOpenCamera = async () => {
    await startCamera()
  }

  const handleRetry = async () => {
    await startCamera()
  }

  const handlePhotoDone = () => {
    stopCamera()
    navigate(`/event/${eventId}/done`, { state: { event, guest } })
  }

  // ─── Loading ───
  if (status === 'loading' || (status === 'active' && !guest)) {
    return <Loader />
  }

  // ─── Error states ───
  if (status === 'notFound') {
    return (
      <FullScreenMessage
        emoji="📷"
        title="Event not found"
        subtitle="Check your QR code or link and try again."
      />
    )
  }

  if (status === 'inactive') {
    return (
      <FullScreenMessage
        emoji="⏳"
        title="Event not active yet"
        subtitle="The host hasn't activated this event. Check back soon."
      />
    )
  }

  // ─── Camera permission denied ───
  if (hasPermission === false) {
    return <PermissionGuide onRetry={handleRetry} />
  }

  // ─── Camera loading (waiting for getUserMedia) ───
  if (cameraLoading) {
    return <Loader />
  }

  // ─── Camera ready — show camera UI ───
  if (stream) {
    return (
      <Camera
        event={event}
        guest={guest}
        guestToken={guest?.token}
        stream={stream}
        capturePhoto={capturePhoto}
        switchCamera={switchCamera}
        uploadPhoto={uploadPhoto}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        onPhotoDone={handlePhotoDone}
      />
    )
  }

  // ─── Welcome screen (default state when event is active) ───
  return (
    <WelcomeScreen
      event={event}
      guest={guest}
      onOpenCamera={handleOpenCamera}
    />
  )
}
