'use client';

import { useState } from 'react';
import { citiesByCountry } from '@/data/cities';
import { CountryTabs } from './CountryTabs';
import { useLocale } from '@/lib/locale-context';
import translations from '@/lib/translations';

export function BrowseByCitySection() {
  const locale = useLocale();
  const countries = Object.keys(citiesByCountry);
  const [activeCountry, setActiveCountry] = useState<string>(countries[0]);

  const activeCities = citiesByCountry[activeCountry] || [];

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <h2 className="text-2xl font-bold mb-6">{translations.browse.title[locale]}</h2>

      <CountryTabs
        countries={countries}
        activeCountry={activeCountry}
        onSelect={setActiveCountry}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mt-8">
        {activeCities.map((city) => (
          <div key={city.name}>
            <h3 className="font-semibold text-base mb-3">{city.name}</h3>
            <ul className="space-y-2">
              {city.services.map((service) => (
                <li key={service.slug}>
                  <a
                    href={`/${activeCountry.toLowerCase().replace(/\s+/g, '-')}/${city.name.toLowerCase().replace(/\s+/g, '-')}/${service.slug}`}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                  >
                    {locale === 'ru'
                      ? `${service.name} ${translations.browse.inCity[locale]} ${city.name}`
                      : `${city.name} ${service.name}`
                    }
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
