import { getTenant } from '@/lib/tenant'
import { signedFetch } from '@/lib/api'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import type { Locale } from '@/lib/i18n'
import { isValidLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import { TenantPage } from './TenantPage'
import { getAuthStatus } from './actions'

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

async function getBusinessData(tenantSlug: string): Promise<{ data: BusinessData | null; status: number }> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await signedFetch(`${apiUrl}/public/businesses/${tenantSlug}/services`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`[getBusinessData] ${response.status} ${response.statusText}:`, text)
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

const TENANT_META: Record<Locale, {
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
  params: Promise<{ tenant: string; locale: string }>
}): Promise<Metadata> {
  const { tenant: tenantSlug, locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : DEFAULT_LOCALE
  const { data: businessData } = await getBusinessData(tenantSlug)

  if (!businessData) {
    return {
      title: 'Business Not Found',
      robots: { index: false, follow: false },
    }
  }

  const { business } = businessData
  const m = TENANT_META[locale]
  const title = m.title(business.name)
  const description = m.description(business.name)
  const url = `https://${business.tenant_url}.blyss.uz`
  const ogImage = business.cover_url || 'https://blyss.uz/og-image.png'
  const favicon = business.avatar_url || '/favicon.png'

  return {
    title,
    description,
    icons: {
      icon: favicon,
      apple: favicon,
    },
    openGraph: {
      type: 'website',
      url: `${url}/${locale}`,
      title: m.ogTitle(business.name),
      description,
      siteName: 'Blyss',
      locale: OG_LOCALE_MAP[locale],
      alternateLocale: Object.entries(OG_LOCALE_MAP)
        .filter(([l]) => l !== locale)
        .map(([, v]) => v),
      images: [{ url: ogImage, width: 1200, height: 630, alt: business.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: m.ogTitle(business.name),
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: `${url}/${locale}`,
      languages: {
        'ru': `${url}/ru`,
        'uz': `${url}/uz`,
      },
    },
    robots: {
      index: true,
      follow: true,
    },
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
  const { data: businessData, status } = await getBusinessData(tenantSlug)

  // Redirect to homepage if not accessed via subdomain or business not found
  if (!tenant.isTenant || tenant.slug !== tenantSlug) {
    redirect(`/${locale}`)
  }

  if (!businessData) {
    if (status === 429) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-900">
          <div className="text-center px-6">
            <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
              {locale === 'uz' ? 'Juda ko\'p urinish' : 'Слишком много запросов'}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              {locale === 'uz' ? '5 daqiqadan so\'ng qayta urinib ko\'ring' : 'Попробуйте снова через 5 минут'}
            </p>
          </div>
        </div>
      )
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-900">
        <p className="text-zinc-500">Business not found</p>
      </div>
    )
  }

  const { business, photos, services, employees } = businessData
  const authStatus = await getAuthStatus()
  const savedUser = (authStatus.authenticated && 'user' in authStatus && authStatus.user) ? authStatus.user as { phone: string; first_name: string; last_name: string } : null

  const businessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: business.name,
    url: `https://${business.tenant_url}.blyss.uz`,
    telephone: business.business_phone_number,
    ...(business.avatar_url && { image: business.avatar_url }),
    ...(business.location?.lat && business.location?.lng && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: business.location.lat,
        longitude: business.location.lng,
      },
    }),
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'UZ',
    },
    ...(business.working_hours && {
      openingHoursSpecification: Object.entries(business.working_hours)
        .filter(([, h]) => h.is_open)
        .map(([day, h]) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: day.charAt(0).toUpperCase() + day.slice(1),
          opens: `${String(Math.floor(h.start / 60)).padStart(2, '0')}:${String(h.start % 60).padStart(2, '0')}`,
          closes: `${String(Math.floor(h.end / 60)).padStart(2, '0')}:${String(h.end % 60).padStart(2, '0')}`,
        })),
    }),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: services.slice(0, 20).map((s) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: s.name.uz || s.name.ru,
          ...(s.description?.uz && { description: s.description.uz }),
        },
        price: s.price,
        priceCurrency: 'UZS',
      })),
    },
  }

  return <div>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
    />
    <TenantPage
      business={business}
      services={services}
      employees={employees || []}
      photos={photos || []}
      tenantSlug={tenantSlug}
      businessId={business.id}
      locale={locale}
      savedUser={savedUser}
    />
  </div>
}
