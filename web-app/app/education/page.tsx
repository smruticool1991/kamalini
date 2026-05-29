'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Gotop from '@/components/gotop';
import { collection, query, onSnapshot, addDoc, serverTimestamp, where, limit, getDocs, getDoc, doc as fbDoc } from 'firebase/firestore';
import { db, auth, googleProvider } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, User } from 'firebase/auth';

// ─── Types ────────────────────────────────────────────────────────────────────
interface EduEntry {
  id: string;
  institutionName?: string;
  courseTitle?: string;
  degreeType?: string;
  specialization?: string;
  fees?: string;
  courseFee?: string;
  courseDuration?: string;
  eduMode?: string;
  location?: string;
  nirfRank?: string;
  accreditation?: string;
  seatsLeft?: string;
  eligibility?: string;
  scholarship?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  contactPhone?: string;
  type?: string;
}

// ─── Detail Row ──────────────────────────────────────────────────────────────
function DetailRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="detail-row">
      <div className="detail-icon">{icon}</div>
      <div>
        <p className="detail-label">{label}</p>
        <p className="detail-value">{value}</p>
      </div>
    </div>
  );
}

// ─── Education Card ──────────────────────────────────────────────────────────
function EducationCard({
  entry,
  institutionImageMap,
  currentUser,
}: {
  entry: EduEntry;
  institutionImageMap: Record<string, string>;
  currentUser: User | null;
}) {
  const [hasApplied, setHasApplied] = useState(false);
  const [applying, setApplying]     = useState(false);
  const [showAuth, setShowAuth]     = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [imgErr, setImgErr]         = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    getDocs(query(
      collection(db, 'educationApplications'),
      where('userId', '==', currentUser.uid),
      where('trainingId', '==', entry.id),
      limit(1)
    )).then(snap => setHasApplied(!snap.empty));
  }, [currentUser, entry.id]);

  const signIn = async () => {
    try { await signInWithPopup(auth, googleProvider); setShowAuth(false); }
    catch {}
  };

  const applyNow = async () => {
    if (!currentUser) { setShowAuth(true); return; }
    setApplying(true);
    try {
      const userDoc = await getDoc(fbDoc(db, 'users', currentUser.uid));
      const userData = userDoc.data() ?? {};
      await addDoc(collection(db, 'educationApplications'), {
        trainingId:      entry.id,
        institutionName: entry.institutionName ?? '',
        courseTitle:     entry.courseTitle ?? '',
        location:        entry.location ?? '',
        userId:          currentUser.uid,
        userName:        userData['name'] ?? currentUser.displayName ?? '',
        userEmail:       userData['email'] ?? currentUser.email ?? '',
        userPhone:       userData['phone'] ?? '',
        status:          'pending',
        appliedAt:       serverTimestamp(),
      });
      setHasApplied(true);
    } finally {
      setApplying(false);
    }
  };

  const institutionName = entry.institutionName || 'Institution';
  const courseTitle     = entry.degreeType || entry.courseTitle || '';
  const fees            = entry.fees || entry.courseFee || '';
  const phone           = entry.phone || entry.contactPhone || '';

  // Background image from institutionImageMap
  const bgImage = !imgErr && (institutionImageMap[institutionName] || institutionImageMap[institutionName.toLowerCase()]);

  // Color based on name
  const COLORS = ['#3D1A8C','#1e40af','#0369a1','#0f766e','#6d28d9','#be185d','#c2410c'];
  const cardColor = COLORS[institutionName.charCodeAt(0) % COLORS.length];
  const initials  = institutionName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <div className="edu-card">
        {/* ── Header with optional image ── */}
        <div
          className="edu-card-header"
          style={{
            background: bgImage
              ? `url(${bgImage}) center/cover no-repeat`
              : `linear-gradient(135deg, ${cardColor}dd, ${cardColor}88)`,
          }}
        >
          <div className="edu-header-overlay" />
          <div className="edu-header-inner">
            <div className="edu-logo" style={{ background: cardColor }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 className="edu-inst-name">{institutionName}</h3>
              {courseTitle && <p className="edu-course">{courseTitle}</p>}
            </div>
            {entry.nirfRank && (
              <div className="nirf-badge">
                <span>🏆</span> #{entry.nirfRank}
              </div>
            )}
          </div>
          <div className="edu-meta-row">
            {entry.location && (
              <span className="edu-meta-item">
                <i className="icon-map-pin"></i> {entry.location}
              </span>
            )}
            {entry.eduMode && (
              <span className="edu-mode-tag">{entry.eduMode}</span>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="edu-body">
          {/* Key stats */}
          <div className="edu-stats">
            {fees && (
              <div className="edu-stat">
                <span className="stat-label">Fees</span>
                <span className="stat-val" style={{ color: cardColor }}>₹{fees}</span>
              </div>
            )}
            {entry.courseDuration && (
              <div className="edu-stat">
                <span className="stat-label">Duration</span>
                <span className="stat-val">{entry.courseDuration}</span>
              </div>
            )}
            {entry.specialization && (
              <div className="edu-stat">
                <span className="stat-label">Specialization</span>
                <span className="stat-val">{entry.specialization}</span>
              </div>
            )}
            {entry.accreditation && (
              <div className="edu-stat">
                <span className="stat-label">Accreditation</span>
                <span className="stat-val" style={{ color: '#16a34a' }}>✓ {entry.accreditation}</span>
              </div>
            )}
          </div>

          {/* Eligibility / Scholarship teaser */}
          {(entry.eligibility || entry.scholarship) && (
            <div className="edu-tags">
              {entry.eligibility && <span className="edu-tag">📋 {entry.eligibility}</span>}
              {entry.scholarship && <span className="edu-tag scholarship">🎁 Scholarship Available</span>}
            </div>
          )}

          {/* Auth gate */}
          {showAuth && (
            <div className="edu-auth-gate">
              <p>Sign in to apply for this programme</p>
              <button className="google-btn" onClick={signIn}>
                <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.69l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
                Sign in with Google
              </button>
            </div>
          )}

          {/* Buttons */}
          <div className="edu-btn-row">
            <button className="edu-detail-btn" onClick={() => setShowDetail(true)}>
              View Details
            </button>
            {!showAuth && (
              hasApplied ? (
                <div className="edu-applied">✓ Applied</div>
              ) : (
                <button className="edu-apply-btn" style={{ background: cardColor }} onClick={applyNow} disabled={applying}>
                  {applying ? 'Applying...' : 'Apply Now'}
                </button>
              )
            )}
            {!hasApplied && !showAuth && (
              <button
                className="edu-signin-toggle"
                onClick={() => setShowAuth(s => !s)}
                title="Sign in required"
                style={{ display: currentUser ? 'none' : undefined }}
              >🔐</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {showDetail && (
        <div className="modal-backdrop" onClick={() => setShowDetail(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <span>🎓</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4>{institutionName}</h4>
                {courseTitle && <p>{courseTitle}</p>}
              </div>
              <button className="modal-close" onClick={() => setShowDetail(false)}>✕</button>
            </div>
            <div className="modal-divider" />
            <div className="modal-body">
              {courseTitle && <DetailRow label="Course / Degree" value={courseTitle} icon="📚" />}
              {entry.specialization && <DetailRow label="Specialization" value={entry.specialization} icon="✨" />}
              {entry.courseDuration && <DetailRow label="Duration" value={entry.courseDuration} icon="⏰" />}
              {fees && <DetailRow label="Fees" value={`₹${fees}`} icon="💰" />}
              {entry.eduMode && <DetailRow label="Mode" value={entry.eduMode} icon="💻" />}
              {entry.location && <DetailRow label="Location" value={entry.location} icon="📍" />}
              {entry.nirfRank && <DetailRow label="NIRF Rank" value={`#${entry.nirfRank}`} icon="🏆" />}
              {entry.accreditation && <DetailRow label="Accreditation" value={entry.accreditation} icon="✅" />}
              {entry.seatsLeft && <DetailRow label="Seats Available" value={entry.seatsLeft} icon="🪑" />}
              {entry.eligibility && <DetailRow label="Eligibility" value={entry.eligibility} icon="📋" />}
              {entry.scholarship && <DetailRow label="Scholarship" value={entry.scholarship} icon="🎁" />}
              {entry.description && (
                <div className="modal-about">
                  <h5>About</h5>
                  <p>{entry.description}</p>
                </div>
              )}
              {(phone || entry.email || entry.website) && (
                <>
                  <h5 style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '16px 0 8px' }}>Contact</h5>
                  {phone && <DetailRow label="Phone" value={phone} icon="📞" />}
                  {entry.email && <DetailRow label="Email" value={entry.email} icon="✉️" />}
                  {entry.website && <DetailRow label="Website" value={entry.website} icon="🌐" />}
                </>
              )}
              <button
                className="modal-apply-btn"
                style={{ background: cardColor }}
                onClick={() => { setShowDetail(false); applyNow(); }}
                disabled={hasApplied || applying}
              >
                {hasApplied ? '✓ Already Applied' : applying ? 'Applying...' : 'Apply Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const SORT_CHIPS = ['Top Choice', 'NIRF Ranked', 'Fee: Low to High'];

export default function EducationPage() {
  const [entries, setEntries]               = useState<EduEntry[]>([]);
  const [courses, setCourses]               = useState<string[]>([]);
  const [institutionImages, setInstImages]  = useState<Record<string, string>>({});
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [mode, setMode]                     = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sortChip, setSortChip]             = useState<string | null>(null);
  const [showCourseMenu, setShowCourseMenu] = useState(false);
  const [currentUser, setCurrentUser]       = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setCurrentUser(u));
    return () => unsub();
  }, []);

  // Load trainings (Education type)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'trainings'), snap => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as EduEntry)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Load courses
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'courses'), snap => {
      const titles = snap.docs
        .map(d => ((d.data() as any)['courseTitle'] ?? '').trim())
        .filter(Boolean);
      setCourses([...new Set(titles)].sort((a, b) => a.localeCompare(b)));
    });
    return () => unsub();
  }, []);

  // Load institution images
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'institutions'), snap => {
      const map: Record<string, string> = {};
      snap.docs.forEach(d => {
        const data = d.data() as any;
        const name = (data['name'] ?? '').trim();
        const url  = (data['imageUrl'] ?? '').trim();
        if (name && url && url !== 'null') {
          map[name] = url;
          map[name.toLowerCase()] = url;
        }
      });
      setInstImages(map);
    });
    return () => unsub();
  }, []);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = entries.filter(e => (e.type ?? 'Training') === 'Education');

    if (mode) list = list.filter(e => (e.eduMode ?? '').toLowerCase().includes(mode.toLowerCase()));

    if (selectedCourse) {
      list = list.filter(e => {
        const deg = (e.degreeType ?? e.courseTitle ?? '').toLowerCase();
        return deg.includes(selectedCourse.toLowerCase());
      });
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        (e.institutionName ?? '').toLowerCase().includes(q) ||
        (e.courseTitle ?? '').toLowerCase().includes(q) ||
        (e.location ?? '').toLowerCase().includes(q)
      );
    }

    if (sortChip === 'NIRF Ranked') {
      list = [...list].sort((a, b) => {
        const ra = parseInt(a.nirfRank ?? '9999', 10);
        const rb = parseInt(b.nirfRank ?? '9999', 10);
        return ra - rb;
      });
    } else if (sortChip === 'Fee: Low to High') {
      const parseFee = (v?: string) => parseInt((v ?? '').replace(/\D/g, '') || '999999999', 10);
      list = [...list].sort((a, b) => parseFee(a.fees ?? a.courseFee) - parseFee(b.fees ?? b.courseFee));
    }

    return list;
  }, [entries, mode, search, selectedCourse, sortChip]);

  return (
    <>
      <style>{eduStyles}</style>
      <Header clname="act1" handleMobile={() => {}} />

      {/* ── Hero ── */}
      <section className="edu-hero">
        <div className="tf-container">
          <nav className="e-breadcrumb">
            <Link href="/">Home</Link> › <span>Education</span>
          </nav>
          <div className="edu-hero-body">
            <div>
              <h1 className="edu-page-title">Education & Colleges</h1>
              <p className="edu-page-sub">
                {loading ? 'Loading...' : `${filtered.length} institution${filtered.length !== 1 ? 's' : ''} available`}
              </p>
            </div>
            <Link href="/training" className="edu-switch-btn">
              🏋️ Switch to Training
            </Link>
          </div>
        </div>
      </section>

      {/* ── Filter bar ── */}
      <div className="edu-filter-bar">
        <div className="tf-container">
          {/* Row 1 — Course selector + Sort chips */}
          <div className="edu-filter-row1">
            <div style={{ position: 'relative' }}>
              <button className="course-picker-btn" onClick={() => setShowCourseMenu(s => !s)}>
                🎓 {selectedCourse || 'All Courses'} ▾
              </button>
              {showCourseMenu && (
                <div className="course-dropdown">
                  <div
                    className={`course-opt${selectedCourse === '' ? ' sel' : ''}`}
                    onClick={() => { setSelectedCourse(''); setShowCourseMenu(false); }}
                  >
                    All Courses
                  </div>
                  {courses.map(c => (
                    <div
                      key={c}
                      className={`course-opt${selectedCourse === c ? ' sel' : ''}`}
                      onClick={() => { setSelectedCourse(c); setShowCourseMenu(false); }}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sort-chips">
              {SORT_CHIPS.map(chip => (
                <button
                  key={chip}
                  className={`sort-chip${sortChip === chip ? ' active' : ''}`}
                  onClick={() => setSortChip(s => s === chip ? null : chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2 — Mode + Search */}
          <div className="edu-filter-row2">
            <div className="edu-mode-chips">
              {[null, 'Online', 'Offline', 'Hybrid'].map(m => (
                <button
                  key={m ?? 'all'}
                  className={`edu-mode-chip${mode === m ? ' active' : ''}`}
                  onClick={() => setMode(m)}
                >
                  {m ?? 'All'}
                </button>
              ))}
            </div>
            <div className="edu-search">
              <i className="icon-search"></i>
              <input
                placeholder="Search institution or course…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && <button onClick={() => setSearch('')}>×</button>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Cards ── */}
      <section className="edu-cards-section">
        <div className="tf-container">
          {loading ? (
            <div className="edu-loading">
              <div className="edu-spinner" />
              <p>Loading institutions...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="edu-empty">
              <div style={{ fontSize: 56 }}>🎓</div>
              <h4>No institutions found</h4>
              <p>{search ? 'Try a different search' : 'No institutions available right now'}</p>
              {(search || selectedCourse) && (
                <button onClick={() => { setSearch(''); setSelectedCourse(''); }}>Clear Filters</button>
              )}
            </div>
          ) : (
            <div className="edu-grid">
              {filtered.map(e => (
                <EducationCard
                  key={e.id}
                  entry={e}
                  institutionImageMap={institutionImages}
                  currentUser={currentUser}
                />
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
const eduStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; }

  .edu-hero {
    background: linear-gradient(135deg, #3D1A8C 0%, #6d28d9 50%, #3D1A8C 100%);
    padding: 110px 0 36px; position: relative; overflow: hidden;
  }
  .edu-hero::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.07) 0%, transparent 70%);
  }
  .edu-hero .tf-container { position: relative; z-index: 1; }
  .e-breadcrumb { font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 16px; }
  .e-breadcrumb a { color: rgba(255,255,255,0.6); text-decoration: none; }
  .e-breadcrumb a:hover { color: #fff; }
  .e-breadcrumb span { color: #fff; }
  .edu-hero-body { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px; }
  .edu-page-title { font-size: 34px; font-weight: 800; color: #fff; margin: 0 0 8px; }
  .edu-page-sub { color: rgba(255,255,255,0.72); font-size: 15px; margin: 0; }
  .edu-switch-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.15); color: #fff;
    border: 1.5px solid rgba(255,255,255,0.35);
    padding: 10px 20px; border-radius: 10px;
    font-size: 14px; font-weight: 600; text-decoration: none;
    backdrop-filter: blur(8px); transition: all 0.2s;
  }
  .edu-switch-btn:hover { background: rgba(255,255,255,0.25); color: #fff; }

  .edu-filter-bar { background: #fff; border-bottom: 1px solid #f0f0f0; padding: 16px 0; }
  .edu-filter-row1 { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }
  .edu-filter-row2 { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }

  .course-picker-btn {
    background: #3D1A8C; color: #fff;
    border: none; padding: 9px 18px; border-radius: 20px;
    font-size: 13px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; gap: 6px; white-space: nowrap;
    transition: background 0.2s;
  }
  .course-picker-btn:hover { background: #2e1270; }
  .course-dropdown {
    position: absolute; top: calc(100% + 6px); left: 0;
    background: #fff; border: 1.5px solid #e5e5e5; border-radius: 12px;
    box-shadow: 0 8px 28px rgba(0,0,0,0.12);
    z-index: 999; min-width: 220px; max-height: 300px; overflow-y: auto;
  }
  .course-opt {
    padding: 11px 16px; font-size: 13px; color: #374151;
    cursor: pointer; transition: background 0.15s;
  }
  .course-opt:hover { background: #f5f3ff; }
  .course-opt.sel { color: #3D1A8C; font-weight: 700; background: #f5f3ff; }

  .sort-chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .sort-chip {
    padding: 7px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
    border: 1.5px solid #d1d5db; background: #fff; color: #374151;
    cursor: pointer; transition: all 0.18s;
  }
  .sort-chip.active { background: #3D1A8C; color: #fff; border-color: #3D1A8C; }
  .sort-chip:hover:not(.active) { border-color: #3D1A8C; color: #3D1A8C; }

  .edu-mode-chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .edu-mode-chip {
    padding: 7px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
    border: 1.5px solid #e5e5e5; background: #f8f9fb; color: #555; cursor: pointer;
    transition: all 0.18s;
  }
  .edu-mode-chip.active { background: #3D1A8C; color: #fff; border-color: #3D1A8C; }
  .edu-mode-chip:hover:not(.active) { border-color: #3D1A8C; color: #3D1A8C; }

  .edu-search {
    display: flex; align-items: center; gap: 8px;
    background: #f1f5f9; border-radius: 10px; padding: 10px 14px;
    flex: 1; min-width: 220px; max-width: 400px;
  }
  .edu-search i { color: #94a3b8; font-size: 17px; flex-shrink: 0; }
  .edu-search input { border: none; outline: none; background: transparent; font-size: 13px; color: #333; flex: 1; }
  .edu-search button { background: none; border: none; cursor: pointer; color: #94a3b8; font-size: 20px; padding: 0; }

  .edu-cards-section { background: #f8fafc; padding: 36px 0 80px; min-height: 50vh; }
  .edu-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 24px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
  .edu-loading { text-align: center; padding: 80px 0; }
  .edu-spinner {
    width: 44px; height: 44px; margin: 0 auto 16px;
    border: 3px solid #e0e0e0; border-top-color: #3D1A8C;
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }
  .edu-loading p { color: #94a3b8; font-size: 14px; }
  .edu-empty { text-align: center; padding: 80px 24px; }
  .edu-empty h4 { font-size: 18px; color: #1a1a2e; margin: 12px 0 8px; }
  .edu-empty p { color: #94a3b8; font-size: 14px; margin: 0 0 20px; }
  .edu-empty button {
    padding: 10px 24px; background: #3D1A8C; color: #fff;
    border: none; border-radius: 10px; cursor: pointer; font-weight: 600;
  }

  /* Education Card */
  .edu-card {
    background: #fff; border-radius: 18px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    overflow: hidden; transition: transform 0.25s, box-shadow 0.25s;
  }
  .edu-card:hover { transform: translateY(-5px); box-shadow: 0 14px 36px rgba(61,26,140,0.18); }
  .edu-card-header { position: relative; padding: 20px; min-height: 130px; }
  .edu-header-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.6) 100%);
  }
  .edu-header-inner { position: relative; z-index: 1; display: flex; gap: 12px; margin-bottom: 14px; }
  .edu-logo {
    width: 50px; height: 50px; flex-shrink: 0; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 800; color: #fff;
    border: 2px solid rgba(255,255,255,0.4);
  }
  .edu-inst-name { font-size: 16px; font-weight: 800; color: #fff; margin: 0 0 4px; }
  .edu-course { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; margin: 0; }
  .nirf-badge {
    position: relative; z-index: 1; flex-shrink: 0;
    background: #F5A623; color: #1a1a2e;
    font-size: 11px; font-weight: 800;
    padding: 4px 10px; border-radius: 20px;
    display: flex; align-items: center; gap: 4px;
    align-self: flex-start;
  }
  .edu-meta-row { position: relative; z-index: 1; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .edu-meta-item { font-size: 12px; color: rgba(255,255,255,0.9); font-weight: 600; display: flex; align-items: center; gap: 4px; }
  .edu-mode-tag {
    background: rgba(255,255,255,0.2); color: #fff;
    font-size: 11px; font-weight: 700;
    padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.35);
  }

  .edu-body { padding: 18px 20px 20px; }
  .edu-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
  .edu-stat { background: #f8fafc; border-radius: 10px; padding: 10px 14px; }
  .stat-label { font-size: 10px; color: #94a3b8; font-weight: 600; margin: 0 0 3px; display: block; }
  .stat-val { font-size: 13px; font-weight: 700; color: #1f2937; margin: 0; display: block; }
  .edu-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
  .edu-tag {
    font-size: 11px; font-weight: 600; color: #374151;
    background: #f1f5f9; border: 1px solid #e2e8f0;
    padding: 4px 10px; border-radius: 20px;
  }
  .edu-tag.scholarship { background: #fefce8; border-color: #fde047; color: #713f12; }

  .edu-auth-gate {
    background: #f8fafc; border: 1.5px solid #e2e8f0;
    border-radius: 12px; padding: 14px; margin-bottom: 12px; text-align: center;
  }
  .edu-auth-gate p { font-size: 13px; color: #64748b; margin: 0 0 10px; }
  .google-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 9px 18px; border-radius: 10px;
    background: #fff; border: 1.5px solid #e5e5e5;
    font-size: 13px; font-weight: 600; color: #333; cursor: pointer;
    transition: box-shadow 0.2s;
  }
  .google-btn:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.12); }

  .edu-btn-row { display: flex; gap: 8px; align-items: center; }
  .edu-detail-btn {
    flex: 1; padding: 12px; border-radius: 10px;
    background: #f1f5f9; border: 1.5px solid #e2e8f0;
    font-size: 13px; font-weight: 600; color: #374151;
    cursor: pointer; transition: all 0.18s;
  }
  .edu-detail-btn:hover { background: #e2e8f0; }
  .edu-apply-btn {
    flex: 1; padding: 12px; border-radius: 10px;
    color: #fff; font-size: 13px; font-weight: 700;
    border: none; cursor: pointer; transition: opacity 0.2s;
  }
  .edu-apply-btn:hover { opacity: 0.88; }
  .edu-apply-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .edu-applied {
    flex: 1; padding: 12px; border-radius: 10px;
    background: #ecfdf5; border: 1.5px solid rgba(22,163,74,0.35);
    color: #065f46; font-size: 13px; font-weight: 700;
    text-align: center;
  }
  .edu-signin-toggle {
    width: 40px; height: 40px; border-radius: 10px;
    background: #f8fafc; border: 1.5px solid #e2e8f0;
    cursor: pointer; font-size: 16px; transition: background 0.2s;
  }
  .edu-signin-toggle:hover { background: #e2e8f0; }

  /* Modal */
  .modal-backdrop {
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(0,0,0,0.5); display: flex; align-items: flex-end;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal-sheet {
    width: 100%; max-width: 680px; margin: 0 auto;
    background: #fff; border-radius: 24px 24px 0 0;
    max-height: 90vh; display: flex; flex-direction: column;
    animation: slideUp 0.3s ease;
  }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .modal-handle {
    width: 40px; height: 4px; background: #d1d5db;
    border-radius: 2px; margin: 12px auto 6px;
  }
  .modal-header {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 8px 20px 12px; font-size: 22px;
  }
  .modal-header h4 { font-size: 16px; font-weight: 800; color: #111827; margin: 0 0 2px; }
  .modal-header p { font-size: 13px; color: #6b7280; margin: 0; }
  .modal-close {
    margin-left: auto; background: #f3f4f6; border: none; cursor: pointer;
    width: 32px; height: 32px; border-radius: 50%; font-size: 14px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .modal-divider { height: 1px; background: #f3f4f6; }
  .modal-body { overflow-y: auto; padding: 20px; flex: 1; }
  .detail-row {
    display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px;
  }
  .detail-icon {
    width: 34px; height: 34px; flex-shrink: 0;
    background: rgba(61,26,140,0.08); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; font-size: 15px;
  }
  .detail-label { font-size: 11px; color: #9ca3af; font-weight: 600; margin: 0 0 2px; }
  .detail-value { font-size: 13px; font-weight: 600; color: #1f2937; margin: 0; }
  .modal-about { margin: 16px 0; }
  .modal-about h5 { font-size: 14px; font-weight: 700; color: #374151; margin: 0 0 6px; }
  .modal-about p { font-size: 13px; color: #6b7280; line-height: 1.6; margin: 0; }
  .modal-apply-btn {
    width: 100%; padding: 14px; border-radius: 12px;
    color: #fff; font-size: 14px; font-weight: 700;
    border: none; cursor: pointer; margin-top: 20px;
    transition: opacity 0.2s;
  }
  .modal-apply-btn:hover { opacity: 0.88; }
  .modal-apply-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  @media (max-width: 768px) {
    .edu-hero { padding: 100px 0 28px; }
    .edu-hero-body { flex-direction: column; align-items: flex-start; }
    .edu-grid { grid-template-columns: 1fr; }
    .edu-filter-row1, .edu-filter-row2 { flex-direction: column; align-items: stretch; }
    .edu-search { max-width: none; }
    .edu-stats { grid-template-columns: 1fr; }
    .modal-sheet { max-width: 100%; }
  }
`;
