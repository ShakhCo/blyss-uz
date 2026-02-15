'use server'

import { signedFetch } from '@/lib/api'
import { cookies } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Validate tenant slug to prevent path traversal
const SLUG_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/

function validateSlug(slug: string): string {
  if (!SLUG_REGEX.test(slug)) {
    throw new Error('Invalid tenant slug')
  }
  return slug
}

// ─── Cookie helpers ───

function getCookieOptions(maxAge: number, httpOnly = true) {
  const isProd = process.env.NODE_ENV === 'production'
  return {
    httpOnly,
    secure: isProd,
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
    ...(isProd && { domain: '.blyss.uz' }),
  }
}

async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  user: { phone: string; first_name: string; last_name: string }
) {
  const opts = getCookieOptions(24 * 60 * 60)
  console.log('[setAuthCookies] cookie options:', { domain: opts.domain, secure: opts.secure, NODE_ENV: process.env.NODE_ENV })
  const cookieStore = await cookies()
  cookieStore.set('blyss_access_token', accessToken, opts)
  cookieStore.set('blyss_refresh_token', refreshToken, getCookieOptions(30 * 24 * 60 * 60))
  cookieStore.set('blyss_user', JSON.stringify(user), getCookieOptions(365 * 24 * 60 * 60, false))
}

// ─── Existing actions ───

export async function reverseGeocode(lat: number, lng: number, locale: string) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${locale}&zoom=18&addressdetails=1`,
      {
        headers: { 'User-Agent': 'blyss.uz' },
        next: { revalidate: 86400 },
      }
    )
    if (!response.ok) return null
    const data = await response.json()
    const addr = data.address
    // Build a detailed address: house_number + road + neighbourhood + district + city
    const street: string[] = []
    if (addr.house_number) street.push(addr.house_number)
    if (addr.road) street.push(addr.road)
    else if (addr.pedestrian) street.push(addr.pedestrian)
    else if (addr.footway) street.push(addr.footway)

    const parts: string[] = []
    if (street.length > 0) parts.push(street.join(' '))
    if (addr.neighbourhood) parts.push(addr.neighbourhood)
    else if (addr.suburb) parts.push(addr.suburb)
    else if (addr.district) parts.push(addr.district)
    if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village)
    return parts.length > 0 ? parts.join(', ') : (data.display_name as string) || null
  } catch {
    return null
  }
}

export async function getDistance(slug: string, lat: number, lng: number) {
  try {
    const safeSlug = validateSlug(slug)
    const response = await signedFetch(
      `${API_URL}/public/businesses/${safeSlug}/services?lat=${lat}&lng=${lng}`,
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

export async function getAvailableSlots(
  businessId: string,
  date: string,
  serviceIds: string[],
  employeeId?: string
) {
  try {
    const params = new URLSearchParams({
      date,
      service_ids: serviceIds.join(','),
    })
    if (employeeId) params.set('employee_id', employeeId)

    const safeId = validateSlug(businessId)
    const response = await signedFetch(
      `${API_URL}/public/businesses/${safeId}/available-slots-v2?${params}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      const text = await response.text()
      console.error(`[getAvailableSlots] ${response.status}:`, text)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[getAvailableSlots] error:', error)
    return null
  }
}

export async function getSlotEmployees(
  businessId: string,
  date: string,
  serviceIds: string[],
  startTime: number,
  employeeId?: string
) {
  try {
    const params = new URLSearchParams({
      date,
      service_ids: serviceIds.join(','),
      start_time: startTime.toString(),
    })
    if (employeeId) params.set('employee_id', employeeId)

    const safeId = validateSlug(businessId)
    const response = await signedFetch(
      `${API_URL}/public/businesses/${safeId}/slot-employees?${params}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      const text = await response.text()
      console.error(`[getSlotEmployees] ${response.status}:`, text)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[getSlotEmployees] error:', error)
    return null
  }
}

export async function sendOtp(phoneNumber: string) {
  try {
    const body = JSON.stringify({ phone_number: phoneNumber })
    const response = await signedFetch(`${API_URL}/public/send-otp`, {
      method: 'POST',
      body,
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false as const, error: data.error as string, error_code: data.error_code as string, wait_seconds: data.wait_seconds as number }
    }

    return { success: true as const, delivery_method: (data.delivery_method as string) || 'sms' }
  } catch (error) {
    console.error('[sendOtp] exception:', error)
    return { success: false as const, error: 'Failed to send OTP' }
  }
}

export async function verifyOtp(phoneNumber: string, otpCode: number) {
  try {
    const body = JSON.stringify({ phone_number: phoneNumber, otp_code: otpCode })
    const response = await signedFetch(`${API_URL}/public/verify-otp`, {
      method: 'POST',
      body,
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false as const, error: data.error as string, error_code: data.error_code as string }
    }

    if (data.needs_registration) {
      return {
        success: true as const,
        needs_registration: true as const,
        otp_id: data.otp_id as string,
        phone_number: data.phone_number as string,
      }
    }

    // Existing user - set cookies
    await setAuthCookies(data.access_token, data.refresh_token, {
      phone: phoneNumber,
      first_name: (data.first_name as string) || '',
      last_name: (data.last_name as string) || '',
    })

    return {
      success: true as const,
      needs_registration: false as const,
      user_id: data.user_id as string,
      phone_number: data.phone_number as string,
      first_name: (data.first_name as string) || '',
      last_name: (data.last_name as string) || '',
    }
  } catch (error) {
    console.error('[verifyOtp] exception:', error)
    return { success: false as const, error: 'Failed to verify OTP' }
  }
}

export async function registerUser(
  otpId: string,
  phoneNumber: string,
  firstName: string,
  lastName: string
) {
  try {
    const body = JSON.stringify({
      otp_id: otpId,
      phone_number: phoneNumber,
      first_name: firstName,
      last_name: lastName,
    })

    const response = await signedFetch(`${API_URL}/public/register`, {
      method: 'POST',
      body,
    })

    const data = await response.json()
    if (!response.ok) {
      return { success: false as const, error: data.error as string, error_code: data.error_code as string }
    }

    await setAuthCookies(data.access_token, data.refresh_token, {
      phone: phoneNumber,
      first_name: firstName,
      last_name: lastName,
    })

    return { success: true as const, user_id: data.user_id as string }
  } catch (error) {
    console.error('[registerUser] exception:', error)
    return { success: false as const, error: 'Failed to register' }
  }
}

export async function createBooking(
  businessId: string,
  date: string,
  startTime: number,
  services: { service_id: string; employee_id: string | null }[],
  notes?: string
) {
  try {
    const cookieStore = await cookies()
    let accessToken = cookieStore.get('blyss_access_token')?.value

    if (!accessToken) {
      return { success: false as const, error: 'Not authenticated', error_code: 'NO_TOKEN' }
    }

    const body = JSON.stringify({
      date,
      start_time: startTime,
      services,
      notes: notes || '',
    })

    const safeId = validateSlug(businessId)
    let response = await signedFetch(
      `${API_URL}/public/businesses/${safeId}/bookings-v2`,
      {
        method: 'POST',
        body,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    // If token expired, refresh and retry once
    if (response.status === 401) {
      const refreshed = await refreshTokens()
      if (refreshed) {
        accessToken = (await cookies()).get('blyss_access_token')?.value
        if (accessToken) {
          response = await signedFetch(
            `${API_URL}/public/businesses/${safeId}/bookings-v2`,
            {
              method: 'POST',
              body,
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          )
        }
      }
    }

    const data = await response.json()
    if (!response.ok) {
      return { success: false as const, error: data.error, error_code: data.error_code }
    }

    return { success: true as const, booking: data }
  } catch (error) {
    console.error('[createBooking] error:', error)
    return { success: false as const, error: 'Failed to create booking' }
  }
}

// ─── Auth actions ───

export async function getAuthStatus() {
  try {
    const cookieStore = await cookies()
    let accessToken = cookieStore.get('blyss_access_token')?.value
    if (!accessToken) return { authenticated: false }

    // Verify token is valid and user exists by calling /public/me
    let response = await signedFetch(`${API_URL}/public/me`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    // If token expired, try refreshing
    if (response.status === 401) {
      const refreshed = await refreshTokens()
      if (!refreshed) {
        // Clear invalid cookies
        cookieStore.delete('blyss_access_token')
        cookieStore.delete('blyss_refresh_token')
        cookieStore.delete('blyss_user')
        return { authenticated: false }
      }
      accessToken = (await cookies()).get('blyss_access_token')?.value
      if (!accessToken) return { authenticated: false }
      response = await signedFetch(`${API_URL}/public/me`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    }

    if (!response.ok) {
      cookieStore.delete('blyss_access_token')
      cookieStore.delete('blyss_refresh_token')
      cookieStore.delete('blyss_user')
      return { authenticated: false }
    }

    const user = await response.json()
    return {
      authenticated: true,
      user: {
        phone: user.phone_number || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      },
    }
  } catch {
    return { authenticated: false }
  }
}

export async function getSavedUser() {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get('blyss_user')?.value
    if (!raw) return null
    return JSON.parse(raw) as { phone: string; first_name: string; last_name: string }
  } catch {
    return null
  }
}

export async function getUserProfile() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('blyss_access_token')?.value
    if (!accessToken) return null

    const response = await signedFetch(`${API_URL}/public/me`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) return null

    const data = await response.json()
    return {
      user_id: data.user_id as string,
      phone: data.phone_number as string,
      first_name: data.first_name as string,
      last_name: data.last_name as string,
    }
  } catch {
    return null
  }
}

export async function logout() {
  try {
    const cookieStore = await cookies()
    const cookieDomain = process.env.NODE_ENV === 'production' ? '.blyss.uz' : undefined

    cookieStore.delete({ name: 'blyss_access_token', path: '/', domain: cookieDomain })
    cookieStore.delete({ name: 'blyss_refresh_token', path: '/', domain: cookieDomain })
    cookieStore.delete({ name: 'blyss_user', path: '/', domain: cookieDomain })

    return { success: true }
  } catch (error) {
    console.error('[logout] exception:', error)
    return { success: false }
  }
}

export async function getMyBookings(businessId?: string) {
  try {
    const cookieStore = await cookies()
    let accessToken = cookieStore.get('blyss_access_token')?.value
    console.log('[getMyBookings] accessToken exists:', !!accessToken, 'businessId:', businessId)
    if (!accessToken) return { bookings: [] }

    const params = businessId ? `?business_id=${businessId}` : ''
    const url = `${API_URL}/public/my-bookings${params}`
    console.log('[getMyBookings] fetching:', url)
    let response = await signedFetch(url, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    console.log('[getMyBookings] response status:', response.status)

    // If token expired, try refreshing and retry once
    if (response.status === 401) {
      console.log('[getMyBookings] token expired, attempting refresh...')
      const refreshed = await refreshTokens()
      console.log('[getMyBookings] refresh result:', refreshed)
      if (refreshed) {
        accessToken = (await cookies()).get('blyss_access_token')?.value
        if (accessToken) {
          response = await signedFetch(url, {
            cache: 'no-store',
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          console.log('[getMyBookings] retry response status:', response.status)
        }
      }
    }

    if (!response.ok) {
      const text = await response.text()
      console.error('[getMyBookings] not ok:', response.status, text)
      return { bookings: [] }
    }
    const data = await response.json()
    console.log('[getMyBookings] success, bookings count:', data.bookings?.length)
    return data
  } catch (error) {
    console.error('[getMyBookings] exception:', error)
    return { bookings: [] }
  }
}

export async function cancelBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies()
    let accessToken = cookieStore.get('blyss_access_token')?.value
    if (!accessToken) return { success: false, error: 'Not authenticated' }

    let response = await signedFetch(
      `${API_URL}/public/my-bookings/${bookingId}/cancel`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    if (response.status === 401) {
      const refreshed = await refreshTokens()
      if (refreshed) {
        accessToken = (await cookies()).get('blyss_access_token')?.value
        if (accessToken) {
          response = await signedFetch(
            `${API_URL}/public/my-bookings/${bookingId}/cancel`,
            {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          )
        }
      }
    }

    if (!response.ok) {
      const data = await response.json()
      return { success: false, error: data.error || 'Failed to cancel booking' }
    }

    return { success: true }
  } catch (error) {
    console.error('[cancelBooking] error:', error)
    return { success: false, error: 'Failed to cancel booking' }
  }
}

export async function refreshTokens() {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('blyss_refresh_token')?.value
    if (!refreshToken) return false

    const body = JSON.stringify({ refresh_token: refreshToken })
    const response = await signedFetch(`${API_URL}/public/refresh-token`, {
      method: 'POST',
      body,
    })

    if (!response.ok) return false

    const data = await response.json()
    cookieStore.set('blyss_access_token', data.access_token, getCookieOptions(24 * 60 * 60))
    cookieStore.set('blyss_refresh_token', data.refresh_token, getCookieOptions(30 * 24 * 60 * 60))

    return true
  } catch {
    return false
  }
}

export async function setBookingIntent(businessId: string, serviceIds: string[]) {
  const cookieStore = await cookies()
  cookieStore.set('blyss_booking_intent', JSON.stringify({ businessId, serviceIds }), getCookieOptions(60 * 30))
}

export async function getBookingIntent() {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get('blyss_booking_intent')?.value
    if (!raw) return null
    return JSON.parse(raw) as { businessId: string; serviceIds: string[] }
  } catch {
    return null
  }
}
