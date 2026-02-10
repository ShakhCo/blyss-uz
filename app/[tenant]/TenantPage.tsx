'use client';

import { useState, useRef, useEffect } from 'react';
import { getDistance } from './actions';
import {
  Clock,
  MapPin,
  Phone,
  Check,
  Star,
  Instagram,
  Share2,
  Heart,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  Plus,
} from 'lucide-react';

type Language = 'uz' | 'ru';

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
  gallery_images?: string[];
  rating?: number;
  reviews_count?: number;
  social_media?: {
    instagram?: string;
  };
  tagline?: string;
}

interface TenantPageProps {
  business: Business;
  services: Service[];
}

function secondsToTime(seconds: number): string {
  if (seconds >= 86399) return '24:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

const DAY_NAMES: Record<Language, Record<string, string>> = {
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

const UI_TEXT: Record<Language, Record<string, string>> = {
  uz: {
    openUntil: '{{time}} gacha ochiq',
    closedNow: 'Hozir yopiq',
    call: "Qo'ng'iroq qilish",
    location: 'Manzil',
    workingHours: 'Ish vaqti',
    closed: 'Yopiq',
    services: 'Xizmatlar',
    noServices: 'Xizmatlar mavjud emas',
    comingSoon: "Tez orada buyurtma berish funksiyasi mavjud bo'ladi",
    contact: "Bog'lanish",
    cancel: 'Bekor qilish',
    minute: 'daq',
    hour: 'soat',
    sum: "so'm",
    reviews: 'sharhlar',
    today: 'Bugun',
    seeAllImages: "Barcha suratlarni ko'rish",
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
    amenities: 'Qulayliklar',
    parking: "Avtoturargoh mavjud",
    distanceAway: '{{distance}} uzoqlikda',
    showDistance: 'Masofani ko\'rish',
    locationBlockedTitle: 'Joylashuv ruxsati kerak',
    locationBlockedDesc: 'Masofani ko\'rsatish uchun brauzerda joylashuv ruxsatini yoqing:',
    locationStep1: 'Manzil satridagi qulf (tune) belgisini bosing',
    locationStep2: '"Joylashuv" ni "Ruxsat berish" ga o\'zgartiring',
    locationStep3: 'Sahifani qayta yuklang',
    gotIt: 'Tushunarli',
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
    comingSoon: 'Функция бронирования скоро будет доступна',
    contact: 'Связаться',
    cancel: 'Отмена',
    minute: 'мин',
    hour: 'ч',
    sum: 'сум',
    reviews: 'отзывов',
    today: 'Сегодня',
    seeAllImages: 'Посмотреть все фото',
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
    amenities: 'Удобства',
    parking: 'Парковка доступна',
    distanceAway: '{{distance}} от вас',
    showDistance: 'Показать расстояние',
    locationBlockedTitle: 'Требуется доступ к геолокации',
    locationBlockedDesc: 'Чтобы показать расстояние, включите доступ к местоположению в браузере:',
    locationStep1: 'Нажмите на значок замка (tune) в адресной строке',
    locationStep2: 'Измените "Местоположение" на "Разрешить"',
    locationStep3: 'Перезагрузите страницу',
    gotIt: 'Понятно',
  },
};

const PLACEHOLDER_GALLERY = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=300&fit=crop',
];

export function TenantPage({ business, services }: TenantPageProps) {
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [showBooking, setShowBooking] = useState(false);
  const [language, setLanguage] = useState<Language>('uz');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGallery, setShowGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('services');
  const [showAllHours, setShowAllHours] = useState(false);
  const [distance, setDistance] = useState<{ distance: number; metric: string } | null>(null);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [distanceDenied, setDistanceDenied] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const locationRetries = useRef(0);

  const servicesRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  const DISTANCE_CACHE_KEY = `distance_${business.tenant_url}`;
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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
    const isOpen = showBooking || showGallery || showLocationModal;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showBooking, showGallery, showLocationModal]);

  const t = UI_TEXT[language];
  const dayNames = DAY_NAMES[language];
  const galleryImages = business.gallery_images?.length ? business.gallery_images : PLACEHOLDER_GALLERY;

  const getText = (text: MultilingualText | string | null | undefined): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    return text[language] || text.uz || '';
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

  const handleServiceToggle = (service: Service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) return prev.filter(s => s.id !== service.id);
      return [...prev, service];
    });
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

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: business.name,
          text: business.tagline || business.business_type,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    }
  };

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);

  const scrollToSection = (section: string) => {
    setActiveTab(section);
    const ref = section === 'services' ? servicesRef : aboutRef;
    const offset = 52; // tab bar height
    const el = ref.current;
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const openStatus = isOpenNow();
  const closingTime = getClosingTime();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">

      {/* ===== GALLERY MOSAIC ===== */}
      <div className="relative">
        {/* Mobile: Single image carousel */}
        <div className="lg:hidden relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
          <img
            src={galleryImages[currentImageIndex]}
            alt={business.name}
            className="w-full h-full object-cover"
          />
          {/* Mobile nav dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {galleryImages.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/60'
                  }`}
              />
            ))}
          </div>
          {/* Mobile swipe arrows */}
          <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-full flex items-center justify-center">
            <ChevronLeft size={18} className="text-zinc-900 dark:text-zinc-100" />
          </button>
          <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-full flex items-center justify-center">
            <ChevronRight size={18} className="text-zinc-900 dark:text-zinc-100" />
          </button>
          {/* Top actions mobile */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            {/* Language toggle — segmented pill */}
            <div className="flex bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-full p-0.5">
              <button
                onClick={() => setLanguage('uz')}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${language === 'uz' ? 'bg-primary text-white' : 'text-zinc-600 dark:text-zinc-300'}`}
              >
                UZ
              </button>
              <button
                onClick={() => setLanguage('ru')}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${language === 'ru' ? 'bg-primary text-white' : 'text-zinc-600 dark:text-zinc-300'}`}
              >
                RU
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={handleShare} className="w-8 h-8 bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-full flex items-center justify-center">
                <Share2 size={14} className="text-zinc-900 dark:text-zinc-100" />
              </button>
              <button onClick={() => setIsFavorite(!isFavorite)} className="w-8 h-8 bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-full flex items-center justify-center">
                <Heart size={14} className={isFavorite ? 'text-red-500 fill-red-500' : 'text-zinc-900 dark:text-zinc-100'} />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop: Mosaic grid */}
        <div className="hidden lg:block max-w-[1350px] mx-auto px-6 pt-4">
          <div className="grid grid-cols-3 grid-rows-2 gap-2 h-[600px] rounded-2xl overflow-hidden">
            {/* Large main image */}
            <div className="col-span-2 row-span-2 relative cursor-pointer group" onClick={() => { setCurrentImageIndex(0); setShowGallery(true); }}>
              <img src={galleryImages[0]} alt={business.name} className="w-full h-full object-cover group-hover:brightness-95 transition-all" />
            </div>
            {/* Two stacked images on the right */}
            {galleryImages.slice(1, 3).map((img, idx) => (
              <div key={idx} className="relative cursor-pointer group overflow-hidden" onClick={() => { setCurrentImageIndex(idx + 1); setShowGallery(true); }}>
                <img src={img} alt="" className="w-full h-full object-cover group-hover:brightness-95 transition-all" />
                {idx === 1 && galleryImages.length > 3 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/50 transition-colors">
                    <span className="text-white font-medium text-sm">{t.seeAllImages}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Desktop top actions */}
          <div className="absolute top-8 right-10 flex items-center gap-2">
            {/* Language toggle — segmented pill (desktop) */}
            <div className="flex bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-full p-0.5 shadow-sm">
              <button
                onClick={() => setLanguage('uz')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${language === 'uz' ? 'bg-primary text-white' : 'text-zinc-700 dark:text-zinc-300'}`}
              >
                UZ
              </button>
              <button
                onClick={() => setLanguage('ru')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${language === 'ru' ? 'bg-primary text-white' : 'text-zinc-700 dark:text-zinc-300'}`}
              >
                RU
              </button>
            </div>
            <button onClick={handleShare} className="w-9 h-9 bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm">
              <Share2 size={16} className="text-zinc-900 dark:text-zinc-100" />
            </button>
            <button onClick={() => setIsFavorite(!isFavorite)} className="w-9 h-9 bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm">
              <Heart size={16} className={isFavorite ? 'text-red-500 fill-red-500' : 'text-zinc-900 dark:text-zinc-100'} />
            </button>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT (Desktop: 2/3 + 1/3 grid starting from business header) ===== */}
      <div className="max-w-[1350px] mx-auto px-4 lg:px-6 pb-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-3">

          {/* ===== LEFT COLUMN: Business Info + Services ===== */}
          <div className="lg:col-span-2">

            {/* Business Info Header */}
            <div className="py-5 lg:py-6">
              <h1 className="text-2xl lg:text-4xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                {business.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-3">
                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={18} className="text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-base">{business.rating || '5.0'}</span>
                  <span className="text-base text-zinc-500 dark:text-zinc-400">({business.reviews_count || 248})</span>
                </div>

                <span className="text-zinc-300 dark:text-zinc-600 text-base">&middot;</span>

                {/* Open/Closed */}
                {openStatus && closingTime ? (
                  <span className="text-base font-medium text-green-600 dark:text-green-400">
                    {t.openUntil.replace('{{time}}', closingTime)}
                  </span>
                ) : (
                  <span className="text-base font-medium text-red-500 dark:text-red-400">{t.closedNow}</span>
                )}

                {/* Location */}
                {business.location?.address && (
                  <span className="text-base text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <MapPin size={15} />
                    {business.location.address}
                  </span>
                )}

                {/* Distance */}
                {distanceLoading && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-600 text-base">&middot;</span>
                    <span className="inline-block w-24 h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </>
                )}
                {distance && !distanceLoading && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-600 text-base">&middot;</span>
                    <span className="text-base text-zinc-500 dark:text-zinc-400">
                      {t.distanceAway.replace('{{distance}}', `${distance.distance} ${distance.metric}`)}
                    </span>
                  </>
                )}
                {distanceDenied && !distance && !distanceLoading && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-600 text-base">&middot;</span>
                    <button
                      onClick={() => fetchDistance(true)}
                      className="text-base text-primary hover:underline flex items-center gap-1"
                    >
                      <MapPin size={14} />
                      {t.showDistance}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Services Header */}
            <div className="pt-2 pb-4">
              <h2 className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t.services}</h2>
            </div>

            {/* Services List */}
            <div ref={servicesRef}>

              {/* Search */}
              <div className="mb-5 lg:pr-8">
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

              {/* Service Categories & Items */}
              {Object.keys(groupedServices).length > 0 ? (
                Object.entries(groupedServices).map(([category, categoryServices]) => (
                  <div key={category} className="mb-6 lg:mr-8 py-2">
                    {/* Category header
                    {(Object.keys(groupedServices).length > 1 || category !== 'general') && (
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1 mt-2">
                        {category === 'general' ? t.general : category}
                      </h3>
                    )} */}

                    {/* Service list */}
                    <div className='flex flex-col gap-4'>
                      {categoryServices.map((service) => {
                        const isSelected = selectedServices.some(s => s.id === service.id);
                        return (
                          <div
                            key={service.id}
                            className={`flex items-start justify-between px-6 py-5 rounded-xl overflow-hidden transition-all duration-100 ease-out ${isSelected
                              ? 'border-2 border-primary shadow-sm'
                              : 'border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm'
                              }`}
                          >
                            {/* Left: name, description, duration */}
                            <div className="flex-1 min-w-0 pr-4">
                              <h4 className="text-lg font-semibold line-clamp-1 text-zinc-900 dark:text-zinc-100">
                                {getText(service.name)}
                              </h4>
                              {service.description && getText(service.description) && (
                                <p className="text-base text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 w-[90%]">
                                  {getText(service.description)}
                                </p>
                              )}
                              <p className="text-base text-zinc-400 mt-3">
                                {formatDuration(service.duration_minutes)}
                              </p>
                            </div>


                            {/* Left: name, description, duration */}
                            <div className="text-end">
                              <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                {formatPrice(service.price)} {t.sum}
                              </h4>
                              {/* {service.description && getText(service.description) && (
                                <p className="text-base text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 w-[80%]">
                                  {getText(service.description)}
                                </p>
                              )} */}

                              {selectedServices.length ? (
                                <button
                                  onClick={() => handleServiceToggle(service)}
                                  className={`cursor-pointer mt-2 w-12 h-12 ms-auto flex items-center justify-center rounded-full transition-all ${isSelected
                                    ? 'bg-primary text-white'
                                    : 'bg-primary/10 text-primary shadow-sm'
                                    }`}
                                >
                                  {isSelected ? <Check size={20} /> : <Plus size={20} />}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleServiceToggle(service)}
                                  className={`mt-2 px-4 py-2 text-base font-medium rounded-full shadow-sm transition-all ${isSelected
                                    ? 'bg-primary/10 text-primary border border-primary'
                                    : 'bg-primary text-white hover:bg-primary/90'
                                    }`}
                                >
                                  {isSelected ? (
                                    <span className="flex items-center gap-1">
                                      <Check size={13} strokeWidth={2.5} />
                                      {t.added}
                                    </span>
                                  ) : (
                                    t.book
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Right: price + book button */}
                            {/* <div className="text-right flex-shrink-0 flex flex-col items-end bg-red-400">
                              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                {formatPrice(service.price)} {t.sum}
                              </p>
                              <button
                                onClick={() => handleServiceToggle(service)}
                                className={`mt-2 px-4 py-1.5 text-xs font-medium rounded-xl transition-all ${isSelected
                                  ? 'bg-primary/10 text-primary border border-primary'
                                  : 'bg-primary text-white hover:bg-primary/90'
                                  }`}
                              >
                                {isSelected ? (
                                  <span className="flex items-center gap-1">
                                    <Check size={13} strokeWidth={2.5} />
                                    {t.added}
                                  </span>
                                ) : (
                                  t.book
                                )}
                              </button>
                            </div> */}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-zinc-400 text-sm">{t.noServices}</p>
                </div>
              )}
            </div>
          </div>

          {/* ===== RIGHT: SIDEBAR (Desktop) ===== */}
          <div className="hidden lg:block lg:col-span-1" ref={aboutRef}>
            <div className="sticky top-[52px] space-y-5 pt-6">

              {/* Map */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
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
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
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
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
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
          {/* Map */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
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

          {/* Call button */}
          <a
            href={`tel:${business.business_phone_number}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white rounded-2xl font-semibold text-sm"
          >
            <Phone size={16} />
            {t.call} {business.business_phone_number}
          </a>

          {/* Hours - collapsible */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none overflow-hidden">
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

          {/* Instagram */}
          {business.social_media?.instagram && (
            <a
              href={`https://instagram.com/${business.social_media.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900"
            >
              <Instagram size={18} className="text-zinc-500 dark:text-zinc-400" />
              <span className="text-sm text-primary">@{business.social_media.instagram}</span>
            </a>
          )}
        </div>
      </div>

      {/* ===== STICKY BOTTOM BAR ===== */}
      {selectedServices.length > 0 && (
        <>
          {/* Mobile */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 z-40 safe-area-bottom">
            <button
              onClick={() => setShowBooking(true)}
              className="w-full py-3.5 bg-primary text-white rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform"
            >
              {t.bookNow} &middot; {selectedServices.length} {t.selected} &middot; {formatPrice(totalPrice)} {t.sum}
            </button>
          </div>

          {/* Desktop */}
          <div className="hidden lg:block fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 z-40">
            <div className="max-w-[1200px] mx-auto px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-2xl lg:text-3xl  font-bold mb-1 text-zinc-900 dark:text-zinc-100">
                    {formatPrice(totalPrice)} {t.sum}
                  </p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">
                    {selectedServices.length} {t.selected}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBooking(true)}
                className="px-12 py-4 bg-primary text-white rounded-2xl font-semibold text-lg hover:bg-primary/90 transition-colors"
              >
                {t.bookNow}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===== BOOKING MODAL ===== */}
      {showBooking && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50"
          onClick={() => setShowBooking(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 w-full lg:w-[600px] rounded-t-3xl lg:rounded-2xl max-h-[90vh] overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-5 flex items-center justify-between">
              <h3 className="text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-zinc-100">{t.bookNow}</h3>
              <button
                onClick={() => setShowBooking(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={18} className="text-zinc-500" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2.5">
                {selectedServices.map((service) => (
                  <div key={service.id} className="flex items-center justify-between py-3 border-b border-zinc-300 dark:border-zinc-800 last:border-b-0">
                    <div>
                      <p className="text-lg lg:text-xl font-medium text-zinc-900 dark:text-zinc-100">{getText(service.name)}</p>
                      <p className="text-sm text-zinc-400 mt-0.5">{formatDuration(service.duration_minutes)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-base lg:text-lg font-medium text-zinc-900 dark:text-zinc-100">{formatPrice(service.price)} {t.sum}</p>
                      <button
                        onClick={() => handleServiceToggle(service)}
                        className="text-zinc-400 hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{t.total} &middot; {formatDuration(totalDuration)}</span>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{formatPrice(totalPrice)} {t.sum}</span>
              </div>

              <div className="mt-5 p-3 bg-primary/5 rounded-xl">
                <p className="text-sm text-primary text-center font-medium">{t.comingSoon}</p>
              </div>
            </div>

            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <a
                href={`tel:${business.business_phone_number}`}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-white rounded-2xl font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                <Phone size={16} />
                {t.contact}
              </a>
              <button
                onClick={() => setShowBooking(false)}
                className="w-full py-2.5 text-zinc-500 dark:text-zinc-400 font-medium text-sm hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== LOCATION PERMISSION MODAL ===== */}
      {showLocationModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50 animate-fadeIn"
          onClick={() => setShowLocationModal(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 w-full lg:w-[420px] rounded-t-3xl lg:rounded-2xl overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex justify-center pt-7 pb-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin size={28} className="text-primary" />
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-2 text-center">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {t.locationBlockedTitle}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                {t.locationBlockedDesc}
              </p>
            </div>

            {/* Steps */}
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

            {/* Button */}
            <div className="px-6 pb-7 pt-2">
              <button
                onClick={() => setShowLocationModal(false)}
                className="w-full py-3.5 bg-primary text-white rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform"
              >
                {t.gotIt}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== GALLERY MODAL ===== */}
      {showGallery && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm font-medium">{currentImageIndex + 1} / {galleryImages.length}</span>
            <button
              onClick={() => setShowGallery(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative px-4">
            <img
              src={galleryImages[currentImageIndex]}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={prevImage}
              className="absolute left-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          <div className="p-4 flex gap-2 overflow-x-auto justify-center">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`flex-shrink-0 w-14 h-14 rounded-md overflow-hidden transition-all ${idx === currentImageIndex ? 'ring-2 ring-primary' : 'opacity-40 hover:opacity-70'
                  }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom spacing for sticky bar */}
      {selectedServices.length > 0 && <div className="h-20 lg:h-16" />}
    </div>
  );
}
