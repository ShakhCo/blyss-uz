'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarCheck } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

interface BottomNavProps {
  locale: Locale;
}

const T: Record<Locale, { home: string; bookings: string }> = {
  uz: { home: 'Asosiy', bookings: 'Bronlarim' },
  ru: { home: 'Главная', bookings: 'Записи' },
};

export function BottomNav({ locale }: BottomNavProps) {
  const pathname = usePathname();
  const t = T[locale];

  const isBookings = pathname.endsWith('/bookings');

  const tabs = [
    { key: 'home', label: t.home, icon: Home, href: `/${locale}`, active: !isBookings },
    { key: 'bookings', label: t.bookings, icon: CalendarCheck, href: `/${locale}/bookings`, active: isBookings },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom,10px)] lg:hidden">
      <div className="flex items-center justify-around gap-2 overflow-hidden p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm rounded-full w-[92%] mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`${tab.active ? 'bg-[#088395]/10' : ''} flex px-1 flex-col items-center gap-0.5 py-1 pb-0.5 min-w-0 w-full rounded-full`}
            >
              <Icon
                size={22}
                strokeWidth={tab.active ? 2.5 : 1.8}
                className={tab.active ? 'text-[#088395]' : 'text-zinc-400'}
              />
              <span
                className={`text-[11px] line-clamp-1 capitalize ${tab.active ? 'text-[#088395] font-bold' : 'font-medium text-zinc-400'}`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
