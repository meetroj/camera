import { useState, useRef, useCallback } from 'react'
import imageCompression from 'browser-image-compression'
import { v4 as uuidv4 } from 'uuid'
import { uploadToCloudinary } from '../services/cloudinary'
import { savePhoto, decrementPhotos } from '../services/firebase'

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState(null)
  const [completedCount, setCompletedCount] = useState(0)
  const queueRef = useRef([])
  const processingRef = useRef(false)

  const runUpload = async ({ blob, eventId, guestToken, photoId }) => {
    const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' })
    const compressed = await imageCompression(file, COMPRESSION_OPTIONS)
    const result = await uploadToCloudinary(compressed, eventId, photoId, setUploadProgress)
    await savePhoto({
      eventId,
      guestToken,
      cloudinaryUrl: result.url,
      cloudinaryPublicId: result.publicId,
      width: result.width,
      height: result.height,
      sizeBytes: result.bytes,
    })
    await decrementPhotos(guestToken)
    return result
  }

  const processQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) return
    processingRef.current = true
    setIsUploading(true)

    while (queueRef.current.length > 0) {
      const item = queueRef.current.shift()
      try {
        const result = await runUpload(item)
        setCompletedCount(c => c + 1)
        setUploadError(null)
        item.resolve(result)
      } catch {
        // Retry once after 2 seconds
        await new Promise(r => setTimeout(r, 2000))
        try {
          const result = await runUpload(item)
          setCompletedCount(c => c + 1)
          setUploadError(null)
          item.resolve(result)
        } catch (retryErr) {
          setUploadError('Upload failed — check your connection.')
          item.reject(retryErr)
        }
      }
    }

    setIsUploading(false)
    setUploadProgress(0)
    processingRef.current = false
  }, [])

  const uploadPhoto = useCallback(
    (blob, eventId, guestToken) =>
      new Promise((resolve, reject) => {
        queueRef.current.push({ blob, eventId, guestToken, photoId: uuidv4(), resolve, reject })
        processQueue()
      }),
    [processQueue]
  )

  return { uploadPhoto, isUploading, uploadProgress, uploadError, completedCount }
}
