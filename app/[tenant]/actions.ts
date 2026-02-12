'use server'

import { signedFetch } from '@/lib/api'
import { cookies } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function getDistance(slug: string, lat: number, lng: number) {
  try {
    const response = await signedFetch(
      `${API_URL}/public/businesses/${slug}/services?lat=${lat}&lng=${lng}`,
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

    const response = await signedFetch(
      `${API_URL}/public/businesses/${businessId}/available-slots-v2?${params}`,
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

    const response = await signedFetch(
      `${API_URL}/public/businesses/${businessId}/slot-employees?${params}`,
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
      return { success: false, error: data.error, error_code: data.error_code, wait_seconds: data.wait_seconds }
    }

    return { success: true, ...data }
  } catch (error) {
    console.error('[sendOtp] error:', error)
    return { success: false, error: 'Failed to send OTP' }
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
      return { success: false, error: data.error, error_code: data.error_code }
    }

    // Store JWT in httpOnly cookies
    const cookieStore = await cookies()
    cookieStore.set('blyss_access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })
    cookieStore.set('blyss_refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    return { success: true, user_id: data.user_id, phone_number: data.phone_number }
  } catch (error) {
    console.error('[verifyOtp] error:', error)
    return { success: false, error: 'Failed to verify OTP' }
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
    const accessToken = cookieStore.get('blyss_access_token')?.value

    if (!accessToken) {
      return { success: false, error: 'Not authenticated', error_code: 'NO_TOKEN' }
    }

    const body = JSON.stringify({
      date,
      start_time: startTime,
      services,
      notes: notes || '',
    })

    const response = await signedFetch(
      `${API_URL}/public/businesses/${businessId}/bookings-v2`,
      {
        method: 'POST',
        body,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    const data = await response.json()
    if (!response.ok) {
      return { success: false, error: data.error, error_code: data.error_code }
    }

    return { success: true, booking: data }
  } catch (error) {
    console.error('[createBooking] error:', error)
    return { success: false, error: 'Failed to create booking' }
  }
}

export async function getAuthStatus() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('blyss_access_token')?.value
    return { authenticated: !!accessToken }
  } catch {
    return { authenticated: false }
  }
}
