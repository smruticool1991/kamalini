import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Training & Skill Development Courses in India | KA Jobs',
  description: 'Explore job-oriented training programs and skill development courses in India. Upskill yourself with industry-relevant certifications and boost your career prospects on KA Jobs.',
  keywords: 'job training India, skill development, vocational training, online courses India, upskill, certification courses, career training, technical training, soft skills training India',
  openGraph: {
    title: 'Job Training & Skill Development | KA Jobs',
    description: 'Explore job-oriented training programs and skill development courses to boost your career in India.',
    type: 'website',
    url: 'https://kajobs.in/training',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Job Training & Skill Development | KA Jobs',
    description: 'Explore job-oriented training programs and skill development courses in India.',
  },
};

export default function TrainingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
