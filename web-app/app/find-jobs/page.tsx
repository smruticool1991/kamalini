'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

// ─── Search Form Bar ──────────────────────────────────────────────────────────
function SearchBar({
  filters, setFilters, onSearch,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onSearch: () => void;
}) {
  const [filterOpen, setFilterOpen] = useState(false);

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
              <div className="form-group-2">
                <span className="icon-map-pin"></span>
                <input
                  type="text"
                  placeholder="Location"
                  style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }}
                  value={filters.location}
                  onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
                />
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
export default function FindJobsPage() {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get('category') || '';
  const urlKeyword  = searchParams.get('keyword')  || '';
  const urlLocation = searchParams.get('location') || '';

  const [isShowMobile, setShowMobile] = useState(false);
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


  const handleMobile = () => {
    const el = document.querySelector('.menu-mobile-popup');
    setShowMobile(!isShowMobile);
    !isShowMobile ? el?.classList.add('modal-menu--open') : el?.classList.remove('modal-menu--open');
  };

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
      {/* ── Exact same mobile menu as home page ── */}
      <div className="menu-mobile-popup">
        <div className="modal-menu__backdrop" onClick={handleMobile}></div>
        <div className="widget-filter">
          <div className="mobile-header">
            <div id="logo" className="logo">
              <Link href="/">
                <Image className="site-logo" src={logo} alt="Image" width={100} height={40} />
              </Link>
            </div>
            <span className="title-button-group" onClick={handleMobile} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
              <i className="icon-close"></i>
            </span>
          </div>

          <Tabs className="tf-tab">
            <TabList className="menu-tab">
              <Tab className="user-tag">Menu</Tab>
              <Tab className="user-tag">Categories</Tab>
            </TabList>

            <div className="content-tab">
              <TabPanel className="header-ct-center menu-moblie animation-tab">
                <div className="nav-wrap">
                  <nav className="main-nav mobile">
                    <ul id="menu-primary-menu" className="menu">
                      <li className="menu-item menu-item-has-children-mobile">
                        <Link href="#" className="iteam-menu" onClick={() => handleToggle('home')}>Home</Link>
                        <Collapse isOpened={toggle.key === 'home'}>
                          <ul className="sub-menu-mobile" style={{ display: toggle.key === 'home' ? 'block' : 'none' }}>
                            <li className="menu-item menu-item-mobile"><Link href="/">Home Page 01 </Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/home-v2">Home Page 02 </Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/home-v3">Home Page 03 </Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/home-v4">Home Page 04 </Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/home-v5">Home Page 05 </Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/home-v6">Home Page 06 </Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/home-v7">Home Page 07 </Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/home-v8">Home Page 08 </Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/home-v9">Home Page 09 </Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/home-v10">Home Page 10 </Link></li>
                          </ul>
                        </Collapse>
                      </li>

                      <li className="menu-item menu-item-has-children-mobile current-item">
                        <Link href="#" className="iteam-menu" onClick={() => handleToggle('job')}>Find jobs</Link>
                        <Collapse isOpened={toggle.key === 'job'}>
                          <ul className="sub-menu-mobile" style={{ display: toggle.key === 'job' ? 'block' : 'none' }}>
                            <li className="menu-item menu-item-mobile"><Link href="/joblist-v1">List Layout</Link></li>
                            <li className="menu-item menu-item-mobile current-item"><Link href="/find-jobs">Grid Layout</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/job-list-sidebar">List Sidebar</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/job-grid-sidebar">Grid Sidebar</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/joblist-v5">List Sidebar Fullwidth</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/joblist-v6">Grid Sidebar Fullwidth</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/joblist-v7">Top Map</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/joblist-v8">Top Map Sidebar</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/joblist-v9">Half Map - V1</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/joblist-v10">Half Map - V2</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/jobsingle-v1">Jobs Single - V1</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/jobsingle-v2">Jobs Single - V2</Link></li>
                          </ul>
                        </Collapse>
                      </li>

                      <li className="menu-item menu-item-has-children-mobile">
                        <Link href="#" className="iteam-menu" onClick={() => handleToggle('employers')}>Employers</Link>
                        <Collapse isOpened={toggle.key === 'employers'}>
                          <ul className="sub-menu-mobile" style={{ display: toggle.key === 'employers' ? 'block' : 'none' }}>
                            <li className="menu-item"><Link href="/employers-v1">List Layout</Link></li>
                            <li className="menu-item"><Link href="/employers-v2">Grid Layout</Link></li>
                            <li className="menu-item"><Link href="/employers-v3">List Sidebar</Link></li>
                            <li className="menu-item"><Link href="/employers-v4">Grid Sidebar</Link></li>
                            <li className="menu-item"><Link href="/employers-v5">Full Width</Link></li>
                            <li className="menu-item"><Link href="/employers-v6">Top Map</Link></li>
                            <li className="menu-item"><Link href="/employers-v7">Half Map</Link></li>
                            <li className="menu-item"><Link href="/employersingle-v1">Employers Single - V1</Link></li>
                            <li className="menu-item"><Link href="/employersingle-v2">Employers Single - V2</Link></li>
                            <li className="menu-item"><Link href="/employerreview">Employers Reviews</Link></li>
                            <li className="menu-item"><Link href="/employernotfound">Employers Not Found</Link></li>
                          </ul>
                        </Collapse>
                      </li>

                      <li className="menu-item menu-item-has-children-mobile">
                        <Link href="#" className="iteam-menu" onClick={() => handleToggle('candidate')}>Candidates</Link>
                        <Collapse isOpened={toggle.key === 'candidate'}>
                          <ul className="sub-menu-mobile" style={{ display: toggle.key === 'candidate' ? 'block' : 'none' }}>
                            <li className="menu-item menu-item-mobile"><Link href="/candidates-v1">List Layout</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/candidates-v2">Grid Layout</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/candidates-v3">List Sidebar</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/candidates-v4">Top Map</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/candidates-v5">Half Map</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/candidates-v6">No Available V1</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/candidates-v7">No Available V2</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/candidatesingle-v1">Candidate Single - V1</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/candidatesingle-v2">Candidate Single - V2</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/samplecv">Sample CV</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/samplecvslidebar">Sample CV Sidebar</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/samplecvdetails">CV Details</Link></li>
                          </ul>
                        </Collapse>
                      </li>

                      <li className="menu-item menu-item-has-children-mobile">
                        <Link href="#" className="iteam-menu" onClick={() => handleToggle('blog')}>Blog</Link>
                        <Collapse isOpened={toggle.key === 'blog'}>
                          <ul className="sub-menu-mobile" style={{ display: toggle.key === 'blog' ? 'block' : 'none' }}>
                            <li className="menu-item menu-item-mobile"><Link href="/blog-v1">Blog List </Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/blog-v2">Blog Grid</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/blog-v3">Blog Masonry</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/blogsingle-v1">Blog Details - V1</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/blogsingle-v2">Blog Details - V2</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/blogsingle-v3">Blog Details Sidebar</Link></li>
                          </ul>
                        </Collapse>
                      </li>

                      <li className="menu-item menu-item-has-children-mobile">
                        <Link href="#" className="iteam-menu" onClick={() => handleToggle('pages')}>Pages</Link>
                        <Collapse isOpened={toggle.key === 'pages'}>
                          <ul className="sub-menu-mobile" style={{ display: toggle.key === 'pages' ? 'block' : 'none' }}>
                            <li className="menu-item menu-item-mobile"><Link href="/aboutus">About Us</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/faqs">FAQS</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/termsofuse">Terms Of Use</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/pricing">Pricing</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/shop">Shop List</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/shoppingcart">Shopping Cart</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/shopsingle">Shop Single</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/checkout">Checkout</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/login">Login</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/createaccount">Create Account</Link></li>
                            <li className="menu-item menu-item-mobile"><Link href="/contactus">Contact Us</Link></li>
                          </ul>
                        </Collapse>
                      </li>
                    </ul>
                  </nav>
                </div>
              </TabPanel>

              <TabPanel className="categories animation-tab">
                <div className="sub-categorie-mobile">
                  <ul className="pop-up">
                    <li className="categories-mobile"><Link href="/jobsingle-v1"><span className="icon-categorie-1"></span>Design &amp; Creative</Link></li>
                    <li className="categories-mobile"><Link href="/jobsingle-v1"><span className="icon-categorie-8"></span>Digital Marketing</Link></li>
                    <li className="categories-mobile"><Link href="/jobsingle-v1"><span className="icon-categorie-2"></span>Development &amp; IT</Link></li>
                    <li className="categories-mobile"><Link href="/jobsingle-v1"><span className="icon-categorie-3"></span>Music &amp; Audio</Link></li>
                    <li className="categories-mobile"><Link href="/jobsingle-v1"><span className="icon-categorie-4"></span>Finance &amp; Accounting</Link></li>
                    <li className="categories-mobile"><Link href="/jobsingle-v1"><span className="icon-categorie-5"></span>Programming &amp; Tech</Link></li>
                    <li className="categories-mobile"><Link href="/jobsingle-v1"><span className="icon-categorie-6"></span>Video &amp; Animation</Link></li>
                    <li className="categories-mobile"><Link href="/jobsingle-v1"><span className="icon-categorie-7"></span>Writing &amp; translation</Link></li>
                  </ul>
                </div>
              </TabPanel>
            </div>
          </Tabs>

          <div className="header-customize-item button">
            <Link href="/">Upload Resume</Link>
          </div>

          <div className="mobile-footer">
            <div className="icon-infor d-flex aln-center">
              <div className="icon">
                <span className="icon-call-calling">
                  <span className="path1"></span>
                  <span className="path2"></span>
                  <span className="path3"></span>
                  <span className="path4"></span>
                </span>
              </div>
              <div className="content">
                <p>Need help? 24/7</p>
                <h6><Link href="tel:0123456678">001-1234-88888</Link></h6>
              </div>
            </div>
            <div className="wd-social d-flex aln-center">
              <ul className="list-social d-flex aln-center">
                <li><Link href="#"><i className="icon-facebook"></i></Link></li>
                <li><Link href="#"><i className="icon-linkedin2"></i></Link></li>
                <li><Link href="#"><i className="icon-twitter"></i></Link></li>
                <li><Link href="#"><i className="icon-pinterest"></i></Link></li>
                <li><Link href="#"><i className="icon-instagram1"></i></Link></li>
                <li><Link href="#"><i className="icon-youtube"></i></Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <FilterPopup
        isShow={isShowFilter}
        handlePopup={handlePopup}
        filters={filters}
        setFilters={setFilters}
      />

      <Header4 clname="actJob1" handleMobile={handleMobile} />

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
                                <h4><Link href={`/jobs/${job.id}`}>{job.company}</Link></h4>
                                <h3>
                                  <Link href={`/jobs/${job.id}`}> {job.title} </Link>
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
                          <Link href={`/jobs/${job.id}`} className="jobtex-link-item" tabIndex={0}></Link>
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
                              <h4><Link href={`/jobs/${job.id}`}>{job.company}</Link></h4>
                              <h3>
                                <Link href={`/jobs/${job.id}`}>{job.title}</Link>
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
                            <Link href={`/jobs/${job.id}`}><button>Apply</button></Link>
                          </div>
                        </div>
                        <Link href={`/jobs/${job.id}`} className="jobtex-link-item" tabIndex={0}></Link>
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
