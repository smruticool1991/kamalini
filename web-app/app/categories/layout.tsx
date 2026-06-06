import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Jobs by Category | IT, Sales, Marketing & More – KA Jobs',
  description: 'Explore job opportunities across all categories in India – IT, sales, marketing, healthcare, education, engineering, finance and more. Find the right career category for you.',
  keywords: 'job categories India, IT jobs, sales jobs India, marketing jobs, healthcare jobs, engineering jobs, finance jobs, teaching jobs, government jobs categories, job types India',
  openGraph: {
    title: 'Browse Jobs by Category | KA Jobs',
    description: 'Explore job opportunities across all categories in India – IT, sales, marketing, healthcare, engineering and more.',
    type: 'website',
    url: 'https://kajobs.in/categories',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Jobs by Category | KA Jobs',
    description: 'Explore job opportunities across all categories in India.',
  },
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
