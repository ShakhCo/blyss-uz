'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';
import { useLocale } from '@/lib/locale-context';
import translations from '@/lib/translations';
import type { Locale } from '@/lib/i18n';

interface BusinessTypeOption {
  id: string;
  icon: string;
  name: { ru: string; uz: string };
}

interface LocationOption {
  id: string;
  name: { ru: string; uz: string };
}

const BUSINESS_TYPES: BusinessTypeOption[] = [
  { id: 'barbershop', icon: '💈', name: { ru: 'Барбершоп', uz: 'Sartaroshxona' } },
  { id: 'beauty_salon', icon: '💇‍♀️', name: { ru: 'Салон красоты', uz: "Go'zallik saloni" } },
  { id: 'spa', icon: '🧖‍♀️', name: { ru: 'СПА центр', uz: 'SPA markazi' } },
  { id: 'massage', icon: '💆', name: { ru: 'Массаж', uz: 'Massaj' } },
  { id: 'skincare', icon: '✨', name: { ru: 'Косметология', uz: 'Kosmetologiya' } },
  { id: 'other', icon: '🏢', name: { ru: 'Другое', uz: 'Boshqa' } },
];

const REGIONS: LocationOption[] = [
  { id: 'tashkent_city', name: { ru: 'Ташкент', uz: 'Toshkent' } },
  { id: 'tashkent_region', name: { ru: 'Ташкентская область', uz: 'Toshkent viloyati' } },
  { id: 'samarkand', name: { ru: 'Самарканд', uz: 'Samarqand' } },
  { id: 'bukhara', name: { ru: 'Бухара', uz: 'Buxoro' } },
  { id: 'fergana', name: { ru: 'Фергана', uz: "Farg'ona" } },
  { id: 'andijan', name: { ru: 'Андижан', uz: 'Andijon' } },
  { id: 'namangan', name: { ru: 'Наманган', uz: 'Namangan' } },
  { id: 'kashkadarya', name: { ru: 'Кашкадарья', uz: 'Qashqadaryo' } },
  { id: 'surkhandarya', name: { ru: 'Сурхандарья', uz: 'Surxondaryo' } },
  { id: 'khorezm', name: { ru: 'Хорезм', uz: 'Xorazm' } },
  { id: 'navoi', name: { ru: 'Навои', uz: 'Navoiy' } },
  { id: 'jizzakh', name: { ru: 'Джизак', uz: 'Jizzax' } },
  { id: 'syrdarya', name: { ru: 'Сырдарья', uz: 'Sirdaryo' } },
  { id: 'karakalpakstan', name: { ru: 'Каракалпакстан', uz: "Qoraqalpog'iston" } },
];

type DropdownType = 'service' | 'location' | null;

function filterTypes(query: string, locale: Locale): BusinessTypeOption[] {
  if (!query.trim()) return BUSINESS_TYPES;
  const q = query.toLowerCase();
  return BUSINESS_TYPES.filter(
    t => t.name[locale].toLowerCase().includes(q) || t.name.ru.toLowerCase().includes(q) || t.name.uz.toLowerCase().includes(q)
  );
}

function filterRegions(query: string, locale: Locale): LocationOption[] {
  if (!query.trim()) return REGIONS;
  const q = query.toLowerCase();
  return REGIONS.filter(
    r => r.name[locale].toLowerCase().includes(q) || r.name.ru.toLowerCase().includes(q) || r.name.uz.toLowerCase().includes(q)
  );
}

export const SearchBar = () => {
  const locale = useLocale();
  const s = translations.search;
  const [query, setQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredTypes = filterTypes(query, locale);
  const filteredRegions = filterRegions(locationQuery, locale);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    if (activeDropdown) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeDropdown]);

  const handleSelectType = (type: BusinessTypeOption) => {
    setQuery(type.name[locale]);
    setActiveDropdown(null);
  };

  const handleSelectLocation = (loc: LocationOption | 'my_location') => {
    if (loc === 'my_location') {
      setActiveDropdown(null);
      setLocationQuery(locale === 'ru' ? 'Определяем...' : 'Aniqlanmoqda...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationQuery(locale === 'ru' ? 'Моё местоположение' : 'Mening joylashuvim');
        },
        () => {
          setLocationQuery('');
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    } else {
      setLocationQuery(loc.name[locale]);
      setActiveDropdown(null);
    }
  };

  const serviceDropdown = (mobile: boolean) => {
    if (activeDropdown !== 'service') return null;
    return (
      <div
        className={`absolute left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden ${mobile ? 'rounded-xl' : 'rounded-3xl'}`}
      >
        <div className="max-h-[280px] overflow-y-auto scrollbar-hide py-2.5">
          {filteredTypes.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              {locale === 'ru' ? 'Ничего не найдено' : 'Hech narsa topilmadi'}
            </div>
          ) : (
            filteredTypes.map(type => (
              <button
                key={type.id}
                onClick={() => handleSelectType(type)}
                className="w-full gap-3 px-2 text-left"
              >
                <div className='flex items-center w-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-full py-3 px-3'>
                  <span className="text-xl w-8 text-center flex-shrink-0">{type.icon}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {type.name[locale]}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  };

  const locationDropdown = (mobile: boolean) => {
    if (activeDropdown !== 'location') return null;
    return (
      <div
        className={`absolute left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden ${mobile ? 'rounded-xl' : 'rounded-3xl'}`}
      >
        <div className="max-h-[280px] overflow-y-auto scrollbar-hide py-2.5">
          {/* My location option */}
          <button
            onClick={() => handleSelectLocation('my_location')}
            className="w-full gap-3 px-2 text-left"
          >
            <div className='flex items-center w-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-full py-3 px-3'>
              <span className="w-8 flex-shrink-0 flex justify-center">
                <Navigation size={18} className="text-primary" />
              </span>
              <span className="text-sm font-medium text-primary">
                {locale === 'ru' ? 'Моё местоположение' : 'Mening joylashuvim'}
              </span>
            </div>
          </button>

          {/* Divider */}
          <div className="mx-4 my-1 border-t border-gray-100 dark:border-gray-800" />

          {/* Regions */}
          {filteredRegions.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              {locale === 'ru' ? 'Ничего не найдено' : 'Hech narsa topilmadi'}
            </div>
          ) : (
            filteredRegions.map(region => (
              <button
                key={region.id}
                onClick={() => handleSelectLocation(region)}
                className="w-full gap-3 px-2 text-left"
              >
                <div className='flex items-center w-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-full py-3 px-3'>
                  <span className="w-8 flex-shrink-0 flex justify-center">
                    <MapPin size={16} className="text-gray-400" />
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {region.name[locale]}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4" ref={wrapperRef}>
      {/* Desktop Layout */}
      <div
        className="hidden md:block rounded-full p-[4px] shadow-lg"
        style={{
          background: 'linear-gradient(to right, color-mix(in srgb, var(--blob-rose, #f472b6) 25%, transparent), color-mix(in srgb, var(--blob-blue, #7dd3fc) 25%, transparent))',
        }}
      >
        <div className="flex bg-white dark:bg-gray-900 rounded-full p-1">
          {/* Field 1: Search Input with dropdown */}
          <div className="relative flex-1">
            <div className="flex items-center gap-2 px-4 py-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setActiveDropdown('service'); }}
                onFocus={() => setActiveDropdown('service')}
                placeholder={s.treatments[locale]}
                className="bg-transparent text-base font-semibold text-gray-900 dark:text-gray-100 placeholder-gray-800 dark:placeholder-gray-400 outline-none focus:outline-none focus-visible:outline-none flex-1 w-full"
              />
            </div>
            {serviceDropdown(false)}
          </div>

          {/* Field 2: Location Input with dropdown */}
          <div className="relative flex-1">
            <div className="flex items-center gap-2 px-4 py-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={locationQuery}
                onChange={e => { setLocationQuery(e.target.value); setActiveDropdown('location'); }}
                onFocus={() => setActiveDropdown('location')}
                placeholder={s.location[locale]}
                className="bg-transparent text-base font-semibold text-gray-900 dark:text-gray-100 placeholder-gray-800 dark:placeholder-gray-400 outline-none focus:outline-none focus-visible:outline-none flex-1 w-full"
              />
            </div>
            {locationDropdown(false)}
          </div>

          {/* Search Button */}
          <button className="bg-black dark:bg-white text-white dark:text-black rounded-full px-6 py-3 font-semibold hover:bg-gray-900 dark:hover:bg-gray-200 transition-colors flex items-center gap-2 whitespace-nowrap">
            <Search className="w-5 h-5" />
            {s.button[locale]}
          </button>
        </div>
      </div>

      {/* Mobile Layout */}
      <div
        className="md:hidden rounded-2xl p-[4px] shadow-lg"
        style={{
          background: 'linear-gradient(to right, color-mix(in srgb, var(--blob-rose, #f472b6) 25%, transparent), color-mix(in srgb, var(--blob-blue, #7dd3fc) 25%, transparent))',
        }}
      >
        <div className="flex flex-col gap-3 bg-white dark:bg-gray-900 rounded-2xl p-4">
          {/* Field 1: Search Input with dropdown */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setActiveDropdown('service'); }}
                onFocus={() => setActiveDropdown('service')}
                placeholder={s.treatments[locale]}
                className="bg-transparent text-sm font-semibold text-gray-900 dark:text-gray-100 placeholder-gray-800 dark:placeholder-gray-400 outline-none focus:outline-none focus-visible:outline-none flex-1 w-full"
              />
            </div>
            {serviceDropdown(true)}
          </div>

          {/* Field 2: Location Input with dropdown */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={locationQuery}
                onChange={e => { setLocationQuery(e.target.value); setActiveDropdown('location'); }}
                onFocus={() => setActiveDropdown('location')}
                placeholder={s.location[locale]}
                className="bg-transparent text-sm font-semibold text-gray-900 dark:text-gray-100 placeholder-gray-800 dark:placeholder-gray-400 outline-none focus:outline-none focus-visible:outline-none flex-1 w-full"
              />
            </div>
            {locationDropdown(true)}
          </div>

          {/* Search Button */}
          <button className="w-full bg-black dark:bg-white text-white dark:text-black rounded-lg px-4 py-3 font-semibold hover:bg-gray-900 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
            <Search className="w-5 h-5" />
            {s.button[locale]}
          </button>
        </div>
      </div>
    </div>
  );
};
