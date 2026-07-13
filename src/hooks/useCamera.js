import { useState, useRef, useCallback } from 'react'

export function useCamera() {
  const [stream, setStream] = useState(null)
  const [hasPermission, setHasPermission] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')
  const [isLoading, setIsLoading] = useState(false)
  const streamRef = useRef(null)

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const startCamera = useCallback(async () => {
    setIsLoading(true)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      streamRef.current = mediaStream
      setStream(mediaStream)
      setHasPermission(true)
    } catch (err) {
      setHasPermission(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' ? false : false
      )
      console.error('Camera start error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    stopTracks()
    setStream(null)
  }, [])

  const switchCamera = useCallback(async () => {
    stopTracks()
    const newMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newMode)
    setIsLoading(true)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: newMode } },
      })
      streamRef.current = mediaStream
      setStream(mediaStream)
    } catch (err) {
      console.error('Switch camera error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [facingMode])

  const applyFilmGrain = (canvas) => {
    const ctx = canvas.getContext('2d')
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const w = canvas.width
    const h = canvas.height
    const cx = w / 2
    const cy = h / 2
    const maxDist = Math.sqrt(cx * cx + cy * cy)

    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4
      const x = idx % w
      const y = Math.floor(idx / w)
      const noise = (Math.random() - 0.5) * 40

      // Warm film tone: boost red, reduce blue
      data[i]     = Math.min(255, Math.max(0, data[i] * 1.05 + noise))
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise))
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * 0.95 + noise))

      // Vignette darkening toward edges
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      const vig = 1 - (dist / maxDist) * 0.55
      data[i]     = Math.floor(data[i] * vig)
      data[i + 1] = Math.floor(data[i + 1] * vig)
      data[i + 2] = Math.floor(data[i + 2] * vig)
    }

    ctx.putImageData(imageData, 0, 0)
  }

  const capturePhoto = useCallback((videoRef) => {
    return new Promise((resolve, reject) => {
      const video = videoRef.current
      if (!video || !video.videoWidth) return reject(new Error('Video not ready'))

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d').drawImage(video, 0, 0)
      applyFilmGrain(canvas)

      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Capture failed'))),
        'image/jpeg',
        0.92
      )
    })
  }, [])

  return {
    stream,
    hasPermission,
    facingMode,
    isLoading,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
  }
}
