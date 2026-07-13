// Mock upload — simulates progress then returns a local blob URL

export async function uploadToCloudinary(imageBlob, eventId, photoId, onProgress) {
  // Simulate upload progress over ~500ms
  for (let p = 0; p <= 100; p += 25) {
    await new Promise(r => setTimeout(r, 100))
    onProgress?.(p)
  }

  // Create a local object URL from the actual captured photo blob
  const url = URL.createObjectURL(imageBlob)

  return {
    url,
    publicId: photoId,
    width: 1280,
    height: 720,
    bytes: imageBlob.size,
  }
}
