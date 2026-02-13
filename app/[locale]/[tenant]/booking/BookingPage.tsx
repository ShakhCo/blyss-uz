'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import {
  ChevronLeft,
  Clock,
  Check,
  User,
  Loader2,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import {
  getAvailableSlots,
  getSlotEmployees,
  createBooking,
  getAuthStatus,
} from '../actions';
import { LoginModal } from '@/app/components/auth/LoginModal';

// ─── Interfaces ───

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

interface Employee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  position: string;
  services: {
    id: string;
    service_id: string;
    name: string | null;
    price: number;
    duration_minutes: number;
  }[];
}

interface SlotEmployee {
  id: string;
  first_name: string;
  last_name: string;
  price: number;
  duration_minutes: number;
}

interface ServiceSlotData {
  service_id: string;
  name: MultilingualText;
  start_time: number;
  employees: SlotEmployee[];
  unavailable?: boolean;
  reason?: string;
}

interface BookingPageProps {
  businessId: string;
  businessName: string;
  businessPhone: string;
  services: Service[];
  allServices: Service[];
  employees: Employee[];
  tenantSlug: string;
  locale: Locale;
  savedUser: { phone: string; first_name: string; last_name: string } | null;
}

// ─── Translations ───

const UI: Record<Locale, Record<string, string>> = {
  uz: {
    bookAppointment: 'Uchrashuv band qilish',
    selectDate: 'Sanani tanlang',
    selectTime: 'Vaqtni tanlang',
    yourServices: 'Xizmatlar',
    noSlots: 'Bu kunga bo\'sh vaqt yo\'q',
    loading: 'Yuklanmoqda...',
    confirmBooking: 'Band qilish',
    total: 'Jami',
    sum: "so'm",
    minute: 'daq',
    hour: 'soat',
    anySpecialist: 'Har qanday mutaxassis',
    today: 'Bugun',
    tomorrow: 'Ertaga',
    errorOccurred: 'Xatolik yuz berdi',
    alreadyBooked: 'Siz allaqachon bu vaqtda band qilgansiz',
    addService: 'Xizmat qo\'shish',
    change: 'O\'zgartirish',
    selectSpecialist: 'Mutaxassisni tanlang',
    notes: 'Izoh (ixtiyoriy)',
    notesPlaceholder: 'Qo\'shimcha ma\'lumot...',
    bookingConfirmed: 'Buyurtmangiz tasdiqlandi!',
    backToBusiness: 'Orqaga qaytish',
    viewBookings: 'Buyurtmalarim',
    addMoreServices: 'Xizmat qo\'shish',
  },
  ru: {
    bookAppointment: 'Записаться',
    selectDate: 'Выберите дату',
    selectTime: 'Выберите время',
    yourServices: 'Услуги',
    noSlots: 'Нет доступного времени',
    loading: 'Загрузка...',
    confirmBooking: 'Записаться',
    total: 'Итого',
    sum: 'сум',
    minute: 'мин',
    hour: 'ч',
    anySpecialist: 'Любой специалист',
    today: 'Сегодня',
    tomorrow: 'Завтра',
    errorOccurred: 'Произошла ошибка',
    alreadyBooked: 'У вас уже есть бронь на это время',
    addService: 'Добавить услугу',
    change: 'Изменить',
    selectSpecialist: 'Выберите специалиста',
    notes: 'Комментарий (необязательно)',
    notesPlaceholder: 'Дополнительная информация...',
    bookingConfirmed: 'Запись подтверждена!',
    backToBusiness: 'Вернуться',
    viewBookings: 'Мои записи',
    addMoreServices: 'Добавить услугу',
  },
};

// ─── Constants ───

const DAY_NAMES_SHORT: Record<Locale, string[]> = {
  uz: ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'],
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
};

const MONTH_NAMES: Record<Locale, string[]> = {
  uz: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
  ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
};

// ─── Helpers ───

function secondsToTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function formatDateYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function generateNext30Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

// ─── Component ───

export function BookingPage({
  businessId,
  businessName,
  businessPhone,
  services,
  allServices,
  employees,
  tenantSlug,
  locale,
  savedUser,
}: BookingPageProps) {
  const router = useRouter();
  const t = UI[locale];

  // ─── State ───

  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<number[]>([]);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(services.map(s => s.id));
  const [serviceEmployees, setServiceEmployees] = useState<ServiceSlotData[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Record<string, string | null>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showEmployeeSheet, setShowEmployeeSheet] = useState(false);
  const [showAddServiceSheet, setShowAddServiceSheet] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<Record<string, unknown> | null>(null);

  const dates = generateNext30Days();
  const timeSectionRef = useRef<HTMLDivElement>(null);
  const servicesSectionRef = useRef<HTMLDivElement>(null);

  // ─── Derived ───

  const currentServices = allServices.filter(s => selectedServiceIds.includes(s.id));
  const remainingServices = allServices.filter(s => !selectedServiceIds.includes(s.id));

  const getText = (text: MultilingualText | string | null | undefined): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    return text[locale as keyof MultilingualText] || text.ru || text.uz || '';
  };

  const formatPrice = (price: number) => price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} ${t.minute}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} ${t.hour} ${mins} ${t.minute}` : `${hours} ${t.hour}`;
  };

  const getServicePrice = (serviceId: string) => {
    const svcData = serviceEmployees.find(s => s.service_id === serviceId);
    const emp = svcData?.employees?.find(e => e.id === selectedEmployees[serviceId]);
    if (emp) return emp.price;
    return allServices.find(s => s.id === serviceId)?.price ?? 0;
  };

  const getServiceDuration = (serviceId: string) => {
    const svcData = serviceEmployees.find(s => s.service_id === serviceId);
    const emp = svcData?.employees?.find(e => e.id === selectedEmployees[serviceId]);
    if (emp) return emp.duration_minutes;
    return allServices.find(s => s.id === serviceId)?.duration_minutes ?? 0;
  };

  const totalPrice = selectedServiceIds.reduce((sum, sid) => sum + getServicePrice(sid), 0);

  // ─── Lock body scroll when sheets or modals are open ───

  useEffect(() => {
    const isOpen = showEmployeeSheet || showAddServiceSheet || showLoginModal;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showEmployeeSheet, showAddServiceSheet, showLoginModal]);

  // ─── Scroll helpers ───

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // ─── Handlers ───

  const handleDateSelect = async (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setServiceEmployees([]);
    setSelectedEmployees({});
    setAvailableSlots([]);
    setError('');
    setSlotsLoading(true);

    try {
      const result = await getAvailableSlots(businessId, dateStr, selectedServiceIds);
      if (result?.available_start_times) {
        setAvailableSlots(result.available_start_times);
      }
    } catch {
      setError(t.errorOccurred);
    } finally {
      setSlotsLoading(false);
    }

    scrollToSection(timeSectionRef);
  };

  const handleTimeSelect = async (time: number) => {
    setSelectedTime(time);
    setError('');
    setLoading(true);

    try {
      const result = await getSlotEmployees(businessId, selectedDate, selectedServiceIds, time);
      if (result?.services) {
        setServiceEmployees(result.services);
        const defaults: Record<string, string | null> = {};
        for (const svc of result.services) {
          if (svc.employees?.length > 0) {
            defaults[svc.service_id] = svc.employees[0].id;
          } else {
            defaults[svc.service_id] = null;
          }
        }
        setSelectedEmployees(defaults);
      }
    } catch {
      setError(t.errorOccurred);
    } finally {
      setLoading(false);
    }

    scrollToSection(servicesSectionRef);
  };

  const handleAddService = async (serviceId: string) => {
    const newIds = [...selectedServiceIds, serviceId];
    setSelectedServiceIds(newIds);
    setShowAddServiceSheet(false);
    setError('');
    setLoading(true);

    try {
      // Re-fetch slots for updated service list
      const slotsResult = await getAvailableSlots(businessId, selectedDate, newIds);
      const newSlots = slotsResult?.available_start_times || [];
      setAvailableSlots(newSlots);

      // If selected time is no longer valid, clear it
      if (selectedTime !== null && !newSlots.includes(selectedTime)) {
        setSelectedTime(null);
        setServiceEmployees([]);
        setSelectedEmployees({});
      } else if (selectedTime !== null) {
        // Re-fetch employees
        const empResult = await getSlotEmployees(businessId, selectedDate, newIds, selectedTime);
        if (empResult?.services) {
          setServiceEmployees(empResult.services);
          const defaults: Record<string, string | null> = {};
          for (const svc of empResult.services) {
            if (selectedEmployees[svc.service_id] !== undefined) {
              const prevEmp = selectedEmployees[svc.service_id];
              const stillAvailable = svc.employees?.some((e: SlotEmployee) => e.id === prevEmp);
              defaults[svc.service_id] = stillAvailable ? prevEmp : (svc.employees?.[0]?.id || null);
            } else {
              defaults[svc.service_id] = svc.employees?.[0]?.id || null;
            }
          }
          setSelectedEmployees(defaults);
        }
      }
    } catch {
      setError(t.errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    if (selectedServiceIds.length <= 1) return;
    const newIds = selectedServiceIds.filter(id => id !== serviceId);
    setSelectedServiceIds(newIds);
    setError('');

    // Remove from selected employees
    setSelectedEmployees(prev => {
      const next = { ...prev };
      delete next[serviceId];
      return next;
    });

    // Re-fetch if we have a selected time
    if (selectedTime !== null) {
      setLoading(true);
      try {
        const slotsResult = await getAvailableSlots(businessId, selectedDate, newIds);
        const newSlots = slotsResult?.available_start_times || [];
        setAvailableSlots(newSlots);

        if (!newSlots.includes(selectedTime)) {
          setSelectedTime(null);
          setServiceEmployees([]);
          setSelectedEmployees({});
        } else {
          const empResult = await getSlotEmployees(businessId, selectedDate, newIds, selectedTime);
          if (empResult?.services) {
            setServiceEmployees(empResult.services);
          }
        }
      } catch {
        setError(t.errorOccurred);
      } finally {
        setLoading(false);
      }
    }
  };

  const openEmployeeSheet = (serviceId: string) => {
    setEditingServiceId(serviceId);
    setShowEmployeeSheet(true);
  };

  const selectEmployee = (serviceId: string, employeeId: string) => {
    setSelectedEmployees(prev => ({ ...prev, [serviceId]: employeeId }));
    setShowEmployeeSheet(false);
    setEditingServiceId(null);
  };

  const submitBooking = useCallback(async () => {
    if (!selectedTime) return;
    setError('');
    setLoading(true);

    try {
      const bookingServices = selectedServiceIds.map(sid => ({
        service_id: sid,
        employee_id: selectedEmployees[sid] || null,
      }));

      const result = await createBooking(
        businessId,
        selectedDate,
        selectedTime,
        bookingServices,
        notes || undefined,
      );

      if (result.success) {
        setBookingResult(result.booking as Record<string, unknown>);
        setShowSuccess(true);
      } else {
        if (result.error_code === 'USER_TIME_CONFLICT') {
          setError(t.alreadyBooked);
        } else {
          setError(result.error || t.errorOccurred);
        }
      }
    } catch {
      setError(t.errorOccurred);
    } finally {
      setLoading(false);
    }
  }, [selectedTime, selectedServiceIds, selectedEmployees, businessId, selectedDate, notes, t]);

  const handleConfirmBooking = async () => {
    setError('');
    try {
      const authResult = await getAuthStatus();
      if (authResult.authenticated) {
        await submitBooking();
      } else {
        setShowLoginModal(true);
      }
    } catch {
      setError(t.errorOccurred);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    submitBooking();
  };

  const goBack = () => {
    router.push(`/${locale}/${tenantSlug}`);
  };

  // ─── Render ───

  return (
    <div className="min-h-screen bg-white pb-4">
      {/* ===== HEADER (sticky) ===== */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg z-30 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={goBack}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-900" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{t.bookAppointment}</h1>
            <p className="text-xs text-gray-500">{businessName}</p>
          </div>
        </div>
      </div>

      {/* ===== ERROR ===== */}
      {error && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        </div>
      )}

      {/* ===== CALENDAR SECTION ===== */}
      <section className="max-w-2xl mx-auto px-4 pt-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {t.selectDate}
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {dates.map((date, idx) => {
            const dateStr = formatDateYMD(date);
            const isSelected = selectedDate === dateStr;
            const isToday = idx === 0;
            const isTomorrow = idx === 1;
            const dayName = isToday
              ? t.today
              : isTomorrow
                ? t.tomorrow
                : DAY_NAMES_SHORT[locale][date.getDay()];
            const monthName = MONTH_NAMES[locale][date.getMonth()];

            return (
              <button
                key={dateStr}
                onClick={() => handleDateSelect(dateStr)}
                className={`flex-shrink-0 flex flex-col items-center w-[4.5rem] py-3 rounded-2xl transition-all ${
                  isSelected
                    ? 'bg-[#088395] text-white shadow-lg shadow-[#088395]/25'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                }`}
              >
                <span
                  className={`text-[10px] font-medium ${
                    isSelected ? 'text-white/70' : 'text-gray-500'
                  }`}
                >
                  {dayName}
                </span>
                <span className="text-xl font-bold mt-0.5">{date.getDate()}</span>
                <span
                  className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-gray-500'}`}
                >
                  {monthName}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===== TIME SLOTS SECTION ===== */}
      {selectedDate && (
        <section ref={timeSectionRef} className="max-w-2xl mx-auto px-4 pt-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t.selectTime}
          </h2>

          {slotsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-[#088395]" />
              <span className="ml-2 text-sm text-gray-500">{t.loading}</span>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-16">
              <Clock size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">{t.noSlots}</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
              {availableSlots.map(time => {
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-[#088395] text-white shadow-md shadow-[#088395]/20'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    {secondsToTime(time)}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ===== SELECTED SERVICES SECTION ===== */}
      {selectedTime !== null && (
        <section ref={servicesSectionRef} className="max-w-2xl mx-auto px-4 pt-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t.yourServices}
          </h2>

          {loading && serviceEmployees.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-[#088395]" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Service cards */}
              {selectedServiceIds.map(serviceId => {
                const service = allServices.find(s => s.id === serviceId);
                if (!service) return null;

                const svcData = serviceEmployees.find(s => s.service_id === serviceId);
                const selectedEmpId = selectedEmployees[serviceId];
                const selectedEmp = svcData?.employees?.find(e => e.id === selectedEmpId);
                const empName = selectedEmp
                  ? [selectedEmp.first_name, selectedEmp.last_name].filter(Boolean).join(' ')
                  : t.anySpecialist;
                const price = selectedEmp?.price ?? service.price;
                const duration = selectedEmp?.duration_minutes ?? service.duration_minutes;

                return (
                  <div key={serviceId} className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {getText(service.name)}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDuration(duration)} &middot; {formatPrice(price)} {t.sum}
                        </p>
                      </div>
                      {selectedServiceIds.length > 1 && (
                        <button
                          onClick={() => handleRemoveService(serviceId)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Employee row */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User size={14} className="text-gray-500" />
                        </div>
                        <span className="text-sm text-gray-700">{empName}</span>
                      </div>
                      {svcData && svcData.employees && svcData.employees.length > 1 && (
                        <button
                          onClick={() => openEmployeeSheet(serviceId)}
                          className="text-xs font-medium text-[#088395]"
                        >
                          {t.change}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add service button */}
              {remainingServices.length > 0 && (
                <button
                  onClick={() => setShowAddServiceSheet(true)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-gray-300 rounded-2xl text-sm font-medium text-gray-500 hover:border-[#088395] hover:text-[#088395] transition-colors"
                >
                  <Plus size={16} />
                  {t.addService}
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* ===== NOTES SECTION ===== */}
      {selectedTime !== null && (
        <section className="max-w-2xl mx-auto px-4 pt-6 pb-32">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.notesPlaceholder}
            className="w-full p-4 bg-gray-50 rounded-2xl border-0 resize-none text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#088395]/20"
            rows={3}
          />
          <p className="text-xs text-gray-400 mt-1.5 ml-1">{t.notes}</p>
        </section>
      )}

      {/* ===== FIXED BOTTOM BAR ===== */}
      {selectedTime !== null && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 z-30">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{t.total}</p>
              <p className="text-xl font-bold text-gray-900">
                {formatPrice(totalPrice)} {t.sum}
              </p>
            </div>
            <button
              onClick={handleConfirmBooking}
              disabled={loading || selectedServiceIds.length === 0}
              className="px-8 py-3.5 bg-[#088395] hover:bg-[#076e7d] text-white rounded-2xl font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                t.confirmBooking
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===== SUCCESS OVERLAY ===== */}
      {showSuccess && (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="text-center px-6 max-w-md w-full">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-6">
              <Check size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.bookingConfirmed}</h2>
            <p className="text-gray-500 mb-8">{businessName}</p>

            {/* Booking details */}
            {bookingResult && (
              <div className="space-y-3 mb-8 text-left">
                <div className="flex justify-between p-4 bg-gray-50 rounded-2xl">
                  <span className="text-sm text-gray-500">{t.selectDate}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {(bookingResult.booking_date as string) || selectedDate}
                  </span>
                </div>
                {selectedTime !== null && (
                  <div className="flex justify-between p-4 bg-gray-50 rounded-2xl">
                    <span className="text-sm text-gray-500">{t.selectTime}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {secondsToTime(selectedTime)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between p-4 bg-gray-50 rounded-2xl">
                  <span className="text-sm text-gray-500">{t.total}</span>
                  <span className="text-sm font-bold text-[#088395]">
                    {formatPrice((bookingResult.total_price as number) ?? totalPrice)} {t.sum}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => router.push(`/${locale}/${tenantSlug}/bookings`)}
                className="w-full py-3.5 bg-[#088395] text-white rounded-2xl font-semibold text-sm transition-colors hover:bg-[#076e7d]"
              >
                {t.viewBookings}
              </button>
              <button
                onClick={() => router.push(`/${locale}/${tenantSlug}`)}
                className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-semibold text-sm transition-colors hover:bg-gray-200"
              >
                {t.backToBusiness}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EMPLOYEE SELECTION BOTTOM SHEET ===== */}
      {showEmployeeSheet && editingServiceId && (
        <div
          className="fixed inset-0 bg-black/50 z-50 animate-fadeIn"
          onClick={() => {
            setShowEmployeeSheet(false);
            setEditingServiceId(null);
          }}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[70vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white px-4 pt-4 pb-2 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">{t.selectSpecialist}</h3>
                <button
                  onClick={() => {
                    setShowEmployeeSheet(false);
                    setEditingServiceId(null);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2 pb-8">
              {(() => {
                const svcData = serviceEmployees.find(s => s.service_id === editingServiceId);
                if (!svcData?.employees) return null;

                return svcData.employees.map(emp => {
                  const isSelected = selectedEmployees[editingServiceId] === emp.id;
                  const empName =
                    [emp.first_name, emp.last_name].filter(Boolean).join(' ') || t.anySpecialist;
                  return (
                    <button
                      key={emp.id}
                      onClick={() => selectEmployee(editingServiceId, emp.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                        isSelected
                          ? 'border-2 border-[#088395] bg-[#088395]/5'
                          : 'border border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User size={18} className="text-gray-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{empName}</p>
                          <p className="text-xs text-gray-500">{formatDuration(emp.duration_minutes)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">
                          {formatPrice(emp.price)} {t.sum}
                        </span>
                        {isSelected && <Check size={18} className="text-[#088395]" />}
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD SERVICE BOTTOM SHEET ===== */}
      {showAddServiceSheet && (
        <div
          className="fixed inset-0 bg-black/50 z-50 animate-fadeIn"
          onClick={() => setShowAddServiceSheet(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[70vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white px-4 pt-4 pb-2 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">{t.addMoreServices}</h3>
                <button
                  onClick={() => setShowAddServiceSheet(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2 pb-8">
              {remainingServices.map(service => (
                <button
                  key={service.id}
                  onClick={() => handleAddService(service.id)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-[#088395] transition-all"
                >
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-gray-900">{getText(service.name)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDuration(service.duration_minutes)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice(service.price)} {t.sum}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-[#088395]/10 flex items-center justify-center">
                      <Plus size={16} className="text-[#088395]" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== LOGIN MODAL ===== */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
        locale={locale}
      />
    </div>
  );
}
