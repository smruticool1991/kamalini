import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | KA Jobs – How We Use Cookies',
  description: 'Learn how KA Jobs uses cookies and similar technologies to improve your browsing experience, personalize content and analyse site traffic.',
  keywords: 'KA Jobs cookie policy, cookies job portal, browser cookies, cookie consent India, website cookies policy',
  openGraph: {
    title: 'Cookie Policy | KA Jobs',
    description: 'Learn how KA Jobs uses cookies to improve your experience and personalise content.',
    type: 'website',
    url: 'https://kajobs.in/cookie-policy',
  },
};

export default function CookieLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
