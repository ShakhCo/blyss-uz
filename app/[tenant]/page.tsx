import { getTenant } from '@/lib/tenant'
import { signedFetch } from '@/lib/api'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { TenantPage } from './TenantPage'

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

interface BusinessData {
  business: {
    id: string
    name: string
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
  }
  photos: Photo[]
  services: Service[]
}

async function getBusinessData(tenantSlug: string): Promise<BusinessData | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await signedFetch(`${apiUrl}/public/businesses/${tenantSlug}/services`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`[getBusinessData] ${response.status} ${response.statusText}:`, text)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch business data:', error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>
}): Promise<Metadata> {
  const { tenant: tenantSlug } = await params
  const businessData = await getBusinessData(tenantSlug)

  if (!businessData) {
    return {
      title: 'Business Not Found | Blyss',
      robots: { index: false, follow: false },
    }
  }

  const { business } = businessData
  const title = `${business.name} — Book Online | Blyss`
  const description = `Book beauty & wellness services at ${business.name} in Uzbekistan. View prices, services, and book your appointment online via Blyss.`
  const url = `https://${business.tenant_url}.blyss.uz`
  const image = business.cover_url || business.avatar_url || 'https://blyss.uz/og-image.png'

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: 'Blyss',
      locale: 'en_US',
      alternateLocale: ['ru_RU', 'uz_UZ'],
      images: [{ url: image, width: 1200, height: 630, alt: business.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
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
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params
  const tenant = await getTenant()
  const businessData = await getBusinessData(tenantSlug)

  // Redirect to homepage if not accessed via subdomain or business not found
  if (!tenant.isTenant || tenant.slug !== tenantSlug) {
    redirect('/')
  }

  if (!businessData) {
    redirect('/')
  }

  const { business, photos, services } = businessData

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
      photos={photos || []}
      tenantSlug={tenantSlug}
      businessId={business.id}
    />
  </div>
}
