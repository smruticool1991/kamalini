'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header4 from '@/components/header/Header4';
import Footer from '@/components/footer';
import { extractId, generateBlogUrl } from '@/lib/slug';
import { BLOG_POSTS } from '@/lib/blogData';

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
  const actualId = extractId(params.id as string);
  const id = Number(actualId);
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
                  <Link href={generateBlogUrl(id - 1, BLOG_POSTS.find(p => p.id === id - 1)?.title)} style={{ textDecoration: 'none' }}>
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
                  <Link href={generateBlogUrl(id + 1, BLOG_POSTS.find(p => p.id === id + 1)?.title)} style={{ textDecoration: 'none', gridColumn: id <= 1 ? 2 : 'auto' }}>
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
                    <Link key={rp.id} href={generateBlogUrl(rp.id, rp.title)} style={{ display: 'flex', gap: 12, marginBottom: 16, textDecoration: 'none', alignItems: 'flex-start' }}>
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
