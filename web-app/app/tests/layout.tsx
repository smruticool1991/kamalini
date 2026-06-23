import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tests & Assessments | KA Jobs',
  description: 'Take skill assessments and aptitude tests on KA Jobs to showcase your abilities to employers.',
  robots: { index: true, follow: true },
};

export default function TestsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
