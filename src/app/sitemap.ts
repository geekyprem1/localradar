import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '',
    '/about',
    '/contact',
    '/login',
    '/signup',
    '/privacy',
    '/terms',
    '/cookies',
    '/refund',
    '/acceptable-use',
    '/security-policy',
    '/ai-usage',
    '/subprocessors',
    '/demo',
    '/status',
    '/blog',
    '/roadmap',
  ];

  return paths.map((path) => ({
    url: `${SITE_URL}${path || '/'}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path.startsWith('/login') || path.startsWith('/signup') ? 0.7 : 0.5,
  }));
}
