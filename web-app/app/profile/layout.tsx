import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile | Manage Your Career Profile – KA Jobs',
  description: 'View and manage your candidate profile on KA Jobs. Update your skills, work experience, education and job preferences to get matched with the best opportunities in India.',
  keywords: 'my profile KA Jobs, candidate profile, job seeker profile, update resume, career profile India, job profile management',
  robots: {
    index: false,  // Profile pages should not be indexed
    follow: false,
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
