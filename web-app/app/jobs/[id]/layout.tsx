import type { Metadata } from 'next';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { extractId, generateJobUrl } from '@/lib/slug';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const actualId = extractId(id);

  try {
    const snap = await getDoc(doc(db, 'jobs', actualId));
    if (snap.exists()) {
      const job = snap.data();
      const title = `${job.title} at ${job.company}${job.location ? ` – ${job.location}` : ''} | KA Jobs`;
      const description = `Apply for ${job.title} at ${job.company}${job.location ? ` in ${job.location}` : ''}. ${job.jobType ? `${job.jobType} position.` : ''} ${job.experience ? `Experience: ${job.experience}.` : ''} Find and apply for the best jobs in India on KA Jobs.`;
      const keywords = [
        job.title, job.company, job.location, job.category, job.jobType,
        'jobs India', 'apply online', 'job opening', 'KA Jobs',
      ].filter(Boolean).join(', ');
      
      const canonicalUrl = `https://kajobs.in${generateJobUrl(actualId, job.title)}`;

      return {
        title,
        description,
        keywords,
        openGraph: {
          title,
          description,
          type: 'website',
          url: canonicalUrl,
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
        },
        alternates: { canonical: canonicalUrl },
      };
    }
  } catch (_) {}

  return {
    title: 'Job Opening | KA Jobs – Find & Apply for Jobs in India',
    description: 'View this job opening and apply directly on KA Jobs. Search thousands of job opportunities across India.',
    keywords: 'job opening India, apply for job, job vacancy, KA Jobs',
  };
}

export default function JobLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
