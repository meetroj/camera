// Fake host backend — lets the whole host UI run with no server.
//
// Mirrors hostApi's shape exactly, so pages can't tell the difference. State
// lives in localStorage so a refresh doesn't wipe your event list mid-test.
// Any email + password signs you in; nothing here validates credentials.

import { ApiError } from './apiError'

const KEY = 'pov_mock_db'
const LATENCY_MS = 300 // enough to see spinners and disabled buttons

const PLANS = [
  { id: 'free', label: 'Free', maxGuests: 30, photosPerGuest: 15, priceInr: 0 },
  { id: 'party', label: 'Party', maxGuests: 100, photosPerGuest: 20, priceInr: 499 },
  { id: 'wedding', label: 'Wedding', maxGuests: 300, photosPerGuest: 30, priceInr: 1499 },
  { id: 'unlimited', label: 'Unlimited', maxGuests: 9999, photosPerGuest: 9999, priceInr: 2999 },
]

const HOURS = (n) => n * 3_600_000

/** Seeded on first load so the dashboard isn't empty on a fresh browser. */
function seed() {
  const now = Date.now()
  return {
    user: null, // start signed out so the login screen is testable
    events: [
      {
        _id: 'evt_active',
        name: "Priya & Arjun's Wedding",
        eventType: 'wedding',
        status: 'active',
        joinCode: 'WED123',
        plan: 'wedding',
        planPrice: 1499,
        maxGuests: 300,
        guestsJoined: 47,
        photosPerGuest: 20,
        totalPhotos: 12,
        galleryType: 'shared',
        revealAt: new Date(now + HOURS(14)).toISOString(),
        createdAt: new Date(now - HOURS(6)).toISOString(),
      },
      {
        _id: 'evt_revealed',
        name: 'Rooftop Birthday 🎂',
        eventType: 'birthday',
        status: 'revealed',
        joinCode: 'BDAY99',
        plan: 'party',
        planPrice: 499,
        maxGuests: 100,
        guestsJoined: 23,
        photosPerGuest: 15,
        totalPhotos: 9,
        galleryType: 'shared',
        revealAt: new Date(now - HOURS(30)).toISOString(),
        createdAt: new Date(now - HOURS(72)).toISOString(),
      },
      {
        _id: 'evt_draft',
        name: 'Office Diwali Party',
        eventType: 'party',
        status: 'draft',
        joinCode: 'DIW777',
        plan: 'party',
        planPrice: 499,
        maxGuests: 100,
        guestsJoined: 0,
        photosPerGuest: 15,
        totalPhotos: 0,
        galleryType: 'shared',
        revealAt: new Date(now + HOURS(48)).toISOString(),
        createdAt: new Date(now - HOURS(1)).toISOString(),
      },
    ],
    // Placeholder imagery keyed by seed, so thumbnails stay stable across reloads.
    photos: {
      evt_active: Array.from({ length: 12 }, (_, i) => ({
        id: `ph_a${i}`,
        thumbUrl: `https://picsum.photos/seed/pov_a${i}/400/400`,
        guestName: ['Riya', 'Sam', 'Ana', 'Dev'][i % 4],
      })),
      evt_revealed: Array.from({ length: 9 }, (_, i) => ({
        id: `ph_r${i}`,
        thumbUrl: `https://picsum.photos/seed/pov_r${i}/400/400`,
        guestName: ['Kabir', 'Mia', 'Zoe'][i % 3],
      })),
      evt_draft: [],
    },
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* corrupt or unavailable storage — fall through to a fresh seed */
  }
  const fresh = seed()
  save(fresh)
  return fresh
}

function save(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* private mode / quota — the UI still works, it just won't survive reload */
  }
}

/** Every call goes through here so latency and persistence are uniform. */
async function tx(fn) {
  await new Promise((r) => setTimeout(r, LATENCY_MS))
  const db = load()
  const result = fn(db)
  save(db)
  return result
}

function requireUser(db) {
  if (!db.user) throw new ApiError(401, 'Not signed in')
  return db.user
}

function findEvent(db, id) {
  const event = db.events.find((e) => e._id === id)
  if (!event) throw new ApiError(404, 'Event not found')
  return event
}

const randomCode = () =>
  Array.from({ length: 6 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('')

export const mockHostApi = {
  // ── Auth ────────────────────────────────────────────────────────────────
  signup: (name, email) =>
    tx((db) => {
      db.user = { _id: 'usr_mock', name, email }
      return { user: db.user }
    }),

  login: (email) =>
    tx((db) => {
      // Any credentials work — this is a UI harness, not an auth system.
      db.user = { _id: 'usr_mock', name: email.split('@')[0] || 'Host', email }
      return { user: db.user }
    }),

  logout: () =>
    tx((db) => {
      db.user = null
      return {}
    }),

  me: () =>
    tx((db) => ({ user: requireUser(db) })),

  updateMe: (patch) =>
    tx((db) => {
      Object.assign(requireUser(db), patch)
      return { user: db.user }
    }),

  // ── Plans ───────────────────────────────────────────────────────────────
  plans: () => tx(() => ({ plans: PLANS })),

  // ── Events ──────────────────────────────────────────────────────────────
  listEvents: () =>
    tx((db) => {
      requireUser(db)
      return { events: db.events }
    }),

  getEvent: (id) =>
    tx((db) => {
      requireUser(db)
      return { event: findEvent(db, id) }
    }),

  createEvent: (data) =>
    tx((db) => {
      requireUser(db)
      const plan = PLANS.find((p) => p.id === data.plan) ?? PLANS[0]
      const requiresPayment = plan.priceInr > 0

      const revealAt = {
        immediate: () => Date.now(),
        '1hour': () => Date.now() + HOURS(1),
        nextday: () => {
          const d = new Date()
          d.setDate(d.getDate() + 1)
          d.setHours(9, 0, 0, 0)
          return d.getTime()
        },
        custom: () => new Date(data.customAt).getTime(),
      }[data.revealOption]?.() ?? Date.now() + HOURS(24)

      const event = {
        _id: `evt_${Math.random().toString(36).slice(2, 9)}`,
        name: data.name,
        eventType: data.eventType,
        // Paid plans land as unpaid drafts, same as the real webhook flow.
        status: requiresPayment ? 'draft' : 'active',
        joinCode: randomCode(),
        plan: plan.id,
        planPrice: plan.priceInr,
        maxGuests: plan.maxGuests,
        guestsJoined: 0,
        photosPerGuest: Math.min(data.photosPerGuest, plan.photosPerGuest),
        totalPhotos: 0,
        galleryType: data.galleryType,
        revealAt: new Date(revealAt).toISOString(),
        createdAt: new Date().toISOString(),
      }

      db.events.unshift(event)
      db.photos[event._id] = []
      return { event, requiresPayment }
    }),

  updateEvent: (id, patch) =>
    tx((db) => {
      requireUser(db)
      Object.assign(findEvent(db, id), patch)
      return { event: findEvent(db, id) }
    }),

  endEvent: (id) =>
    tx((db) => {
      requireUser(db)
      const event = findEvent(db, id)
      event.status = 'ended'
      return { event }
    }),

  revealEvent: (id) =>
    tx((db) => {
      requireUser(db)
      const event = findEvent(db, id)
      event.status = 'revealed'
      event.revealAt = new Date().toISOString()
      return { event }
    }),

  deleteEvent: (id) =>
    tx((db) => {
      requireUser(db)
      db.events = db.events.filter((e) => e._id !== id)
      delete db.photos[id]
      return {}
    }),

  listGuests: (id) =>
    tx((db) => {
      requireUser(db)
      const event = findEvent(db, id)
      return {
        guests: Array.from({ length: event.guestsJoined }, (_, i) => ({
          id: `g${i}`,
          name: `Guest ${i + 1}`,
          photosUploaded: Math.floor(Math.random() * event.photosPerGuest),
        })),
      }
    }),

  // ── Photos ──────────────────────────────────────────────────────────────
  photos: (eventId) =>
    tx((db) => {
      requireUser(db)
      const event = findEvent(db, eventId)
      // The real API locks the gallery until reveal; mirror that so the
      // "still developing" state is reachable in the UI.
      if (event.status === 'draft') throw new ApiError(423, 'Gallery is still developing')
      return { photos: db.photos[eventId] ?? [] }
    }),

  deletePhoto: (photoId) =>
    tx((db) => {
      requireUser(db)
      for (const [eventId, list] of Object.entries(db.photos)) {
        const next = list.filter((p) => p.id !== photoId)
        if (next.length !== list.length) {
          db.photos[eventId] = next
          const event = db.events.find((e) => e._id === eventId)
          if (event) event.totalPhotos = next.length
          break
        }
      }
      return {}
    }),

  // ── Payments ────────────────────────────────────────────────────────────
  createOrder: (eventId) =>
    tx((db) => {
      requireUser(db)
      const event = findEvent(db, eventId)
      return { orderId: `order_mock_${eventId}`, amount: event.planPrice * 100 }
    }),
}
