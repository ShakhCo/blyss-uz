import { redirect } from 'next/navigation'
import { getTenant } from '@/lib/tenant'
import { signedFetch } from '@/lib/api'
import { isValidLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { BookingPage } from './BookingPage'
import { getBookingIntent, getAuthStatus } from '../actions'

interface MultilingualText {
  uz: string
  ru: string
}

interface Service {
  id: string
  name: MultilingualText
  description?: MultilingualText | null
  price: number
  duration_minutes: number
}

interface Employee {
  id: string
  first_name: string | null
  last_name: string | null
  position: string
  services: {
    id: string
    service_id: string
    name: string | null
    price: number
    duration_minutes: number
  }[]
}

async function getBusinessData(tenantSlug: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await signedFetch(`${apiUrl}/public/businesses/${tenantSlug}/services`, {
      next: { revalidate: 60 }
    })

    if (!response.ok) {
      console.error(`[booking/getBusinessData] ${response.status}:`, await response.text())
      return null
    }
    return await response.json()
  } catch (error) {
    console.error('[booking/getBusinessData] fetch error:', error)
    return null
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ tenant: string; locale: string }>
}) {
  const { tenant: tenantSlug, locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : DEFAULT_LOCALE
  const tenant = await getTenant()

  if (!tenant.isTenant || tenant.slug !== tenantSlug) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-zinc-500">Invalid tenant</p>
      </div>
    )
  }

  const intent = await getBookingIntent()
  if (!intent) {
    redirect(`/${locale}`)
  }

  const { businessId, serviceIds } = intent
  const businessData = await getBusinessData(tenantSlug)

  if (!businessData) {
    redirect(`/${locale}`)
  }

  const allServices: Service[] = businessData.services || []
  const selectedServices = allServices.filter((s: Service) => serviceIds.includes(s.id))
  const employees: Employee[] = businessData.employees || []
  const authStatus = await getAuthStatus()
  const savedUser = (authStatus.authenticated && 'user' in authStatus && authStatus.user) ? authStatus.user as { phone: string; first_name: string; last_name: string } : null

  if (selectedServices.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-zinc-500">No services selected.</p>
      </div>
    )
  }

  return (
    <BookingPage
      businessId={businessId}
      businessName={businessData.business.name}
      businessPhone={businessData.business.business_phone_number}
      workingHours={businessData.business.working_hours || null}
      services={selectedServices}
      allServices={allServices}
      employees={employees}
      tenantSlug={tenantSlug}
      locale={locale}
      savedUser={savedUser}
    />
  )
}
