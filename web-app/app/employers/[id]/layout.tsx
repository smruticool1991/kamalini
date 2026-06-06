import type { Metadata } from 'next';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const snap = await getDoc(doc(db, 'companies', id));
    if (snap.exists()) {
      const company = snap.data();
      const title = `${company.name} – Jobs, Reviews & Company Info | KA Jobs`;
      const description = `Explore ${company.name}${company.location ? ` in ${company.location}` : ''}. View open job positions, employee reviews, salary info, and company culture. Apply directly on KA Jobs.`;
      const keywords = [
        company.name, company.location, company.industry,
        `${company.name} jobs`, `${company.name} careers`, `${company.name} reviews`,
        'jobs India', 'employer profile', 'KA Jobs',
      ].filter(Boolean).join(', ');

      return {
        title,
        description,
        keywords,
        openGraph: {
          title,
          description,
          type: 'website',
          url: `https://kajobs.in/employers/${id}`,
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
        },
        alternates: { canonical: `https://kajobs.in/employers/${id}` },
      };
    }
  } catch (_) {}

  return {
    title: 'Company Profile | KA Jobs – Jobs, Reviews & Employer Info',
    description: 'View company profile, open job positions, and employee reviews on KA Jobs. Find the best companies to work for in India.',
    keywords: 'company profile India, employer jobs, company reviews, KA Jobs',
  };
}

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
