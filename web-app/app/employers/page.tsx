'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { Collapse } from 'react-collapse';
import Header4 from '@/components/header/Header4';
import Footer from '@/components/footer';
import Gotop from '@/components/gotop';
import logo from '@/assets/images/logo.png';
import { useFirebaseCompanies, useFirebaseAllJobs } from '@/lib/useFirebaseData';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const COLORS = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777','#0284c7','#65a30d','#ea580c'];
const getColor  = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];
const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const ITEMS_PER_PAGE = 9;

const SORT_OPTIONS = [
  { value: 'name_asc',  label: 'Name (A → Z)' },
  { value: 'name_desc', label: 'Name (Z → A)' },
  { value: 'jobs_desc', label: 'Most Jobs' },
  { value: 'jobs_asc',  label: 'Fewest Jobs' },
];

const INDUSTRY_OPTIONS = ['All Industries','Technology','Finance','Healthcare','Education','Marketing','Retail','Manufacturing','Other'];

// ─── Star row ─────────────────────────────────────────────────────────────────
function StarRow({ n = 5 }: { n?: number }) {
  return (
    <div className="star" style={{ display: 'flex', gap: 1 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} className={s <= n ? 'icon-star-full' : ''} style={{ fontSize: 12, color: s <= n ? '#f59e0b' : '#ddd' }} />
      ))}
    </div>
  );
}

// ─── Grid Card (style-3 cl3) ──────────────────────────────────────────────────
function GridCard({ company, jobCount }: { company: any; jobCount: number }) {
  const color = getColor(company.name);
  return (
    <div className="employer-block style-3 cl3">
      <div className="inner-box" style={{ position: 'relative' }}>
        {/* Logo */}
        <div className="logo-company" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 14,
            background: color, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800,
            boxShadow: `0 6px 20px ${color}44`,
          }}>
            {getInitials(company.name)}
          </div>
        </div>

        {/* Content */}
        <div className="box-content">
          <StarRow />
          <h3 style={{ margin: '8px 0 4px' }}>
            {company.name}&nbsp;<span className="icon-bolt"></span>
          </h3>
          <p className="info">
            <span className="icon-map-pin"></span>&nbsp;
            {company.location || 'Location not specified'}
          </p>
        </div>

        {/* Footer */}
        <div className="group-btn">
          <Link
            href={`/find-jobs?company=${encodeURIComponent(company.name)}`}
            className="btn-employer"
            style={{ textDecoration: 'none', fontSize: 12 }}
            onClick={e => e.stopPropagation()}
          >
            {jobCount} Open Job{jobCount !== 1 ? 's' : ''}
          </Link>
        </div>

        {/* Full-card clickable overlay → detail page */}
        <Link
          href={`/employers/${company.id}`}
          aria-label={`View ${company.name} details`}
          style={{
            position: 'absolute', inset: 0,
            borderRadius: 'inherit', zIndex: 0,
          }}
        />
      </div>
    </div>
  );
}

// ─── List Card (style-2 cl2) ──────────────────────────────────────────────────
function ListCard({ company, jobCount }: { company: any; jobCount: number }) {
  const color = getColor(company.name);
  return (
    <div className="employer-block style-2 cl2">
      <div className="inner-box" style={{ position: 'relative' }}>
        {/* Logo */}
        <div className="logo-company" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 12,
            background: color, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800,
            boxShadow: `0 4px 16px ${color}44`,
          }}>
            {getInitials(company.name)}
          </div>
        </div>

        {/* Content */}
        <div className="box-content">
          <StarRow />
          <h3 style={{ margin: '6px 0 4px' }}>
            {company.name}&nbsp;<span className="icon-bolt"></span>
          </h3>
          <p className="info">
            <span className="icon-map-pin"></span>&nbsp;
            {company.location || 'Location not specified'}
          </p>
          {company.industry && (
            <span style={{
              fontSize: 12, color: color, background: `${color}15`,
              padding: '3px 10px', borderRadius: 20, fontWeight: 600,
              display: 'inline-block', marginTop: 6,
            }}>
              {company.industry}
            </span>
          )}
        </div>

        {/* Right — job count + View Details */}
        <div className="button-readmore" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, position: 'relative', zIndex: 1 }}>
          <Link
            href={`/find-jobs?company=${encodeURIComponent(company.name)}`}
            className="btn-employer"
            style={{ textDecoration: 'none', fontSize: 12 }}
            onClick={e => e.stopPropagation()}
          >
            {jobCount} Open Job{jobCount !== 1 ? 's' : ''}
          </Link>
          <Link
            href={`/employers/${company.id}`}
            style={{
              fontSize: 12, color: color, fontWeight: 600,
              textDecoration: 'none', position: 'relative', zIndex: 1,
            }}
            onClick={e => e.stopPropagation()}
          >
            View Details →
          </Link>
        </div>

        {/* Full-card clickable overlay → detail page */}
        <Link
          href={`/employers/${company.id}`}
          aria-label={`View ${company.name} details`}
          style={{
            position: 'absolute', inset: 0,
            borderRadius: 'inherit', zIndex: 0,
          }}
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EmployersPage() {
  const { companies, loading } = useFirebaseCompanies(200);
  const { jobs: allJobs } = useFirebaseAllJobs();

  const [toggle, setToggle] = useState({ key: '', status: false });
  const [search, setSearch]   = useState('');
  const [industry, setIndustry] = useState('All Industries');
  const [sortBy, setSortBy]   = useState('name_asc');
  const [page, setPage]       = useState(1);

  const handleToggle = (key: string) =>
    setToggle(prev => prev.key === key ? { key: '', status: false } : { key, status: true });


  useEffect(() => {
    const WOW = require('wowjs');
    window.wow = new WOW.WOW({ live: false });
    window.wow.init();
  }, []);

  // Job count per company
  const jobCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    allJobs.forEach(j => {
      const key = (j.company || '').toLowerCase();
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [allJobs]);

  const getJobCount = (company: any) =>
    jobCountMap[(company.name || '').toLowerCase()] || 0;

  // Filter + sort
  const filtered = useMemo(() => {
    let list = companies.filter(c => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.location || '').toLowerCase().includes(search.toLowerCase());
      const matchIndustry = industry === 'All Industries' || (c.industry || '') === industry;
      return matchSearch && matchIndustry;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'name_asc')  return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'jobs_desc') return getJobCount(b) - getJobCount(a);
      if (sortBy === 'jobs_asc')  return getJobCount(a) - getJobCount(b);
      return 0;
    });

    return list;
  }, [companies, search, industry, sortBy, jobCountMap]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, industry, sortBy]);

  const gridViewSVG = (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none">
      <path d="M4.5 0H0.500478C0.5 0.380952 0.5 0.596931 0.5 1.33333V14.6667C0.5 15.4031 0.500478 16 0.500478 16H4.5C4.5 16 4.5 15.4031 4.5 14.6667V1.33333C4.5 0.596931 4.5 0.380952 4.5 0Z" fill="currentColor"/>
      <path d="M10.5 0H6.50048C6.5 0.380952 6.5 0.596931 6.5 1.33333V14.6667C6.5 15.4031 6.50048 16 6.50048 16H10.5C10.5 16 10.5 15.4031 10.5 14.6667V1.33333C10.5 0.596931 10.5 0.380952 10.5 0Z" fill="currentColor"/>
      <path d="M16.5 0H12.5005C12.5 0.380952 12.5 0.596931 12.5 1.33333V14.6667C12.5 15.4031 12.5005 16 12.5005 16H16.5C16.5 16 16.5 15.4031 16.5 14.6667V1.33333C16.5 0.596931 16.5 0.380952 16.5 0Z" fill="currentColor"/>
    </svg>
  );
  const listViewSVG = (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none">
      <path d="M0.5 12.001L0.5 16.0005C0.880952 16.001 1.09693 16.001 1.83333 16.001L15.1667 16.001C15.9031 16.001 16.5 16.0005 16.5 16.0005L16.5 12.001C16.5 12.001 15.9031 12.001 15.1667 12.001L1.83333 12.001C1.09693 12.001 0.880952 12.001 0.5 12.001Z" fill="currentColor"/>
      <path d="M0.5 6.00098L0.5 10.0005C0.880952 10.001 1.09693 10.001 1.83333 10.001L15.1667 10.001C15.9031 10.001 16.5 10.0005 16.5 10.0005L16.5 6.00098C16.5 6.00098 15.9031 6.00098 15.1667 6.00098L1.83333 6.00098C1.09693 6.00098 0.880952 6.00098 0.5 6.00098Z" fill="currentColor"/>
      <path d="M0.5 0.000976562L0.5 4.0005C0.880952 4.00098 1.09693 4.00098 1.83333 4.00098L15.1667 4.00098C15.9031 4.00098 16.5 4.0005 16.5 4.0005L16.5 0.000975863C16.5 0.000975863 15.9031 0.000975889 15.1667 0.000975921L1.83333 0.000976504C1.09693 0.000976536 0.880952 0.000976546 0.5 0.000976562Z" fill="currentColor"/>
    </svg>
  );

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .emp-search-bar {
          display: flex; align-items: center; gap: 10px;
          background: #fff; border: 1.5px solid #e5e5e5;
          border-radius: 10px; padding: 10px 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .emp-search-bar:focus-within {
          border-color: #14a077; box-shadow: 0 0 0 3px #14a07720;
        }
        .emp-search-bar input {
          border: none; outline: none; font-size: 14px;
          color: #333; background: transparent; flex: 1; min-width: 0;
        }
        .emp-select {
          border: 1.5px solid #e5e5e5; border-radius: 10px;
          padding: 10px 14px; font-size: 13px; color: #555;
          background: #fff; cursor: pointer; outline: none;
          transition: border-color 0.2s;
        }
        .emp-select:focus { border-color: #14a077; }
        .page-btn {
          width: 38px; height: 38px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid #e5e5e5; background: #fff;
          cursor: pointer; font-size: 14px; color: #555;
          transition: all 0.2s; font-weight: 600;
        }
        .page-btn:hover, .page-btn.active {
          background: #14a077; color: #fff; border-color: #14a077;
        }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      {/* ── Header ── */}
      <Header4 clname="actEm1" />

      {/* ── Breadcrumb ── */}
      <section className="breadcrumb-section">
        <div className="tf-container">
          <div className="row">
            <div className="col-lg-12">
              <div className="breadcrumb-inner">
                <div className="wd-breadcrumb">
                  <h3>Employers</h3>
                  <ul className="breadcrumbs d-flex aln-center">
                    <li><Link href="/">Home</Link></li>
                    <li>Employers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Search Bar (Form2 equivalent) ── */}
      <section style={{ background: '#f8f9fb', padding: '24px 0', borderBottom: '1px solid #efefef' }}>
        <div className="tf-container">
          <div className="row" style={{ alignItems: 'center', gap: '12px 0' }}>
            {/* Keyword search */}
            <div className="col-lg-5 col-md-6">
              <div className="emp-search-bar">
                <i className="icon-search" style={{ color: '#aaa', fontSize: 18 }}></i>
                <input
                  placeholder="Search companies, industries..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 18 }}>×</button>
                )}
              </div>
            </div>

            {/* Industry filter */}
            <div className="col-lg-4 col-md-4" style={{ paddingLeft: 12 }}>
              <select
                className="emp-select"
                style={{ width: '100%' }}
                value={industry}
                onChange={e => setIndustry(e.target.value)}
              >
                {INDUSTRY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Search button */}
            <div className="col-lg-3 col-md-2" style={{ paddingLeft: 12 }}>
              <button
                className="tf-btn-submit"
                style={{ width: '100%', height: 46, borderRadius: 10 }}
                onClick={() => setPage(1)}
              >
                <i className="icon-search" style={{ marginRight: 8 }}></i>
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <section className="inner-employer-section">
        <div className="tf-container">
          <div className="row">
            <Tabs className="col-lg-12 tf-tab">

              {/* ── Toolbar ── */}
              <div className="wd-meta-select-job">
                <div className="wd-findjob-filer">
                  <div className="group-select-display">
                    <TabList className="inner menu-tab">
                      {/* Grid view */}
                      <Tab className="btn-display">{gridViewSVG}</Tab>
                      {/* List view */}
                      <Tab className="btn-display">{listViewSVG}</Tab>
                    </TabList>
                    <p className="nofi-job">
                      <span>{filtered.length}</span> employer{filtered.length !== 1 ? 's' : ''} found
                    </p>
                  </div>

                  {/* Sort dropdown */}
                  <select
                    className="emp-select"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    style={{ minWidth: 160 }}
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── Tab content ── */}
              <div className="content-tab">

                {/* ════ Grid View ════ */}
                <TabPanel className="inner">
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                      <div style={{ width: 44, height: 44, border: '3px solid #eee', borderTopColor: '#14a077', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                      <p style={{ color: '#999' }}>Loading employers...</p>
                    </div>
                  ) : paginated.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                      <div style={{ fontSize: 56, marginBottom: 12 }}>🏢</div>
                      <h4 style={{ color: '#1a1a2e', margin: '0 0 8px' }}>No employers found</h4>
                      <p style={{ color: '#888', margin: '0 0 20px' }}>Try adjusting your search or filters</p>
                      <button onClick={() => { setSearch(''); setIndustry('All Industries'); }}
                        style={{ padding: '10px 24px', borderRadius: 10, background: '#14a077', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    <div className="group-col-3">
                      {paginated.map(company => (
                        <GridCard key={company.id} company={company} jobCount={getJobCount(company)} />
                      ))}
                    </div>
                  )}
                  {/* Pagination */}
                  {!loading && totalPages > 1 && (
                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                  )}
                </TabPanel>

                {/* ════ List View ════ */}
                <TabPanel className="inner">
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                      <div style={{ width: 44, height: 44, border: '3px solid #eee', borderTopColor: '#14a077', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                      <p style={{ color: '#999' }}>Loading employers...</p>
                    </div>
                  ) : paginated.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                      <div style={{ fontSize: 56, marginBottom: 12 }}>🏢</div>
                      <h4 style={{ color: '#1a1a2e', margin: '0 0 8px' }}>No employers found</h4>
                      <p style={{ color: '#888', margin: '0 0 20px' }}>Try adjusting your search or filters</p>
                      <button onClick={() => { setSearch(''); setIndustry('All Industries'); }}
                        style={{ padding: '10px 24px', borderRadius: 10, background: '#14a077', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    <div className="group-col-2">
                      {paginated.map(company => (
                        <ListCard key={company.id} company={company} jobCount={getJobCount(company)} />
                      ))}
                    </div>
                  )}
                  {!loading && totalPages > 1 && (
                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                  )}
                </TabPanel>

              </div>
            </Tabs>
          </div>
        </div>
      </section>

      <Footer />
      <Gotop />
    </>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <ul className="pagination-job padding" style={{ display: 'flex', gap: 6, listStyle: 'none', padding: 0, justifyContent: 'center', marginTop: 32 }}>
      <li>
        <button className="page-btn" disabled={page === 1} onClick={() => onChange(page - 1)}>
          <i className="icon-keyboard_arrow_left"></i>
        </button>
      </li>
      {pages.map(p => (
        <li key={p}>
          <button className={`page-btn${page === p ? ' active' : ''}`} onClick={() => onChange(p)}>
            {p}
          </button>
        </li>
      ))}
      <li>
        <button className="page-btn" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
          <i className="icon-keyboard_arrow_right"></i>
        </button>
      </li>
    </ul>
  );
}
