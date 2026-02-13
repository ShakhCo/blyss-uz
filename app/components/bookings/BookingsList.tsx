'use client'

import type { Locale } from '@/lib/i18n'
import { Calendar, Clock, User } from 'lucide-react'

interface BookingItem {
  service_name: string
  employee_name: string
  start_time: number
  end_time: number
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

const T: Record<Locale, Record<string, string>> = {
  uz: {
    noBookings: 'Buyurtmalar yo\'q',
    noBookingsDesc: 'Siz hali hech narsa band qilmagansiz',
    confirmed: 'Tasdiqlangan',
    pending: 'Kutilmoqda',
    completed: 'Bajarilgan',
    cancelled: 'Bekor qilingan',
    total: 'Jami',
    sum: "so'm",
    minute: 'daq',
  },
  ru: {
    noBookings: 'Нет записей',
    noBookingsDesc: 'Вы ещё ничего не бронировали',
    confirmed: 'Подтверждено',
    pending: 'Ожидание',
    completed: 'Завершено',
    cancelled: 'Отменено',
    total: 'Итого',
    sum: 'сум',
    minute: 'мин',
  },
}

function secondsToTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function formatPrice(price: number) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-green-50 text-green-700',
  pending: 'bg-yellow-50 text-yellow-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-50 text-red-600',
}

export function BookingsList({ bookings, locale, showBusinessName = false }: BookingsListProps) {
  const t = T[locale]

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Calendar size={28} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{t.noBookings}</h3>
        <p className="text-sm text-gray-500">{t.noBookingsDesc}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const statusKey = booking.status || 'pending'
        const statusLabel = t[statusKey] || statusKey
        const statusStyle = STATUS_STYLES[statusKey] || STATUS_STYLES.pending

        return (
          <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 flex items-start justify-between">
              <div>
                {showBusinessName && booking.business_name && (
                  <p className="text-sm font-semibold text-gray-900 mb-0.5">{booking.business_name}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={14} />
                  <span>{booking.booking_date}</span>
                  {booking.items.length > 0 && (
                    <>
                      <span className="text-gray-300">|</span>
                      <Clock size={14} />
                      <span>
                        {secondsToTime(booking.items[0].start_time)}
                        {booking.items.length > 0 && ` - ${secondsToTime(booking.items[booking.items.length - 1].end_time)}`}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle}`}>
                {statusLabel}
              </span>
            </div>

            {/* Services */}
            <div className="px-4 pb-3 space-y-2">
              {booking.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm text-gray-900 truncate">{item.service_name}</span>
                    {item.employee_name && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                        <User size={10} />
                        {item.employee_name}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-900 ml-3 shrink-0">
                    {formatPrice(item.price)} {t.sum}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer total */}
            <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-600">{t.total}</span>
              <span className="text-sm font-bold text-[#088395]">
                {formatPrice(booking.total_price)} {t.sum}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
