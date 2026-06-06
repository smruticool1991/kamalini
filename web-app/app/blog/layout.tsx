import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Career Tips & Job Search Advice | KA Jobs Blog',
  description: 'Read expert career advice, resume writing tips, interview preparation guides and job market insights on the KA Jobs blog. Stay ahead in your career journey.',
  keywords: 'career tips India, job search advice, resume tips, interview preparation, career guidance, job market India, career blog, employment tips, how to get a job India',
  openGraph: {
    title: 'Career Tips & Job Search Advice | KA Jobs Blog',
    description: 'Expert career advice, resume tips, interview preparation and job market insights for Indian job seekers.',
    type: 'website',
    url: 'https://kajobs.in/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Career Tips & Job Search Advice | KA Jobs Blog',
    description: 'Expert career advice, resume tips and job market insights for Indian job seekers.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
