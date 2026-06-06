import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | KA Jobs – Usage Guidelines & Conditions',
  description: 'Read the KA Jobs terms of service. Understand the rules, conditions and guidelines for using our job portal as a candidate or employer in India.',
  keywords: 'KA Jobs terms of service, terms and conditions, job portal terms, user agreement, candidate terms, employer terms, usage policy India',
  openGraph: {
    title: 'Terms of Service | KA Jobs',
    description: 'Understand the rules and conditions for using the KA Jobs platform.',
    type: 'website',
    url: 'https://kajobs.in/terms-of-service',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
