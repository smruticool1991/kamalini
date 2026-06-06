import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Jobs in India | Search Latest Job Openings – KA Jobs',
  description: 'Browse thousands of job openings across India. Search by location, experience, salary and category. Apply to top companies in IT, sales, marketing, engineering, healthcare and more.',
  keywords: 'find jobs India, job search, job openings India, latest jobs, jobs near me, fresher jobs, IT jobs, sales jobs, engineering jobs, marketing jobs, government jobs, private jobs India',
  openGraph: {
    title: 'Find Jobs in India | KA Jobs',
    description: 'Search thousands of job openings across India. Find the perfect job by location, industry and experience.',
    type: 'website',
    url: 'https://kajobs.in/find-jobs',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Jobs in India | KA Jobs',
    description: 'Search thousands of job openings across India. Apply to top companies instantly.',
  },
};

export default function FindJobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
