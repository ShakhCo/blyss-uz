'use client';

import { useState } from 'react';
import { Clock, MapPin, Phone, Check, Calendar } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface Business {
  name: string;
  business_type: string;
  location?: {
    address?: string;
    city?: string;
  };
  working_hours?: Record<string, { start: number; end: number; is_open: boolean }>;
  business_phone_number: string;
  tenant_url: string;
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

// Day names in Uzbek
const DAY_NAMES_UZ: Record<string, string> = {
  monday: 'Dushanba',
  tuesday: 'Seshanba',
  wednesday: 'Chorshanba',
  thursday: 'Payshanba',
  friday: 'Juma',
  saturday: 'Shanba',
  sunday: 'Yakshanba',
};

export function TenantPage({ business, services }: TenantPageProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBooking, setShowBooking] = useState(false);

  // Format price in Uzbek format
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price);
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} daqiqa`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} soat ${mins} daqiqa` : `${hours} soat`;
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
            {isOpenNow() ? 'Hozir ochiq' : 'Hozir yopiq'}
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
            <span className="text-sm font-medium">Qo'ng'iroq</span>
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              business.location?.address || business.name
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-stone-100 rounded-2xl text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <MapPin size={18} />
            <span className="text-sm font-medium">Manzil</span>
          </a>
        </div>
      </div>

      {/* Working Hours */}
      {business.working_hours && (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-3xl overflow-hidden">
            <div className="px-4 pt-4 pb-2 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-900">Ish vaqti</h2>
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
                    {DAY_NAMES_UZ[day]}
                  </span>
                  <span className={`text-sm font-medium ${
                    hours.is_open ? 'text-stone-900' : 'text-stone-400'
                  }`}>
                    {hours.is_open
                      ? `${secondsToTime(hours.start)} — ${secondsToTime(hours.end)}`
                      : 'Yopiq'}
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
            <h2 className="text-lg font-bold text-stone-900">Xizmatlar</h2>
          </div>
          {services.length > 0 ? (
            <div className="divide-y divide-stone-50">
              {services.map((service, index) => (
                <button
                  key={service.id}
                  // onClick={() => handleServiceSelect(service)}
                  className="w-full flex items-center gap-4 px-4 py-4 hover:bg-stone-50 transition-colors text-left"
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                    selectedService?.id === service.id ? 'bg-primary' : 'bg-stone-200'
                  }`}>
                    {selectedService?.id === service.id && <Check size={14} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-stone-900 truncate">
                      {service.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-stone-500 flex items-center gap-1">
                        <Clock size={12} />
                        {formatDuration(service.duration_minutes)}
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        {formatPrice(service.price)} so'm
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-stone-500">Xizmatlar mavjud emas</p>
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
              {selectedService.name}
            </h3>

            <div className="flex items-center gap-4 text-sm text-stone-600 mb-6">
              <div className="flex items-center gap-1">
                <Clock size={16} />
                {formatDuration(selectedService.duration_minutes)}
              </div>
              <div className="font-semibold text-primary">
                {formatPrice(selectedService.price)} so'm
              </div>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 mb-6">
              <p className="text-sm text-stone-600 text-center">
                Tez orada buyurtma berish funksiyasi mavjud bo'ladi
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
              Bilan bog'lanish
            </button>

            <button
              onClick={() => setShowBooking(false)}
              className="w-full px-6 py-4 text-stone-600 font-medium hover:text-stone-900 transition-colors"
            >
              Bekor qilish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
