'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { Collapse } from 'react-collapse';
import Image from 'next/image';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Gotop from '@/components/gotop';
import logo from '@/assets/images/logo.png';
import { useFirebaseCategories, useFirebaseAllJobs } from '@/lib/useFirebaseData';

// ─── Category Icons (mapped by name keyword) ──────────────────────────────────
const ICON_MAP: Record<string, string> = {
  design:     'icon-categorie-1',
  creative:   'icon-categorie-1',
  marketing:  'icon-categorie-8',
  digital:    'icon-categorie-8',
  developer:  'icon-categorie-2',
  development:'icon-categorie-2',
  it:         'icon-categorie-2',
  tech:       'icon-categorie-2',
  software:   'icon-categorie-2',
  finance:    'icon-categorie-4',
  accounting: 'icon-categorie-4',
  sales:      'icon-categorie-5',
  retail:     'icon-categorie-5',
  health:     'icon-categorie-6',
  medical:    'icon-categorie-6',
  education:  'icon-categorie-7',
  teaching:   'icon-categorie-7',
  hr:         'icon-categorie-3',
  human:      'icon-categorie-3',
  data:       'icon-categorie-9',
  analytics:  'icon-categorie-9',
  customer:   'icon-categorie-10',
  support:    'icon-categorie-10',
};

const COLORS = [
  '#4f46e5','#0891b2','#059669','#d97706',
  '#dc2626','#7c3aed','#db2777','#0284c7',
  '#65a30d','#ea580c',
];

function getCategoryIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return 'icon-categorie-1';
}

function getCategoryColor(name: string, idx: number): string {
  return COLORS[idx % COLORS.length];
}

export default function CategoriesPage() {
  const { categories, loading } = useFirebaseCategories();
  const { jobs: allJobs } = useFirebaseAllJobs();

  const [toggle, setToggle] = useState({ key: '', status: false });
  const [search, setSearch] = useState('');

  const handleToggle = (key: string) =>
    setToggle(prev => prev.key === key ? { key: '', status: false } : { key, status: true });


  useEffect(() => {
    const WOW = require('wowjs');
    window.wow = new WOW.WOW({ live: false });
    window.wow.init();
  }, []);

  // Build enriched category list with live job counts
  const enriched = categories.map((cat, i) => {
    const liveCount = allJobs.filter(j => {
      if (!j.category) return false;
      const jc = j.category.toLowerCase();
      const catName = cat.name?.toLowerCase() ?? '';
      const catId = cat.id?.toLowerCase() ?? '';
      return jc === catName || jc === catId || catName.includes(jc) || jc.includes(catName);
    }).length;
    return {
      ...cat,
      count: liveCount > 0 ? liveCount : (cat.jobCount ?? 0),
      color: getCategoryColor(cat.name, i),
      icon: getCategoryIcon(cat.name),
    };
  });

  // Filter by search
  const filtered = enriched.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalJobs = allJobs.length;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cat-card {
          background: #fff;
          border-radius: 16px;
          padding: 28px 24px;
          border: 1.5px solid #f0f0f0;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          animation: fadeUp 0.4s ease both;
          text-decoration: none;
          display: block;
        }
        .cat-card:hover {
          border-color: var(--cat-color);
          box-shadow: 0 12px 40px rgba(0,0,0,0.10);
          transform: translateY(-4px);
        }
        .cat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: var(--cat-color);
          border-radius: 16px 16px 0 0;
          opacity: 0;
          transition: opacity 0.25s;
        }
        .cat-card:hover::before { opacity: 1; }
        .cat-icon-wrap {
          width: 56px; height: 56px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
          font-size: 26px;
          transition: transform 0.25s;
        }
        .cat-card:hover .cat-icon-wrap { transform: scale(1.1); }
        .cat-name {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 6px;
          line-height: 1.3;
        }
        .cat-count {
          font-size: 13px;
          color: #888;
          margin: 0;
        }
        .cat-arrow {
          position: absolute;
          bottom: 20px; right: 20px;
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--cat-color);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          opacity: 0;
          transform: translateX(-6px);
          transition: all 0.25s;
        }
        .cat-card:hover .cat-arrow { opacity: 1; transform: translateX(0); }
        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff;
          border: 1.5px solid #e5e5e5;
          border-radius: 12px;
          padding: 10px 18px;
          max-width: 420px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-bar:focus-within {
          border-color: #14a077;
          box-shadow: 0 0 0 3px #14a07720;
        }
        .search-bar input {
          border: none; outline: none;
          font-size: 14px; color: #333;
          background: transparent; flex: 1;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Header ── */}
      <Header clname="act1" />

      {/* ── Page Hero ── */}
      <section style={{
        background: 'linear-gradient(135deg, #0f2557 0%, #14a077 100%)',
        padding: '110px 0 60px',   /* top: 80px header + 30px breathing room */
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* dot pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.05,
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }} />

        <div className="tf-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="row" style={{ alignItems: 'center' }}>

            {/* ── Left: breadcrumb + title ── */}
            <div className="col-lg-7 col-md-8">
              {/* Breadcrumb */}
              <nav style={{
                display: 'flex', gap: 6, alignItems: 'center',
                fontSize: 13, marginBottom: 14,
              }}>
                <Link href="/" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>
                  Home
                </Link>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>›</span>
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>All Categories</span>
              </nav>

              <h1 style={{
                fontSize: 34, fontWeight: 800, color: '#fff',
                margin: '0 0 10px', lineHeight: 1.2,
              }}>
                Browse All Categories
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, margin: 0 }}>
                {loading
                  ? 'Loading...'
                  : `${categories.length} categories · ${totalJobs} job${totalJobs !== 1 ? 's' : ''} available`
                }
              </p>
            </div>

            {/* ── Right: search bar ── */}
            <div className="col-lg-5 col-md-4" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 0 }}>
              <div className="search-bar" style={{
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(10px)',
                borderColor: 'rgba(255,255,255,0.3)',
                width: '100%',
                maxWidth: 360,
              }}>
                <i className="icon-search" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, flexShrink: 0 }}></i>
                <input
                  placeholder="Search categories..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ color: '#fff' }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.6)', fontSize: 20, padding: 0, lineHeight: 1,
                    }}
                  >×</button>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Categories Grid ── */}
      <section style={{ padding: '60px 0 80px', background: '#f8f9fb', minHeight: '60vh' }}>
        <div className="tf-container">

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ width: 48, height: 48, border: '3px solid #e0e0e0', borderTopColor: '#14a077', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ color: '#999' }}>Loading categories...</p>
            </div>

          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
              <h4 style={{ color: '#1a1a2e', margin: '0 0 8px' }}>No categories found</h4>
              <p style={{ color: '#888' }}>Try a different search term</p>
              <button onClick={() => setSearch('')} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, background: '#14a077', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Clear search
              </button>
            </div>

          ) : (
            <>
              {/* Result count */}
              {search && (
                <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
                  Showing <strong>{filtered.length}</strong> result{filtered.length !== 1 ? 's' : ''} for "<strong>{search}</strong>"
                </p>
              )}

              <div className="row" style={{ gap: '0' }}>
                {filtered.map((cat, i) => (
                  <div key={cat.id} className="col-xl-3 col-lg-4 col-md-6 col-sm-6" style={{ marginBottom: 24, animationDelay: `${i * 0.04}s` }}>
                    <Link
                      href={`/find-jobs?category=${encodeURIComponent(cat.name)}`}
                      className="cat-card"
                      style={{ '--cat-color': cat.color } as React.CSSProperties}
                    >
                      {/* Icon */}
                      <div className="cat-icon-wrap" style={{ background: `${cat.color}18` }}>
                        <i className={cat.icon} style={{ color: cat.color }}></i>
                      </div>

                      {/* Name & count */}
                      <h3 className="cat-name">{cat.name}</h3>
                      <p className="cat-count">
                        <strong style={{ color: cat.color }}>{cat.count}</strong>
                        &nbsp;open position{cat.count !== 1 ? 's' : ''}
                      </p>

                      {/* Hover arrow */}
                      <div className="cat-arrow">
                        <i className="icon-keyboard_arrow_right"></i>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      {!loading && (
        <section style={{ background: 'linear-gradient(135deg, #14a077, #0f2557)', padding: '56px 0' }}>
          <div className="tf-container" style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: '0 0 12px' }}>
              Can't find your category?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 28px', fontSize: 15 }}>
              Browse all available jobs or use our advanced search to find exactly what you need.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/find-jobs" style={{ padding: '12px 32px', background: '#fff', color: '#14a077', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none', transition: 'all 0.2s' }}>
                Browse All Jobs
              </Link>
              <Link href="/" style={{ padding: '12px 32px', background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.4)' }}>
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      )}

      <Footer />
      <Gotop />
    </>
  );
}
