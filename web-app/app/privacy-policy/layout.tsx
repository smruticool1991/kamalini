import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | KA Jobs – How We Protect Your Data',
  description: 'Read KA Jobs\' privacy policy to understand how we collect, use and protect your personal information. Your data security and privacy are our top priority.',
  keywords: 'KA Jobs privacy policy, data protection, personal data India, privacy policy job portal, user data security, GDPR compliance India',
  openGraph: {
    title: 'Privacy Policy | KA Jobs',
    description: 'Read how KA Jobs collects, uses and protects your personal information.',
    type: 'website',
    url: 'https://kajobs.in/privacy-policy',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
