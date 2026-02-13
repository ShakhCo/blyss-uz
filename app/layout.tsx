import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";

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
    default: 'Blyss — Book Beauty & Wellness Services in Uzbekistan',
    template: '%s | Blyss',
  },
  description:
    'Blyss — платформа для онлайн-записи в салоны красоты, барбершопы, спа и велнес-студии Узбекистана. Найдите и забронируйте лучших мастеров рядом с вами через Telegram или веб-сайт.',
  keywords: [
    // English
    'book beauty services', 'beauty salon booking', 'wellness booking',
    'barber booking', 'spa booking', 'nail salon', 'hair salon',
    'beauty marketplace', 'Uzbekistan beauty', 'Tashkent salon',
    // Russian
    'запись в салон красоты', 'онлайн запись', 'барбершоп',
    'салон красоты Ташкент', 'запись к мастеру', 'маникюр запись',
    'массаж запись', 'спа Ташкент', 'велнес Узбекистан',
    // Uzbek
    'go\'zallik saloni', 'onlayn yozilish', 'sartaroshxona',
    'Toshkent salon', 'massaj', 'spa xizmatlari',
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
    locale: 'en_US',
    alternateLocale: ['ru_RU', 'uz_UZ'],
    url: SITE_URL,
    siteName: 'Blyss',
    title: 'Blyss — Book Beauty & Wellness Services in Uzbekistan',
    description:
      'Discover and book top-rated salons, barbers, spas and wellness studios trusted by thousands across Uzbekistan. No app download needed — open in Telegram.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Blyss — Beauty & Wellness Booking Platform',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blyss — Book Beauty & Wellness Services',
    description:
      'Discover and book top-rated salons, barbers, spas and wellness studios in Uzbekistan. Open in Telegram — no download needed.',
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
    canonical: SITE_URL,
    languages: {
      'en': SITE_URL,
      'ru': `${SITE_URL}/ru`,
      'uz': `${SITE_URL}/uz`,
    },
  },
  icons: {
    icon: '/favicon.ico',
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
