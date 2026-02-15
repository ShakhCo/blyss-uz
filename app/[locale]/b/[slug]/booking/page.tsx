import { redirect } from 'next/navigation'
import { signedFetch } from '@/lib/api'
import { isValidLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { BookingPage } from '../../../[tenant]/booking/BookingPage'
import { getBookingIntent, getAuthStatus } from '../../../[tenant]/actions'

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

function extractBusinessId(slug: string): string {
  const lastDash = slug.lastIndexOf('-')
  return lastDash !== -1 ? slug.slice(lastDash + 1) : slug
}

async function getBusinessData(businessId: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await signedFetch(`${apiUrl}/public/businesses/${businessId}/services`, {
      next: { revalidate: 60 }
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
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : DEFAULT_LOCALE
  const businessId = extractBusinessId(slug)

  const intent = await getBookingIntent()
  if (!intent) {
    redirect(`/${locale}/b/${slug}`)
  }

  const { serviceIds } = intent
  const businessData = await getBusinessData(businessId)

  if (!businessData) {
    redirect(`/${locale}/b/${slug}`)
  }

  const allServices: Service[] = businessData.services || []
  const selectedServices = allServices.filter((s: Service) => serviceIds.includes(s.id))
  const employees: Employee[] = businessData.employees || []
  const authStatus = await getAuthStatus()
  const savedUser = (authStatus.authenticated && 'user' in authStatus && authStatus.user)
    ? authStatus.user as { phone: string; first_name: string; last_name: string }
    : null

  if (selectedServices.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-900">
        <p className="text-zinc-500 dark:text-zinc-400">No services selected.</p>
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
      tenantSlug={businessId}
      locale={locale}
      savedUser={savedUser}
      primaryColor={businessData.business.primary_color || undefined}
    />
  )
}
