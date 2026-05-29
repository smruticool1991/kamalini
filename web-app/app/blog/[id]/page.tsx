'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header4 from '@/components/header/Header4';
import Footer from '@/components/footer';

const BLOG_POSTS = [
  { id: 1, img: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=900&q=80', title: "The 9-to-5 workday doesn't work anymore", cate: 'Career', author: 'KA Jobs Team', authorImg: 'https://ui-avatars.com/api/?name=KA+Jobs&background=1565c0&color=fff&size=80', time: 'May 20, 2025', readTime: '4 min read', tags: ['Work-Life Balance', 'Flexibility', 'Future of Work'], text: 'The traditional workday is changing. Here\'s why flexible schedules are the future of work and how to adapt your career accordingly.', content: `
The traditional 9-to-5 workday was invented in the industrial age — when workers needed to be physically present at a factory at a set time. In the knowledge economy, that model doesn't just feel outdated; it actively harms productivity and wellbeing.

## Why the Old Model Fails Modern Workers

Studies consistently show that people have different peak productivity windows. Some are sharpest in the early morning; others hit their stride after lunch. Forcing everyone into the same eight-hour window ignores this biological reality.

**The evidence is clear:**
- 77% of remote workers report higher productivity at home (Owl Labs, 2024)
- Companies offering flexible hours see 25% lower turnover rates
- Employee satisfaction scores jump by an average of 34% when schedules are flexible

## What Leading Companies Are Doing

Forward-thinking organisations are embracing results-oriented work environments (ROWE). Instead of measuring hours clocked, they measure outcomes achieved. Teams set their own hours, meet asynchronously, and deliver work on their own timeline — as long as deadlines are met.

## How to Adapt Your Career

1. **Look for async-first employers** — check if their job listings mention flexible hours or async communication tools like Notion or Loom.
2. **Build self-management skills** — time-blocking, deep work sessions, and clear prioritisation become essential when nobody is watching the clock.
3. **Communicate proactively** — flexibility requires trust, and trust is built through consistent, transparent communication.
4. **Set boundaries ruthlessly** — flexible work can easily bleed into 24/7 availability. Define your working hours and stick to them.

The future of work isn't about where or when you work — it's about what you produce and how sustainably you can maintain it.
  ` },
  { id: 2, img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&q=80', title: '3 ways to spot a transparent company during your job search', cate: 'Job Search', author: 'KA Jobs Team', authorImg: 'https://ui-avatars.com/api/?name=KA+Jobs&background=14a077&color=fff&size=80', time: 'May 18, 2025', readTime: '5 min read', tags: ['Job Search', 'Company Culture', 'Interview Tips'], text: 'Transparency in the workplace matters more than ever. Learn the telltale signs of an open, honest company culture before you join.', content: `
Finding a job is hard. Finding a job at a company you'll actually love is harder. One of the most important — and overlooked — factors is transparency. A transparent company is honest about its challenges, open about compensation, and clear in its communication. But how do you spot one before you accept an offer?

## 1. Their Job Descriptions Are Specific and Honest

Vague job descriptions are a red flag. If a company can't clearly articulate what the role involves, what success looks like, or why the position is open, that's a sign of either disorganisation or deliberate opacity.

**Green flags to look for:**
- Salary ranges clearly stated
- Explicit mention of team size and reporting structure
- Honest about challenges ("we're scaling fast and processes are still evolving")

## 2. Glassdoor Reviews Tell a Consistent Story

No company has 100% positive reviews. But transparent companies have a consistent narrative across reviews — even the critical ones tend to identify specific, actionable areas rather than vague dissatisfaction.

Look for **management responses** to reviews. Companies that respond — even to negative feedback — demonstrate accountability and openness.

## 3. Your Interviewers Answer Questions Directly

The interview process itself is a window into company culture. When you ask tough questions — "What's the biggest challenge the team is facing right now?" or "Why did the last person in this role leave?" — pay attention to how they answer.

- Do they give you a direct, specific answer?
- Do they acknowledge real challenges or spin everything positively?
- Do they encourage you to talk to other team members?

A company that encourages you to speak with future colleagues before deciding is a company that's confident in what you'll find.
  ` },
  { id: 3, img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=80', title: 'KA Jobs Announces Awards for Best Places to Work 2025', cate: 'News', author: 'KA Jobs Team', authorImg: 'https://ui-avatars.com/api/?name=KA+Jobs&background=f59e0b&color=fff&size=80', time: 'May 15, 2025', readTime: '3 min read', tags: ['Awards', 'Best Workplaces', 'News'], text: 'We\'re thrilled to announce our annual Best Places to Work awards recognising employers who prioritise their people.', content: `
We are proud to announce the launch of the **KA Jobs Best Places to Work 2025** awards — our annual recognition programme celebrating employers who go above and beyond for their teams.

## Why These Awards Matter

In a competitive talent market, employer reputation is everything. Candidates are doing more research than ever before about companies before applying. These awards give great employers a platform to showcase their culture and attract the talent they deserve.

## Selection Criteria

Winners are selected based on four key pillars:

1. **Employee Wellbeing** — Mental health support, flexible working, and work-life balance initiatives
2. **Growth & Development** — Learning budgets, mentorship programmes, and clear career progression
3. **Diversity & Inclusion** — Measurable D&I commitments and inclusive hiring practices
4. **Compensation Transparency** — Fair pay, clear salary bands, and benefit parity

## How to Nominate

Employers can self-nominate through the KA Jobs platform. Employees can also nominate their companies directly. Nominations close on June 30, 2025.

Winners will be announced at the **KA Jobs Annual Summit** in August 2025 and featured prominently across our platform, reaching over 2 million active job seekers.
  ` },
  { id: 4, img: 'https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=900&q=80', title: 'How Does Writing Influence Your Personal Brand?', cate: 'Personal Growth', author: 'Priya Sharma', authorImg: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=7c3aed&color=fff&size=80', time: 'May 12, 2025', readTime: '6 min read', tags: ['Personal Branding', 'Writing', 'LinkedIn'], text: 'Your writing — emails, LinkedIn posts, resumes — shapes how the professional world perceives you. Here\'s how to use it strategically.', content: `
Every word you write professionally contributes to your personal brand. Your emails, LinkedIn posts, resume, and even your Slack messages create a cumulative impression that shapes how colleagues, managers, and recruiters perceive you.

## The Silent Resume

Before anyone meets you in person, they've often already read your writing. Your LinkedIn summary, your application email, your portfolio descriptions — these are forming opinions before a single word is spoken.

**The question isn't whether your writing is creating an impression. It's whether that impression is intentional.**

## Three Writing Habits That Build a Strong Brand

### 1. Write with a consistent voice

Your professional voice should be recognisably yours across all platforms. This doesn't mean being informal on LinkedIn just because you're casual in Slack. It means having a consistent tone, vocabulary, and perspective.

### 2. Share your thinking, not just your doing

Most people write about what they did. The professionals who build strong personal brands write about *how* they think. Share your frameworks, your decision-making process, your lessons from failures.

### 3. Write regularly, even imperfectly

Consistency beats perfection. A weekly LinkedIn post that's 80% polished does more for your brand than a quarterly essay that's 100% refined. The algorithm rewards frequency; your audience rewards authenticity.

## Practical Starting Points

- Rewrite your LinkedIn summary in the first person and make it specific about what you uniquely offer
- Start responding thoughtfully to posts in your industry instead of just liking them
- Write a short "lessons learned" post about a recent project — even if it was internal
  ` },
  { id: 5, img: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900&q=80', title: 'How To Write Content That Gets You Hired', cate: 'Career', author: 'Rahul Verma', authorImg: 'https://ui-avatars.com/api/?name=Rahul+Verma&background=059669&color=fff&size=80', time: 'May 10, 2025', readTime: '5 min read', tags: ['Resume', 'Cover Letter', 'Job Applications'], text: 'Content creation skills are now a must-have across almost every industry. Discover how to showcase them effectively in your applications.', content: `Content creation is no longer confined to marketing teams. Recruiters across industries are actively seeking candidates who can communicate clearly, tell compelling stories, and create content that resonates with an audience. Here's how to demonstrate those skills throughout your job search.` },
  { id: 6, img: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=900&q=80', title: 'Where To Grow Your Career: Startup or Corporate?', cate: 'Career', author: 'Ananya Iyer', authorImg: 'https://ui-avatars.com/api/?name=Ananya+Iyer&background=dc2626&color=fff&size=80', time: 'May 8, 2025', readTime: '7 min read', tags: ['Career Path', 'Startups', 'Corporate'], text: 'Both paths have pros and cons. We break down the key differences to help you choose the right environment for your growth.', content: `The startup vs corporate debate is one of the most common career crossroads professionals face. There's no universally right answer — but there are frameworks to help you decide based on what you specifically value and where you are in your career.` },
  { id: 7, img: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=900&q=80', title: 'Caring Is The New Marketing — What HR Leaders Need to Know', cate: 'HR Insights', author: 'KA Jobs Team', authorImg: 'https://ui-avatars.com/api/?name=KA+Jobs&background=1565c0&color=fff&size=80', time: 'May 5, 2025', readTime: '4 min read', tags: ['HR', 'Employer Branding', 'Employee Experience'], text: 'Employee wellbeing isn\'t just a perk anymore. It\'s a competitive advantage. Here\'s how leading companies are making it central to their brand.', content: `The most effective employer brands aren't built in boardrooms — they're built in break rooms, Slack channels, and performance reviews. Caring about your employees, and making that care visible, is the most powerful marketing your company can do.` },
  { id: 8, img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&q=80', title: 'Remote Work: Self-Discovery and Professional Progress', cate: 'Remote Work', author: 'Kiran Patel', authorImg: 'https://ui-avatars.com/api/?name=Kiran+Patel&background=0891b2&color=fff&size=80', time: 'May 2, 2025', readTime: '5 min read', tags: ['Remote Work', 'Productivity', 'Work From Home'], text: 'Working remotely changes how we relate to our work and ourselves. Explore the unexpected benefits and how to make the most of them.', content: `Remote work forced millions of professionals to confront questions they'd never had to ask before: Do I actually enjoy my work when no one's watching? What environment helps me think best? How do I define a productive day for myself?` },
  { id: 9, img: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&q=80', title: '5 Tips to Create an ATS-Friendly Resume', cate: 'Job Search', author: 'Meena Nair', authorImg: 'https://ui-avatars.com/api/?name=Meena+Nair&background=9333ea&color=fff&size=80', time: 'Apr 28, 2025', readTime: '6 min read', tags: ['Resume', 'ATS', 'Job Search'], text: 'Most resumes never reach a human. Learn how to optimise yours for Applicant Tracking Systems and get past the first filter.', content: `The hard truth: most resumes are rejected before a human ever reads them. Applicant Tracking Systems (ATS) scan, parse, and rank resumes automatically — and most candidates are unknowingly sabotaging themselves with formatting and keyword mistakes.` },
  { id: 10, img: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=900&q=80', title: 'How To Choose The Right Job Offer', cate: 'Career', author: 'Arjun Mehta', authorImg: 'https://ui-avatars.com/api/?name=Arjun+Mehta&background=ea580c&color=fff&size=80', time: 'Apr 25, 2025', readTime: '5 min read', tags: ['Job Offer', 'Negotiation', 'Career'], text: 'Multiple offers on the table? This guide walks you through the criteria that matter beyond salary — culture, growth, and alignment.', content: `Receiving multiple job offers is an exciting position to be in — but it can also be surprisingly stressful. When the stakes feel high, it's easy to make a decision based on the wrong factors. Here's a framework for evaluating offers holistically.` },
  { id: 11, img: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=900&q=80', title: 'Start A Blog To Accelerate Your Career Growth', cate: 'Personal Growth', author: 'KA Jobs Team', authorImg: 'https://ui-avatars.com/api/?name=KA+Jobs&background=1565c0&color=fff&size=80', time: 'Apr 22, 2025', readTime: '4 min read', tags: ['Blogging', 'Personal Brand', 'Career Growth'], text: 'Blogging builds authority, improves your writing, and opens doors you never expected. Here\'s how to start — even with zero followers.', content: `Starting a blog might feel intimidating, especially when you're competing with established voices in your industry. But here's the truth: the bar for getting started is lower than you think, and the compounding benefits over time are enormous.` },
  { id: 12, img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900&q=80', title: '20 HR Podcasts Every Professional Should Listen To', cate: 'HR Insights', author: 'KA Jobs Team', authorImg: 'https://ui-avatars.com/api/?name=KA+Jobs&background=1565c0&color=fff&size=80', time: 'Apr 18, 2025', readTime: '3 min read', tags: ['HR', 'Podcasts', 'Learning'], text: 'From talent acquisition to employee experience, these podcasts cover everything HR professionals need to stay ahead of the curve.', content: `Podcasts have become one of the most efficient ways to stay informed in a fast-moving industry. Whether you're commuting, exercising, or just taking a break, these shows will keep your HR knowledge sharp and your perspective fresh.` },
];

function renderContent(content: string) {
  const lines = content.trim().split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length) {
      elements.push(
        <ul key={key} style={{ paddingLeft: 24, marginBottom: 20 }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ color: '#374151', fontSize: 16, lineHeight: 1.8, marginBottom: 8 }}>{item.replace(/^- /, '')}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    if (line.startsWith('## ')) {
      flushList(`ul-${i}`);
      elements.push(<h2 key={i} style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginTop: 36, marginBottom: 12 }}>{line.replace('## ', '')}</h2>);
    } else if (line.startsWith('### ')) {
      flushList(`ul-${i}`);
      elements.push(<h3 key={i} style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginTop: 24, marginBottom: 10 }}>{line.replace('### ', '')}</h3>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line);
    } else if (line.startsWith('**') && line.endsWith('**')) {
      flushList(`ul-${i}`);
      elements.push(<p key={i} style={{ fontWeight: 700, color: '#111827', fontSize: 16, lineHeight: 1.8, marginBottom: 12 }}>{line.replace(/\*\*/g, '')}</p>);
    } else if (line.trim()) {
      flushList(`ul-${i}`);
      // Handle inline bold
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      elements.push(
        <p key={i} style={{ color: '#374151', fontSize: 16, lineHeight: 1.9, marginBottom: 16 }}>
          {parts.map((part, j) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={j}>{part.slice(2, -2)}</strong>
              : part
          )}
        </p>
      );
    } else {
      flushList(`ul-${i}-end`);
    }
  });
  flushList('final');
  return elements;
}

export default function BlogDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const post = BLOG_POSTS.find(p => p.id === id);
  const [comment, setComment] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const related = BLOG_POSTS.filter(p => p.id !== id && (p.cate === post?.cate)).slice(0, 3);

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setComment({ name: '', email: '', message: '' });
  };

  if (!post) {
    return (
      <>
        <Header4 clname="actBlog" />
        <div style={{ textAlign: 'center', padding: '120px 24px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📄</div>
          <h2 style={{ color: '#374151' }}>Article not found</h2>
          <Link href="/blog" style={{ color: '#1565c0', fontWeight: 600, textDecoration: 'none' }}>← Back to Blog</Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header4 clname="actBlog" />

      {/* Hero */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a2a6e 0%, #1565c0 100%)',
        padding: '80px 0 0',
      }}>
        <div className="tf-container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 24 }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <Link href="/blog" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Blog</Link>
            <span>/</span>
            <span style={{ color: '#fff' }}>{post.cate}</span>
          </div>
          <div style={{
            display: 'inline-block', background: '#1e88e5', color: '#fff',
            fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20,
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20,
          }}>{post.cate}</div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 800, color: '#fff', lineHeight: 1.25, maxWidth: 800, marginBottom: 24 }}>
            {post.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', paddingBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={post.authorImg} alt={post.author} style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)' }} />
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>by <strong style={{ color: '#fff' }}>{post.author}</strong></span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>📅 {post.time}</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>⏱ {post.readTime}</span>
          </div>
        </div>
        {/* Wave bottom */}
        <svg viewBox="0 0 1440 60" style={{ display: 'block', marginBottom: -1 }}>
          <path fill="#fff" d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" />
        </svg>
      </section>

      {/* Main Content */}
      <section style={{ padding: '0 0 80px', background: '#fff' }}>
        <div className="tf-container">
          <div className="wrap-blog-detail blog-detail" style={{ display: 'grid', gridTemplateColumns: '1fr min(280px, 30%)', gap: 48, alignItems: 'start' }}>

            {/* Article */}
            <div>
              {/* Featured Image */}
              <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 40, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}>
                <img src={post.img} alt={post.title} style={{ width: '100%', height: 420, objectFit: 'cover', display: 'block' }} />
              </div>

              {/* Article Body */}
              <div style={{ maxWidth: 700 }}>
                {post.content ? renderContent(post.content) : (
                  <p style={{ color: '#374151', fontSize: 16, lineHeight: 1.9 }}>{post.text}</p>
                )}
              </div>

              {/* Tags + Share */}
              <div className="tag-social" style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div className="widget-popular-tags" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: '#374151', fontSize: 14 }}>Tags:</span>
                  {post.tags.map(tag => (
                    <Link key={tag} href="/blog" style={{
                      padding: '4px 14px', background: '#f0f9ff', color: '#1565c0',
                      borderRadius: 20, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                      border: '1px solid #bfdbfe',
                    }}>{tag}</Link>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>Share:</span>
                  {['facebook', 'twitter', 'linkedin2'].map(icon => (
                    <a key={icon} href="#" style={{
                      width: 36, height: 36, borderRadius: '50%', background: '#f3f4f6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#374151', transition: 'all 0.2s', textDecoration: 'none',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1565c0'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f3f4f6'; (e.currentTarget as HTMLElement).style.color = '#374151'; }}
                    >
                      <i className={`icon-${icon}`} style={{ fontSize: 14 }}></i>
                    </a>
                  ))}
                </div>
              </div>

              {/* Prev / Next */}
              <div className="nav-links stc" style={{ marginTop: 36, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {id > 1 && (
                  <Link href={`/blog/${id - 1}`} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '16px 20px', border: '1px solid #e5e7eb', borderRadius: 12, background: '#fafafa', transition: 'all 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#1565c0')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                    >
                      <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>← Previous</div>
                      <div style={{ fontSize: 14, color: '#111827', fontWeight: 600, lineHeight: 1.4 }}>
                        {BLOG_POSTS.find(p => p.id === id - 1)?.title}
                      </div>
                    </div>
                  </Link>
                )}
                {id < BLOG_POSTS.length && (
                  <Link href={`/blog/${id + 1}`} style={{ textDecoration: 'none', gridColumn: id <= 1 ? 2 : 'auto' }}>
                    <div style={{ padding: '16px 20px', border: '1px solid #e5e7eb', borderRadius: 12, background: '#fafafa', textAlign: 'right', transition: 'all 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#1565c0')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                    >
                      <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>Next →</div>
                      <div style={{ fontSize: 14, color: '#111827', fontWeight: 600, lineHeight: 1.4 }}>
                        {BLOG_POSTS.find(p => p.id === id + 1)?.title}
                      </div>
                    </div>
                  </Link>
                )}
              </div>

              {/* Comment Form */}
              <div style={{ marginTop: 56, padding: 36, background: '#f8fafc', borderRadius: 16, border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 24 }}>Leave A Comment</h3>
                {submitted ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#059669' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                    <p style={{ fontWeight: 600 }}>Thanks for your comment! It's been submitted for review.</p>
                  </div>
                ) : (
                  <form onSubmit={handleComment}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Name *</label>
                        <input type="text" required value={comment.name}
                          onChange={e => setComment({ ...comment, name: e.target.value })}
                          placeholder="Your name"
                          style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email *</label>
                        <input type="email" required value={comment.email}
                          onChange={e => setComment({ ...comment, email: e.target.value })}
                          placeholder="Your email"
                          style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Message *</label>
                      <textarea required rows={5} value={comment.message}
                        onChange={e => setComment({ ...comment, message: e.target.value })}
                        placeholder="Share your thoughts..."
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                    </div>
                    <button type="submit" className="btn btn-find" style={{ minWidth: 160 }}>Post Comment</button>
                  </form>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ position: 'sticky', top: 24 }}>
              {/* About Author */}
              <div style={{ background: '#f8fafc', borderRadius: 16, padding: 24, marginBottom: 24, border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <img src={post.authorImg} alt={post.author} style={{ width: 72, height: 72, borderRadius: '50%', marginBottom: 12, border: '3px solid #e5e7eb' }} />
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{post.author}</h4>
                <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>Career & Jobs Expert</p>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                  Sharing insights on careers, hiring, and workplace trends to help professionals grow.
                </p>
              </div>

              {/* Categories */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, border: '1px solid #e5e7eb' }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Categories</h4>
                {['Career', 'Job Search', 'HR Insights', 'Personal Growth', 'Remote Work', 'News'].map(cat => (
                  <Link key={cat} href="/blog" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', borderBottom: '1px solid #f3f4f6', textDecoration: 'none',
                    color: post.cate === cat ? '#1565c0' : '#374151', fontSize: 14, fontWeight: post.cate === cat ? 600 : 400,
                  }}>
                    <span>{cat}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>→</span>
                  </Link>
                ))}
              </div>

              {/* Popular Tags */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, border: '1px solid #e5e7eb' }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Popular Tags</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['Resume', 'Job Search', 'Career', 'Remote Work', 'HR', 'Hiring', 'LinkedIn', 'Interview', 'Salary'].map(tag => (
                    <Link key={tag} href="/blog" style={{
                      padding: '5px 12px', background: '#f3f4f6', color: '#374151',
                      borderRadius: 20, fontSize: 12, fontWeight: 500, textDecoration: 'none',
                      border: '1px solid #e5e7eb', transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1565c0'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f3f4f6'; (e.currentTarget as HTMLElement).style.color = '#374151'; }}
                    >{tag}</Link>
                  ))}
                </div>
              </div>

              {/* Related Posts */}
              {related.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Related Articles</h4>
                  {related.map(rp => (
                    <Link key={rp.id} href={`/blog/${rp.id}`} style={{ display: 'flex', gap: 12, marginBottom: 16, textDecoration: 'none', alignItems: 'flex-start' }}>
                      <img src={rp.img} alt={rp.title} style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.4, marginBottom: 4 }}>{rp.title}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{rp.time}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
