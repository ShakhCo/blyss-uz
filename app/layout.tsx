import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { LocationProvider } from "@/lib/location-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = 'https://blyss.uz';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Blyss — Онлайн-запись в салоны красоты Узбекистана',
    template: '%s | Blyss',
  },
  description:
    'Найдите и запишитесь к лучшим мастерам Узбекистана — салоны красоты, барбершопы, спа. Откройте в Telegram — без скачивания.',
  keywords: [
    // English
    'book beauty services', 'beauty salon booking', 'wellness booking',
    'barber booking', 'spa booking', 'nail salon', 'hair salon',
    'beauty marketplace', 'Uzbekistan beauty', 'Tashkent salon',
    'online appointment', 'book appointment online', 'beauty near me',
    // Russian
    'запись в салон красоты', 'онлайн запись', 'барбершоп',
    'салон красоты Ташкент', 'запись к мастеру', 'маникюр запись',
    'массаж запись', 'спа Ташкент', 'велнес Узбекистан',
    'записаться онлайн', 'салон красоты рядом', 'парикмахерская Ташкент',
    'педикюр', 'косметолог', 'стрижка онлайн запись',
    // Uzbek
    'go\'zallik saloni', 'onlayn yozilish', 'sartaroshxona',
    'Toshkent salon', 'massaj', 'spa xizmatlari',
    'soch turmaklash', 'manikur', 'pedikur', 'kosmetolog',
    'go\'zallik xizmatlari', 'navbatga yozilish', 'salon band qilish',
    'yaqin atrofdagi salon', 'Toshkent sartaroshxona', 'onlayn band qilish',
    // Brand
    'blyss', 'blyss.uz', 'blyss telegram',
  ],
  authors: [{ name: 'Blyss', url: SITE_URL }],
  creator: 'Blyss',
  publisher: 'Blyss',
  applicationName: 'Blyss',
  category: 'Beauty & Wellness',
  classification: 'Business',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    alternateLocale: ['uz_UZ'],
    url: SITE_URL,
    siteName: 'Blyss',
    title: 'Blyss — Онлайн-запись в салоны красоты Узбекистана',
    description:
      'Откройте в Telegram — запишитесь к лучшим мастерам Узбекистана. Салоны красоты, барбершопы, спа и велнес-студии.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Blyss — Платформа для онлайн-записи в салоны красоты',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blyss — Онлайн-запись в салоны красоты',
    description:
      'Запишитесь в салон через Telegram. Салоны красоты, барбершопы, спа — Узбекистан.',
    images: ['/og-image.png'],
    creator: '@blyssuz',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: `${SITE_URL}/ru`,
    languages: {
      'ru': `${SITE_URL}/ru`,
      'uz': `${SITE_URL}/uz`,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var p=new URLSearchParams(window.location.search).get('colorScheme');var s=p==='light'||p==='dark'?p:window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.setAttribute('data-color-scheme',s)}catch(e){}})()` }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <LocationProvider>{children}</LocationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
