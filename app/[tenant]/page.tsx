import { getTenant } from '@/lib/tenant'
import { signedFetch } from '@/lib/api'
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
      title: 'Business Not Found',
    }
  }

  return {
    title: businessData.business.name,
    description: `Book services at ${businessData.business.name}`,
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

  // Verify the request is actually from a subdomain
  if (!tenant.isTenant || tenant.slug !== tenantSlug) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Tenant</h1>
          <p className="text-stone-600">This page must be accessed via a subdomain.</p>
        </div>
      </div>
    )
  }

  if (!businessData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-red-600 mb-2">{tenantSlug}</h1>
          <p className="text-stone-600">Unable to load business information.</p>
        </div>
      </div>
    )
  }

  const { business, photos, services } = businessData

  return <div>
    <TenantPage
      business={business}
      services={services}
      photos={photos || []}
      tenantSlug={tenantSlug}
      businessId={business.id}
    />
  </div>
}
