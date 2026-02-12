'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Clock,
  Check,
  User,
  Phone,
  Calendar,
  Loader2,
} from 'lucide-react';
import {
  getAvailableSlots,
  getSlotEmployees,
  sendOtp,
  verifyOtp,
  createBooking,
  getAuthStatus,
} from '../actions';

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
  employees: Employee[];
  tenantSlug: string;
}

type Step = 'date' | 'time' | 'employees' | 'phone' | 'confirm' | 'success';

const UI = {
  uz: {
    back: 'Orqaga',
    selectDate: 'Sanani tanlang',
    selectTime: 'Vaqtni tanlang',
    selectEmployee: 'Xodimni tanlang',
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
    waitSeconds: '{{s}} soniya kuting',
    bookingConfirmed: 'Buyurtmangiz tasdiqlandi!',
    bookingDetails: 'Tafsilotlar',
    backToBusiness: 'Biznesga qaytish',
    date: 'Sana',
    time: 'Vaqt',
    service: 'Xizmat',
    employee: 'Xodim',
    price: 'Narx',
    anyEmployee: 'Har qanday xodim',
    today: 'Bugun',
    tomorrow: 'Ertaga',
    errorOccurred: 'Xatolik yuz berdi',
    tryAgain: 'Qayta urinib ko\'ring',
    alreadyBooked: 'Siz allaqachon bu vaqtda band qilgansiz',
  },
  ru: {
    back: 'Назад',
    selectDate: 'Выберите дату',
    selectTime: 'Выберите время',
    selectEmployee: 'Выберите специалиста',
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
    waitSeconds: 'Подождите {{s}} сек',
    bookingConfirmed: 'Бронирование подтверждено!',
    bookingDetails: 'Детали',
    backToBusiness: 'Вернуться',
    date: 'Дата',
    time: 'Время',
    service: 'Услуга',
    employee: 'Специалист',
    price: 'Цена',
    anyEmployee: 'Любой специалист',
    today: 'Сегодня',
    tomorrow: 'Завтра',
    errorOccurred: 'Произошла ошибка',
    tryAgain: 'Попробуйте снова',
    alreadyBooked: 'У вас уже есть бронь на это время',
  },
};

const DAY_NAMES_SHORT: Record<Language, string[]> = {
  uz: ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'],
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
};

const MONTH_NAMES: Record<Language, string[]> = {
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

export function BookingPage({ businessId, businessName, businessPhone, services, tenantSlug }: BookingPageProps) {
  const router = useRouter();
  const [lang] = useState<Language>('uz');
  const t = UI[lang];

  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<number[]>([]);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [serviceEmployees, setServiceEmployees] = useState<ServiceSlotData[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Record<string, string | null>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingResult, setBookingResult] = useState<Record<string, unknown> | null>(null);

  const dateScrollRef = useRef<HTMLDivElement>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const dates = generateNext30Days();

  const getText = (text: MultilingualText | string | null | undefined): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    return text[lang] || text.uz || '';
  };

  const formatPrice = (price: number) => price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} ${t.minute}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} ${t.hour} ${mins} ${t.minute}` : `${hours} ${t.hour}`;
  };

  const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = services.reduce((sum, s) => sum + s.duration_minutes, 0);

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

  const handleDateSelect = async (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setAvailableSlots([]);
    setError('');
    setLoading(true);

    try {
      const serviceIds = services.map(s => s.id);
      const result = await getAvailableSlots(businessId, dateStr, serviceIds);

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
      const serviceIds = services.map(s => s.id);
      const result = await getSlotEmployees(businessId, selectedDate, serviceIds, time);

      if (result?.services) {
        setServiceEmployees(result.services);
        // Auto-select first employee for each service
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
      setStep('employees');
    } catch {
      setError(t.errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeesConfirm = () => {
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
      console.log(result)
      if (result.success) {
        setOtpSent(true);
        setOtpCooldown(60);
      } else {
        setError(result.error || t.errorOccurred);
        if (result.wait_seconds) setOtpCooldown(result.wait_seconds);
      }
    } catch (error) {
      console.log("error")
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
      const bookingServices = services.map(s => ({
        service_id: s.id,
        employee_id: selectedEmployees[s.id] || null,
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
    switch (step) {
      case 'time': setStep('date'); break;
      case 'employees': setStep('time'); break;
      case 'phone': setStep('employees'); break;
      case 'confirm': setStep(isAuthenticated ? 'employees' : 'phone'); break;
      default: router.push(`/`);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'date': return t.selectDate;
      case 'time': return t.selectTime;
      case 'employees': return t.selectEmployee;
      case 'phone': return t.phoneVerify;
      case 'confirm': return t.confirm;
      case 'success': return t.success;
    }
  };

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
              {['date', 'time', 'employees', 'phone', 'confirm'].map((s, i) => {
                const stepOrder = ['date', 'time', 'employees', isAuthenticated ? 'confirm' : 'phone', 'confirm'];
                const currentIdx = stepOrder.indexOf(step);
                return (
                  <div key={s} className={`h-1 flex-1 rounded-full ${i <= currentIdx ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                );
              })}
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
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{services.length} {lang === 'uz' ? 'xizmat tanlangan' : 'услуг выбрано'}</p>
              {services.map(s => (
                <div key={s.id} className="flex justify-between py-1">
                  <span className="text-sm text-zinc-900 dark:text-zinc-100">{getText(s.name)}</span>
                  <span className="text-sm text-zinc-500">{formatPrice(s.price)} {t.sum}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-700">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.total}</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatPrice(totalPrice)} {t.sum} &middot; {formatDuration(totalDuration)}</span>
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
                      {isToday ? t.today : isTomorrow ? t.tomorrow : DAY_NAMES_SHORT[lang][date.getDay()]}
                    </span>
                    <span className="text-xl font-bold mt-0.5">{date.getDate()}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-zinc-500'}`}>
                      {MONTH_NAMES[lang][date.getMonth()]}
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

        {/* ===== EMPLOYEES STEP ===== */}
        {step === 'employees' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {serviceEmployees.map(svc => (
                  <div key={svc.service_id}>
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                      {getText(svc.name)}
                      <span className="text-xs text-zinc-500 ml-2">{secondsToTime(svc.start_time)}</span>
                    </h3>

                    {svc.unavailable ? (
                      <p className="text-sm text-red-500">{svc.reason}</p>
                    ) : (
                      <div className="space-y-2">
                        {svc.employees.map(emp => {
                          const isSelected = selectedEmployees[svc.service_id] === emp.id;
                          const empName = [emp.first_name, emp.last_name].filter(Boolean).join(' ') || t.anyEmployee;
                          return (
                            <button
                              key={emp.id}
                              onClick={() => setSelectedEmployees(prev => ({ ...prev, [svc.service_id]: emp.id }))}
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
                        })}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={handleEmployeesConfirm}
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
                <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-2">{t.codeSent}</p>
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
              {serviceEmployees.map(svc => {
                const emp = svc.employees?.find(e => e.id === selectedEmployees[svc.service_id]);
                const empName = emp ? [emp.first_name, emp.last_name].filter(Boolean).join(' ') : t.anyEmployee;
                const price = emp?.price ?? services.find(s => s.id === svc.service_id)?.price ?? 0;
                const duration = emp?.duration_minutes ?? services.find(s => s.id === svc.service_id)?.duration_minutes ?? 0;

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
                  {formatPrice(serviceEmployees.reduce((sum, svc) => {
                    const emp = svc.employees?.find(e => e.id === selectedEmployees[svc.service_id]);
                    return sum + (emp?.price ?? services.find(s => s.id === svc.service_id)?.price ?? 0);
                  }, 0))} {t.sum}
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
              onClick={() => router.push(`/`)}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-sm"
            >
              {t.backToBusiness}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
