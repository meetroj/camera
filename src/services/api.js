// The one place that talks to the MERN backend.
//
// The host's session lives in an httpOnly cookie the server sets, so every
// request must send credentials. There is no token to store in localStorage —
// that's deliberate: a token there is readable by any XSS payload.

import { ApiError } from './apiError'
import { mockHostApi } from './mockHostApi'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// No VITE_API_URL means there's no backend to talk to (e.g. the Vercel preview),
// so fall back to the in-memory mock rather than firing doomed requests at
// localhost:5000 — which, from a visitor's browser, is *their* machine.
// Set VITE_MOCK_API=true to force the mock even when a real API is configured.
export const USE_MOCK_API =
  import.meta.env.VITE_MOCK_API === 'true' || !import.meta.env.VITE_API_URL

export { ApiError } from './apiError'

async function request(method, path, { body, token } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}` // guest routes only

  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      credentials: 'include', // carries the host session cookie
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    // fetch only rejects on a network-level failure — the API being down.
    throw new ApiError(0, "Can't reach the server. Is the backend running on port 5000?")
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    /* some responses have no body */
  }

  if (!res.ok) {
    throw new ApiError(res.status, data?.error || `Request failed (${res.status})`, data?.code)
  }
  return data
}

export const api = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { body, ...opts }),
  patch: (path, body, opts) => request('PATCH', path, { body, ...opts }),
  delete: (path, opts) => request('DELETE', path, opts),
}

// ── Host ───────────────────────────────────────────────────────────────────
const realHostApi = {
  signup: (name, email, password) => api.post('/auth/signup', { name, email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateMe: (patch) => api.patch('/auth/me', patch),

  plans: () => api.get('/plans'),

  listEvents: () => api.get('/events'),
  createEvent: (data) => api.post('/events', data),
  getEvent: (id) => api.get(`/events/${id}`),
  updateEvent: (id, patch) => api.patch(`/events/${id}`, patch),
  endEvent: (id) => api.post(`/events/${id}/end`),
  revealEvent: (id) => api.post(`/events/${id}/reveal`),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  listGuests: (id) => api.get(`/events/${id}/guests`),

  photos: (eventId, page = 1) => api.get(`/photos/event/${eventId}?page=${page}`),
  deletePhoto: (photoId) => api.delete(`/photos/${photoId}`),

  createOrder: (eventId) => api.post('/payments/order', { eventId }),
}

// Every host page imports `hostApi` and never learns which one it got.
export const hostApi = USE_MOCK_API ? mockHostApi : realHostApi

if (USE_MOCK_API && typeof console !== 'undefined') {
  console.info('[pov] Mock host API active — no backend. Any email/password signs in.')
}
