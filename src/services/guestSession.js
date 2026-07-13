import { v4 as uuidv4 } from 'uuid'

const storageKey = (eventId) => `pov_guest_${eventId}`

export function getOrCreateGuestToken(eventId) {
  const existing = localStorage.getItem(storageKey(eventId))
  if (existing) return existing
  const token = uuidv4()
  localStorage.setItem(storageKey(eventId), token)
  return token
}

export function clearGuestSession(eventId) {
  localStorage.removeItem(storageKey(eventId))
}

export function getStoredToken(eventId) {
  return localStorage.getItem(storageKey(eventId))
}
