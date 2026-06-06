import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Education & Higher Studies Guide for Job Seekers | KA Jobs',
  description: 'Discover education pathways, college programs and higher study options aligned with career goals. Find the right educational course to land your dream job in India.',
  keywords: 'education India, higher studies, college courses India, degree programs, career education, professional education, B.Tech, MBA, diploma courses, graduation India',
  openGraph: {
    title: 'Education & Higher Studies for Job Seekers | KA Jobs',
    description: 'Discover education pathways and college programs aligned with your career goals in India.',
    type: 'website',
    url: 'https://kajobs.in/education',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Education & Higher Studies | KA Jobs',
    description: 'Discover education pathways and college programs aligned with your career goals in India.',
  },
};

export default function EducationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
