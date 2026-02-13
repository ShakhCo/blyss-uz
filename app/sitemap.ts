import type { MetadataRoute } from 'next';
import { signedFetch } from '@/lib/api';

const SITE_URL = 'https://blyss.uz';

interface Business {
  tenant_url: string;
  updated_at?: string;
}

async function getAllBusinesses(): Promise<Business[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await signedFetch(`${apiUrl}/public/businesses`, {
      cache: 'no-store',
    });

    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : data.businesses ?? [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // Dynamic business/tenant pages
  const businesses = await getAllBusinesses();
  const businessPages: MetadataRoute.Sitemap = businesses.map((b) => ({
    url: `https://${b.tenant_url}.blyss.uz`,
    lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...businessPages];
}
