import { getTenant } from '@/lib/tenant'
import { signedFetch } from '@/lib/api'
import { isValidLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { BookingPage } from './BookingPage'
import { getBookingIntent } from '../actions'

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
      cache: 'no-store'
    })

    if (!response.ok) return null
    return await response.json()
  } catch {
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-zinc-500">No booking selected. Please go back and select services.</p>
      </div>
    )
  }

  const { businessId, serviceIds } = intent
  const businessData = await getBusinessData(tenantSlug)

  if (!businessData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-zinc-500">Unable to load business data.</p>
      </div>
    )
  }

  const allServices: Service[] = businessData.services || []
  const selectedServices = allServices.filter((s: Service) => serviceIds.includes(s.id))
  const employees: Employee[] = businessData.employees || []

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
      services={selectedServices}
      employees={employees}
      tenantSlug={tenantSlug}
      locale={locale}
    />
  )
}
