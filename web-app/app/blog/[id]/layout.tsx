import type { Metadata } from 'next';
import { extractId, generateBlogUrl } from '@/lib/slug';

// Blog posts are static — define titles/descriptions here
const BLOG_META: Record<number, { title: string; description: string; keywords: string }> = {
  1:  { title: "The 9-to-5 Workday Doesn't Work Anymore", description: "The traditional workday is changing. Discover why flexible schedules are the future of work and how to adapt your career accordingly. Read on KA Jobs Blog.", keywords: "flexible work schedule, future of work, remote work India, work life balance, career advice India" },
  2:  { title: "3 Ways to Spot a Transparent Company During Your Job Search", description: "Transparency in the workplace matters more than ever. Learn the telltale signs of an open, honest company culture before you accept an offer.", keywords: "company culture, transparent company, job search tips, glassdoor reviews, workplace transparency India" },
  3:  { title: "KA Jobs Announces Awards for Best Places to Work 2025", description: "KA Jobs announces its annual Best Places to Work 2025 awards recognising employers who prioritise their people and build great cultures.", keywords: "best places to work India 2025, employer awards, top companies India, KA Jobs awards" },
  4:  { title: "How Does Writing Influence Your Personal Brand?", description: "Your professional writing shapes how the world perceives you. Learn how to build a strong personal brand through strategic writing on LinkedIn and beyond.", keywords: "personal branding, professional writing, LinkedIn India, career growth, personal brand building" },
  5:  { title: "How To Write Content That Gets You Hired", description: "Content creation skills are now a must-have across every industry. Discover how to showcase them effectively in your job applications and resume.", keywords: "resume writing tips, cover letter India, content creation jobs, job application tips, how to get hired" },
  6:  { title: "Where To Grow Your Career: Startup or Corporate?", description: "Startup vs corporate — which is better for your career growth? We break down the key differences to help you choose the right environment.", keywords: "startup vs corporate India, career growth, startup jobs India, corporate jobs, career choice" },
  7:  { title: "Caring Is The New Marketing — What HR Leaders Need to Know", description: "Employee wellbeing is now a competitive advantage. Here's how leading companies are making it central to their employer brand and recruitment strategy.", keywords: "HR India, employer branding, employee wellbeing, talent acquisition India, HR leadership" },
  8:  { title: "Remote Work: Self-Discovery and Professional Progress", description: "Working remotely changes how we relate to our work and ourselves. Explore the unexpected benefits and how to make the most of remote work in India.", keywords: "remote work India, work from home, remote productivity, WFH tips India, hybrid work" },
  9:  { title: "5 Tips to Create an ATS-Friendly Resume", description: "Most resumes never reach a human. Learn how to optimise your resume for Applicant Tracking Systems (ATS) and get past the first filter in your job search.", keywords: "ATS resume India, resume tips, applicant tracking system, resume optimisation, job search India" },
  10: { title: "How To Choose The Right Job Offer", description: "Multiple job offers on the table? This guide walks you through the criteria that matter beyond salary — culture, growth, and alignment with your values.", keywords: "job offer evaluation, salary negotiation India, choosing a job, career decisions, job offer tips" },
  11: { title: "Start A Blog To Accelerate Your Career Growth", description: "Blogging builds authority, improves your writing, and opens unexpected career doors. Here's how to start — even with zero followers — and grow steadily.", keywords: "career blog, blogging for career, personal branding India, content creator career, professional blog" },
  12: { title: "20 HR Podcasts Every Professional Should Listen To", description: "From talent acquisition to employee experience, these 20 HR podcasts cover everything professionals need to stay ahead of the curve in 2025.", keywords: "HR podcasts India, best podcasts HR, talent acquisition podcast, employee experience, HR learning" },
};

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const actualId = extractId(id);
  const numId = Number(actualId);
  const meta = BLOG_META[numId];

  if (meta) {
    const fullTitle = `${meta.title} | KA Jobs Blog`;
    const canonicalUrl = `https://kajobs.in${generateBlogUrl(numId, meta.title)}`;
    
    return {
      title: fullTitle,
      description: meta.description,
      keywords: meta.keywords + ', KA Jobs blog, career advice India, job search tips',
      openGraph: {
        title: fullTitle,
        description: meta.description,
        type: 'article',
        url: canonicalUrl,
        siteName: 'KA Jobs',
      },
      twitter: {
        card: 'summary_large_image',
        title: fullTitle,
        description: meta.description,
      },
      alternates: { canonical: canonicalUrl },
    };
  }

  return {
    title: 'Career Article | KA Jobs Blog – Career Tips & Job Advice',
    description: 'Read expert career advice, job search tips, and industry insights on the KA Jobs blog.',
    keywords: 'career advice India, job tips, KA Jobs blog',
  };
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
