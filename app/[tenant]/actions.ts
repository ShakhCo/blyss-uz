'use server'

import { signedFetch } from '@/lib/api'

export async function getDistance(slug: string, lat: number, lng: number) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await signedFetch(
      `${apiUrl}/public/businesses/${slug}/services?lat=${lat}&lng=${lng}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      console.error(`[getDistance] ${response.status}:`, await response.text())
      return null
    }

    const data = await response.json()
    return data.distance ?? null
  } catch (error) {
    console.error('[getDistance] error:', error)
    return null
  }
}
