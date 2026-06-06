import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/profile',
          '/profile/',
          '/api/',
          '/_next/',
          '/admin/',
          '/*.json$',
        ],
      },
      {
        // Block AI scrapers
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'CCBot',
          'anthropic-ai',
          'Claude-Web',
          'Google-Extended',
        ],
        disallow: '/',
      },
    ],
    sitemap: 'https://kajobs.in/sitemap.xml',
    host: 'https://kajobs.in',
  };
}
