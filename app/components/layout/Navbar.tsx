'use client';

import React from 'react';
import type { Locale } from '@/lib/i18n';
import { UserMenu } from '../auth/UserMenu';

interface NavbarProps {
  locale?: Locale;
  user?: { phone: string; first_name: string; last_name: string } | null;
}

export const Navbar = ({ locale = 'ru', user = null }: NavbarProps) => {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Left: Logo */}
        <div className="text-xl font-bold text-black">BLYSS</div>

        {/* Right: Navigation Items */}
        <div className="flex items-center gap-3">
          <UserMenu locale={locale} user={user} />
        </div>
      </div>
    </nav>
  );
};
