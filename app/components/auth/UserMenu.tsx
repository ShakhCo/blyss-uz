'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { CalendarDays, LogOut } from 'lucide-react'
import { LoginModal } from './LoginModal'
import { logout } from '@/app/[locale]/[tenant]/actions'

interface BlyssUser {
  phone: string
  first_name: string
  last_name: string
}

interface UserMenuProps {
  locale: 'uz' | 'ru'
  user: BlyssUser | null
}

const T: Record<'uz' | 'ru', Record<string, string>> = {
  uz: {
    signIn: 'Kirish',
    myBookings: 'Mening buyurtmalarim',
    logOut: 'Chiqish',
  },
  ru: {
    signIn: 'Войти',
    myBookings: 'Мои записи',
    logOut: 'Выйти',
  },
}

function getInitial(user: BlyssUser): string {
  if (user.first_name && user.first_name.trim().length > 0) {
    return user.first_name.trim()[0].toUpperCase()
  }
  if (user.phone && user.phone.length > 0) {
    return user.phone[0]
  }
  return '?'
}

function getDisplayName(user: BlyssUser): string {
  if (user.first_name && user.first_name.trim().length > 0) {
    return user.first_name.trim()
  }
  return user.phone
}

export function UserMenu({ locale, user: initialUser }: UserMenuProps) {
  const t = T[locale]
  const [user, setUser] = useState<BlyssUser | null>(initialUser)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Sync with server prop
  useEffect(() => {
    setUser(initialUser)
  }, [initialUser])

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside, true)
    return () => document.removeEventListener('click', handleClickOutside, true)
  }, [dropdownOpen])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    setUser(null)
  }

  const handleLoginSuccess = () => {
    setLoginModalOpen(false)
    window.location.reload()
  }

  // Logged out state
  if (!user) {
    return (
      <>
        <button
          onClick={() => setLoginModalOpen(true)}
          className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          {t.signIn}
        </button>

        <LoginModal
          isOpen={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          onSuccess={handleLoginSuccess}
          locale={locale}
        />
      </>
    )
  }

  // Logged in state
  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full px-1 py-1 pr-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
          {getInitial(user)}
        </div>
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 max-w-[120px] truncate">
          {getDisplayName(user)}
        </span>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 min-w-48 z-50">
          <Link
            href={`/${locale}/bookings`}
            onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <CalendarDays size={16} className="text-gray-400" />
            {t.myBookings}
          </Link>

          <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <LogOut size={16} className="text-red-400" />
            {t.logOut}
          </button>
        </div>
      )}
    </div>
  )
}
