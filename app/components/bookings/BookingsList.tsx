'use client'

import type { Locale } from '@/lib/i18n'
import { Calendar, ChevronRight, Clock } from 'lucide-react'

interface MultilingualText {
  uz: string
  ru: string
}

interface BookingItem {
  service_name: string | MultilingualText
  employee_name: string
  start_time: number | string
  end_time: number | string
  price: number
  duration_minutes: number
  status: string
}

interface Booking {
  id: string
  business_id: string
  business_name: string
  booking_date: string
  status: string
  total_price: number
  total_duration_minutes: number
  items: BookingItem[]
  created_at: string | null
}

interface BookingsListProps {
  bookings: Booking[]
  locale: Locale
  showBusinessName?: boolean
}

const MONTH_NAMES: Record<Locale, string[]> = {
  uz: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
}

const T: Record<Locale, Record<string, string>> = {
  uz: {
    noBookings: 'Buyurtmalar yo\'q',
    noBookingsDesc: 'Siz hali hech narsa band qilmagansiz',
    cancelled: 'Bekor qilingan',
    sum: "so'm",
    min: 'daq',
  },
  ru: {
    noBookings: 'Нет записей',
    noBookingsDesc: 'Вы ещё ничего не бронировали',
    cancelled: 'Отменено',
    sum: 'сум',
    min: 'мин',
  },
}

function parseTime(value: number | string | undefined | null): number | null {
  if (value == null) return null
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.includes('T')) {
    const timePart = value.split('T')[1]
    const [h, m] = timePart.split(':').map(Number)
    return h * 3600 + (m || 0) * 60
  }
  return null
}

function secondsToTime(value: number | string | undefined | null): string {
  const seconds = parseTime(value)
  if (seconds == null) return '--:--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function formatPrice(price: number | undefined | null) {
  if (price == null) return '0'
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function resolveText(value: string | MultilingualText | undefined | null, locale: Locale): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  return value[locale] || value.ru || value.uz || ''
}

function formatDate(dateStr: string, locale: Locale): string {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const day = parseInt(parts[2], 10)
  const month = parseInt(parts[1], 10) - 1
  return `${day} ${MONTH_NAMES[locale][month]}`
}

export function BookingsList({ bookings, locale, showBusinessName = false }: BookingsListProps) {
  const t = T[locale]

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <Calendar size={28} className="text-zinc-400 dark:text-zinc-500" />
        </div>
        <h3 className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{t.noBookings}</h3>
        <p className="text-base lg:text-lg text-zinc-500 dark:text-zinc-400">{t.noBookingsDesc}</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col w-full gap-4'>
      {bookings.map((booking) => {
        const isCancelled = booking.status === 'cancelled'
        const items = booking.items || []
        const timeRange = items.length > 0
          ? `${secondsToTime(items[0].start_time)} – ${secondsToTime(items[items.length - 1].end_time)}`
          : null

        return (
          <div key={booking.id} className={`p-4 rounded-xl bg-white dark:bg-zinc-800 border-4 border-zinc-200 dark:border-zinc-700 shadow-xs ${isCancelled ? 'opacity-50' : ''}`}>
            {/* Date, time, status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Calendar size={18} className="text-zinc-400 dark:text-zinc-500" />
                  <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatDate(booking.booking_date, locale)}</span>
                </div>
                {timeRange && (
                  <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{timeRange}</span>
                )}
              </div>
              {isCancelled && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  {t.cancelled}
                </span>
              )}
            </div>

            {showBusinessName && booking.business_name && (
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                {resolveText(booking.business_name as string | MultilingualText, locale)}
              </p>
            )}

            {/* Services */}
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <ChevronRight size={18} className="text-zinc-300 dark:text-zinc-600 shrink-0" />
                    <span className="text-lg text-zinc-700 dark:text-zinc-300 truncate">{resolveText(item.service_name, locale)}</span>
                  </div>
                  <span className="text-base text-zinc-500 dark:text-zinc-400 shrink-0 ml-3">
                    {item.employee_name}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700">
              <span className="text-base text-zinc-400 dark:text-zinc-500">
                {booking.total_duration_minutes} {t.min}
              </span>
              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {formatPrice(booking.total_price)} {t.sum}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
