'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { Collapse } from 'react-collapse';
import { Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, type User } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import Header4 from '@/components/header/Header4';
import Footer from '@/components/footer';
import Gotop from '@/components/gotop';
import logo from '@/assets/images/logo.png';
import {
  useFirebaseCompany,
  useFirebaseJobs,
  useFirebaseReviews,
  addFirebaseReview,
} from '@/lib/useFirebaseData';
import { generateJobUrl } from '@/lib/slug';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];
const getColor = (name?: string) => COLORS[(name?.charCodeAt(0) ?? 0) % COLORS.length];
const getInitials = (name?: string) =>
  (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

function timeAgo(ts: Timestamp | string | null | undefined): string {
  if (!ts) return '';
  const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts as string);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day ago';
  if (diff < 30) return `${diff} days ago`;
  if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
  return `${Math.floor(diff / 365)} years ago`;
}

function formatDate(ts: Timestamp | string | null | undefined): string {
  if (!ts) return '';
  const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts as string);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

const VERIFIED_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 21 20" fill="none"
    style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }}>
    <path fillRule="evenodd" clipRule="evenodd"
      d="M0.5 10C0.5 4.477 4.977 0 10.5 0C16.023 0 20.5 4.477 20.5 10C20.5 15.523 16.023 20 10.5 20C4.977 20 0.5 15.523 0.5 10Z"
      fill="#14a077" />
    <path d="M8.896 13.843L5.646 10.356C5.451 10.147 5.451 9.807 5.646 9.598L6.354 8.839C6.549 8.63 6.865 8.63 7.061 8.839L9.25 11.188L13.939 6.157C14.135 5.948 14.451 5.948 14.646 6.157L15.354 6.916C15.549 7.125 15.549 7.465 15.354 7.674L9.604 13.843C9.408 14.052 9.092 14.052 8.896 13.843Z"
      fill="white" />
  </svg>
);

// ─── Star Display ─────────────────────────────────────────────────────────────
function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= rating ? '#f59e0b' : '#d1d5db' }}>★</span>
      ))}
    </span>
  );
}

// ─── Star Progress Bar ────────────────────────────────────────────────────────
function StarBar({ stars, percent }: { stars: number; percent: number }) {
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, listStyle: 'none' }}>
      <Stars rating={stars} size={13} />
      <div style={{ flex: 1, height: 7, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${percent}%`, height: '100%', background: '#f59e0b', borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 12, color: '#888', minWidth: 32 }}>{percent}%</span>
    </li>
  );
}

// ─── Average rating calculator ────────────────────────────────────────────────
function calcStats(reviews: { rating: number }[]) {
  if (!reviews.length) return { avg: 0, count: 0, dist: [0, 0, 0, 0, 0] };
  const count = reviews.length;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / count;
  const dist = [5, 4, 3, 2, 1].map(
    s => Math.round((reviews.filter(r => r.rating === s).length / count) * 100)
  );
  return { avg: Math.round(avg * 10) / 10, count, dist };
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EmployerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { company, loading, error } = useFirebaseCompany(id);
  const { jobs: allJobs } = useFirebaseJobs(100);
  const { reviews, loading: reviewsLoading, refetch } = useFirebaseReviews(id);

  const [toggle, setToggle] = useState({ key: '', status: false });
  const [isShowMobile, setShowMobile] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  // Review form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewForm, setReviewForm] = useState({ name: '', email: '', review: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleToggle = (key: string) =>
    setToggle(prev => prev.key === key ? { key: '', status: false } : { key, status: true });

  const handleMobile = () => {
    const el = document.querySelector('.menu-mobile-popup');
    setShowMobile(!isShowMobile);
    !isShowMobile ? el?.classList.add('modal-menu--open') : el?.classList.remove('modal-menu--open');
  };

  // Watch auth state & pre-fill form from Google profile
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        setReviewForm(f => ({
          name: f.name || user.displayName || '',
          email: f.email || user.email || '',
          review: f.review,
        }));
      }
    });
    return () => unsub();
  }, []);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign in error:', err);
    } finally {
      setSigningIn(false);
    }
  };

  useEffect(() => {
    const WOW = require('wowjs');
    window.wow = new WOW.WOW({ live: false });
    window.wow.init();
  }, []);

  // Jobs by this company
  const companyJobs = allJobs.filter(j =>
    j.company?.toLowerCase() === company?.name?.toLowerCase() ||
    (j as any).companyId === id
  );

  // Review stats
  const stats = calcStats(reviews);
  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  // Submit review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setSubmitError('Please select a star rating.'); return; }
    if (!reviewForm.name.trim() || !reviewForm.review.trim()) { setSubmitError('Name and review are required.'); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      await addFirebaseReview(id, {
        name: reviewForm.name.trim(),
        email: reviewForm.email.trim(),
        rating,
        review: reviewForm.review.trim(),
      });
      setSubmitted(true);
      setReviewForm({ name: '', email: '', review: '' });
      setRating(0);
      await refetch();
    } catch (err) {
      console.error(err);
      setSubmitError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const accentColor = getColor(company?.name);

  // ─── Loading / Error states ──
  if (loading) return (
    <>
      <Header4 clname="actEm2" handleMobile={handleMobile} />
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid #e0e0e0', borderTopColor: '#14a077', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#999' }}>Loading employer details...</p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Footer />
    </>
  );

  if (error || !company) return (
    <>
      <Header4 clname="actEm2" handleMobile={handleMobile} />
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ fontSize: 20, fontWeight: 600, color: '#333' }}>Company not found</p>
        <Link href="/find-jobs" style={{ color: '#14a077', textDecoration: 'underline' }}>Browse Jobs</Link>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .emp-anim { animation: fadeUp 0.35s ease both; }
        .review-card { transition: box-shadow 0.2s, transform 0.2s; }
        .review-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.10) !important; transform: translateY(-2px); }
        .star-pick-btn { transition: transform 0.1s; background: none; border: none; cursor: pointer; padding: 2px; }
        .star-pick-btn:hover { transform: scale(1.25); }
      `}</style>

      {/* ── Mobile Menu ── */}
      <div className="menu-mobile-popup">
        <div className="modal-menu__backdrop" onClick={handleMobile}></div>
        <div className="widget-filter">
          <div className="mobile-header">
            <div id="logo" className="logo">
              <Link href="/"><Image className="site-logo" src={logo} alt="Logo" width={100} height={40} /></Link>
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
                      {[
                        { key: 'home', label: 'Home', items: [{ href: '/', label: 'Home' }] },
                        { key: 'job', label: 'Find Jobs', items: [{ href: '/find-jobs', label: 'Browse Jobs' }] },
                      ].map(item => (
                        <li key={item.key} className="menu-item menu-item-has-children-mobile">
                          <Link href="#" className="iteam-menu" onClick={() => handleToggle(item.key)}>{item.label}</Link>
                          <Collapse isOpened={toggle.key === item.key}>
                            <ul className="sub-menu-mobile" style={{ display: toggle.key === item.key ? 'block' : 'none' }}>
                              {item.items.map(s => <li key={s.href} className="menu-item menu-item-mobile"><Link href={s.href}>{s.label}</Link></li>)}
                            </ul>
                          </Collapse>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </TabPanel>
              <TabPanel className="categories animation-tab"><div /></TabPanel>
            </div>
          </Tabs>
          <div className="mobile-footer">
            <div className="icon-infor d-flex aln-center">
              <div className="content"><p>Need help? 24/7</p><h6><Link href="tel:0123456678">001-1234-88888</Link></h6></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Header ── */}
      <Header4 clname="actEm2" handleMobile={handleMobile} />

      {/* ── Hero Banner ── */}
      <section className="single-job-thumb">
        <div style={{
          height: 260,
          background: `linear-gradient(135deg, #0f2557 0%, ${accentColor} 100%)`,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '38px 38px' }} />
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center' }}>
            <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 6 }}>{company.industry || 'Company'}</p>
            <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>{company.name}</h1>
            {stats.count > 0 && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Stars rating={Math.round(stats.avg)} size={18} />
                <span style={{ fontSize: 14, opacity: 0.9 }}>{stats.avg} · {stats.count} review{stats.count !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Sticky Employer Bar ── */}
      <section className="form-sticky fixed-space">
        <div className="tf-container">
          <div className="row">
            <div className="col-lg-12">
              <div className="wd-job-author stc-em">

                {/* LEFT — logo + info + buttons */}
                <div className="inner-job-left">
                  {/* logo-company: CSS sets width/height 100px, margin-right 32px */}
                  <div className="logo-company" style={{
                    background: accentColor, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, fontWeight: 800, borderRadius: 12,
                    boxShadow: `0 6px 20px ${accentColor}44`,
                  }}>
                    {getInitials(company.name)}
                  </div>

                  <div className="content">
                    <h3>
                      <Link href="#">{company.name}</Link>&nbsp;{VERIFIED_ICON}
                    </h3>
                    <div className="job-info">
                      <span className="icon-map-pin"></span>
                      &nbsp;
                      <span>{company.location || 'Location not specified'}</span>
                    </div>
                    <div className="group-btn">
                      <button
                        className="tf-btn"
                        onClick={() => setFollowed(!followed)}
                        style={followed ? { background: '#14a077', color: '#fff', border: 'none' } : {}}
                      >
                        {followed ? '✓ Following' : 'Follow'}
                      </button>
                      <button className="tf-btn">
                        {companyJobs.length} job opening{companyJobs.length !== 1 ? 's' : ''}
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT — share icon + stacked buttons */}
                <div className="inner-job-right">
                  <span className="icon-share2"></span>
                  <div>
                    <Link href="/find-jobs" className="tf-btn-submit btn-popup" style={{ textDecoration: 'none', display: 'block' }}>
                      Browse Jobs
                    </Link>
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noreferrer"
                        className="tf-btn"
                        style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}
                      >
                        Visit Website
                      </a>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── Main Content ── */}
      <section className="inner-employer-section">
        <div className="tf-container">
          <div className="row">

            {/* ── Left — Tabs ── */}
            <div className="col-lg-8">
              <Tabs className="job-article tf-tab single-job single-employer">
                <TabList className="menu-tab">
                  <Tab className="ct-tab">About</Tab>
                  <Tab className="ct-tab">Jobs ({companyJobs.length})</Tab>
                  <Tab className="ct-tab">Reviews ({reviews.length})</Tab>
                </TabList>
                <div className="content-tab emp-anim">

                  {/* ════ About Tab ════ */}
                  <TabPanel className="inner-content animation-tab">
                    <h5>About {company.name}</h5>
                    {company.description
                      ? company.description.split('\n').map((p, i) => p.trim() && <p key={i}>{p}</p>)
                      : <p>{company.name} is a leading company in the {company.industry || 'industry'} sector based in {company.location || 'their city'}. We are committed to innovation, excellence, and building a great team.</p>
                    }

                    {/* Social share row */}
                    <div className="post-navigation d-flex aln-center">
                      <div className="wd-social d-flex aln-center">
                        <span>Share:</span>
                        <ul className="list-social d-flex aln-center">
                          {['facebook', 'linkedin2', 'twitter', 'pinterest'].map(icon => (
                            <li key={icon}><Link href="#"><i className={`icon-${icon}`}></i></Link></li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* ── Rating summary (from real data) ── */}
                    {stats.count > 0 && (
                      <div className="job-rating" style={{ marginTop: 32 }}>
                        <h6>Company Reviews</h6>
                        <div className="rating-review">
                          <div className="left-rating">
                            <h2>{stats.avg}</h2>
                            <Stars rating={Math.round(stats.avg)} size={18} />
                            <p className="count-rating">({stats.count} Rating{stats.count !== 1 ? 's' : ''})</p>
                          </div>
                          <div className="right-rating">
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                              {[5, 4, 3, 2, 1].map((s, i) => (
                                <StarBar key={s} stars={s} percent={stats.dist[i]} />
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Recent reviews preview ── */}
                    {reviews.length > 0 && (
                      <div style={{ marginTop: 24 }}>
                        <h6 style={{ marginBottom: 16 }}>Recent Reviews</h6>
                        <ul className="client-review" style={{ paddingLeft: 0 }}>
                          {reviews.slice(0, 2).map((r, i) => (
                            <li key={r.id} className="client-item review-card" style={{ background: '#fff', borderRadius: 14, padding: '20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0' }}>
                              <div className="content">
                                <div className="top-content">
                                  <div className="avatar" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                                      {r.name[0]?.toUpperCase()}
                                    </div>
                                    <div className="infor">
                                      <h5 style={{ margin: '0 0 3px' }}><Link href="#">{r.name}</Link>{VERIFIED_ICON}</h5>
                                      <span style={{ fontSize: 12, color: '#999' }}>{formatDate(r.createdAt)}</span>
                                      <div style={{ margin: '6px 0 8px' }}><Stars rating={r.rating} size={15} /></div>
                                      <p style={{ margin: 0, color: '#555', lineHeight: 1.65 }}>{r.review}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* ── Write a Review form ── */}
                    <div style={{ marginTop: 40, background: '#fff', borderRadius: 16, padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0' }}>
                      <h5 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>Write a Review</h5>
                      <p style={{ color: '#888', fontSize: 13, margin: '0 0 24px' }}>Share your experience to help others make informed decisions.</p>

                      {/* ── Success state ── */}
                      {submitted ? (
                        <div style={{ textAlign: 'center', padding: '32px', background: 'linear-gradient(135deg,#e8f5ef,#f0faf6)', borderRadius: 12, border: '1px solid #14a077' }}>
                          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                          <h5 style={{ color: '#14a077', margin: '0 0 8px' }}>Thank you for your review!</h5>
                          <p style={{ color: '#666', margin: 0, fontSize: 14 }}>Your review is now live and visible to others.</p>
                          <button onClick={() => { setSubmitted(false); setRating(0); }} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, border: '1px solid #14a077', background: 'none', color: '#14a077', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                            Write Another
                          </button>
                        </div>

                      ) : authLoading ? (
                        /* ── Auth loading ── */
                        <div style={{ textAlign: 'center', padding: '32px 0' }}>
                          <div style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#14a077', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                        </div>

                      ) : !currentUser ? (
                        /* ── NOT LOGGED IN — show sign-in gate ── */
                        <div style={{ textAlign: 'center', padding: '32px 20px', background: 'linear-gradient(135deg,#f8f9ff,#f0f4ff)', borderRadius: 14, border: '1.5px dashed #c7d2fe' }}>
                          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px #4f46e533' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="white"/>
                            </svg>
                          </div>
                          <h5 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#1a1a2e' }}>Sign in to write a review</h5>
                          <p style={{ color: '#666', margin: '0 0 24px', fontSize: 14, lineHeight: 1.6 }}>
                            Your honest review helps other job seekers.<br />Please sign in with Google to continue.
                          </p>
                          <button
                            onClick={handleGoogleSignIn}
                            disabled={signingIn}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 12,
                              padding: '12px 28px', borderRadius: 10,
                              border: '1.5px solid #e0e0e0',
                              background: signingIn ? '#f5f5f5' : '#fff',
                              cursor: signingIn ? 'wait' : 'pointer',
                              fontSize: 15, fontWeight: 600, color: '#333',
                              boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                              transition: 'all 0.2s',
                            }}
                          >
                            {/* Google G icon */}
                            <svg width="20" height="20" viewBox="0 0 48 48">
                              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.7 6.5 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-7.9 19.7-20 0-1.3-.1-2.7-.1-4z"/>
                              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.7 6.5 29.1 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                              <path fill="#4CAF50" d="M24 44c5 0 9.7-1.9 13.2-5l-6.1-5.1C29.3 35.6 26.8 36.5 24 36.5c-5.1 0-9.5-3-11.3-7.4l-6.6 5.1C9.6 39.7 16.3 44 24 44z"/>
                              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.1 5.1C40.5 35.5 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
                            </svg>
                            {signingIn ? 'Signing in...' : 'Continue with Google'}
                          </button>
                        </div>

                      ) : (
                        /* ── LOGGED IN — show review form ── */
                        <>
                          {/* Logged-in user badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f0faf6', borderRadius: 10, border: '1px solid #14a07733', marginBottom: 24 }}>
                            {currentUser.photoURL
                              ? <img src={currentUser.photoURL} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                              : <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#14a077', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>{currentUser.displayName?.[0] || '?'}</div>
                            }
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{currentUser.displayName}</p>
                              <p style={{ margin: 0, fontSize: 12, color: '#888' }}>{currentUser.email}</p>
                            </div>
                            <span style={{ fontSize: 12, color: '#14a077', fontWeight: 600, background: '#e8f5ef', padding: '3px 10px', borderRadius: 20 }}>✓ Verified</span>
                          </div>

                          <form className="wd-form-rating" onSubmit={handleSubmitReview}>
                            {submitError && (
                              <div style={{ padding: '10px 16px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, color: '#e53e3e', fontSize: 13, marginBottom: 18 }}>
                                {submitError}
                              </div>
                            )}

                            {/* Star picker */}
                            <div className="form-rating-heading" style={{ marginBottom: 20 }}>
                              <div className="group-rating" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                <label style={{ fontWeight: 600, color: '#333', fontSize: 14 }}>Your Rating *</label>
                                <div style={{ display: 'flex', gap: 2 }}>
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <button
                                      key={s}
                                      type="button"
                                      className="star-pick-btn"
                                      onClick={() => setRating(s)}
                                      onMouseEnter={() => setHoverRating(s)}
                                      onMouseLeave={() => setHoverRating(0)}
                                      style={{ fontSize: 32, color: s <= (hoverRating || rating) ? '#f59e0b' : '#d1d5db', lineHeight: 1 }}
                                      aria-label={`${s} star`}
                                    >★</button>
                                  ))}
                                </div>
                                {(hoverRating || rating) > 0 && (
                                  <span style={{ fontSize: 13, color: '#888', background: '#f9f9f9', padding: '3px 10px', borderRadius: 10 }}>
                                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hoverRating || rating]}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="row">
                              <div className="col-lg-6">
                                <div className="wrap-input">
                                  <label>Your Name</label>
                                  {/* Pre-filled + read-only from Google profile */}
                                  <input
                                    type="text"
                                    value={reviewForm.name}
                                    onChange={e => setReviewForm(f => ({ ...f, name: e.target.value }))}
                                    style={{ background: '#fafafa', color: '#555' }}
                                    required
                                  />
                                </div>
                              </div>
                              <div className="col-lg-6">
                                <div className="wrap-input">
                                  <label>Email</label>
                                  <input
                                    type="email"
                                    value={reviewForm.email}
                                    readOnly
                                    style={{ background: '#fafafa', color: '#888', cursor: 'not-allowed' }}
                                  />
                                </div>
                              </div>
                              <div className="col-lg-12">
                                <div className="wrap-notes">
                                  <label>Your Review *</label>
                                  <textarea
                                    rows={5}
                                    placeholder="Share your experience — work culture, benefits, growth opportunities, management style..."
                                    value={reviewForm.review}
                                    onChange={e => setReviewForm(f => ({ ...f, review: e.target.value }))}
                                    required
                                  ></textarea>
                                </div>
                              </div>
                              <div className="col-lg-12">
                                <button
                                  type="submit"
                                  className="tf-btn-submit style-2"
                                  disabled={submitting}
                                  style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'wait' : 'pointer' }}
                                >
                                  {submitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                              </div>
                            </div>
                          </form>
                        </>
                      )}
                    </div>
                  </TabPanel>

                  {/* ════ Jobs Tab ════ */}
                  <TabPanel className="inner-content animation-tab">
                    <h5 style={{ marginBottom: 24 }}>Open Positions at {company.name}</h5>
                    {companyJobs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fafafa', borderRadius: 12, border: '1px solid #f0f0f0' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                        <p style={{ color: '#888' }}>No open positions right now. Check back soon!</p>
                        <Link href="/find-jobs" style={{ color: '#14a077', fontWeight: 600, display: 'inline-block', marginTop: 8 }}>Browse all jobs →</Link>
                      </div>
                    ) : companyJobs.map(job => (
                      <div key={job.id} className="features-job mg-bt-0" style={{ position: 'relative', marginBottom: 16 }}>
                        <div className="job-archive-header">
                          <div className="inner-box">
                            <div className="logo-company">
                              <div style={{ width: 52, height: 52, borderRadius: 10, background: accentColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
                                {getInitials(job.company)}
                              </div>
                            </div>
                            <div className="box-content">
                              <h4><Link href={`/employers/${id}`}>{job.company}</Link></h4>
                              <h3><Link href={generateJobUrl(job.id, job.title)}>{job.title}</Link><span className="icon-bolt"></span></h3>
                              <ul>
                                {job.location && <li><span className="icon-map-pin"></span>{job.location}</li>}
                                {job.createdAt && <li><span className="icon-calendar"></span>{timeAgo(job.createdAt as any)}</li>}
                              </ul>
                              <span className="icon-heart"></span>
                            </div>
                          </div>
                        </div>
                        <div className="job-archive-footer">
                          <div className="job-footer-left">
                            <ul className="job-tag">
                              {job.jobType && <li><Link href="#">{job.jobType}</Link></li>}
                              {job.experience && <li><Link href="#">{job.experience}</Link></li>}
                            </ul>
                            <Stars rating={4} size={14} />
                          </div>
                          <div className="job-footer-right">
                            {job.salary && <div className="price"><span className="icon-dolar1"></span><p>{job.currency || '₹'}{job.salary}<span className="year">/year</span></p></div>}
                            {job.deadline
                              ? <p className="days">{Math.max(0, Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000))} days left</p>
                              : <p className="days">Apply Now</p>
                            }
                          </div>
                        </div>
                        <Link href={generateJobUrl(job.id, job.title)} className="jobtex-link-item" tabIndex={0}></Link>
                      </div>
                    ))}
                  </TabPanel>

                  {/* ════ Reviews Tab ════ */}
                  <TabPanel className="inner-content animation-tab">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h5 style={{ margin: 0 }}>All Reviews</h5>
                        <p style={{ color: '#888', fontSize: 14, margin: '4px 0 0' }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''} for {company.name}</p>
                      </div>
                    </div>

                    {/* Rating summary */}
                    {stats.count > 0 && (
                      <div className="rating-review" style={{ marginBottom: 32, padding: '24px', background: '#fafafa', borderRadius: 14, border: '1px solid #f0f0f0' }}>
                        <div className="left-rating">
                          <h2 style={{ fontSize: 52, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>{stats.avg}</h2>
                          <div style={{ margin: '6px 0' }}><Stars rating={Math.round(stats.avg)} size={20} /></div>
                          <p className="count-rating" style={{ color: '#888', margin: 0 }}>({stats.count} Rating{stats.count !== 1 ? 's' : ''})</p>
                        </div>
                        <div className="right-rating" style={{ flex: 1 }}>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {[5, 4, 3, 2, 1].map((s, i) => (
                              <StarBar key={s} stars={s} percent={stats.dist[i]} />
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Actual reviews list */}
                    {reviewsLoading ? (
                      <div style={{ textAlign: 'center', padding: 40 }}>
                        <div style={{ width: 36, height: 36, border: '3px solid #e0e0e0', borderTopColor: '#14a077', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                        <p style={{ color: '#999' }}>Loading reviews...</p>
                      </div>
                    ) : reviews.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fafafa', borderRadius: 14, border: '1px solid #f0f0f0' }}>
                        <div style={{ fontSize: 52, marginBottom: 12 }}>💬</div>
                        <h5 style={{ margin: '0 0 8px', color: '#1a1a2e' }}>No reviews yet</h5>
                        <p style={{ color: '#888', margin: '0 0 20px' }}>Be the first to share your experience!</p>
                      </div>
                    ) : (
                      <>
                        <ul className="client-review" style={{ paddingLeft: 0 }}>
                          {displayedReviews.map((r, i) => (
                            <li key={r.id} className="client-item review-card" style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', marginBottom: 16, boxShadow: '0 2px 14px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0', listStyle: 'none' }}>
                              <div className="content">
                                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                  {/* Avatar */}
                                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
                                    {r.name[0]?.toUpperCase()}
                                  </div>
                                  {/* Content */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                                      <h5 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                                        <Link href="#" style={{ color: '#1a1a2e', textDecoration: 'none' }}>{r.name}</Link>
                                        {VERIFIED_ICON}
                                      </h5>
                                      <span style={{ fontSize: 12, color: '#bbb' }}>·</span>
                                      <span style={{ fontSize: 12, color: '#999' }}>{timeAgo(r.createdAt)}</span>
                                    </div>
                                    <div style={{ marginBottom: 10 }}>
                                      <Stars rating={r.rating} size={16} />
                                      <span style={{ marginLeft: 6, fontSize: 12, color: '#888' }}>
                                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][r.rating]}
                                      </span>
                                    </div>
                                    <p style={{ margin: 0, color: '#444', lineHeight: 1.7, fontSize: 14 }}>{r.review}</p>
                                    <div style={{ marginTop: 12 }}>
                                      <span style={{ fontSize: 12, color: '#888' }}>
                                        {formatDate(r.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>

                        {/* Show more / less */}
                        {reviews.length > 3 && (
                          <button onClick={() => setShowAll(!showAll)} className="btn-load"
                            style={{ display: 'block', width: '100%', marginTop: 8 }}>
                            {showAll ? `Show Less ▲` : `See all ${reviews.length} reviews ▼`}
                          </button>
                        )}
                      </>
                    )}
                  </TabPanel>

                </div>
              </Tabs>
            </div>

            {/* ── Right Sidebar ── */}
            <div className="col-lg-4">
              <div className="cv-form-details po-sticky job-sg single-stick">

                {/* Map placeholder */}
                <div style={{ height: 190, borderRadius: 14, background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}30)`, border: `1px solid ${accentColor}30`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📍</div>
                  <p style={{ fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{company.location || 'Location'}</p>
                  <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>{company.name}</p>
                </div>

                {/* Info */}
                <ul className="list-infor">
                  {company.website && <li><div className="category">Website</div><div className="detail"><a href={company.website} target="_blank" rel="noreferrer" style={{ color: '#14a077', wordBreak: 'break-all' }}>{company.website.replace(/^https?:\/\//, '')}</a></div></li>}
                  {company.email && <li><div className="category">Email</div><div className="detail">{company.email}</div></li>}
                  {company.industry && <li><div className="category">Industry</div><div className="detail">{company.industry}</div></li>}
                  {company.size && <li><div className="category">Company Size</div><div className="detail">{company.size}</div></li>}
                  {company.location && <li><div className="category">Headquarters</div><div className="detail">{company.location}</div></li>}
                  <li><div className="category">Open Positions</div><div className="detail" style={{ color: '#14a077', fontWeight: 700 }}>{companyJobs.length} jobs</div></li>
                  {stats.count > 0 && <li><div className="category">Rating</div><div className="detail" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Stars rating={Math.round(stats.avg)} size={14} /><span style={{ fontWeight: 700, color: '#1a1a2e' }}>{stats.avg}</span><span style={{ color: '#888', fontSize: 12 }}>({stats.count})</span></div></li>}
                </ul>

                {/* Socials */}
                <div className="wd-social d-flex aln-center">
                  <span>Socials:</span>
                  <ul className="list-social d-flex aln-center">
                    {['facebook', 'linkedin2', 'twitter', 'instagram1'].map(icon => (
                      <li key={icon}><Link href="#"><i className={`icon-${icon}`}></i></Link></li>
                    ))}
                  </ul>
                </div>

                {/* Contact form */}
                <div className="form-job-single">
                  <h6>Contact {company.name}</h6>
                  <form onSubmit={e => e.preventDefault()}>
                    <input type="text" placeholder="Subject" />
                    <input type="text" placeholder="Your Name" />
                    <input type="email" placeholder="Your Email" />
                    <textarea placeholder="Your message..."></textarea>
                    <button type="submit">Send Message</button>
                  </form>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
      <Gotop />
    </>
  );
}
