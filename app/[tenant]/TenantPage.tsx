'use client';

import { useState } from 'react';
import { Clock, MapPin, Phone, Check, Calendar, Globe } from 'lucide-react';

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
}

interface Business {
  name: string;
  business_type: string;
  location?: {
    lat?: number;
    lng?: number;
  };
  working_hours?: Record<string, { start: number; end: number; is_open: boolean }>;
  business_phone_number: string;
  tenant_url: string;
  avatar_url?: string | null;
}

interface TenantPageProps {
  business: Business;
  services: Service[];
}

// Helper: Convert seconds to "HH:MM"
function secondsToTime(seconds: number): string {
  if (seconds >= 86399) {
    return '24:00';
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Day names by language
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

// UI translations
const UI_TEXT: Record<Language, Record<string, string>> = {
  uz: {
    openNow: 'Hozir ochiq',
    closedNow: 'Hozir yopiq',
    call: "Qo'ng'iroq",
    location: 'Manzil',
    workingHours: 'Ish vaqti',
    closed: 'Yopiq',
    services: 'Xizmatlar',
    noServices: 'Xizmatlar mavjud emas',
    comingSoon: "Tez orada buyurtma berish funksiyasi mavjud bo'ladi",
    contact: "Bilan bog'lanish",
    cancel: 'Bekor qilish',
    minute: 'daqiqa',
    hour: 'soat',
    sum: "so'm",
  },
  ru: {
    openNow: 'Сейчас открыто',
    closedNow: 'Сейчас закрыто',
    call: 'Позвонить',
    location: 'Адрес',
    workingHours: 'Время работы',
    closed: 'Закрыто',
    services: 'Услуги',
    noServices: 'Услуги отсутствуют',
    comingSoon: 'Функция онлайн-бронирования скоро будет доступна',
    contact: 'Связаться',
    cancel: 'Отмена',
    minute: 'мин',
    hour: 'ч',
    sum: 'сум',
  },
};

export function TenantPage({ business, services }: TenantPageProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [language, setLanguage] = useState<Language>('uz');

  const t = UI_TEXT[language];
  const dayNames = DAY_NAMES[language];

  // Get text from multilingual object
  const getText = (text: MultilingualText | string | null | undefined): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    return text[language] || text.uz || '';
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === 'uz' ? 'uz-UZ' : 'ru-RU').format(price);
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} ${t.minute}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} ${t.hour} ${mins} ${t.minute}` : `${hours} ${t.hour}`;
  };

  // Toggle language
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'uz' ? 'ru' : 'uz');
  };

  // Check if business is open now
  const isOpenNow = () => {
    const today = new Date().getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today];
    const now = new Date();
    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60;

    const todayHours = business.working_hours?.[todayName];
    if (!todayHours || !todayHours.is_open) {
      return false;
    }

    return currentSeconds >= todayHours.start && currentSeconds <= todayHours.end;
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setShowBooking(true);
  };

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Hero Header */}
      <div className="bg-white rounded-b-3xl px-4 pt-6 pb-6 shadow-sm">
        {/* Language Toggle */}
        <div className="flex justify-end mb-2">
          <button
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
          >
            <Globe size={14} />
            {language === 'uz' ? 'RU' : 'UZ'}
          </button>
        </div>

        {/* Business Avatar */}
        {business.avatar_url && (
          <div className="flex justify-center mb-4">
            <img
              src={business.avatar_url}
              alt={business.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-stone-200"
            />
          </div>
        )}

        {/* Business Status Badge */}
        <div className="flex justify-center mb-4">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            isOpenNow()
              ? 'bg-green-100 text-green-700'
              : 'bg-stone-100 text-stone-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isOpenNow() ? 'bg-green-500' : 'bg-stone-400'
            }`} />
            {isOpenNow() ? t.openNow : t.closedNow}
          </div>
        </div>

        {/* Business Name */}
        <h1 className="text-2xl font-bold text-stone-900 text-center mb-2">
          {business.name}
        </h1>

        {/* Business Type */}
        <p className="text-base text-stone-600 text-center mb-6">
          {business.business_type}
        </p>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          <a
            href={`tel:${business.business_phone_number}`}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-stone-100 rounded-2xl text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <Phone size={18} />
            <span className="text-sm font-medium">{t.call}</span>
          </a>
          <a
            href={business.location?.lat && business.location?.lng
              ? `https://www.google.com/maps/search/?api=1&query=${business.location.lat},${business.location.lng}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name)}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-stone-100 rounded-2xl text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <MapPin size={18} />
            <span className="text-sm font-medium">{t.location}</span>
          </a>
        </div>
      </div>

      {/* Working Hours */}
      {business.working_hours && (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-3xl overflow-hidden">
            <div className="px-4 pt-4 pb-2 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-900">{t.workingHours}</h2>
            </div>
            <div className="p-2">
              {Object.entries(business.working_hours).map(([day, hours]) => (
                <div
                  key={day}
                  className="flex items-center justify-between px-4 py-3 border-b border-stone-50 last:border-b-0"
                >
                  <span className={`text-sm ${
                    hours.is_open ? 'text-stone-700' : 'text-stone-400'
                  }`}>
                    {dayNames[day]}
                  </span>
                  <span className={`text-sm font-medium ${
                    hours.is_open ? 'text-stone-900' : 'text-stone-400'
                  }`}>
                    {hours.is_open
                      ? `${secondsToTime(hours.start)} — ${secondsToTime(hours.end)}`
                      : t.closed}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Services */}
      <div className="px-4 mt-4 pb-8">
        <div className="bg-white rounded-3xl overflow-hidden">
          <div className="px-4 pt-4 pb-2 border-b border-stone-100">
            <h2 className="text-lg font-bold text-stone-900">{t.services}</h2>
          </div>
          {services.length > 0 ? (
            <div className="divide-y divide-stone-50">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="w-full flex items-center gap-4 px-4 py-4 hover:bg-stone-50 transition-colors text-left"
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                    selectedService?.id === service.id ? 'bg-primary' : 'bg-stone-200'
                  }`}>
                    {selectedService?.id === service.id && <Check size={14} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-stone-900 truncate">
                      {getText(service.name)}
                    </h3>
                    {service.description && getText(service.description) && (
                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                        {getText(service.description)}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-stone-500 flex items-center gap-1">
                        <Clock size={12} />
                        {formatDuration(service.duration_minutes)}
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        {formatPrice(service.price)} {t.sum}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-stone-500">{t.noServices}</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && selectedService && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4"
          onClick={() => setShowBooking(false)}
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideUp 0.3s ease-out' }}
          >
            <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mb-6" />

            <h3 className="text-xl font-bold text-stone-900 mb-2">
              {getText(selectedService.name)}
            </h3>

            {selectedService.description && getText(selectedService.description) && (
              <p className="text-sm text-stone-500 mb-4">
                {getText(selectedService.description)}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-stone-600 mb-6">
              <div className="flex items-center gap-1">
                <Clock size={16} />
                {formatDuration(selectedService.duration_minutes)}
              </div>
              <div className="font-semibold text-primary">
                {formatPrice(selectedService.price)} {t.sum}
              </div>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 mb-6">
              <p className="text-sm text-stone-600 text-center">
                {t.comingSoon}
              </p>
            </div>

            <button
              onClick={() => {
                setShowBooking(false);
                window.location.href = `tel:${business.business_phone_number}`;
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-semibold hover:bg-primary-dark transition-colors"
            >
              <Phone size={20} />
              {t.contact}
            </button>

            <button
              onClick={() => setShowBooking(false)}
              className="w-full px-6 py-4 text-stone-600 font-medium hover:text-stone-900 transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
