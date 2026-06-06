import type { MetadataRoute } from 'next';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateBlogUrl, generateJobUrl } from '@/lib/slug';
import { BLOG_POSTS } from '@/lib/blogData';

const BASE_URL = 'https://kajobs.in';

export const revalidate = 3600; // Regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Static pages ──────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/find-jobs`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/employers`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/categories`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/about-us`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/training`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/education`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/contact-us`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms-of-service`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cookie-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // ── Blog posts (dynamic SEO urls) ──────────────────────────────────────────
  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${BASE_URL}${generateBlogUrl(post.id, post.title)}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // ── Dynamic: Jobs from Firestore ───────────────────────────────────────────
  let jobPages: MetadataRoute.Sitemap = [];
  try {
    const jobsSnap = await getDocs(collection(db, 'jobs'));
    jobPages = jobsSnap.docs.map((doc) => {
      const data = doc.data();
      const lastMod = data.updatedAt
        ? new Date(data.updatedAt)
        : data.createdAt
        ? new Date(data.createdAt)
        : now;

      return {
        url: `${BASE_URL}${generateJobUrl(doc.id, data.title)}`,
        lastModified: isNaN(lastMod.getTime()) ? now : lastMod,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      };
    });
  } catch (err) {
    console.error('[Sitemap] Failed to fetch jobs:', err);
  }

  // ── Dynamic: Companies/Employers from Firestore ────────────────────────────
  let employerPages: MetadataRoute.Sitemap = [];
  try {
    const companiesSnap = await getDocs(collection(db, 'companies'));
    employerPages = companiesSnap.docs.map((doc) => {
      const data = doc.data();
      const lastMod = data.updatedAt
        ? new Date(data.updatedAt)
        : now;

      return {
        url: `${BASE_URL}/employers/${doc.id}`,
        lastModified: isNaN(lastMod.getTime()) ? now : lastMod,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      };
    });
  } catch (err) {
    console.error('[Sitemap] Failed to fetch companies:', err);
  }

  return [
    ...staticPages,
    ...blogPages,
    ...jobPages,
    ...employerPages,
  ];
}
