'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { useLocation } from '@/lib/location-context';
import { useLocale } from '@/lib/locale-context';
import type { Locale } from '@/lib/i18n';
import translations from '@/lib/translations';

interface NearestBusiness {
  business_id: string;
  business_name: string;
  avatar_url: string;
  business_type: string;
  distance: number;
  distance_metric: string;
  location: {
    lat: number;
    lng: number;
    display_address: string;
    city: string;
  };
  services: {
    name: { ru: string; uz: string };
    duration_minutes: number;
  }[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, '-')
    .replace(/^-|-$/g, '');
}

function businessHref(business: NearestBusiness, locale: Locale): string {
  const name = slugify(business.business_name);
  return `/${locale}/b/${name}-${business.business_id}`;
}

function BusinessCard({ business, locale }: { business: NearestBusiness; locale: Locale }) {
  return (
    <Link href={businessHref(business, locale)} className="group block transition-transform duration-300 hover:scale-[1.03]">
      {/* Avatar */}
      <div className="relative w-full aspect-[3/2] rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 mb-3">
        {business.avatar_url ? (
          <img
            src={business.avatar_url}
            alt={business.business_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-3xl font-bold">
            {business.business_name.charAt(0)}
          </div>
        )}
        {/* Distance badge */}
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <MapPin size={12} />
          {business.distance} {business.distance_metric}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1.5">
        <h3 className="font-semibold text-lg lg:text-xl line-clamp-1">
          {business.business_name}
        </h3>
        {/* <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 line-clamp-1">
          {business.location.display_address || business.location.city}
        </p> */}
        {business.services.length > 0 && (
          <p className="text-sm lg:text-base text-gray-400 dark:text-gray-500 line-clamp-2">
            {business.services.slice(0, 3).map(s => s.name[locale]).join(' · ')}
          </p>
        )}
      </div>
    </Link>
  );
}

export function NearestBusinesses() {
  const location = useLocation();
  const locale = useLocale();
  const [businesses, setBusinesses] = useState<NearestBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!location) return;

    fetch(`/api/nearest?lat=${location.lat}&lng=${location.lng}`)
      .then(res => res.json())
      .then(json => {
        setBusinesses(json.data || []);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [location]);

  const title = translations.venues.nearest[locale];

  if (!location || loading) {
    if (!location) return null;
    // Skeleton grid
    return (
      <section className="w-full max-w-7xl mx-auto px-6 pb-10">
        <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-6 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i}>
              <div className="aspect-[3/2] rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse mb-3" />
              <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (businesses.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-6 pb-10">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {businesses.map(biz => (
          <BusinessCard key={biz.business_id} business={biz} locale={locale} />
        ))}
      </div>
    </section>
  );
}
