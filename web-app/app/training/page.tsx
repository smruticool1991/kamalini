'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Gotop from '@/components/gotop';
import logo from '@/assets/images/logo.png';
import { collection, query, onSnapshot, addDoc, serverTimestamp, where, limit, getDocs } from 'firebase/firestore';
import { db, auth, googleProvider } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, User } from 'firebase/auth';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Facility { name: string; value?: string; }
interface Training {
  id: string;
  centerName?: string;
  courseName?: string;
  location?: string;
  duration?: string;
  pocName?: string;
  pocPhone?: string;
  status?: string;
  facilities?: Facility[];
  type?: string;
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Amit Verma',   role: 'Data Entry Operator', from: '₹14,000', to: '₹38,000', quote: 'Got placed within 2 months of completing my online course' },
  { name: 'Kavitha Nair', role: 'Sales Executive',     from: '₹16,000', to: '₹45,000', quote: 'Flexible learning helped me upskill while working full time' },
  { name: 'Rohit Patil',  role: 'Logistics Coord.',    from: '₹18,000', to: '₹52,000', quote: 'Best decision I made — my salary tripled in one year' },
];

// ─── Training Card ─────────────────────────────────────────────────────────────
function TrainingCard({ training, currentUser }: { training: Training; currentUser: User | null }) {
  const [hasApplied, setHasApplied] = useState(false);
  const [applying, setApplying]     = useState(false);
  const [showAuth, setShowAuth]     = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    getDocs(query(
      collection(db, 'trainingApplications'),
      where('userId', '==', currentUser.uid),
      where('trainingId', '==', training.id),
      limit(1)
    )).then(snap => setHasApplied(!snap.empty));
  }, [currentUser, training.id]);

  const applyNow = async () => {
    if (!currentUser) { setShowAuth(true); return; }
    setApplying(true);
    try {
      await addDoc(collection(db, 'trainingApplications'), {
        trainingId:  training.id,
        centerName:  training.centerName ?? '',
        courseName:  training.courseName ?? '',
        location:    training.location ?? '',
        duration:    training.duration ?? '',
        userId:      currentUser.uid,
        userName:    currentUser.displayName ?? '',
        userEmail:   currentUser.email ?? '',
        status:      'pending',
        appliedAt:   serverTimestamp(),
      });
      setHasApplied(true);
    } finally {
      setApplying(false);
    }
  };

  const signIn = async () => {
    try { await signInWithPopup(auth, googleProvider); setShowAuth(false); }
    catch {}
  };

  const isActive   = (training.status ?? 'active') === 'active';
  const facilities = training.facilities ?? [];

  return (
    <div className="training-card">
      {/* ── Gradient header ── */}
      <div className="tc-header">
        <div className="tc-header-row">
          <div className="tc-icon-box">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" fill="white"/>
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" fill="rgba(255,255,255,0.7)"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 className="tc-center-name">{training.centerName || 'Training Center'}</h3>
            {training.courseName && <p className="tc-course-name">{training.courseName}</p>}
          </div>
          <span className={`tc-status-badge ${isActive ? 'active' : 'inactive'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="tc-meta-row">
          {training.location && (
            <span className="tc-meta-item">
              <i className="icon-map-pin"></i> {training.location}
            </span>
          )}
          {training.location && training.duration && <span className="tc-divider">|</span>}
          {training.duration && (
            <span className="tc-meta-item">
              <i className="icon-clock"></i> {training.duration}
            </span>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="tc-body">
        {/* Facilities */}
        {facilities.length > 0 && (
          <>
            <p className="tc-section-label">FACILITIES</p>
            <div className="tc-chips">
              {facilities.map((f, i) => (
                <span key={i} className="tc-chip">
                  {f.value ? `${f.name}: ${f.value}` : f.name}
                </span>
              ))}
            </div>
          </>
        )}

        {/* POC */}
        {(training.pocName || training.pocPhone) && (
          <div className="tc-poc">
            <div className="tc-poc-icon">
              <i className="icon-user-1"></i>
            </div>
            <div style={{ flex: 1 }}>
              <p className="tc-poc-label">Point of Contact</p>
              {training.pocName  && <p className="tc-poc-name">{training.pocName}</p>}
              {training.pocPhone && (
                <a href={`tel:${training.pocPhone}`} className="tc-poc-phone">{training.pocPhone}</a>
              )}
            </div>
            {training.pocPhone && (
              <a href={`tel:${training.pocPhone}`} className="tc-call-btn">
                <i className="icon-call-calling"></i>
              </a>
            )}
          </div>
        )}

        {/* Auth gate */}
        {showAuth && (
          <div className="tc-auth-gate">
            <p>Sign in to apply for this training</p>
            <button className="tc-google-btn" onClick={signIn}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.69l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
              Sign in with Google
            </button>
          </div>
        )}

        {/* Apply button */}
        {!showAuth && (
          hasApplied ? (
            <div className="tc-applied">
              <i className="icon-check"></i> Applied for this Training
            </div>
          ) : (
            <button className="tc-apply-btn" onClick={applyNow} disabled={applying}>
              {applying ? 'Applying...' : 'Apply Now →'}
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TrainingPage() {
  const [showLanding, setShowLanding] = useState(true);
  const [trainings, setTrainings]     = useState<Training[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [mode, setMode]               = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [slideIndex, setSlideIndex]   = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setCurrentUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'trainings'));
    const unsub = onSnapshot(q, snap => {
      setTrainings(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Training)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Auto-slide testimonials
  useEffect(() => {
    const t = setInterval(() => setSlideIndex(i => (i + 1) % TESTIMONIALS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    let list = trainings.filter(t => (t.type ?? 'Training') === 'Training');
    if (mode) {
      list = list.filter(t => {
        const f = (t.facilities ?? []).find(f => f.name?.toLowerCase().includes('mode'));
        return (f?.value ?? '').toLowerCase().includes(mode.toLowerCase());
      });
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        (t.centerName ?? '').toLowerCase().includes(q) ||
        (t.courseName ?? '').toLowerCase().includes(q) ||
        (t.location   ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [trainings, mode, search]);

  // ── Main screen ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{pageStyles}</style>
      <Header clname="act1" handleMobile={() => {}} />

      <section className="training-hero">
        <div className="tf-container">
          <nav className="t-breadcrumb">
            <Link href="/">Home</Link> › <span>Training</span>
          </nav>
          <div className="training-hero-body">
            <div>
              <h1 className="training-title">Training Centers</h1>
              <p className="training-subtitle">
                {loading ? 'Loading...' : `${filtered.length} center${filtered.length !== 1 ? 's' : ''} available`}
              </p>
            </div>
            <Link href="/education" className="switch-tab-btn">
              🎓 Switch to Education
            </Link>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="tf-container">
          <div className="filter-inner">
            {/* Mode chips */}
            <div className="mode-chips">
              {[null, 'Online', 'Offline', 'Hybrid'].map(m => (
                <button
                  key={m ?? 'all'}
                  className={`mode-chip${mode === m ? ' active' : ''}`}
                  onClick={() => setMode(m)}
                >
                  {m ?? 'All'}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="t-search">
              <i className="icon-search"></i>
              <input
                placeholder="Search center, course or location…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && <button onClick={() => setSearch('')}>×</button>}
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <section className="cards-section">
        <div className="tf-container">
          {loading ? (
            <div className="t-loading">
              <div className="t-spinner" />
              <p>Loading training centers...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="t-empty">
              <div style={{ fontSize: 52 }}>🏋️</div>
              <h4>No training centers found</h4>
              <p>{search ? 'Try a different search' : 'No centers available right now'}</p>
              {search && <button onClick={() => setSearch('')}>Clear search</button>}
            </div>
          ) : (
            <div className="cards-grid">
              {filtered.map(t => (
                <TrainingCard key={t.id} training={t} currentUser={currentUser} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <Gotop />
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const landingStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .landing-bg {
    min-height: 100vh;
    background: linear-gradient(180deg, #1A0A2E 0%, #0D1B2A 55%, #0A1628 100%);
    position: relative; overflow: hidden;
    display: flex; flex-direction: column;
    font-family: 'Inter', sans-serif;
  }
  .landing-overlay {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 30%, rgba(74,53,128,0.35) 0%, transparent 70%);
    pointer-events: none;
  }
  .landing-content {
    position: relative; z-index: 1;
    display: flex; flex-direction: column;
    min-height: 100vh; padding: 0 0 0;
  }
  .landing-topbar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 28px 32px 0;
  }
  .landing-brand { font-size: 26px; font-weight: 900; font-style: italic; }
  .brand-gold { color: #F5A623; }
  .brand-white { color: #fff; }
  .landing-close {
    background: rgba(255,255,255,0.15); border: none; color: #fff;
    width: 40px; height: 40px; border-radius: 50%; font-size: 18px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .landing-close:hover { background: rgba(255,255,255,0.25); }
  .landing-hero { text-align: center; padding: 48px 24px 24px; }
  .landing-headline {
    color: #fff; font-size: clamp(32px, 6vw, 52px);
    font-weight: 900; line-height: 1.1; letter-spacing: 0.5px; margin-bottom: 18px;
  }
  .landing-pill {
    display: inline-block;
    background: #F5A623;
    color: #3A1A6B; font-size: clamp(20px, 4vw, 32px);
    font-weight: 900; font-style: italic;
    padding: 10px 28px; border-radius: 10px;
    box-shadow: 0 0 32px rgba(245,166,35,0.5);
  }
  .landing-divider {
    display: flex; align-items: center; gap: 16px;
    padding: 32px 32px 24px;
  }
  .div-line { flex: 1; height: 1px; background: rgba(255,255,255,0.25); }
  .div-text { color: rgba(255,255,255,0.65); font-size: 11px; letter-spacing: 1.4px; font-weight: 600; white-space: nowrap; }
  /* Testimonial carousel */
  .testimonial-track {
    display: flex; transition: transform 0.5s ease;
    padding: 0 32px;
  }
  .testimonial-card {
    min-width: 100%; background: #1A1A2E;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 18px; padding: 20px 24px;
  }
  .tc-badge {
    display: inline-block; background: #fff;
    color: #1A1A2E; font-size: 10px; font-weight: 900;
    padding: 3px 10px; border-radius: 6px; margin-bottom: 12px;
  }
  .tc-user { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .tc-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: #2D8C6B; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 15px;
  }
  .tc-user span { color: #fff; font-weight: 600; font-size: 14px; }
  .tc-quote { color: rgba(255,255,255,0.7); font-size: 13px; font-style: italic; margin-bottom: 12px; line-height: 1.5; }
  .tc-role { color: rgba(255,255,255,0.45); font-size: 12px; margin-bottom: 8px; }
  .tc-salary { display: flex; align-items: center; gap: 8px; }
  .sal-from {
    border: 1px solid rgba(255,255,255,0.3); color: #fff;
    padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
  }
  .sal-arrow { color: rgba(255,255,255,0.4); font-size: 14px; }
  .sal-to { background: #2D8C6B; color: #fff; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .carousel-dots { display: flex; gap: 8px; justify-content: center; padding: 16px 0; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.3); border: none; cursor: pointer; transition: all 0.2s; padding: 0; }
  .dot.active { background: #F5A623; width: 20px; border-radius: 4px; }
  .landing-cta {
    margin: auto 0 0;
    width: 100%; padding: 20px;
    background: #fff; border: none; cursor: pointer;
    color: #777; font-size: 16px; font-weight: 700;
    transition: background 0.2s;
  }
  .landing-cta:hover { background: #f5f5f5; }
`;

const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; }
  .training-hero {
    background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
    padding: 110px 0 36px; position: relative;
  }
  .training-hero::before {
    content: ''; position: absolute; inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
  .training-hero .tf-container { position: relative; z-index: 1; }
  .t-breadcrumb {
    font-size: 13px; color: rgba(255,255,255,0.65);
    margin-bottom: 16px;
  }
  .t-breadcrumb a { color: rgba(255,255,255,0.65); text-decoration: none; }
  .t-breadcrumb a:hover { color: #fff; }
  .t-breadcrumb span { color: #fff; }
  .training-hero-body {
    display: flex; justify-content: space-between; align-items: flex-end;
    flex-wrap: wrap; gap: 16px;
  }
  .training-title { font-size: 34px; font-weight: 800; color: #fff; margin: 0 0 8px; }
  .training-subtitle { color: rgba(255,255,255,0.75); font-size: 15px; margin: 0; }
  .switch-tab-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.15); color: #fff;
    border: 1.5px solid rgba(255,255,255,0.35);
    padding: 10px 20px; border-radius: 10px;
    font-size: 14px; font-weight: 600; text-decoration: none;
    backdrop-filter: blur(8px); transition: all 0.2s;
  }
  .switch-tab-btn:hover { background: rgba(255,255,255,0.25); color: #fff; }

  .filter-bar { background: #fff; border-bottom: 1px solid #f0f0f0; padding: 16px 0; }
  .filter-inner { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  .mode-chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .mode-chip {
    padding: 7px 16px; border-radius: 20px; font-size: 13px; font-weight: 600;
    border: 1.5px solid #e5e5e5; background: #f8f9fb; color: #555; cursor: pointer;
    transition: all 0.18s;
  }
  .mode-chip.active { background: #667EEA; color: #fff; border-color: #667EEA; }
  .mode-chip:hover:not(.active) { border-color: #667EEA; color: #667EEA; }
  .t-search {
    display: flex; align-items: center; gap: 8px;
    background: #f1f5f9; border-radius: 10px; padding: 10px 14px;
    min-width: 260px; flex: 1; max-width: 420px;
  }
  .t-search i { color: #94a3b8; font-size: 17px; flex-shrink: 0; }
  .t-search input {
    border: none; outline: none; background: transparent;
    font-size: 13px; color: #333; flex: 1;
  }
  .t-search button {
    background: none; border: none; cursor: pointer;
    color: #94a3b8; font-size: 20px; line-height: 1; padding: 0;
  }

  .cards-section { background: #f8fafc; padding: 36px 0 72px; min-height: 50vh; }
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 24px;
  }
  .t-loading { text-align: center; padding: 80px 0; }
  .t-spinner {
    width: 44px; height: 44px; margin: 0 auto 16px;
    border: 3px solid #e0e0e0; border-top-color: #667EEA;
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .t-loading p { color: #94a3b8; font-size: 14px; }
  .t-empty { text-align: center; padding: 80px 24px; }
  .t-empty h4 { font-size: 18px; color: #1a1a2e; margin: 12px 0 8px; }
  .t-empty p { color: #94a3b8; font-size: 14px; margin: 0 0 20px; }
  .t-empty button {
    padding: 10px 24px; background: #667EEA; color: #fff;
    border: none; border-radius: 10px; cursor: pointer; font-weight: 600;
  }

  /* Training Card */
  .training-card {
    background: #fff; border-radius: 18px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    overflow: hidden; transition: transform 0.25s, box-shadow 0.25s;
  }
  .training-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(102,126,234,0.18); }
  .tc-header {
    background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
    padding: 20px 20px 16px;
  }
  .tc-header-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
  .tc-icon-box {
    width: 46px; height: 46px; flex-shrink: 0;
    background: rgba(255,255,255,0.18); border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
  }
  .tc-center-name { font-size: 16px; font-weight: 800; color: #fff; margin: 0 0 3px; }
  .tc-course-name { font-size: 13px; color: rgba(255,255,255,0.82); font-weight: 500; margin: 0; }
  .tc-status-badge {
    font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; flex-shrink: 0;
  }
  .tc-status-badge.active { background: #22C55E; color: #fff; }
  .tc-status-badge.inactive { background: rgba(255,255,255,0.22); color: #fff; }
  .tc-meta-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .tc-meta-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: rgba(255,255,255,0.9); font-weight: 600; }
  .tc-divider { color: rgba(255,255,255,0.35); font-size: 12px; }
  .tc-body { padding: 18px 20px 20px; }
  .tc-section-label { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 0.8px; margin: 0 0 8px; }
  .tc-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
  .tc-chip {
    padding: 5px 12px; font-size: 11px; font-weight: 600; color: #4338CA;
    background: linear-gradient(135deg, #EEF2FF, #F5F3FF);
    border: 1px solid rgba(102,126,234,0.25); border-radius: 20px;
  }
  .tc-poc {
    display: flex; align-items: center; gap: 12px;
    background: #f8fafc; border: 1.5px solid #e2e8f0;
    border-radius: 12px; padding: 12px 14px; margin-bottom: 16px;
  }
  .tc-poc-icon {
    width: 38px; height: 38px; flex-shrink: 0;
    background: linear-gradient(135deg, #667EEA, #764BA2);
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 16px;
  }
  .tc-poc-label { font-size: 10px; color: #94a3b8; font-weight: 600; margin: 0; }
  .tc-poc-name { font-size: 13px; font-weight: 700; color: #0f172a; margin: 2px 0 0; }
  .tc-poc-phone { font-size: 12px; color: #2563eb; text-decoration: none; display: block; margin-top: 2px; }
  .tc-call-btn {
    width: 36px; height: 36px; background: #2563eb; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 16px; text-decoration: none; transition: background 0.2s;
  }
  .tc-call-btn:hover { background: #1d4ed8; }
  .tc-apply-btn {
    width: 100%; padding: 13px; border-radius: 12px;
    background: linear-gradient(135deg, #667EEA, #764BA2);
    color: #fff; font-size: 14px; font-weight: 700;
    border: none; cursor: pointer; transition: opacity 0.2s;
  }
  .tc-apply-btn:hover { opacity: 0.9; }
  .tc-apply-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .tc-applied {
    width: 100%; padding: 13px; border-radius: 12px;
    background: #ecfdf5; border: 1.5px solid rgba(45,140,107,0.35);
    color: #065f46; font-size: 14px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .tc-auth-gate {
    background: #f8fafc; border: 1.5px solid #e2e8f0;
    border-radius: 12px; padding: 16px; margin-bottom: 12px;
    text-align: center;
  }
  .tc-auth-gate p { font-size: 13px; color: #64748b; margin: 0 0 12px; }
  .tc-google-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 10px;
    background: #fff; border: 1.5px solid #e5e5e5;
    font-size: 13px; font-weight: 600; color: #333; cursor: pointer;
    transition: box-shadow 0.2s;
  }
  .tc-google-btn:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.12); }

  @media (max-width: 768px) {
    .training-hero { padding: 100px 0 28px; }
    .training-hero-body { flex-direction: column; align-items: flex-start; }
    .cards-grid { grid-template-columns: 1fr; }
    .filter-inner { flex-direction: column; align-items: stretch; }
    .t-search { max-width: none; }
  }
`;
