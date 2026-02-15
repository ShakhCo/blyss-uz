'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getDistance, reverseGeocode, setBookingIntent } from './actions';
import { BottomNav } from '@/app/components/layout/BottomNav';
import type { Locale } from '@/lib/i18n';
import { LOCALES } from '@/lib/i18n';
import {
  Clock,
  MapPin,
  Phone,
  Star,
  Instagram,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  CalendarCheck,
} from 'lucide-react';

interface MultilingualText {
  uz: string;
  ru: string;
}

interface Service {
  id: string;
  name: MultilingualText;
  description?: MultilingualText | null;
  price: number;
  duration_minutes: number;
  category?: string;
}

interface Employee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  position: string;
  services: {
    id: string;
    service_id: string;
    name: MultilingualText | null;
    price: number;
    duration_minutes: number;
  }[];
}

interface Photo {
  id: string;
  url: string;
  category: 'interior' | 'exterior';
  order: number;
}

interface Business {
  name: string;
  business_type: string;
  location?: {
    lat?: number;
    lng?: number;
    address?: string;
  };
  working_hours?: Record<string, { start: number; end: number; is_open: boolean }>;
  business_phone_number: string;
  tenant_url: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  rating?: number;
  reviews_count?: number;
  social_media?: {
    instagram?: string;
  };
  tagline?: string;
  primary_color?: string | null;
}

interface SavedUser {
  phone: string;
  first_name: string;
  last_name: string;
}

interface TenantPageProps {
  business: Business;
  services: Service[];
  employees: Employee[];
  photos: Photo[];
  tenantSlug: string;
  businessId: string;
  locale: Locale;
  savedUser: SavedUser | null;
}

function secondsToTime(seconds: number): string {
  if (seconds >= 86399) return '24:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

const DAY_NAMES: Record<Locale, Record<string, string>> = {
  uz: {
    monday: 'Dushanba',
    tuesday: 'Seshanba',
    wednesday: 'Chorshanba',
    thursday: 'Payshanba',
    friday: 'Juma',
    saturday: 'Shanba',
    sunday: 'Yakshanba',
  },
  ru: {
    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница',
    saturday: 'Суббота',
    sunday: 'Воскресенье',
  },
};

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const UI_TEXT: Record<Locale, Record<string, string>> = {
  uz: {
    openUntil: '{{time}} gacha ochiq',
    closedNow: 'Hozir yopiq',
    call: "Qo'ng'iroq qilish",
    location: 'Manzil',
    workingHours: 'Ish vaqti',
    closed: 'Yopiq',
    services: 'Xizmatlar',
    noServices: 'Xizmatlar mavjud emas',
    contact: "Bog'lanish",
    cancel: 'Bekor qilish',
    minute: 'daq',
    hour: 'soat',
    sum: "so'm",
    reviews: 'sharhlar',
    today: 'Bugun',
    seeAllImages: "Hammasini ko'rish",
    searchServices: 'Xizmatlarni qidirish...',
    book: 'Band qilish',
    about: 'Haqida',
    getDirections: "Yo'nalish olish",
    added: "Qo'shildi",
    continue: 'Davom etish',
    bookNow: 'Band qilish',
    selected: 'xizmat tanlangan',
    total: 'Jami',
    general: 'Umumiy',
    photos: 'Suratlar',
    seeAll: "Hammasini ko'rish",
    interior: 'Ichki',
    exterior: 'Tashqi',
    allPhotos: 'Hammasi',
    distanceAway: '{{distance}} uzoqlikda',
    showDistance: 'Masofani ko\'rish',
    locationBlockedTitle: 'Joylashuv ruxsati kerak',
    locationBlockedDesc: 'Masofani ko\'rsatish uchun brauzerda joylashuv ruxsatini yoqing:',
    locationStep1: 'Manzil satridagi qulf (tune) belgisini bosing',
    locationStep2: '"Joylashuv" ni "Ruxsat berish" ga o\'zgartiring',
    locationStep3: 'Sahifani qayta yuklang',
    gotIt: 'Tushunarli',
    specialists: 'Mutaxassislar',
    noSpecialists: 'Mutaxassislar mavjud emas',
    myBookings: 'Mening bronlarim',
  },
  ru: {
    openUntil: 'Открыто до {{time}}',
    closedNow: 'Сейчас закрыто',
    call: 'Позвонить',
    location: 'Адрес',
    workingHours: 'Время работы',
    closed: 'Закрыто',
    services: 'Услуги',
    noServices: 'Услуги отсутствуют',
    contact: 'Связаться',
    cancel: 'Отмена',
    minute: 'мин',
    hour: 'ч',
    sum: 'сум',
    reviews: 'отзывов',
    today: 'Сегодня',
    seeAllImages: 'все фото',
    searchServices: 'Поиск услуг...',
    book: 'Забронировать',
    about: 'О салоне',
    getDirections: 'Маршрут',
    added: 'Добавлено',
    continue: 'Продолжить',
    bookNow: 'Забронировать',
    selected: 'услуг выбрано',
    total: 'Итого',
    general: 'Общие',
    photos: 'Фото',
    seeAll: 'Смотреть все',
    interior: 'Интерьер',
    exterior: 'Экстерьер',
    allPhotos: 'Все',
    distanceAway: '{{distance}} от вас',
    showDistance: 'Показать расстояние',
    locationBlockedTitle: 'Требуется доступ к геолокации',
    locationBlockedDesc: 'Чтобы показать расстояние, включите доступ к местоположению в браузере:',
    locationStep1: 'Нажмите на значок замка (tune) в адресной строке',
    locationStep2: 'Измените "Местоположение" на "Разрешить"',
    locationStep3: 'Перезагрузите страницу',
    gotIt: 'Понятно',
    specialists: 'Специалисты',
    noSpecialists: 'Специалисты отсутствуют',
    myBookings: 'Мои записи',
  },
};

const LOCALE_LABELS: Record<Locale, string> = {
  uz: 'UZ',
  ru: 'RU',
};

export function TenantPage({ business, services, employees, photos, tenantSlug, businessId, locale, savedUser }: TenantPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [showGallery, setShowGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'interior' | 'exterior'>('all');
  const [showAllHours, setShowAllHours] = useState(false);
  const [distance, setDistance] = useState<{ distance: number; metric: string } | null>(null);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [distanceDenied, setDistanceDenied] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [geoAddress, setGeoAddress] = useState<string | null>(null);
  const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);
  const [navigatingToBookings, setNavigatingToBookings] = useState(false);
  const locationRetries = useRef(0);


  const servicesRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  const DISTANCE_CACHE_KEY = `distance_${business.tenant_url}`;
  const ADDRESS_CACHE_KEY = `address_v2_${business.tenant_url}_${locale}`;
  const CACHE_TTL = 24 * 60 * 60 * 1000;

  // Build gallery images from photos + cover
  const allPhotos = photos.length > 0
    ? photos.map(p => ({ url: p.url, category: p.category }))
    : [];

  const coverUrl = business.cover_url || null;

  // For the mosaic: cover + first interior + first exterior
  const interiorPhotos = allPhotos.filter(p => p.category === 'interior');
  const exteriorPhotos = allPhotos.filter(p => p.category === 'exterior');

  const mosaicImages: string[] = [];
  if (coverUrl) mosaicImages.push(coverUrl);
  if (interiorPhotos.length > 0 && interiorPhotos[0].url !== coverUrl) mosaicImages.push(interiorPhotos[0].url);
  if (exteriorPhotos.length > 0) mosaicImages.push(exteriorPhotos[0].url);
  // Fill remaining slots from photos (up to 5 for desktop banner + thumbnails)
  for (const p of allPhotos) {
    if (mosaicImages.length >= 5) break;
    if (!mosaicImages.includes(p.url)) mosaicImages.push(p.url);
  }

  const galleryImages = allPhotos.map(p => p.url);
  const hasPhotos = galleryImages.length > 0;
  const hasCover = !!coverUrl;

  // Filtered photos for gallery modal
  const filteredGalleryPhotos = galleryFilter === 'all'
    ? allPhotos
    : allPhotos.filter(p => p.category === galleryFilter);

  const getCachedDistance = () => {
    try {
      const raw = localStorage.getItem(DISTANCE_CACHE_KEY);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return { distance: cached.distance, metric: cached.metric };
      }
      localStorage.removeItem(DISTANCE_CACHE_KEY);
    } catch { /* ignore */ }
    return null;
  };

  const cacheDistance = (data: { distance: number; metric: string }) => {
    try {
      localStorage.setItem(DISTANCE_CACHE_KEY, JSON.stringify({
        ...data,
        timestamp: Date.now(),
      }));
    } catch { /* ignore */ }
  };

  const fetchDistance = (isManual = false) => {
    if (!business.location?.lat || !business.location?.lng) return;
    if (!navigator.geolocation) return;

    setDistanceLoading(true);
    setDistanceDenied(false);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          locationRetries.current = 0;
          const slug = business.tenant_url.replace(/\.blyss\.uz$/, '');
          const data = await getDistance(
            slug,
            position.coords.latitude,
            position.coords.longitude
          );
          if (data?.distance !== undefined && data?.metric) {
            const result = { distance: data.distance, metric: data.metric };
            setDistance(result);
            cacheDistance(result);
          }
        } catch {
          // silently fail
        } finally {
          setDistanceLoading(false);
        }
      },
      () => {
        setDistanceLoading(false);
        setDistanceDenied(true);
        if (isManual) {
          locationRetries.current += 1;
          if (locationRetries.current >= 1) {
            setShowLocationModal(true);
          }
        }
      }
    );
  };

  useEffect(() => {
    const cached = getCachedDistance();
    if (cached) {
      setDistance(cached);
      return;
    }
    fetchDistance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.location, business.tenant_url]);

  useEffect(() => {
    if (!business.location?.lat || !business.location?.lng) return;
    // Check cache first
    try {
      const raw = localStorage.getItem(ADDRESS_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
          setGeoAddress(cached.address);
          return;
        }
        localStorage.removeItem(ADDRESS_CACHE_KEY);
      }
    } catch { /* ignore */ }
    // Fetch from Nominatim
    reverseGeocode(business.location.lat, business.location.lng, locale).then((address) => {
      if (address) {
        setGeoAddress(address);
        try {
          localStorage.setItem(ADDRESS_CACHE_KEY, JSON.stringify({ address, timestamp: Date.now() }));
        } catch { /* ignore */ }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.location, locale]);

  useEffect(() => {
    const isOpen = showGallery || showLocationModal;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showGallery, showLocationModal]);

  const t = UI_TEXT[locale];
  const dayNames = DAY_NAMES[locale];

  const getText = (text: MultilingualText | string | null | undefined): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    return text[locale as keyof MultilingualText] || text.ru || text.uz || '';
  };

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} ${t.minute}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} ${t.hour} ${mins} ${t.minute}` : `${hours} ${t.hour}`;
  };

  const getTodayName = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  const isOpenNow = () => {
    const todayName = getTodayName();
    const now = new Date();
    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60;
    const todayHours = business.working_hours?.[todayName];
    if (!todayHours || !todayHours.is_open) return false;
    return currentSeconds >= todayHours.start && currentSeconds <= todayHours.end;
  };

  const getClosingTime = () => {
    const todayName = getTodayName();
    const todayHours = business.working_hours?.[todayName];
    if (!todayHours || !todayHours.is_open) return null;
    return secondsToTime(todayHours.end);
  };

  // Detect /b/ direct route vs subdomain route for navigation
  const pathSegments = pathname.split('/').filter(Boolean);
  const isDirectRoute = pathSegments[1] === 'b';
  const basePath = isDirectRoute ? `/${locale}/b/${pathSegments[2]}` : `/${locale}`;

  const handleBookService = async (service: Service) => {
    setBookingServiceId(service.id);
    // Clear any saved booking state before starting fresh
    document.cookie = `blyss_booking_${businessId}=; path=/; max-age=0`;
    await setBookingIntent(businessId, [service.id]);
    router.push(`${basePath}/booking`);
  };

  const switchLocale = (newLocale: Locale) => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments[1] === 'b') {
      // Direct URL route: /{locale}/b/{slug}/...
      const rest = segments.slice(1);
      router.push(`/${newLocale}/${rest.join('/')}`);
    } else {
      // Subdomain route: /{locale}/{tenantSlug}/...
      const rest = segments.slice(2);
      const newPath = `/${newLocale}${rest.length > 0 ? '/' + rest.join('/') : ''}`;
      router.push(newPath);
    }
  };

  const filteredServices = services.filter(service => {
    if (!searchQuery) return true;
    const name = getText(service.name).toLowerCase();
    const desc = getText(service.description).toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || desc.includes(searchQuery.toLowerCase());
  });

  const groupedServices = filteredServices.reduce<Record<string, Service[]>>((acc, service) => {
    const cat = service.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {});

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % (hasPhotos ? galleryImages.length : 1));
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + (hasPhotos ? galleryImages.length : 1)) % (hasPhotos ? galleryImages.length : 1));

  const openStatus = isOpenNow();
  const closingTime = getClosingTime();

  const LanguageSwitcher = ({ className = '' }: { className?: string }) => (
    <div className={`flex bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-full p-0.5 ${className}`}>
      {LOCALES.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${locale === loc ? 'bg-primary text-white' : 'text-zinc-600 dark:text-zinc-300'}`}
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  );

  const LanguageSwitcherDesktop = ({ className = '' }: { className?: string }) => (
    <div className={`flex bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-full p-0.5 shadow-sm ${className}`}>
      {LOCALES.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${locale === loc ? 'bg-primary text-white' : 'text-zinc-700 dark:text-zinc-300'}`}
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  );

  const primaryColor = business.primary_color || '#088395';

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900" style={{ '--primary': primaryColor } as React.CSSProperties}>

      {/* ===== COVER PHOTO ===== */}
      {hasCover ? (
        <div
          className="relative h-[180px] lg:h-[300px] cursor-pointer overflow-hidden"
          onClick={() => { setCurrentImageIndex(0); setShowGallery(true); }}
        >
          <img
            src={coverUrl || mosaicImages[0] || ''}
            alt={business.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between lg:hidden">
            <LanguageSwitcher />
          </div>
          <div className="absolute top-4 right-4 hidden lg:flex items-center gap-2">
            <LanguageSwitcherDesktop />
          </div>
        </div>
      ) : (
        <div className="relative h-[120px] lg:h-[200px]" style={{ backgroundColor: primaryColor }}>
          <div className="absolute top-3 right-3 lg:top-4 lg:right-4">
            <LanguageSwitcherDesktop className="shadow-none" />
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT (grid starts right after cover) ===== */}
      <div className="max-w-[1350px] mx-auto px-4 lg:px-6 pb-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-5">

          {/* ===== LEFT COLUMN: Avatar + Info + Services ===== */}
          <div className="lg:col-span-2">

            {/* Avatar overlapping cover */}
            <div className="-mt-14 lg:-mt-16 relative z-10">
              <div
                className={`w-28 h-28 lg:w-32 lg:h-32 rounded-full bg-white dark:bg-zinc-900 bg-center bg-cover border-[3px] border-white dark:border-zinc-900 ${business.avatar_url ? '' : 'border border-zinc-200 dark:border-zinc-700'} overflow-hidden`}
                style={business.avatar_url ? { backgroundImage: `url(${business.avatar_url})` } : undefined}
              >
                {!business.avatar_url && (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                    <User size={36} className="text-zinc-400 dark:text-zinc-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Business name + meta */}
            <div className="mt-3 mb-6">
              <h1 className="text-2xl lg:text-4xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                {business.name}
              </h1>
              {(geoAddress || business.location?.address) && (
                <p className="text-sm lg:text-base text-zinc-500 dark:text-zinc-400 mt-1">
                  {geoAddress || business.location?.address}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-1.5">
                {openStatus && closingTime ? (
                  <span className="text-sm lg:text-base font-medium text-green-600 dark:text-green-400">
                    {t.openUntil.replace('{{time}}', closingTime)}
                  </span>
                ) : (
                  <span className="text-sm lg:text-base font-medium text-red-500 dark:text-red-400">{t.closedNow}</span>
                )}
                {distanceLoading && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-600">&middot;</span>
                    <span className="inline-block w-24 h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </>
                )}
                {distance && !distanceLoading && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-600">&middot;</span>
                    <span className="text-sm lg:text-base text-zinc-500 dark:text-zinc-400">
                      {t.distanceAway.replace('{{distance}}', `${distance.distance} ${distance.metric}`)}
                    </span>
                  </>
                )}
                {distanceDenied && !distance && !distanceLoading && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-600">&middot;</span>
                    <button
                      onClick={() => fetchDistance(true)}
                      className="text-sm lg:text-base text-primary hover:underline flex items-center gap-1"
                    >
                      <MapPin size={14} />
                      {t.showDistance}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="pb-4">
              <h2 className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t.services}</h2>
            </div>

            <div ref={servicesRef}>
              {/* Search */}
              <div className="mb-5">
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchServices}
                    className="w-full pl-10 pr-10 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-transparent rounded-xl text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-zinc-300 dark:focus:border-zinc-600 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
                    >
                      <X size={14} className="text-zinc-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Service Items */}
              {Object.keys(groupedServices).length > 0 ? (
                Object.entries(groupedServices).map(([category, categoryServices]) => (
                  <div key={category} className="mb-6 py-2">
                    <div className='flex flex-col gap-4'>
                      {categoryServices.map((service, index) => (
                        <div
                          key={service.id}
                          className={`flex items-start justify-between lg:px-6 lg:py-5 lg:rounded-xl overflow-hidden transition-all duration-100 ease-out lg:border lg:border-zinc-300 lg:dark:border-zinc-800 lg:hover:border-zinc-400 lg:dark:hover:border-zinc-600 lg:hover:shadow-sm ${categoryServices.length - 1 === index ? '' : 'border-b pb-4 border-zinc-300 dark:border-zinc-800'}`}
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <h4 className="text-base lg:text-lg font-semibold line-clamp-1 text-zinc-900 dark:text-zinc-100">
                              {getText(service.name)}
                            </h4>
                            {service.description && getText(service.description) && (
                              <p className="text-sm lg:text-base text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 w-[90%]">
                                {getText(service.description)}
                              </p>
                            )}
                            <p className="text-sm lg:text-base text-zinc-400 mt-3">
                              {formatDuration(service.duration_minutes)}
                            </p>
                          </div>
                          <div className="text-end">
                            <h4 className="text-base lg:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                              {formatPrice(service.price)} {t.sum}
                            </h4>
                            <button
                              onClick={() => handleBookService(service)}
                              disabled={bookingServiceId === service.id}
                              className="mt-2 px-3 py-1.5 lg:px-4 lg:py-2 text-sm lg:text-base font-medium rounded-full shadow-sm transition-all bg-primary text-white hover:bg-primary/90 disabled:opacity-70 flex items-center gap-1.5"
                            >
                              {bookingServiceId === service.id && (
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              )}
                              {t.book}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-zinc-400 text-sm">{t.noServices}</p>
                </div>
              )}
            </div>

            {/* ===== EMPLOYEES LIST ===== */}
            {employees.length > 0 && (
              <div className="mt-8">
                <div className="pt-2 pb-4 mb-2">
                  <h2 className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t.specialists}</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {employees.map((employee) => {
                    const name = [employee.first_name, employee.last_name].filter(Boolean).join(' ');
                    return (
                      <div
                        key={employee.id}
                        className="flex flex-col items-center flex-shrink-0 w-[100px]"
                      >
                        <div className="w-[72px] h-[72px] lg:w-[80px] lg:h-[80px] rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-zinc-200 dark:border-zinc-700">
                          <User size={32} className="text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 mt-2 text-center line-clamp-1">
                          {name || employee.position}
                        </p>
                        {name && employee.position && (
                          <p className="text-sm lg:text-base text-zinc-500 dark:text-zinc-400 text-center line-clamp-1">
                            {employee.position}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ===== RIGHT: SIDEBAR (Desktop) ===== */}
          <div className="hidden lg:block lg:col-span-1" ref={aboutRef}>
            <div className="sticky top-4 space-y-5 pt-6">
              {/* My Bookings button */}
              {savedUser && (
                <button
                  onClick={() => { setNavigatingToBookings(true); router.push(`${basePath}/bookings`); }}
                  disabled={navigatingToBookings}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary/90 transition-colors disabled:opacity-70"
                >
                  {navigatingToBookings ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <CalendarCheck size={20} />
                  )}
                  {t.myBookings}
                </button>
              )}
              {/* Map */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-800 relative">
                  {business.location?.lat && business.location?.lng ? (
                    <iframe
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${business.location.lat},${business.location.lng}&zoom=15`}
                      className="w-full h-full border-0"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin size={28} className="text-zinc-300 dark:text-zinc-600" />
                    </div>
                  )}
                </div>
                <div className="p-3.5">
                  <p className="text-lg lg:text-xl font-medium text-zinc-900 dark:text-zinc-100">{business.name}</p>
                  {business.location?.lat && business.location?.lng && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${business.location.lat},${business.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-base font-medium mt-1 text-primary hover:underline"
                    >
                      {t.getDirections}
                    </a>
                  )}
                </div>
              </div>

              {/* Working Hours */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Clock size={24} className="text-primary" />
                    <h4 className="text-lg lg:text-xl font-semibold text-zinc-900 dark:text-zinc-100">{t.workingHours}</h4>
                  </div>
                </div>
                {business.working_hours && (
                  <div className="space-y-1">
                    {DAY_ORDER.map((day) => {
                      const hours = business.working_hours?.[day];
                      const isToday = day === getTodayName();
                      return (
                        <div
                          key={day}
                          className={`flex justify-between text-base py-1.5 px-3 rounded-xl ${isToday ? 'bg-primary' : ''}`}
                        >
                          <span className={isToday ? 'font-medium text-white' : hours?.is_open ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'}>
                            {dayNames[day]}
                          </span>
                          <span className={isToday ? 'font-medium text-white' : hours?.is_open ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-400 dark:text-red-500'}>
                            {hours?.is_open
                              ? `${secondsToTime(hours.start)} - ${secondsToTime(hours.end)}`
                              : t.closed}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Phone size={24} className="text-primary" />
                  <h4 className="text-lg lg:text-xl font-semibold text-zinc-900 dark:text-zinc-100">{t.contact}</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base text-zinc-600 dark:text-zinc-400">+{business.business_phone_number}</span>
                  <a
                    href={`tel:${business.business_phone_number}`}
                    className="text-base font-medium text-primary hover:underline"
                  >
                    {t.call}
                  </a>
                </div>
                {business.social_media?.instagram && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-300 dark:border-zinc-800">
                    <Instagram size={15} className="text-zinc-400" />
                    <a
                      href={`https://instagram.com/${business.social_media.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-primary hover:underline"
                    >
                      @{business.social_media.instagram}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== MOBILE: ABOUT SECTION ===== */}
        <div className="lg:hidden mt-8 space-y-4" ref={aboutRef}>
          <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
            <div className="aspect-[2/1] bg-zinc-100 dark:bg-zinc-800">
              {business.location?.lat && business.location?.lng ? (
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${business.location.lat},${business.location.lng}&zoom=15`}
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin size={28} className="text-zinc-300 dark:text-zinc-600" />
                </div>
              )}
            </div>
            <div className="p-3.5">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{business.name}</p>
              {business.location?.address && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{business.location.address}</p>
              )}
              {business.location?.lat && business.location?.lng && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${business.location.lat},${business.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm font-medium mt-1.5 text-primary hover:underline"
                >
                  {t.getDirections}
                </a>
              )}
            </div>
          </div>

          <a
            href={`tel:${business.business_phone_number}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm"
          >
            <Phone size={16} />
            {t.call} {business.business_phone_number}
          </a>

          {/* Hours - collapsible */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none overflow-hidden">
            <button
              onClick={() => setShowAllHours(!showAllHours)}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-primary" />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t.workingHours}</span>
              </div>
              <div className="flex items-center gap-2">
                {openStatus && (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    {t.openUntil.replace('{{time}}', closingTime || '')}
                  </span>
                )}
                {showAllHours ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
              </div>
            </button>
            {showAllHours && business.working_hours && (
              <div className="px-4 pb-4 space-y-1">
                {DAY_ORDER.map((day) => {
                  const hours = business.working_hours?.[day];
                  const isToday = day === getTodayName();
                  return (
                    <div
                      key={day}
                      className={`flex justify-between text-sm py-1.5 px-3 rounded-full ${isToday ? 'bg-primary' : ''}`}
                    >
                      <span className={isToday ? 'font-medium text-white' : hours?.is_open ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'}>
                        {dayNames[day]}
                      </span>
                      <span className={isToday ? 'font-medium text-white' : hours?.is_open ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}>
                        {hours?.is_open
                          ? `${secondsToTime(hours.start)} - ${secondsToTime(hours.end)}`
                          : t.closed}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {business.social_media?.instagram && (
            <a
              href={`https://instagram.com/${business.social_media.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900"
            >
              <Instagram size={18} className="text-zinc-500 dark:text-zinc-400" />
              <span className="text-sm text-primary">@{business.social_media.instagram}</span>
            </a>
          )}
        </div>
      </div>

      {/* ===== LOCATION PERMISSION MODAL ===== */}
      {showLocationModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50 animate-fadeIn"
          onClick={() => setShowLocationModal(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 w-full lg:w-[420px] rounded-t-3xl lg:rounded-xl overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-7 pb-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin size={28} className="text-primary" />
              </div>
            </div>
            <div className="px-6 pb-2 text-center">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {t.locationBlockedTitle}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                {t.locationBlockedDesc}
              </p>
            </div>
            <div className="px-6 py-4 space-y-3">
              {[t.locationStep1, t.locationStep2, t.locationStep3].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{step}</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-7 pt-2">
              <button
                onClick={() => setShowLocationModal(false)}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform"
              >
                {t.gotIt}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <BottomNav locale={locale} />

      {/* ===== GALLERY MODAL (with category tabs) ===== */}
      {showGallery && hasPhotos && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 text-white">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{currentImageIndex + 1} / {filteredGalleryPhotos.length}</span>
              {/* Category tabs */}
              <div className="flex gap-1 ml-4">
                {(['all', 'interior', 'exterior'] as const).map((cat) => {
                  const count = cat === 'all' ? allPhotos.length : allPhotos.filter(p => p.category === cat).length;
                  if (count === 0 && cat !== 'all') return null;
                  return (
                    <button
                      key={cat}
                      onClick={() => { setGalleryFilter(cat); setCurrentImageIndex(0); }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${galleryFilter === cat ? 'bg-white text-black' : 'bg-white/20 text-white hover:bg-white/30'}`}
                    >
                      {cat === 'all' ? t.allPhotos : cat === 'interior' ? t.interior : t.exterior} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={() => setShowGallery(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative px-4">
            {filteredGalleryPhotos.length > 0 && (
              <img
                src={filteredGalleryPhotos[currentImageIndex]?.url || ''}
                alt=""
                className="max-w-full max-h-full object-contain"
              />
            )}
            {filteredGalleryPhotos.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev - 1 + filteredGalleryPhotos.length) % filteredGalleryPhotos.length)}
                  className="absolute left-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev + 1) % filteredGalleryPhotos.length)}
                  className="absolute right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>

          <div className="p-4 flex gap-2 overflow-x-auto justify-center">
            {filteredGalleryPhotos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`flex-shrink-0 w-14 h-14 rounded-md overflow-hidden transition-all ${idx === currentImageIndex ? 'ring-2 ring-primary' : 'opacity-40 hover:opacity-70'}`}
              >
                <img src={photo.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
