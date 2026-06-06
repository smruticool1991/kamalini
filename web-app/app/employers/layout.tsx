import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Top Employers Hiring in India | Companies & Job Openings – KA Jobs',
  description: 'Explore top employers and companies actively hiring in India. Browse company profiles, open positions and apply directly. Find your ideal workplace on KA Jobs.',
  keywords: 'top employers India, companies hiring India, job employers, best companies to work, hire in India, employer profiles, MNC jobs India, startup jobs, company job openings',
  openGraph: {
    title: 'Top Employers Hiring in India | KA Jobs',
    description: 'Explore top employers actively hiring in India. Browse company profiles and apply to open positions.',
    type: 'website',
    url: 'https://kajobs.in/employers',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top Employers Hiring in India | KA Jobs',
    description: 'Explore top employers actively hiring in India. Browse company profiles and apply.',
  },
};

export default function EmployersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
