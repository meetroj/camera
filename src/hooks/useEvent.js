import { useState, useEffect, useCallback } from 'react'
import { getEvent, getGuestSession, createGuestSession } from '../services/firebase'
import { getOrCreateGuestToken } from '../services/guestSession'

export function useEvent(eventId) {
  const [event, setEvent] = useState(null)
  const [guest, setGuest] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!eventId) { setStatus('notFound'); return }
    setStatus('loading')
    setError(null)

    try {
      const eventData = await getEvent(eventId)
      if (!eventData) { setStatus('notFound'); return }

      setEvent(eventData)

      if (!eventData.active) { setStatus('inactive'); return }

      const token = getOrCreateGuestToken(eventId)
      let guestData = await getGuestSession(token, eventId)
      if (!guestData) {
        guestData = await createGuestSession(token, eventId, eventData.photosPerGuest ?? 15)
      }
      setGuest({ ...guestData, token })
      setStatus('active')
    } catch (err) {
      console.error('useEvent:', err)
      setError(err.message)
      setStatus('notFound')
    }
  }, [eventId])

  useEffect(() => { load() }, [load])

  return { event, guest, status, error, refetch: load }
}
