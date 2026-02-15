import type { Metadata } from 'next';
import type { Locale } from '@/lib/i18n';
import { isValidLocale, DEFAULT_LOCALE } from '@/lib/i18n';
import { Navbar } from "../components/layout/Navbar";
import { HeroSection } from "../components/hero/HeroSection";
import { GradientBlobs } from "../components/hero/GradientBlobs";
import { ForBusinessSection } from "../components/business/ForBusinessSection";
import { BrowseByCitySection } from "../components/browse/BrowseByCitySection";
import { NearestBusinesses } from "../components/venues/NearestBusinesses";

const SITE_URL = 'https://blyss.uz';

const OG_LOCALE_MAP: Record<Locale, string> = {
  ru: 'ru_RU',
  uz: 'uz_UZ',
};

const META: Record<Locale, { title: string; description: string; ogTitle: string; ogDescription: string; twitterTitle: string; twitterDescription: string; ogImageAlt: string }> = {
  ru: {
    title: 'Blyss — Онлайн-запись в салоны красоты Узбекистана',
    description: 'Найдите и запишитесь к лучшим мастерам Узбекистана — салоны красоты, барбершопы, спа. Откройте в Telegram — без скачивания.',
    ogTitle: 'Blyss — Онлайн-запись в салоны красоты',
    ogDescription: 'Откройте в Telegram — запишитесь к лучшим мастерам Узбекистана. Салоны красоты, барбершопы, спа и велнес-студии.',
    twitterTitle: 'Blyss — Онлайн-запись в салоны красоты',
    twitterDescription: 'Запишитесь в салон через Telegram. Салоны красоты, барбершопы, спа — Узбекистан.',
    ogImageAlt: 'Blyss — Платформа для онлайн-записи в салоны красоты',
  },
  uz: {
    title: 'Blyss — O\'zbekistonda go\'zallik xizmatlariga onlayn yozilish',
    description: 'O\'zbekistondagi eng yaxshi salonlar, sartaroshxonalar, spa va velnes studiyalarni toping va onlayn yoziling. Telegram orqali oching — yuklab olish shart emas.',
    ogTitle: 'Blyss — Go\'zallik xizmatlariga onlayn yozilish',
    ogDescription: 'Telegram orqali oching — eng yaxshi ustalarga yoziling. Salonlar, sartaroshxonalar, spa va velnes studiyalari.',
    twitterTitle: 'Blyss — Go\'zallik xizmatlariga onlayn yozilish',
    twitterDescription: 'Telegram orqali salonga yoziling. Salonlar, sartaroshxonalar, spa — O\'zbekiston.',
    ogImageAlt: 'Blyss — Go\'zallik xizmatlari platformasi',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = isValidLocale(localeParam) ? localeParam : DEFAULT_LOCALE;
  const m = META[locale];

  return {
    title: { absolute: m.title },
    description: m.description,
    openGraph: {
      type: 'website',
      locale: OG_LOCALE_MAP[locale],
      alternateLocale: Object.entries(OG_LOCALE_MAP)
        .filter(([l]) => l !== locale)
        .map(([, v]) => v),
      url: `${SITE_URL}/${locale}`,
      siteName: 'Blyss',
      title: m.ogTitle,
      description: m.ogDescription,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: m.ogImageAlt,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: m.twitterTitle,
      description: m.twitterDescription,
      images: ['/og-image.png'],
      creator: '@blyssuz',
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        'ru': `${SITE_URL}/ru`,
        'uz': `${SITE_URL}/uz`,
      },
    },
  };
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Blyss',
  url: 'https://blyss.uz',
  description:
    'Online booking platform for beauty and wellness services in Uzbekistan. Book salons, barbers, spas, and wellness studios.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, Telegram',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'UZS',
  },
  areaServed: {
    '@type': 'Country',
    name: 'Uzbekistan',
  },
  provider: {
    '@type': 'Organization',
    name: 'Blyss',
    url: 'https://blyss.uz',
    logo: 'https://blyss.uz/icon-512.png',
    sameAs: [
      'https://t.me/blyssuz',
    ],
  },
  inLanguage: ['ru', 'uz'],
};

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isValidLocale(localeParam) ? localeParam : DEFAULT_LOCALE;

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950 text-black dark:text-gray-100 overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <GradientBlobs />

      <div className="relative z-[1]">
        <Navbar />

        <main>
          <HeroSection />

          <NearestBusinesses />

          <ForBusinessSection />

          <BrowseByCitySection />
        </main>
      </div>
    </div>
  );
}
