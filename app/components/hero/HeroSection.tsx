'use client';

import { useLocale } from '@/lib/locale-context';
import translations from '@/lib/translations';
import { SearchBar } from './SearchBar';

export const HeroSection = () => {
  const locale = useLocale();

  return (
    <section className="relative pt-40 md:pt-48 pb-32 md:pb-40">
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto text-center px-4 mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            {translations.hero.title[locale]}
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
            {translations.hero.subtitle[locale]}
          </p>
        </div>

        <div className="mb-12">
          <SearchBar />
        </div>

      </div>
    </section>
  );
};
