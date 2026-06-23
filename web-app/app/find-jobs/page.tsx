'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Collapse } from 'react-collapse';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Header4 from '@/components/header/Header4';
import logo from '@/assets/images/logo.png';
import Footer from '@/components/footer';
import Gotop from '@/components/gotop';

import { useFirebaseJobs } from '@/lib/useFirebaseData';
import { generateJobUrl } from '@/lib/slug';



// ─── Filter Sidebar Popup ─────────────────────────────────────────────────────
function FilterPopup({
  isShow, handlePopup, filters, setFilters,
}: {
  isShow: boolean;
  handlePopup: () => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}) {
  return (
    <div className={`sidebar-popup${isShow ? ' modal-menu--open' : ''}`}>
      <div className="modal-menu__backdrop" onClick={handlePopup}></div>
      <div className="widget-filter">
        <form onSubmit={(e) => { e.preventDefault(); handlePopup(); }}>
          <div className="group-form">
            <label className="title">Search Company</label>
            <div className="group-input search-ip">
              <button type="button"><i className="icon-search"></i></button>
              <input
                type="text"
                placeholder="Job title, keywords or company"
                value={filters.keyword}
                onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
              />
            </div>
          </div>

          <div className="group-form">
            <label className="title">Job Type</label>
            <div className="group-input">
              <select
                className="react-dropdown select2"
                style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
                value={filters.jobType}
                onChange={(e) => setFilters((f) => ({ ...f, jobType: e.target.value }))}
              >
                <option value="">All Job Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Freelancer">Freelancer</option>
              </select>
            </div>
          </div>

          <div className="group-form">
            <label className="title">Experience Level</label>
            <div className="group-input">
              <select
                className="react-dropdown select2"
                style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
                value={filters.experience}
                onChange={(e) => setFilters((f) => ({ ...f, experience: e.target.value }))}
              >
                <option value="">All Levels</option>
                <option value="Entry">Entry Level</option>
                <option value="Mid">Mid Level</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>
            </div>
          </div>

          <div className="group-form">
            <label className="title">Category</label>
            <div className="group-input">
              <input
                type="text"
                placeholder="e.g. Technology, Finance..."
                style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
                value={filters.category}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
          </div>

          <button type="submit">Find Jobs</button>
          <button
            type="button"
            onClick={() => setFilters({ keyword: '', location: '', jobType: '', experience: '', category: '' })}
            style={{ marginTop: '10px', width: '100%', background: 'none', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '10px', cursor: 'pointer' }}
          >
            Clear Filters
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb({ title, className }: { title: string; className?: string }) {
  return (
    <section className={`bg-f5 ${className ?? ''}`}>
      <div className="tf-container">
        <div className="row">
          <div className="col-lg-12">
            <div className="page-title">
              <div className="widget-menu-link">
                <ul>
                  <li><Link href="/">Home</Link></li>
                  <li><Link href="#">{title}</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── All major Indian cities ──────────────────────────────────────────────────
const CITY_LIST = [
  "All Locations",
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
  "Kolkata", "Pune", "Ahmedabad", "Noida", "Gurgaon",
  "Jaipur", "Lucknow", "Chandigarh", "Bhopal", "Indore",
  "Nagpur", "Coimbatore", "Surat", "Kochi", "Visakhapatnam",
  "Vadodara", "Agra", "Nashik", "Thiruvananthapuram", "Patna",
  "Ranchi", "Bhubaneswar", "Mysuru", "Mangalore", "Madurai",
  "Tiruchirappalli", "Dehradun", "Amritsar", "Ludhiana",
  "Guwahati", "Raipur", "Jodhpur", "Udaipur", "Varanasi",
  "Allahabad", "Meerut", "Remote", "Pan India",
];

// ─── Search Form Bar ──────────────────────────────────────────────────────────
function SearchBar({
  filters, setFilters, onSearch,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onSearch: () => void;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);
  const [locSearch, setLocSearch] = useState('');

  const filteredCities = CITY_LIST.filter((c) =>
    c.toLowerCase().includes(locSearch.toLowerCase())
  );

  const selectCity = (city: string) => {
    setFilters((f) => ({ ...f, location: city === 'All Locations' ? '' : city }));
    setLocOpen(false);
    setLocSearch('');
  };

  const displayLocation = filters.location || 'All Locations';

  return (
    <section className="form-sticky stc1">
      <div className="tf-container">
        <div className="job-search-form inner-form-map st1">
          <form onSubmit={(e) => { e.preventDefault(); onSearch(); }}>
            <div className="row-group-search">
              <div className="form-group-1">
                <input
                  type="text"
                  className="input-filter-search"
                  placeholder="Job title, keywords or company"
                  value={filters.keyword}
                  onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
                />
                <span className="icon-search search-job"></span>
              </div>
              <div
                className="form-group-2"
                style={{ position: 'relative' }}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Element)) {
                    setLocOpen(false);
                    setLocSearch('');
                  }
                }}
              >
                <span className="icon-map-pin"></span>
                <div
                  onClick={() => { setLocOpen(!locOpen); setLocSearch(''); }}
                  style={{
                    cursor: 'pointer', padding: '0 30px', display: 'flex',
                    alignItems: 'center', height: '100%', minWidth: 140,
                    userSelect: 'none', fontSize: 14,
                    color: filters.location ? '#333' : '#999',
                  }}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setLocOpen(!locOpen)}
                >
                  {displayLocation}
                  <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.5, paddingLeft: 8, transition: 'transform 0.2s', transform: locOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                </div>

                {locOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                    background: '#fff', borderRadius: 12,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
                    width: 240, zIndex: 999,
                    border: '1px solid #f0f0f0', overflow: 'hidden',
                  }}>
                    {/* Typeahead */}
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0' }}>
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search city..."
                        value={locSearch}
                        onChange={(e) => setLocSearch(e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{
                          width: '100%', border: '1px solid #e0e0e0', borderRadius: 8,
                          padding: '7px 10px', fontSize: 13, outline: 'none',
                          background: '#f8f9fa', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    {/* City list */}
                    <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                      {filteredCities.length === 0 ? (
                        <div style={{ padding: '14px 30px', fontSize: 13, color: '#999' }}>No cities found</div>
                      ) : (
                        filteredCities.map((city) => (
                          <div
                            key={city}
                            onMouseDown={(e) => { e.preventDefault(); selectCity(city); }}
                            style={{
                              padding: '10px 16px', fontSize: 14, cursor: 'pointer',
                              color: displayLocation === city ? '#14a077' : '#333',
                              fontWeight: displayLocation === city ? 600 : 400,
                              background: displayLocation === city ? '#f0faf6' : 'transparent',
                              display: 'flex', alignItems: 'center', gap: 8,
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => { if (displayLocation !== city) (e.currentTarget as HTMLDivElement).style.background = '#f8f9fa'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = displayLocation === city ? '#f0faf6' : 'transparent'; }}
                          >
                            {city}
                            {displayLocation === city && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#14a077' }}>✓</span>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group-3">
                <span className="icon-filter"></span>
                <div
                  className={`filter-radio${filterOpen ? ' open' : ''}`}
                  onClick={() => setFilterOpen(!filterOpen)}
                  style={{ cursor: 'pointer' }}
                >
                  <p>Filter More</p>
                </div>
              </div>
              {filterOpen && (
                <div className="wd-filter-radio modal-menu--open">
                  <div className="content">
                    <div className="fl-cl lc2">
                      <h6>All Job Types</h6>
                      <ul>
                        {['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelancer'].map((type) => (
                          <li key={type}>
                            <div className="round">
                              <input
                                type="checkbox"
                                id={`type-${type}`}
                                checked={filters.jobType === type}
                                onChange={() => setFilters((f) => ({ ...f, jobType: f.jobType === type ? '' : type }))}
                              />
                              <label htmlFor={`type-${type}`}></label>
                            </div>
                            <label>{type}</label>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="fl-cl lc1">
                      <h6>Experience Level</h6>
                      <ul>
                        {['Entry', 'Mid', 'Senior', 'Lead'].map((exp) => (
                          <li key={exp}>
                            <div className="round">
                              <input
                                type="checkbox"
                                id={`exp-${exp}`}
                                checked={filters.experience === exp}
                                onChange={() => setFilters((f) => ({ ...f, experience: f.experience === exp ? '' : exp }))}
                              />
                              <label htmlFor={`exp-${exp}`}></label>
                            </div>
                            <label>{exp} Level</label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              <div className="form-group-4">
                <button className="btn btn-find" type="submit">Find Jobs</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Filters {
  keyword: string;
  location: string;
  jobType: string;
  experience: string;
  category: string;
}

// ─── URL helper ───────────────────────────────────────────────────────────────
function updateURL(overrides: Record<string, string>) {
  if (typeof window === 'undefined') return '/find-jobs';
  const p = new URLSearchParams(window.location.search);
  Object.entries(overrides).forEach(([k, v]) => {
    if (v) p.set(k, v); else p.delete(k);
  });
  const qs = p.toString();
  return `/find-jobs${qs ? `?${qs}` : ''}`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function FindJobsInner() {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get('category') || '';
  const urlKeyword  = searchParams.get('keyword')  || '';
  const urlLocation = searchParams.get('location') || '';

  const [isShowFilter, setShowFilter] = useState(false);
  const [toggle, setToggle] = useState({ key: '', status: false });
  const [filters, setFilters] = useState<Filters>({
    keyword: urlKeyword, location: urlLocation, jobType: '', experience: '', category: urlCategory,
  });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({
    keyword: urlKeyword, location: urlLocation, jobType: '', experience: '', category: urlCategory,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 8;

  const handleToggle = (key: string) => {
    setToggle((prev) => prev.key === key ? { key: '', status: false } : { key, status: true });
  };

  const { jobs: allJobs, loading } = useFirebaseJobs(100);

  useEffect(() => {
    const WOW = require('wowjs');
    window.wow = new WOW.WOW({ live: false });
    window.wow.init();
  }, []);



  const handlePopup = () => {
    const el = document.querySelector('.sidebar-popup');
    setShowFilter(!isShowFilter);
    !isShowFilter ? el?.classList.add('modal-menu--open') : el?.classList.remove('modal-menu--open');
  };

  const applySearch = () => {
    setAppliedFilters({ ...filters });
    setCurrentPage(1);
  };

  // Filter logic
  const filteredJobs = useMemo(() => {
    return allJobs.filter((job) => {
      const kw = appliedFilters.keyword.toLowerCase();
      const loc = appliedFilters.location.toLowerCase();
      const matchKeyword = !kw ||
        job.title?.toLowerCase().includes(kw) ||
        job.company?.toLowerCase().includes(kw) ||
        job.category?.toLowerCase().includes(kw);
      const matchLocation = !loc || job.location?.toLowerCase().includes(loc);
      const matchJobType = !appliedFilters.jobType || job.experience === appliedFilters.jobType;
      const matchExperience = !appliedFilters.experience || job.experience === appliedFilters.experience;
      const matchCategory = !appliedFilters.category ||
        job.category?.toLowerCase().includes(appliedFilters.category.toLowerCase());
      return matchKeyword && matchLocation && matchJobType && matchExperience && matchCategory;
    });
  }, [allJobs, appliedFilters]);

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const pagedJobs = filteredJobs.slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage);

  const getInitial = (name?: string) => (name || '?')[0]?.toUpperCase() ?? '?';

  return (
    <>
      <FilterPopup
        isShow={isShowFilter}
        handlePopup={handlePopup}
        filters={filters}
        setFilters={setFilters}
      />

      <Header4 clname="actJob1" />

      <Breadcrumb title="Find Jobs" className="breadcrumb-section" />

      <SearchBar filters={filters} setFilters={setFilters} onSearch={applySearch} />

      {/* ── Job Grid Section ─────────────────────────────────── */}
      <section className="inner-jobs-section">
        <div className="tf-container">
          <div className="row">
            <Tabs className="col-lg-12 tf-tab">
              {/* ── Toolbar ── */}
              <div className="wd-meta-select-job">
                <div className="wd-findjob-filer">
                  <div className="group-select-display">
                    <Link className="button-filter st2" href="#" onClick={(e) => { e.preventDefault(); handlePopup(); }}>
                      <i className="icon-filter"></i> Filters
                    </Link>
                    <TabList className="inner menu-tab">
                      {/* Grid view icon */}
                      <Tab className="btn-display">
                        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none">
                          <path d="M4.5 0H0.500478C0.5 0.380952 0.5 0.596931 0.5 1.33333V14.6667C0.5 15.4031 0.500478 16 0.500478 16H4.5C4.5 16 4.5 15.4031 4.5 14.6667V1.33333C4.5 0.596931 4.5 0.380952 4.5 0Z" fill="white"/>
                          <path d="M10.5 0H6.50048C6.5 0.380952 6.5 0.596931 6.5 1.33333V14.6667C6.5 15.4031 6.50048 16 6.50048 16H10.5C10.5 16 10.5 15.4031 10.5 14.6667V1.33333C10.5 0.596931 10.5 0.380952 10.5 0Z" fill="white"/>
                          <path d="M16.5 0H12.5005C12.5 0.380952 12.5 0.596931 12.5 1.33333V14.6667C12.5 15.4031 12.5005 16 12.5005 16H16.5C16.5 16 16.5 15.4031 16.5 14.6667V1.33333C16.5 0.596931 16.5 0.380952 16.5 0Z" fill="white"/>
                        </svg>
                      </Tab>
                      {/* List view icon */}
                      <Tab className="btn-display">
                        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none">
                          <path d="M0.5 12.001L0.5 16.0005C0.880952 16.001 1.09693 16.001 1.83333 16.001L15.1667 16.001C15.9031 16.001 16.5 16.0005 16.5 16.0005L16.5 12.001C16.5 12.001 15.9031 12.001 15.1667 12.001L1.83333 12.001C1.09693 12.001 0.880952 12.001 0.5 12.001Z" fill="#A0A0A0"/>
                          <path d="M0.5 6.001L0.5 10.0005C0.880952 10.001 1.09693 10.001 1.83333 10.001L15.1667 10.001C15.9031 10.001 16.5 10.0005 16.5 10.0005L16.5 6.001C16.5 6.001 15.9031 6.001 15.1667 6.001L1.83333 6.001C1.09693 6.001 0.880952 6.001 0.5 6.001Z" fill="#A0A0A0"/>
                          <path d="M0.5 0.001L0.5 4.0005C0.880952 4.001 1.09693 4.001 1.83333 4.001L15.1667 4.001C15.9031 4.001 16.5 4.0005 16.5 4.0005L16.5 0.001C16.5 0.001 15.9031 0.001 15.1667 0.001L1.83333 0.001C1.09693 0.001 0.880952 0.001 0.5 0.001Z" fill="#A0A0A0"/>
                        </svg>
                      </Tab>
                    </TabList>
                    <p className="nofi-job">
                      <span>{filteredJobs.length}</span> jobs found
                    </p>
                  </div>
                  {/* Sort */}
                  <div className="sort-by">
                    <select
                      style={{ border: '1px solid #e0e0e0', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      <option>Newest First</option>
                      <option>Oldest First</option>
                      <option>A-Z</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* ── Active Filter Chips ── */}
              {(appliedFilters.keyword || appliedFilters.location || appliedFilters.category) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0 4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, color: '#666', whiteSpace: 'nowrap' }}>Filtering by:</span>

                  {/* Keyword chip */}
                  {appliedFilters.keyword && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eef2ff', color: '#4f46e5', border: '1px solid #4f46e5', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
                      🔍 {appliedFilters.keyword}
                      <button onClick={() => { setFilters(f => ({ ...f, keyword: '' })); setAppliedFilters(f => ({ ...f, keyword: '' })); setCurrentPage(1); window.history.replaceState({}, '', updateURL({ keyword: '' })); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4f46e5', padding: 0, fontSize: 16, lineHeight: 1, marginLeft: 2 }} aria-label="Clear keyword">×</button>
                    </span>
                  )}

                  {/* Location chip */}
                  {appliedFilters.location && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e8f4ff', color: '#0891b2', border: '1px solid #0891b2', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
                      📍 {appliedFilters.location}
                      <button onClick={() => { setFilters(f => ({ ...f, location: '' })); setAppliedFilters(f => ({ ...f, location: '' })); setCurrentPage(1); window.history.replaceState({}, '', updateURL({ location: '' })); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0891b2', padding: 0, fontSize: 16, lineHeight: 1, marginLeft: 2 }} aria-label="Clear location">×</button>
                    </span>
                  )}

                  {/* Category chip */}
                  {appliedFilters.category && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e8f5ef', color: '#14a077', border: '1px solid #14a077', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
                      🗂 {appliedFilters.category}
                      <button onClick={() => { setFilters(f => ({ ...f, category: '' })); setAppliedFilters(f => ({ ...f, category: '' })); setCurrentPage(1); window.history.replaceState({}, '', updateURL({ category: '' })); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#14a077', padding: 0, fontSize: 16, lineHeight: 1, marginLeft: 2 }} aria-label="Clear category">×</button>
                    </span>
                  )}

                  {/* Clear all */}
                  {[appliedFilters.keyword, appliedFilters.location, appliedFilters.category].filter(Boolean).length > 1 && (
                    <button onClick={() => { setFilters(f => ({ ...f, keyword: '', location: '', category: '' })); setAppliedFilters(f => ({ ...f, keyword: '', location: '', category: '' })); setCurrentPage(1); window.history.replaceState({}, '', '/find-jobs'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c', fontSize: 13, fontWeight: 600, textDecoration: 'underline' }}>Clear all</button>
                  )}

                  <span style={{ fontSize: 13, color: '#999' }}>({filteredJobs.length} jobs found)</span>
                </div>
              )}


              <div className="content-tab">
                {/* ── Grid View (TabPanel 1) ── */}
                <TabPanel className="inner">
                  {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#999' }}>
                      <p>Loading jobs...</p>
                    </div>
                  ) : pagedJobs.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#999' }}>
                      <p style={{ fontSize: '18px', fontWeight: 600 }}>No jobs found</p>
                      <p style={{ marginTop: '8px' }}>Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    <div className="group-col-2">
                      {pagedJobs.map((job) => (
                        <div key={job.id} className="features-job cl2">
                          <div className="job-archive-header">
                            <div className="inner-box">
                              <div className="logo-company">
                                <div style={{
                                  width: '54px', height: '54px', borderRadius: '8px',
                                  background: '#eef2ff', color: '#4f46e5',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '22px', fontWeight: 700,
                                }}>
                                  {getInitial(job.company)}
                                </div>
                              </div>
                              <div className="box-content">
                                <h4><Link href={generateJobUrl(job.id, job.company)}>{job.company}</Link></h4>
                                <h3>
                                  <Link href={generateJobUrl(job.id, job.title)}> {job.title} </Link>
                                  <span className="icon-bolt"></span>
                                </h3>
                                <ul>
                                  {job.location && (
                                    <li><span className="icon-map-pin"></span>{job.location}</li>
                                  )}
                                  {job.createdAt && (
                                    <li>
                                      <span className="icon-calendar"></span>
                                      {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </li>
                                  )}
                                </ul>
                                <span className="icon-heart"></span>
                              </div>
                            </div>
                          </div>
                          <div className="job-archive-footer">
                            <div className="job-footer-left">
                              <ul className="job-tag">
                                {job.experience && <li><Link href="#">{job.experience}</Link></li>}
                                {job.category && <li><Link href="#">{job.category}</Link></li>}
                              </ul>
                              <div className="star">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className="icon-star-full"></span>
                                ))}
                              </div>
                            </div>
                            <div className="job-footer-right">
                              <div className="price">
                                <span className="icon-dolar1"></span>
                                <p>
                                  {job.salary
                                    ? <>{job.currency || '₹'} {job.salary}<span className="year">/year</span></>
                                    : 'Salary not disclosed'}
                                </p>
                              </div>
                              <p className="days">Apply Now</p>
                            </div>
                          </div>
                          <Link href={generateJobUrl(job.id, job.title)} className="jobtex-link-item" tabIndex={0}></Link>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <ul className="pagination-job padding">
                      <li>
                        <button
                          className={currentPage === 1 ? 'disabled' : ''}
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <i className="icon-keyboard_arrow_left"></i>
                        </button>
                      </li>
                      {[...Array(totalPages)].map((_, i) => (
                        <li key={i} className={currentPage === i + 1 ? 'current' : ''}>
                          <button
                            onClick={() => setCurrentPage(i + 1)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            {i + 1}
                          </button>
                        </li>
                      ))}
                      <li>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <i className="icon-keyboard_arrow_right"></i>
                        </button>
                      </li>
                    </ul>
                  )}
                </TabPanel>

                {/* ── List View (TabPanel 2) ── */}
                <TabPanel className="inner">
                  {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#999' }}>Loading jobs...</div>
                  ) : pagedJobs.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#999' }}>No jobs found</div>
                  ) : (
                    pagedJobs.map((job) => (
                      <div key={job.id} className="features-job style-3">
                        <div className="inner-box">
                          <div className="company">
                            <div className="logo-company">
                              <div style={{
                                width: '54px', height: '54px', borderRadius: '8px',
                                background: '#eff6ff', color: '#2563eb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '20px', fontWeight: 700,
                              }}>
                                {getInitial(job.company)}
                              </div>
                            </div>
                            <div className="box-content">
                              <h4><Link href={generateJobUrl(job.id, job.company)}>{job.company}</Link></h4>
                              <h3>
                                <Link href={generateJobUrl(job.id, job.title)}>{job.title}</Link>
                                <span className="icon-bolt"></span>
                              </h3>
                              <div className="star">
                                {[...Array(5)].map((_, i) => <span key={i} className="icon-star-full"></span>)}
                              </div>
                            </div>
                          </div>
                          <ul className="info">
                            {job.location && <li><span className="icon-map-pin"></span>{job.location}</li>}
                            {job.createdAt && (
                              <li>{new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</li>
                            )}
                          </ul>
                          <div className="category">
                            <ul className="job-tag">
                              {job.experience && <li><Link href="#">{job.experience}</Link></li>}
                              {job.category && <li><Link href="#">{job.category}</Link></li>}
                            </ul>
                          </div>
                          <div className="salary">
                            <span className="icon-dolar1"></span>
                            <p>
                              {job.salary
                                ? <>{job.currency || '₹'} {job.salary} <span className="year">/year</span></>
                                : 'Salary not disclosed'}
                            </p>
                          </div>
                          <div className="group-btn">
                            <span className="icon-heart"></span>
                            <Link href={generateJobUrl(job.id, job.title)}><button>Apply</button></Link>
                          </div>
                        </div>
                        <Link href={generateJobUrl(job.id, job.title)} className="jobtex-link-item" tabIndex={0}></Link>
                      </div>
                    ))
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <ul className="pagination-job padding">
                      <li>
                        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                          <i className="icon-keyboard_arrow_left"></i>
                        </button>
                      </li>
                      {[...Array(totalPages)].map((_, i) => (
                        <li key={i} className={currentPage === i + 1 ? 'current' : ''}>
                          <button onClick={() => setCurrentPage(i + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>{i + 1}</button>
                        </li>
                      ))}
                      <li>
                        <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                          <i className="icon-keyboard_arrow_right"></i>
                        </button>
                      </li>
                    </ul>
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

export default function FindJobsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#999', fontSize: 18 }}>Loading...</p></div>}>
      <FindJobsInner />
    </Suspense>
  );
}

