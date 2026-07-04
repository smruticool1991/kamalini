import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Upgrade to Premium | KA Jobs',
  description: 'Compare candidate plans and upgrade your KA Jobs profile — priority visibility to recruiters, unlimited applications, and more.',
  robots: { index: false, follow: false },
};

export default function PlansLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
