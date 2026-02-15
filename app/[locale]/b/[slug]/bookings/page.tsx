import { redirect } from 'next/navigation'
import type { Locale } from '@/lib/i18n'
import { isValidLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import { getMyBookings, getAuthStatus, cancelBooking } from '../../../[tenant]/actions'
import { BookingsList } from '@/app/components/bookings/BookingsList'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { signedFetch } from '@/lib/api'
import { BottomNav } from '@/app/components/layout/BottomNav'
import { BookingsLoginPrompt } from '../../../[tenant]/bookings/BookingsLoginPrompt'
import { BookingsUserInfo } from '../../../[tenant]/bookings/BookingsUserInfo'

const T = {
  uz: {
    myBookings: 'Mening buyurtmalarim',
  },
  ru: {
    myBookings: 'Мои записи',
  },
} as const

function extractBusinessId(slug: string): string {
  const lastDash = slug.lastIndexOf('-')
  return lastDash !== -1 ? slug.slice(lastDash + 1) : slug
}

async function getBusinessInfo(businessId: string): Promise<{ id: string | null; primaryColor: string | null }> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await signedFetch(`${apiUrl}/public/businesses/${businessId}/services`, {
      next: { revalidate: 60 },
    })
    if (!response.ok) return { id: null, primaryColor: null }
    const data = await response.json()
    return { id: data.business?.id || null, primaryColor: data.business?.primary_color || null }
  } catch {
    return { id: null, primaryColor: null }
  }
}

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : DEFAULT_LOCALE
  const businessId = extractBusinessId(slug)
  const t = T[locale]

  const authResult = await getAuthStatus()
  if (!authResult.authenticated) {
    return <BookingsLoginPrompt locale={locale} />
  }
  const user = 'user' in authResult ? authResult.user as { phone: string; first_name: string; last_name: string } : null

  const [{ bookings: allBookings }, businessInfo] = await Promise.all([
    getMyBookings(),
    getBusinessInfo(businessId),
  ])
  const { id: resolvedBusinessId, primaryColor } = businessInfo

  const tenantBookings = resolvedBusinessId
    ? allBookings.filter((b: { business_id: string }) => b.business_id === resolvedBusinessId)
    : allBookings

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900" style={primaryColor ? { '--primary': primaryColor } as React.CSSProperties : undefined}>
      <div className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg z-30 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={`/${locale}/b/${slug}`}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft size={20} className="text-zinc-900 dark:text-zinc-100" />
          </Link>
          <h1 className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t.myBookings}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {user && (
          <div className="mb-4">
            <BookingsUserInfo user={user} locale={locale} />
          </div>
        )}
        <BookingsList bookings={tenantBookings} locale={locale} showBusinessName={false} onCancel={cancelBooking} />
      </div>

      <BottomNav locale={locale} />
    </div>
  )
}
