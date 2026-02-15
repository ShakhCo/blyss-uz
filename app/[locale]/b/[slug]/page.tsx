import { signedFetch } from '@/lib/api'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Locale } from '@/lib/i18n'
import { isValidLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import { TenantPage } from '../../[tenant]/TenantPage'
import { getAuthStatus } from '../../[tenant]/actions'

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

interface Photo {
  id: string
  url: string
  category: 'interior' | 'exterior'
  order: number
}

interface Employee {
  id: string
  first_name: string | null
  last_name: string | null
  position: string
  services: {
    id: string
    service_id: string
    name: MultilingualText | null
    price: number
    duration_minutes: number
  }[]
}

interface BusinessData {
  business: {
    id: string
    name: string
    bio?: string
    business_type: string
    location: {
      lat?: number
      lng?: number
    }
    working_hours?: Record<string, { start: number; end: number; is_open: boolean }>
    business_phone_number: string
    tenant_url: string
    avatar_url?: string | null
    cover_url?: string | null
    primary_color?: string | null
  }
  photos: Photo[]
  services: Service[]
  employees: Employee[]
}

/** Extract business ID from slug like "big-bro-4829d9b06ecc2552" → "4829d9b06ecc2552" */
function extractBusinessId(slug: string): string {
  const lastDash = slug.lastIndexOf('-')
  return lastDash !== -1 ? slug.slice(lastDash + 1) : slug
}

async function getBusinessData(businessId: string): Promise<{ data: BusinessData | null; status: number }> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await signedFetch(`${apiUrl}/public/businesses/${businessId}/services`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      return { data: null, status: response.status }
    }

    return { data: await response.json(), status: 200 }
  } catch (error) {
    console.error('Failed to fetch business data:', error)
    return { data: null, status: 0 }
  }
}

const OG_LOCALE_MAP: Record<Locale, string> = {
  ru: 'ru_RU',
  uz: 'uz_UZ',
}

const META: Record<Locale, {
  title: (name: string) => string
  description: (name: string) => string
  ogTitle: (name: string) => string
}> = {
  ru: {
    title: (name) => `${name} — Онлайн-запись`,
    description: (name) => `Запишитесь онлайн в ${name} — просмотрите услуги, цены и забронируйте через Blyss.`,
    ogTitle: (name) => `${name} — Онлайн-запись | Blyss`,
  },
  uz: {
    title: (name) => `${name} — Onlayn yozilish`,
    description: (name) => `${name} — xizmatlar va narxlarni ko'ring, Blyss orqali onlayn band qiling.`,
    ogTitle: (name) => `${name} — Onlayn yozilish | Blyss`,
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug, locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : DEFAULT_LOCALE
  const businessId = extractBusinessId(slug)
  const { data: businessData } = await getBusinessData(businessId)

  if (!businessData) {
    return {
      title: 'Business Not Found',
      robots: { index: false, follow: false },
    }
  }

  const { business } = businessData
  const m = META[locale]
  const title = m.title(business.name)
  const description = m.description(business.name)
  const ogImage = business.cover_url || 'https://blyss.uz/og-image.png'

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      url: `https://blyss.uz/${locale}/b/${slug}`,
      title: m.ogTitle(business.name),
      description,
      siteName: 'Blyss',
      locale: OG_LOCALE_MAP[locale],
      images: [{ url: ogImage, width: 1200, height: 630, alt: business.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: m.ogTitle(business.name),
      description,
      images: [ogImage],
    },
  }
}

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : DEFAULT_LOCALE
  const businessId = extractBusinessId(slug)
  const { data: businessData } = await getBusinessData(businessId)

  if (!businessData) {
    notFound()
  }

  const { business, photos, services, employees } = businessData
  const authStatus = await getAuthStatus()
  const savedUser = (authStatus.authenticated && 'user' in authStatus && authStatus.user)
    ? authStatus.user as { phone: string; first_name: string; last_name: string }
    : null

  return (
    <TenantPage
      business={business}
      services={services}
      employees={employees || []}
      photos={photos || []}
      tenantSlug={slug}
      businessId={business.id}
      locale={locale}
      savedUser={savedUser}
    />
  )
}
