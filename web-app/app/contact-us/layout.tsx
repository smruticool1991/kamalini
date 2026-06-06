import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Get in Touch with KA Jobs Support Team',
  description: 'Have a question or need help? Contact the KA Jobs team for support with job applications, employer inquiries, technical issues or partnership opportunities.',
  keywords: 'contact KA Jobs, job portal support, contact us, help center, employer support, candidate support, KA Jobs helpline, job board contact',
  openGraph: {
    title: 'Contact Us | KA Jobs',
    description: 'Get in touch with the KA Jobs team for support, employer inquiries or partnership opportunities.',
    type: 'website',
    url: 'https://kajobs.in/contact-us',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us | KA Jobs',
    description: 'Get in touch with the KA Jobs team for support, employer inquiries or partnership opportunities.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
