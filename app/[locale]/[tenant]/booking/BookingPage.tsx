'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import {
  ChevronLeft,
  Clock,
  Check,
  User,
  Phone,
  Calendar,
  Loader2,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import {
  getAvailableSlots,
  getSlotEmployees,
  sendOtp,
  verifyOtp,
  createBooking,
  getAuthStatus,
} from '../actions';

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
  savedPhone: string | null;
}

type Step = 'date' | 'time' | 'services' | 'phone' | 'confirm' | 'success';

const UI: Record<Locale, Record<string, string>> = {
  uz: {
    back: 'Orqaga',
    selectDate: 'Sanani tanlang',
    selectTime: 'Vaqtni tanlang',
    servicesReview: 'Xizmatlar',
    phoneVerify: 'Telefon tasdiqlash',
    confirm: 'Tasdiqlash',
    success: 'Muvaffaqiyat!',
    noSlots: 'Bu kunga bo\'sh vaqt yo\'q',
    loading: 'Yuklanmoqda...',
    next: 'Davom etish',
    bookNow: 'Band qilish',
    total: 'Jami',
    sum: "so'm",
    minute: 'daq',
    hour: 'soat',
    enterPhone: 'Telefon raqamingizni kiriting',
    phoneFormat: '998XXXXXXXXX',
    sendCode: 'Kod yuborish',
    enterCode: 'Kodni kiriting',
    verifyCode: 'Tasdiqlash',
    codeSent: 'Kod yuborildi',
    codeSentViaSms: 'Kod SMS orqali yuborildi',
    codeSentViaTelegram: 'Kod Telegram orqali yuborildi',
    waitSeconds: '{{s}} soniya kuting',
    bookingConfirmed: 'Buyurtmangiz tasdiqlandi!',
    bookingDetails: 'Tafsilotlar',
    backToBusiness: 'Biznesga qaytish',
    date: 'Sana',
    time: 'Vaqt',
    service: 'Xizmat',
    employee: 'Xodim',
    price: 'Narx',
    anySpecialist: 'Har qanday mutaxassis',
    today: 'Bugun',
    tomorrow: 'Ertaga',
    errorOccurred: 'Xatolik yuz berdi',
    tryAgain: 'Qayta urinib ko\'ring',
    alreadyBooked: 'Siz allaqachon bu vaqtda band qilgansiz',
    servicesSelected: 'xizmat tanlangan',
    addService: 'Xizmat qo\'shish',
    change: 'O\'zgartirish',
    remove: 'O\'chirish',
    selectSpecialist: 'Mutaxassisni tanlang',
    addMoreServices: 'Xizmat qo\'shish',
  },
  ru: {
    back: 'Назад',
    selectDate: 'Выберите дату',
    selectTime: 'Выберите время',
    servicesReview: 'Услуги',
    phoneVerify: 'Подтвердите телефон',
    confirm: 'Подтверждение',
    success: 'Успешно!',
    noSlots: 'Нет доступного времени на этот день',
    loading: 'Загрузка...',
    next: 'Продолжить',
    bookNow: 'Забронировать',
    total: 'Итого',
    sum: 'сум',
    minute: 'мин',
    hour: 'ч',
    enterPhone: 'Введите номер телефона',
    phoneFormat: '998XXXXXXXXX',
    sendCode: 'Отправить код',
    enterCode: 'Введите код',
    verifyCode: 'Подтвердить',
    codeSent: 'Код отправлен',
    codeSentViaSms: 'Код отправлен по SMS',
    codeSentViaTelegram: 'Код отправлен через Telegram',
    waitSeconds: 'Подождите {{s}} сек',
    bookingConfirmed: 'Бронирование подтверждено!',
    bookingDetails: 'Детали',
    backToBusiness: 'Вернуться',
    date: 'Дата',
    time: 'Время',
    service: 'Услуга',
    employee: 'Специалист',
    price: 'Цена',
    anySpecialist: 'Любой специалист',
    today: 'Сегодня',
    tomorrow: 'Завтра',
    errorOccurred: 'Произошла ошибка',
    tryAgain: 'Попробуйте снова',
    alreadyBooked: 'У вас уже есть бронь на это время',
    servicesSelected: 'услуг выбрано',
    addService: 'Добавить услугу',
    change: 'Изменить',
    remove: 'Удалить',
    selectSpecialist: 'Выберите специалиста',
    addMoreServices: 'Добавить услугу',
  },
};

const DAY_NAMES_SHORT: Record<Locale, string[]> = {
  uz: ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'],
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
};

const MONTH_NAMES: Record<Locale, string[]> = {
  uz: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
  ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
};

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

// Session storage helpers for surviving Next.js revalidation remounts
const BOOKING_STATE_KEY = 'blyss_booking_state';

interface SavedBookingState {
  step: Step;
  selectedDate: string;
  availableSlots: number[];
  selectedTime: number | null;
  selectedServiceIds: string[];
  serviceEmployees: ServiceSlotData[];
  selectedEmployees: Record<string, string | null>;
  isAuthenticated: boolean;
  phoneNumber: string;
  businessId: string;
}

function loadBookingState(businessId: string): SavedBookingState | null {
  try {
    const raw = sessionStorage.getItem(BOOKING_STATE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as SavedBookingState;
    if (state.businessId !== businessId) return null;
    return state;
  } catch { return null; }
}

function saveBookingState(state: SavedBookingState) {
  try { sessionStorage.setItem(BOOKING_STATE_KEY, JSON.stringify(state)); } catch {}
}

function clearBookingState() {
  try { sessionStorage.removeItem(BOOKING_STATE_KEY); } catch {}
}

export function BookingPage({ businessId, businessName, businessPhone, services, allServices, tenantSlug, locale, savedPhone }: BookingPageProps) {
  const router = useRouter();
  const t = UI[locale];

  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<number[]>([]);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(services.map(s => s.id));
  const [serviceEmployees, setServiceEmployees] = useState<ServiceSlotData[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Record<string, string | null>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(savedPhone || '');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDeliveryMethod, setOtpDeliveryMethod] = useState<'sms' | 'telegram' | null>(null);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingResult, setBookingResult] = useState<Record<string, unknown> | null>(null);
  const [showEmployeeSheet, setShowEmployeeSheet] = useState(false);
  const [showAddServiceSheet, setShowAddServiceSheet] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const restoredRef = useRef(false);

  const dateScrollRef = useRef<HTMLDivElement>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const isPopStateRef = useRef(false);
  const dates = generateNext30Days();

  // Restore state from sessionStorage on mount (survives Next.js revalidation remounts)
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = loadBookingState(businessId);
    if (saved && saved.step !== 'date') {
      setStep(saved.step);
      setSelectedDate(saved.selectedDate);
      setAvailableSlots(saved.availableSlots);
      setSelectedTime(saved.selectedTime);
      setSelectedServiceIds(saved.selectedServiceIds);
      setServiceEmployees(saved.serviceEmployees);
      setSelectedEmployees(saved.selectedEmployees);
      setIsAuthenticated(saved.isAuthenticated);
      if (saved.phoneNumber) setPhoneNumber(saved.phoneNumber);
    }
  }, [businessId]);

  // Save state to sessionStorage on step changes
  useEffect(() => {
    if (step === 'success') {
      clearBookingState();
      return;
    }
    saveBookingState({
      step,
      selectedDate,
      availableSlots,
      selectedTime,
      selectedServiceIds,
      serviceEmployees,
      selectedEmployees,
      isAuthenticated,
      phoneNumber,
      businessId,
    });
  }, [step, selectedDate, availableSlots, selectedTime, selectedServiceIds, serviceEmployees, selectedEmployees, isAuthenticated, phoneNumber, businessId]);

  const validSteps: Step[] = ['date', 'time', 'services', 'phone', 'confirm', 'success'];

  // Sync step → URL (pushState when step changes programmatically)
  useEffect(() => {
    if (isPopStateRef.current) {
      isPopStateRef.current = false;
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('step', step);
    if (step === 'date') {
      window.history.replaceState({ step }, '', url.toString());
    } else {
      window.history.pushState({ step }, '', url.toString());
    }
  }, [step]);

  // Listen for browser back/forward → sync URL to step
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlStep = params.get('step') as Step;
      if (urlStep && validSteps.includes(urlStep)) {
        isPopStateRef.current = true;
        setError('');
        setStep(urlStep);
      } else {
        // No step param → user went back past the booking page
        router.push(`/${locale}`);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

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

  // Lock body scroll when sheets are open
  useEffect(() => {
    const isOpen = showEmployeeSheet || showAddServiceSheet;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showEmployeeSheet, showAddServiceSheet]);

  // Check auth on mount
  useEffect(() => {
    getAuthStatus().then(res => setIsAuthenticated(res.authenticated));
  }, []);

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setOtpCooldown(prev => {
          if (prev <= 1) {
            clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(cooldownRef.current);
    }
  }, [otpCooldown]);

  const fetchSlotsAndEmployees = async (serviceIds: string[], date: string, time: number | null) => {
    setLoading(true);
    try {
      const slotsResult = await getAvailableSlots(businessId, date, serviceIds);
      const newSlots = slotsResult?.available_start_times || [];
      setAvailableSlots(newSlots);

      // If the currently selected time is no longer available, bump back to time step
      if (time !== null && !newSlots.includes(time)) {
        setSelectedTime(null);
        setStep('time');
        return false;
      }

      // If we have a valid time, fetch employees too
      if (time !== null) {
        const empResult = await getSlotEmployees(businessId, date, serviceIds, time);
        if (empResult?.services) {
          setServiceEmployees(empResult.services);
          // Auto-select first employee for new services, keep existing selections
          const defaults: Record<string, string | null> = {};
          for (const svc of empResult.services) {
            if (selectedEmployees[svc.service_id] !== undefined) {
              // Check if previously selected employee is still available
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
      return true;
    } catch {
      setError(t.errorOccurred);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = async (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setAvailableSlots([]);
    setError('');
    setLoading(true);

    try {
      const result = await getAvailableSlots(businessId, dateStr, selectedServiceIds);
      if (result?.available_start_times) {
        setAvailableSlots(result.available_start_times);
      }
      setStep('time');
    } catch {
      setError(t.errorOccurred);
    } finally {
      setLoading(false);
    }
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
      setStep('services');
    } catch {
      setError(t.errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (serviceId: string) => {
    const newIds = [...selectedServiceIds, serviceId];
    setSelectedServiceIds(newIds);
    setShowAddServiceSheet(false);
    setError('');

    const ok = await fetchSlotsAndEmployees(newIds, selectedDate, selectedTime);
    if (ok && step === 'services') {
      // Stay on services step, data is updated
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

    // Re-fetch employees for updated service list
    if (selectedTime !== null) {
      setLoading(true);
      try {
        const empResult = await getSlotEmployees(businessId, selectedDate, newIds, selectedTime);
        if (empResult?.services) {
          setServiceEmployees(empResult.services);
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

  const handleServicesConfirm = () => {
    if (isAuthenticated) {
      setStep('confirm');
    } else {
      setStep('phone');
    }
  };

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 12) return;
    setError('');
    setLoading(true);

    try {
      const result = await sendOtp(phoneNumber);
      if (result.success) {
        setOtpSent(true);
        setOtpDeliveryMethod((result.delivery_method as 'sms' | 'telegram') || 'sms');
        setOtpCooldown(60);
      } else {
        setError(result.error || t.errorOccurred);
        if (result.wait_seconds) setOtpCooldown(result.wait_seconds);
      }
    } catch {
      setError(t.errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 5) return;
    setError('');
    setLoading(true);

    try {
      const result = await verifyOtp(phoneNumber, parseInt(otpCode));
      if (result.success) {
        // Save phone in cookie for future pre-fill (client-side to avoid server action revalidation)
        const isProduction = window.location.hostname.endsWith('.blyss.uz');
        const domain = isProduction ? '; domain=.blyss.uz' : '';
        const secure = isProduction ? '; Secure' : '';
        document.cookie = `blyss_phone=${phoneNumber}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Strict${domain}${secure}`;
        setIsAuthenticated(true);
        setStep('confirm');
      } else {
        setError(result.error || t.errorOccurred);
      }
    } catch {
      setError(t.errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedTime) return;
    setError('');
    setLoading(true);

    try {
      const bookingServices = selectedServiceIds.map(sid => ({
        service_id: sid,
        employee_id: selectedEmployees[sid] || null,
      }));

      const result = await createBooking(businessId, selectedDate, selectedTime, bookingServices);

      if (result.success) {
        setBookingResult(result.booking as Record<string, unknown>);
        setStep('success');
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
  };

  const goBack = () => {
    setError('');
    if (step === 'date') {
      router.push(`/${locale}`);
    } else {
      window.history.back();
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'date': return t.selectDate;
      case 'time': return t.selectTime;
      case 'services': return t.servicesReview;
      case 'phone': return t.phoneVerify;
      case 'confirm': return t.confirm;
      case 'success': return t.success;
    }
  };

  const stepOrder = ['date', 'time', 'services', 'phone', 'confirm'];
  const currentStepIdx = stepOrder.indexOf(step);

  // Compute total from employee prices (if available) or service base prices
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

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* Header */}
      {step !== 'success' && (
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-30">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <ChevronLeft size={20} className="text-zinc-900 dark:text-zinc-100" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{getStepTitle()}</h1>
              <p className="text-xs text-zinc-500">{businessName}</p>
            </div>
          </div>
          {/* Step progress */}
          <div className="max-w-2xl mx-auto px-4 pb-2">
            <div className="flex gap-1">
              {stepOrder.map((s, i) => (
                <div key={s} className={`h-1 flex-1 rounded-full ${i <= currentStepIdx ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="max-w-2xl mx-auto px-4 pt-3">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ===== DATE STEP ===== */}
        {step === 'date' && (
          <div>
            {/* Services summary */}
            <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{currentServices.length} {t.servicesSelected}</p>
              {currentServices.map(s => (
                <div key={s.id} className="flex justify-between py-1">
                  <span className="text-sm text-zinc-900 dark:text-zinc-100">{getText(s.name)}</span>
                  <span className="text-sm text-zinc-500">{formatPrice(s.price)} {t.sum}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-700">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.total}</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatPrice(currentServices.reduce((sum, s) => sum + s.price, 0))} {t.sum} &middot; {formatDuration(currentServices.reduce((sum, s) => sum + s.duration_minutes, 0))}
                </span>
              </div>
            </div>

            {/* Date strip */}
            <div ref={dateScrollRef} className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
              {dates.map((date, idx) => {
                const dateStr = formatDateYMD(date);
                const isSelected = selectedDate === dateStr;
                const isToday = idx === 0;
                const isTomorrow = idx === 1;

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDateSelect(dateStr)}
                    className={`flex-shrink-0 flex flex-col items-center w-16 py-3 rounded-xl transition-all ${isSelected
                      ? 'bg-primary text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <span className={`text-[10px] font-medium ${isSelected ? 'text-white/70' : 'text-zinc-500'}`}>
                      {isToday ? t.today : isTomorrow ? t.tomorrow : DAY_NAMES_SHORT[locale][date.getDay()]}
                    </span>
                    <span className="text-xl font-bold mt-0.5">{date.getDate()}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-zinc-500'}`}>
                      {MONTH_NAMES[locale][date.getMonth()]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== TIME STEP ===== */}
        {step === 'time' && (
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              <Calendar size={14} className="inline mr-1" />
              {selectedDate}
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-primary" />
                <span className="ml-2 text-sm text-zinc-500">{t.loading}</span>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-20">
                <Clock size={40} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
                <p className="text-zinc-500 text-sm">{t.noSlots}</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${selectedTime === time
                      ? 'bg-primary text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {secondsToTime(time)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== SERVICES REVIEW STEP ===== */}
        {step === 'services' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Date & time summary */}
                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <Calendar size={16} className="text-primary" />
                  <span className="text-sm text-zinc-900 dark:text-zinc-100">{selectedDate}</span>
                  <span className="text-zinc-300 dark:text-zinc-600">&middot;</span>
                  <Clock size={16} className="text-primary" />
                  <span className="text-sm text-zinc-900 dark:text-zinc-100">{selectedTime !== null ? secondsToTime(selectedTime) : ''}</span>
                </div>

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
                    <div key={serviceId} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {getText(service.name)}
                          </h4>
                          <p className="text-xs text-zinc-500 mt-1">
                            {formatDuration(duration)} &middot; {formatPrice(price)} {t.sum}
                          </p>
                        </div>
                        {selectedServiceIds.length > 1 && (
                          <button
                            onClick={() => handleRemoveService(serviceId)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {/* Employee row */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                            <User size={14} className="text-zinc-500" />
                          </div>
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">{empName}</span>
                        </div>
                        {svcData && svcData.employees && svcData.employees.length > 1 && (
                          <button
                            onClick={() => openEmployeeSheet(serviceId)}
                            className="text-xs font-medium text-primary"
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
                    className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:border-primary hover:text-primary transition-colors"
                  >
                    <Plus size={16} />
                    {t.addService}
                  </button>
                )}

                {/* Total */}
                <div className="flex justify-between items-center p-4 bg-primary/5 rounded-xl">
                  <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t.total}</span>
                  <span className="text-base font-bold text-primary">
                    {formatPrice(totalPrice)} {t.sum}
                  </span>
                </div>

                {/* Continue button */}
                <button
                  onClick={handleServicesConfirm}
                  className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-sm"
                >
                  {t.next}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== PHONE VERIFICATION STEP ===== */}
        {step === 'phone' && (
          <div className="max-w-sm mx-auto">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone size={28} className="text-primary" />
              </div>
            </div>

            {!otpSent ? (
              <>
                <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-6">{t.enterPhone}</p>
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">+</span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder={t.phoneFormat}
                    className="w-full pl-8 pr-4 py-3.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSendOtp}
                  disabled={phoneNumber.length !== 12 || loading}
                  className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {t.sendCode}
                </button>
              </>
            ) : (
              <>
                <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                  {otpDeliveryMethod === 'telegram' ? t.codeSentViaTelegram : t.codeSentViaSms}
                </p>
                <p className="text-center text-xs text-zinc-400 mb-6">+{phoneNumber}</p>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="00000"
                  className="w-full text-center text-2xl tracking-[0.3em] py-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                  autoFocus
                />
                <button
                  onClick={handleVerifyOtp}
                  disabled={otpCode.length !== 5 || loading}
                  className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {t.verifyCode}
                </button>
                {otpCooldown > 0 ? (
                  <p className="text-center text-xs text-zinc-400">
                    {t.waitSeconds.replace('{{s}}', String(otpCooldown))}
                  </p>
                ) : (
                  <button onClick={handleSendOtp} className="w-full text-center text-xs text-primary font-medium">
                    {t.sendCode}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== CONFIRM STEP ===== */}
        {step === 'confirm' && selectedTime !== null && (
          <div>
            <div className="space-y-3 mb-6">
              {/* Date & Time */}
              <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <Calendar size={18} className="text-primary" />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedDate}</p>
                  <p className="text-xs text-zinc-500">{secondsToTime(selectedTime)}</p>
                </div>
              </div>

              {/* Services with employees */}
              {serviceEmployees.filter(svc => selectedServiceIds.includes(svc.service_id)).map(svc => {
                const emp = svc.employees?.find(e => e.id === selectedEmployees[svc.service_id]);
                const empName = emp ? [emp.first_name, emp.last_name].filter(Boolean).join(' ') : t.anySpecialist;
                const price = emp?.price ?? allServices.find(s => s.id === svc.service_id)?.price ?? 0;
                const duration = emp?.duration_minutes ?? allServices.find(s => s.id === svc.service_id)?.duration_minutes ?? 0;

                return (
                  <div key={svc.service_id} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{getText(svc.name)}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          <User size={12} className="inline mr-1" />{empName} &middot; {formatDuration(duration)}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatPrice(price)} {t.sum}</p>
                    </div>
                  </div>
                );
              })}

              {/* Total */}
              <div className="flex justify-between items-center p-4 bg-primary/5 rounded-xl">
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t.total}</span>
                <span className="text-base font-bold text-primary">
                  {formatPrice(totalPrice)} {t.sum}
                </span>
              </div>
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {t.bookNow}
            </button>
          </div>
        )}

        {/* ===== SUCCESS STEP ===== */}
        {step === 'success' && (
          <div className="text-center pt-12">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6 animate-scaleIn">
              <Check size={36} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{t.bookingConfirmed}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">{businessName}</p>

            {bookingResult && (
              <div className="text-left space-y-3 mb-8">
                <div className="flex justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <span className="text-sm text-zinc-500">{t.date}</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{(bookingResult as Record<string, unknown>).booking_date as string}</span>
                </div>
                {selectedTime !== null && (
                  <div className="flex justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                    <span className="text-sm text-zinc-500">{t.time}</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{secondsToTime(selectedTime)}</span>
                  </div>
                )}
                <div className="flex justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <span className="text-sm text-zinc-500">{t.total}</span>
                  <span className="text-sm font-bold text-primary">{formatPrice((bookingResult as Record<string, unknown>).total_price as number)} {t.sum}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => router.push(`/${locale}`)}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-sm"
            >
              {t.backToBusiness}
            </button>
          </div>
        )}
      </div>

      {/* ===== EMPLOYEE SELECTION BOTTOM SHEET ===== */}
      {showEmployeeSheet && editingServiceId && (
        <div
          className="fixed inset-0 bg-black/50 z-50 animate-fadeIn"
          onClick={() => { setShowEmployeeSheet(false); setEditingServiceId(null); }}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-3xl max-h-[70vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-zinc-900 px-4 pt-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t.selectSpecialist}</h3>
                <button
                  onClick={() => { setShowEmployeeSheet(false); setEditingServiceId(null); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X size={18} className="text-zinc-500" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2 pb-8">
              {(() => {
                const svcData = serviceEmployees.find(s => s.service_id === editingServiceId);
                if (!svcData?.employees) return null;

                return svcData.employees.map(emp => {
                  const isSelected = selectedEmployees[editingServiceId] === emp.id;
                  const empName = [emp.first_name, emp.last_name].filter(Boolean).join(' ') || t.anySpecialist;
                  return (
                    <button
                      key={emp.id}
                      onClick={() => selectEmployee(editingServiceId, emp.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${isSelected
                        ? 'border-2 border-primary bg-primary/5'
                        : 'border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                          <User size={18} className="text-zinc-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{empName}</p>
                          <p className="text-xs text-zinc-500">{formatDuration(emp.duration_minutes)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatPrice(emp.price)} {t.sum}</span>
                        {isSelected && <Check size={18} className="text-primary" />}
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
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-3xl max-h-[70vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-zinc-900 px-4 pt-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t.addMoreServices}</h3>
                <button
                  onClick={() => setShowAddServiceSheet(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X size={18} className="text-zinc-500" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2 pb-8">
              {remainingServices.map(service => (
                <button
                  key={service.id}
                  onClick={() => handleAddService(service.id)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-primary transition-all"
                >
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{getText(service.name)}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{formatDuration(service.duration_minutes)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatPrice(service.price)} {t.sum}</span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plus size={16} className="text-primary" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
