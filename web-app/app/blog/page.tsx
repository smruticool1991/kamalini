'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Header4 from '@/components/header/Header4';
import Footer from '@/components/footer';

const BLOG_POSTS = [
  { id: 1, img: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&q=80', title: "The 9-to-5 workday doesn't work anymore", cate: 'Career', author: 'KA Jobs Team', time: 'May 20, 2025', text: 'The traditional workday is changing. Here\'s why flexible schedules are the future of work and how to adapt your career accordingly.', readTime: '4 min read' },
  { id: 2, img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80', title: '3 ways to spot a transparent company during your job search', cate: 'Job Search', author: 'KA Jobs Team', time: 'May 18, 2025', text: 'Transparency in the workplace matters more than ever. Learn the telltale signs of an open, honest company culture before you join.', readTime: '5 min read' },
  { id: 3, img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80', title: 'KA Jobs Announces Awards for Best Places to Work 2025', cate: 'News', author: 'KA Jobs Team', time: 'May 15, 2025', text: 'We\'re thrilled to announce our annual Best Places to Work awards recognising employers who prioritise their people.', readTime: '3 min read' },
  { id: 4, img: 'https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=600&q=80', title: 'How Does Writing Influence Your Personal Brand?', cate: 'Personal Growth', author: 'Priya Sharma', time: 'May 12, 2025', text: 'Your writing — emails, LinkedIn posts, resumes — shapes how the professional world perceives you. Here\'s how to use it strategically.', readTime: '6 min read' },
  { id: 5, img: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80', title: 'How To Write Content That Gets You Hired', cate: 'Career', author: 'Rahul Verma', time: 'May 10, 2025', text: 'Content creation skills are now a must-have across almost every industry. Discover how to showcase them effectively in your applications.', readTime: '5 min read' },
  { id: 6, img: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80', title: 'Where To Grow Your Career: Startup or Corporate?', cate: 'Career', author: 'Ananya Iyer', time: 'May 8, 2025', text: 'Both paths have pros and cons. We break down the key differences to help you choose the right environment for your growth.', readTime: '7 min read' },
  { id: 7, img: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=600&q=80', title: 'Caring Is The New Marketing — What HR Leaders Need to Know', cate: 'HR Insights', author: 'KA Jobs Team', time: 'May 5, 2025', text: 'Employee wellbeing isn\'t just a perk anymore. It\'s a competitive advantage. Here\'s how leading companies are making it central to their brand.', readTime: '4 min read' },
  { id: 8, img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80', title: 'Remote Work: Self-Discovery and Professional Progress', cate: 'Remote Work', author: 'Kiran Patel', time: 'May 2, 2025', text: 'Working remotely changes how we relate to our work and ourselves. Explore the unexpected benefits and how to make the most of them.', readTime: '5 min read' },
  { id: 9, img: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&q=80', title: '5 Tips to Create an ATS-Friendly Resume', cate: 'Job Search', author: 'Meena Nair', time: 'Apr 28, 2025', text: 'Most resumes never reach a human. Learn how to optimise yours for Applicant Tracking Systems and get past the first filter.', readTime: '6 min read' },
  { id: 10, img: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&q=80', title: 'How To Choose The Right Job Offer', cate: 'Career', author: 'Arjun Mehta', time: 'Apr 25, 2025', text: 'Multiple offers on the table? This guide walks you through the criteria that matter beyond salary — culture, growth, and alignment.', readTime: '5 min read' },
  { id: 11, img: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=600&q=80', title: 'Start A Blog To Accelerate Your Career Growth', cate: 'Personal Growth', author: 'KA Jobs Team', time: 'Apr 22, 2025', text: 'Blogging builds authority, improves your writing, and opens doors you never expected. Here\'s how to start — even with zero followers.', readTime: '4 min read' },
  { id: 12, img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=80', title: '20 HR Podcasts Every Professional Should Listen To', cate: 'HR Insights', author: 'KA Jobs Team', time: 'Apr 18, 2025', text: 'From talent acquisition to employee experience, these podcasts cover everything HR professionals need to stay ahead of the curve.', readTime: '3 min read' },
];

const CATEGORIES = ['All', 'Career', 'Job Search', 'News', 'Personal Growth', 'HR Insights', 'Remote Work'];
const POSTS_PER_PAGE = 9;

export default function BlogPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return BLOG_POSTS.filter(post => {
      const matchCat = activeCategory === 'All' || post.cate === activeCategory;
      const matchSearch = !search.trim() ||
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.cate.toLowerCase().includes(search.toLowerCase()) ||
        post.author.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  const handleCategory = (cat: string) => { setActiveCategory(cat); setCurrentPage(1); };
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setCurrentPage(1); };

  return (
    <>
      <Header4 clname="actBlog" />

      {/* Hero Banner */}
      <section style={{
        background: 'linear-gradient(135deg, #0a2a6e 0%, #1565c0 50%, #1e88e5 100%)',
        padding: '80px 0 60px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.05) 0%, transparent 60%)' }} />
        <div className="tf-container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 30,
              padding: '6px 18px', fontSize: 13, fontWeight: 600,
              color: '#93c5fd', marginBottom: 20, letterSpacing: 1,
            }}>
              <span>✦</span> KA JOBS BLOG
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#fff', marginBottom: 16, lineHeight: 1.2 }}>
              Insights for Your Career Journey
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', maxWidth: 560, margin: '0 auto 36px' }}>
              Career tips, hiring trends, and expert advice — everything you need to navigate today's job market.
            </p>
            {/* Search */}
            <div style={{
              maxWidth: 520, margin: '0 auto',
              display: 'flex', gap: 0,
              background: '#fff', borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 16px', color: '#9ca3af', fontSize: 18 }}>🔍</span>
              <input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={handleSearch}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#111', padding: '14px 0', background: 'transparent' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ padding: '0 16px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af', fontSize: 18 }}>✕</button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb', padding: '0' }}>
        <div className="tf-container">
          <div style={{ display: 'flex', gap: 8, padding: '16px 0', overflowX: 'auto', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                style={{
                  padding: '8px 20px', borderRadius: 30, fontSize: 13, fontWeight: 600,
                  border: '2px solid', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                  background: activeCategory === cat ? '#1565c0' : '#fff',
                  borderColor: activeCategory === cat ? '#1565c0' : '#e5e7eb',
                  color: activeCategory === cat ? '#fff' : '#374151',
                  boxShadow: activeCategory === cat ? '0 4px 12px rgba(21,101,192,0.3)' : 'none',
                  transform: activeCategory === cat ? 'translateY(-1px)' : 'none',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section style={{ padding: '60px 0 80px', background: '#fff' }}>
        <div className="tf-container">
          {/* Results count */}
          <div style={{ marginBottom: 32, color: '#6b7280', fontSize: 14 }}>
            Showing <strong style={{ color: '#111' }}>{filtered.length}</strong> article{filtered.length !== 1 ? 's' : ''}
            {activeCategory !== 'All' && <> in <strong style={{ color: '#1565c0' }}>{activeCategory}</strong></>}
          </div>

          {paginated.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
              <h3 style={{ color: '#374151', marginBottom: 8 }}>No articles found</h3>
              <p style={{ color: '#9ca3af' }}>Try a different search term or category</p>
            </div>
          ) : (
            <div className="group-col-3">
              {paginated.map(post => (
                <div key={post.id} className="widget-blog-1 style-1 cl3 stc" style={{ cursor: 'pointer' }}>
                  <div className="img-blog" style={{ position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={post.img}
                      alt={post.title}
                      style={{ width: '100%', height: 220, objectFit: 'cover', transition: 'transform 0.4s ease', display: 'block' }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                    <div style={{
                      position: 'absolute', top: 12, left: 12,
                      background: '#1565c0', color: '#fff', fontSize: 11, fontWeight: 700,
                      padding: '4px 10px', borderRadius: 20, letterSpacing: 0.5, textTransform: 'uppercase',
                    }}>
                      {post.cate}
                    </div>
                  </div>
                  <div className="content" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: 12, color: '#9ca3af', fontSize: 12, marginBottom: 10 }}>
                      <span>📅 {post.time}</span>
                      <span>⏱ {post.readTime}</span>
                    </div>
                    <h3 className="main-title" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4, marginBottom: 10 }}>
                      <Link href={`/blog/${post.id}`} style={{ color: '#111827', textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#1565c0')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#111827')}
                      >
                        {post.title}
                      </Link>
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
                      {post.text.length > 100 ? post.text.slice(0, 100) + '…' : post.text}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>by <strong style={{ color: '#374151' }}>{post.author}</strong></span>
                      <Link href={`/blog/${post.id}`} style={{
                        fontSize: 13, fontWeight: 600, color: '#1565c0', textDecoration: 'none',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        Read More →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <ul className="pagination-job" style={{ marginTop: 48 }}>
              <li>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  style={{ border: 'none', background: 'transparent', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1 }}>
                  <i className="icon-keyboard_arrow_left"></i>
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <li key={page} className={currentPage === page ? 'current' : ''}>
                  <button onClick={() => setCurrentPage(page)} style={{
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    fontWeight: currentPage === page ? 700 : 400,
                  }}>{page}</button>
                </li>
              ))}
              <li>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  style={{ border: 'none', background: 'transparent', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1 }}>
                  <i className="icon-keyboard_arrow_right"></i>
                </button>
              </li>
            </ul>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
