'use client'

import { CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { LoginModal } from '@/app/components/auth/LoginModal'
import { BottomNav } from '@/app/components/layout/BottomNav'
import { ChevronLeft } from 'lucide-react'
import type { Locale } from '@/lib/i18n'

const T: Record<Locale, Record<string, string>> = {
  uz: {
    myBookings: 'Mening buyurtmalarim',
    loginRequired: 'Buyurtmalarni ko\'rish uchun tizimga kiring',
    back: 'Orqaga',
    signIn: 'Kirish',
  },
  ru: {
    myBookings: 'Мои записи',
    loginRequired: 'Войдите, чтобы увидеть записи',
    back: 'Назад',
    signIn: 'Войти',
  },
}

export function BookingsLoginPrompt({ locale }: { locale: Locale }) {
  const [loginOpen, setLoginOpen] = useState(false)
  const t = T[locale]

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

      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
          <CalendarDays size={28} className="text-zinc-400 dark:text-zinc-500" />
        </div>
        <p className="text-base lg:text-lg text-zinc-500 dark:text-zinc-400 mb-6">{t.loginRequired}</p>
        <button
          onClick={() => setLoginOpen(true)}
          className="px-8 py-3 bg-[#088395] text-white rounded-xl text-base font-semibold hover:bg-[#076e7d] transition-colors"
        >
          {t.signIn}
        </button>
      </div>

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => window.location.reload()}
        locale={locale}
      />

      <BottomNav locale={locale} />
    </div>
  )
}
