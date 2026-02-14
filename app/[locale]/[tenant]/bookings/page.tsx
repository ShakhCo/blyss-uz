import { getTenant } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import type { Locale } from '@/lib/i18n'
import { isValidLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import { getMyBookings, getAuthStatus } from '../actions'
import { BookingsList } from '@/app/components/bookings/BookingsList'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { signedFetch } from '@/lib/api'
import { BottomNav } from '@/app/components/layout/BottomNav'
import { BookingsLoginPrompt } from './BookingsLoginPrompt'
import { BookingsUserInfo } from './BookingsUserInfo'

const T = {
  uz: {
    myBookings: 'Mening buyurtmalarim',
    loginRequired: 'Buyurtmalarni ko\'rish uchun tizimga kiring',
    back: 'Orqaga',
    otherBookings: (count: number) =>
      `Sizda boshqa bizneslardan ${count} ta buyurtma bor.`,
    viewAll: 'Barchasini ko\'rish',
  },
  ru: {
    myBookings: 'Мои записи',
    loginRequired: 'Войдите, чтобы увидеть записи',
    back: 'Назад',
    otherBookings: (count: number) =>
      `У вас ${count} записей в других заведениях.`,
    viewAll: 'Посмотреть все',
  },
} as const

async function getBusinessId(tenantSlug: string): Promise<string | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await signedFetch(`${apiUrl}/public/businesses/${tenantSlug}/services`, {
      next: { revalidate: 60 },
    })
    if (!response.ok) return null
    const data = await response.json()
    return data.business?.id || null
  } catch {
    return null
  }
}

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ tenant: string; locale: string }>
}) {
  const { tenant: tenantSlug, locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : DEFAULT_LOCALE
  const tenant = await getTenant()
  const t = T[locale]

  if (!tenant.isTenant || tenant.slug !== tenantSlug) {
    redirect(`/${locale}`)
  }

  const authResult = await getAuthStatus()
  if (!authResult.authenticated) {
    return <BookingsLoginPrompt locale={locale} />
  }
  const user = 'user' in authResult ? authResult.user as { phone: string; first_name: string; last_name: string } : null

  const [{ bookings: allBookings }, businessId] = await Promise.all([
    getMyBookings(),
    getBusinessId(tenantSlug),
  ])

  const tenantBookings = businessId
    ? allBookings.filter((b: { business_id: string }) => b.business_id === businessId)
    : allBookings
  const otherCount = allBookings.length - tenantBookings.length

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg z-30 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={`/${locale}`}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft size={20} className="text-zinc-900 dark:text-zinc-100" />
          </Link>
          <h1 className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t.myBookings}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {user && (
          <div className="mb-4">
            <BookingsUserInfo user={user} locale={locale} />
          </div>
        )}
        {/* {otherCount > 0 && (
          <div className="mb-4 p-4 bg-[#088395]/5 dark:bg-[#088395]/10 rounded-2xl flex items-center justify-between gap-3">
            <p className="text-base text-zinc-700 dark:text-zinc-300">{t.otherBookings(otherCount)}</p>
            <a
              href={`https://blyss.uz/${locale}/my-bookings`}
              className="text-base font-semibold text-[#088395] whitespace-nowrap"
            >
              {t.viewAll} →
            </a>
          </div>
        )} */}
        <BookingsList bookings={tenantBookings} locale={locale} showBusinessName={false} />
      </div>

      <BottomNav locale={locale} />
    </div>
  )
}
