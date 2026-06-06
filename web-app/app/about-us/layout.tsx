import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | KA Jobs – Connecting India\'s Workforce',
  description: 'Learn about KA Jobs – India\'s trusted job portal connecting candidates with top employers across industries. Discover our mission, vision, and how we help you find the right job.',
  keywords: 'about KA Jobs, job portal India, about us, job board, employment platform, career opportunities India, job search India',
  openGraph: {
    title: 'About Us | KA Jobs',
    description: 'KA Jobs connects Indian job seekers with top companies. Learn about our mission to simplify hiring and help candidates build careers.',
    type: 'website',
    url: 'https://kajobs.in/about-us',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us | KA Jobs',
    description: 'KA Jobs connects Indian job seekers with top companies. Learn about our mission.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
