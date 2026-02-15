'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const GOOGLE_GEOLOCATION_API_KEY = 'AIzaSyAJGY6AKA5S0eJQsPJCU0BqAanlhgpvJU0'
const STORAGE_KEY = 'blyss_location'
const TASHKENT_CENTER: UserLocation = { lat: 41.2995, lng: 69.2401 }
const MAX_AGE_MS = 60 * 60 * 1000 // 1 hour

export interface UserLocation {
  lat: number
  lng: number
}

interface StoredLocation {
  lat: number
  lng: number
  ts: number
}

const LocationContext = createContext<UserLocation | null>(null)

function getCached(): UserLocation | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: StoredLocation = JSON.parse(raw)
    if (Date.now() - parsed.ts > MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return { lat: parsed.lat, lng: parsed.lng }
  } catch {
    return null
  }
}

function setCache(loc: UserLocation) {
  try {
    const stored: StoredLocation = { lat: loc.lat, lng: loc.lng, ts: Date.now() }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch { /* ignore */ }
}

async function fetchGoogleGeolocation(): Promise<UserLocation | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${GOOGLE_GEOLOCATION_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data.location) {
      return { lat: data.location.lat, lng: data.location.lng }
    }
  } catch { /* ignore */ }
  return null
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<UserLocation | null>(null)

  useEffect(() => {
    const cached = getCached()
    if (cached) {
      setLocation(cached)
      return
    }

    fetchGoogleGeolocation().then((loc) => {
      const resolved = loc ?? TASHKENT_CENTER
      setCache(resolved)
      setLocation(resolved)
    })
  }, [])

  return (
    <LocationContext.Provider value={location}>{children}</LocationContext.Provider>
  )
}

export function useLocation(): UserLocation | null {
  return useContext(LocationContext)
}
