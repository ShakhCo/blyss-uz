import type { Locale } from './i18n'

const translations = {
  hero: {
    title: {
      ru: 'Запишитесь к лучшим мастерам',
      uz: 'Eng yaxshi ustalarga yoziling',
    },
    subtitle: {
      ru: 'Найдите и запишитесь к мастерам красоты рядом с вами',
      uz: 'Yaqiningizdagi go\'zallik ustalarini toping va yoziling',
    },
  },
  search: {
    treatments: {
      ru: 'Все услуги и салоны',
      uz: 'Barcha xizmatlar va salonlar',
    },
    location: {
      ru: 'Текущее местоположение',
      uz: 'Joriy joylashuv',
    },
    button: {
      ru: 'Найти',
      uz: 'Qidirish',
    },
  },
  venues: {
    recentlyViewed: {
      ru: 'Недавно просмотренные',
      uz: 'Yaqinda ko\'rilgan',
    },
    recommended: {
      ru: 'Рекомендуемые',
      uz: 'Tavsiya etilgan',
    },
    newToBlyss: {
      ru: 'Новые на Blyss',
      uz: 'Blyss\'da yangi',
    },
    trending: {
      ru: 'Популярные',
      uz: 'Ommabop',
    },
    nearest: {
      ru: 'Рядом с вами',
      uz: 'Sizga yaqin',
    },
  },
  business: {
    title: {
      ru: 'Blyss для бизнеса',
      uz: 'Blyss biznes uchun',
    },
    description: {
      ru: 'Управляйте записями, календарём, оплатами и взаимоотношениями с клиентами на одной платформе. Развивайте свой бизнес с удобными инструментами Blyss.',
      uz: 'Buyurtmalar, taqvim, to\'lovlar va mijozlar bilan munosabatlarni bitta platformada boshqaring. Blyss\'ning qulay vositalari bilan biznesingizni rivojlantiring.',
    },
    cta: {
      ru: 'Узнать больше',
      uz: 'Batafsil',
    },
    days: {
      ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
      uz: ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'],
    },
  },
  browse: {
    title: {
      ru: 'Поиск по городам',
      uz: 'Shaharlar bo\'yicha qidirish',
    },
    inCity: {
      ru: 'в',
      uz: '',
    },
  },
} as const

export default translations
