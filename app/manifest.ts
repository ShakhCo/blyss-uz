import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Blyss — Beauty & Wellness Booking | Онлайн-запись | Go\'zallik xizmatlari',
    short_name: 'Blyss',
    description:
      'Book beauty & wellness services across Uzbekistan. | Онлайн-запись в салоны красоты, барбершопы, спа. | Go\'zallik va sog\'lomlashtirish xizmatlarini onlayn band qiling.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait',
    categories: ['beauty', 'health', 'lifestyle', 'business'],
    lang: 'ru',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
