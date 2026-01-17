import { getTenant } from '@/lib/tenant'

interface Service {
  id: string
  name: string
  price: number
  duration_minutes: number
}

interface BusinessData {
  business: {
    name: string
    business_type: string
    location: {
      address?: string
      city?: string
      latitude?: number
      longitude?: number
    }
    working_hours?: Record<string, any>
    business_phone_number: string
    tenant_url: string
  }
  services: Service[]
}

async function getBusinessData(tenantSlug: string): Promise<BusinessData | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/public/businesses/${tenantSlug}/services`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch business data:', error)
    return null
  }
}

export default async function TenantPage({
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Invalid Tenant</h1>
          <p className="text-gray-600">This page must be accessed via a subdomain.</p>
        </div>
      </div>
    )
  }

  if (!businessData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Business Not Found</h1>
          <p className="text-gray-600">Unable to load business information.</p>
        </div>
      </div>
    )
  }

  const { business, services } = businessData

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-4xl p-8">
        {/* Business Header */}
        <div className="mb-8 rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900">
          <h1 className="mb-4 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            {business.name}
          </h1>

          <div className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {business.business_type}
          </div>

          {/* Contact Info */}
          <div className="mt-6 space-y-3">
            {business.location?.address && (
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">Address</p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {business.location.address}
                    {business.location.city && `, ${business.location.city}`}
                  </p>
                </div>
              </div>
            )}

            {business.business_phone_number && (
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">Phone</p>
                  <a
                    href={`tel:${business.business_phone_number}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {business.business_phone_number}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Working Hours */}
          {business.working_hours && (
            <div className="mt-6 rounded-md bg-zinc-100 p-4 dark:bg-zinc-800">
              <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">Working Hours</h3>
              <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                {Object.entries(business.working_hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span className="capitalize text-zinc-600 dark:text-zinc-400">{day}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {hours && typeof hours === 'object' && 'open' in hours && 'close' in hours
                        ? `${hours.open} - ${hours.close}`
                        : 'Closed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Services */}
        {services.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Services</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {service.name}
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {service.duration_minutes} min
                    </div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {service.price.toLocaleString()} UZS
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">No services available at the moment.</p>
          </div>
        )}
      </main>
    </div>
  )
}
