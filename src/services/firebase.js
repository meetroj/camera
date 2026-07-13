// Mock service — no backend needed for MVP

export const db = {}

function sessionKey(guestToken, eventId) {
  return `pov_sess_${eventId}_${guestToken}`
}

// In-memory photo store (resets on page refresh — fine for MVP)
const photoDB = {}

export async function getEvent(eventId) {
  return {
    id: eventId,
    name: 'My Event 📷',
    active: true,
    revealed: true,
    photosPerGuest: 15,
    maxGuests: 30,
    galleryType: 'shared',
    revealAt: { toDate: () => new Date(Date.now() + 3_600_000) },
    deletedAt: null,
  }
}

export async function getGuestSession(guestToken, eventId) {
  const stored = localStorage.getItem(sessionKey(guestToken, eventId))
  return stored ? JSON.parse(stored) : null
}

export async function createGuestSession(guestToken, eventId, photosAllowed) {
  const data = { eventId, photosRemaining: photosAllowed, photosUploaded: 0 }
  localStorage.setItem(sessionKey(guestToken, eventId), JSON.stringify(data))
  return data
}

export async function savePhoto(photoData) {
  const id = `photo_${Date.now()}_${Math.random().toString(36).slice(2)}`
  if (!photoDB[photoData.eventId]) photoDB[photoData.eventId] = []
  photoDB[photoData.eventId].push({ id, ...photoData, deleted: false })

  // Persist remaining count in localStorage
  const key = sessionKey(photoData.guestToken, photoData.eventId)
  const stored = localStorage.getItem(key)
  if (stored) {
    const sess = JSON.parse(stored)
    sess.photosUploaded = (sess.photosUploaded || 0) + 1
    sess.photosRemaining = Math.max(0, (sess.photosRemaining || 0) - 1)
    localStorage.setItem(key, JSON.stringify(sess))
  }
  return id
}

export async function decrementPhotos() {
  // Handled inside savePhoto above
}

export async function getGallery(eventId) {
  return (photoDB[eventId] ?? []).filter(p => !p.deleted)
}
