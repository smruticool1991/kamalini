'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Header4 from '@/components/header/Header4';
import Footer from '@/components/footer';
import Gotop from '@/components/gotop';
import { Collapse } from 'react-collapse';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import logo from '@/assets/images/logo.png';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { generateJobUrl } from '@/lib/slug';

const ProfileCompleteModal = dynamic(
  () => import('@/components/profileComplete/ProfileCompleteModal'),
  { ssr: false }
);

// ─── User Profile type ────────────────────────────────────────────────────────
interface UserProfile {
  name?: string;
  educationLevel?: string;
  dateOfBirth?: string;
  gender?: string;
  workStatus?: string;
  currentCity?: string;
  openToRelocation?: boolean;
  preferredCities?: string[];
  keySkills?: string;
  preferredJobRoles?: string[];
  englishLevel?: string;
  collegeName?: string;
  degree?: string;
  specialization?: string;
  completionYear?: string;
  profileComplete?: boolean;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: string;
  appliedAt: any;
  experience: string;
  currentRole: string;
  phone: string;
  linkedin?: string;
  portfolio?: string;
  coverLetter?: string;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending:   { bg: '#fff8e1', color: '#f59e0b', label: '⏳ Pending' },
    reviewed:  { bg: '#e3f2fd', color: '#2196f3', label: '👁 Reviewed' },
    shortlisted: { bg: '#e8f5e9', color: '#4caf50', label: '⭐ Shortlisted' },
    rejected:  { bg: '#fce4ec', color: '#e91e63', label: '✗ Rejected' },
    hired:     { bg: '#e8f5e9', color: '#14a077', label: '🎉 Hired!' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      background: s.bg, color: s.color, padding: '4px 12px',
      borderRadius: 20, fontSize: 12, fontWeight: 600,
    }}>{s.label}</span>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [toggle, setToggle] = useState({ key: '', status: false });
  const [isShowMobile, setShowMobile] = useState(false);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleToggle = (key: string) =>
    setToggle(prev => prev.key === key ? { key: '', status: false } : { key, status: true });

  const handleMobile = () => {
    const el = document.querySelector('.menu-mobile-popup');
    setShowMobile(!isShowMobile);
    !isShowMobile ? el?.classList.add('modal-menu--open') : el?.classList.remove('modal-menu--open');
  };

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (!u) {
        router.push('/');
        return;
      }
      // Fetch Firestore profile
      try {
        const snap = await getDoc(doc(db, 'users', u.uid));
        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
      // Fetch this user's applications
      try {
        const q = query(
          collection(db, 'applications'),
          where('applicantUid', '==', u.uid),
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Application));
        // Sort by date descending
        data.sort((a, b) => {
          const at = a.appliedAt?.toDate?.() ?? new Date(a.appliedAt ?? 0);
          const bt = b.appliedAt?.toDate?.() ?? new Date(b.appliedAt ?? 0);
          return bt.getTime() - at.getTime();
        });
        setApplications(data);
      } catch (err) {
        console.error('Error fetching applications:', err);
      } finally {
        setAppsLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  // Check hash for tab
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#applications') {
      setActiveTab(1);
    }
  }, []);

  const formatDate = (ts: any) => {
    if (!ts) return 'N/A';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];
  const getColor = (name?: string) => COLORS[(name?.charCodeAt(0) ?? 0) % COLORS.length];
  const getInitial = (name?: string | null) => (name || '?')[0]?.toUpperCase() ?? '?';

  if (loading) return (
    <>
      <Header4 clname="" handleMobile={handleMobile} />
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid #e0e0e0', borderTopColor: '#14a077', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#999' }}>Loading your profile...</p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Footer />
    </>
  );

  if (!user) return null;

  const statCounts = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    hired: applications.filter(a => a.status === 'hired').length,
  };

  const isProfileComplete = userProfile?.profileComplete === true;

  return (
    <>
      {/* Profile Completion Modal */}
      {showProfileModal && user && (
        <ProfileCompleteModal
          userEmail={user.email || ''}
          userName={user.displayName || ''}
          initialData={userProfile ?? undefined}
          onComplete={async () => {
            setShowProfileModal(false);
            // Update localStorage cache
            if (user) localStorage.setItem(`pc_${user.uid}`, '1');
            // Refresh profile data from Firestore
            const snap = await getDoc(doc(db, 'users', user.uid));
            if (snap.exists()) setUserProfile(snap.data() as UserProfile);
          }}
          onDismiss={() => setShowProfileModal(false)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .profile-card { animation: fadeUp 0.4s ease both; }
        .app-card { transition: box-shadow 0.2s, transform 0.2s; }
        .app-card:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.10) !important; transform: translateY(-2px); }
        .tab-btn { transition: all 0.2s; }
        .tab-btn.active { background: linear-gradient(135deg,#14a077,#0f7a5a) !important; color: #fff !important; }
      `}</style>

      {/* Mobile Menu */}
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

      <Header4 clname="actJob2" handleMobile={handleMobile} />

      {/* ── Hero ── */}
      <section style={{
        background: 'linear-gradient(135deg, #0f2557 0%, #14a077 100%)',
        padding: '80px 0 120px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="tf-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} style={{ width: 110, height: 110, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.5)', objectFit: 'cover', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }} />
              ) : (
                <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 800, color: '#fff', border: '4px solid rgba(255,255,255,0.4)' }}>
                  {getInitial(user.displayName)}
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: '#4caf50', border: '2px solid #fff' }} />
            </div>
            {/* Info */}
            <div style={{ color: '#fff' }}>
              <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800 }}>{user.displayName}</h1>
              <p style={{ margin: '0 0 4px', opacity: 0.8, fontSize: 15 }}>
                <i className="icon-mail" style={{ marginRight: 6 }} />{user.email}
              </p>
              <p style={{ margin: 0, opacity: 0.65, fontSize: 13 }}>
                Member since {user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Recently'}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#fff' }}>
                  ✉ Google Account
                </span>
                <span style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#fff' }}>
                  📋 {statCounts.total} Application{statCounts.total !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            {/* Sign Out */}
            <div style={{ marginLeft: 'auto' }}>
              <button onClick={() => signOut(auth)} style={{
                padding: '10px 20px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, backdropFilter: 'blur(4px)',
              }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <div style={{ background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginTop: -48, borderRadius: 16, maxWidth: 900, margin: '-48px auto 0', position: 'relative', zIndex: 2, padding: '24px 32px', display: 'flex', gap: 0, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Applied', value: statCounts.total, color: '#4f46e5', icon: '📤' },
          { label: 'Pending Review', value: statCounts.pending, color: '#f59e0b', icon: '⏳' },
          { label: 'Shortlisted', value: statCounts.shortlisted, color: '#14a077', icon: '⭐' },
          { label: 'Hired', value: statCounts.hired, color: '#059669', icon: '🎉' },
        ].map((stat, i) => (
          <div key={stat.label} style={{ flex: 1, minWidth: 120, textAlign: 'center', padding: '12px 16px', borderRight: i < 3 ? '1px solid #f0f0f0' : 'none' }}>
            <div style={{ fontSize: 28 }}>{stat.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: stat.color, lineHeight: 1.2, marginTop: 4 }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main Content ── */}
      <section style={{ padding: '60px 0 80px' }}>
        <div className="tf-container">
          {/* Tab Buttons */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
            {['👤 Profile Details', '📋 My Applications'].map((label, i) => (
              <button
                key={label}
                onClick={() => setActiveTab(i)}
                className={`tab-btn${activeTab === i ? ' active' : ''}`}
                style={{
                  padding: '10px 24px', borderRadius: 25, border: '1.5px solid #e0e0e0',
                  background: activeTab === i ? '' : '#fff',
                  color: activeTab === i ? '' : '#555',
                  cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}
              >{label}</button>
            ))}
          </div>

          {/* ── Tab 0: Profile Details ── */}
          {activeTab === 0 && (
            <div className="row profile-card">
              <div className="col-lg-8">

                {/* ── Complete Profile Banner ── */}
                {!isProfileComplete && (
                  <div style={{
                    background: 'linear-gradient(135deg, #fff8e1, #fff3cd)',
                    border: '1.5px solid #f59e0b',
                    borderRadius: 14, padding: '18px 22px', marginBottom: 20,
                    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                  }}>
                    <span style={{ fontSize: 32 }}>🚀</span>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontWeight: 700, color: '#92400e', fontSize: 15 }}>Your profile is incomplete!</div>
                      <div style={{ color: '#b45309', fontSize: 13, marginTop: 2 }}>Complete your profile to get matched with the best jobs</div>
                    </div>
                    <button
                      onClick={() => setShowProfileModal(true)}
                      style={{
                        padding: '10px 20px', borderRadius: 10, border: 'none',
                        background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                        color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Complete Now →
                    </button>
                  </div>
                )}

                {/* ── Account Info ── */}
                <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 20 }}>
                  <div style={{ background: 'linear-gradient(135deg,#f0faf6,#e8f4ff)', padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1a1a2e' }}>Account Information</h3>
                    <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>Your Google account details</p>
                  </div>
                  <div style={{ padding: '22px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {[
                        { label: 'Full Name', value: userProfile?.name || user.displayName, icon: '👤' },
                        { label: 'Email Address', value: user.email, icon: '✉' },
                        { label: 'Email Verified', value: user.emailVerified ? '✓ Verified' : '✗ Not Verified', icon: '🛡' },
                        { label: 'Member Since', value: user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A', icon: '📅' },
                      ].map(item => (
                        <div key={item.label} style={{ padding: '14px', background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                          <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
                            {item.icon} {item.label}
                          </div>
                          <div style={{ fontSize: 14, color: '#1a1a2e', fontWeight: 600 }}>{item.value || 'Not provided'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Personal Details (Firestore) ── */}
                {isProfileComplete && userProfile && (
                  <>
                    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{ background: 'linear-gradient(135deg,#f0faf6,#e8f4ff)', padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1a1a2e' }}>Personal Details</h3>
                        <button
                          onClick={() => {
                            // Clear cache so re-save is recognized
                            if (user) localStorage.removeItem(`pc_${user.uid}`);
                            setShowProfileModal(true);
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 16px', borderRadius: 8,
                            border: '1.5px solid #14a077',
                            background: '#fff', color: '#14a077',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#14a077'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#14a077'; }}
                        >
                          ✏ Edit Profile
                        </button>
                      </div>
                      <div style={{ padding: '22px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          {[
                            { label: 'Date of Birth', value: userProfile.dateOfBirth, icon: '🎂' },
                            { label: 'Gender', value: userProfile.gender, icon: '👥' },
                            { label: 'Work Status', value: userProfile.workStatus, icon: '💼' },
                            { label: 'Education Level', value: userProfile.educationLevel, icon: '🎓' },
                            { label: 'Current City', value: userProfile.currentCity, icon: '📍' },
                            { label: 'English Level', value: userProfile.englishLevel, icon: '🗣' },
                          ].filter(f => f.value).map(item => (
                            <div key={item.label} style={{ padding: '14px', background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
                                {item.icon} {item.label}
                              </div>
                              <div style={{ fontSize: 14, color: '#1a1a2e', fontWeight: 600 }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                        {userProfile.openToRelocation && (
                          <div style={{ marginTop: 14, padding: '10px 14px', background: '#e8f5ef', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>🚗</span>
                            <span style={{ color: '#14a077', fontWeight: 600, fontSize: 13 }}>Open to Relocation</span>
                            {userProfile.preferredCities && userProfile.preferredCities.length > 0 && (
                              <span style={{ color: '#555', fontSize: 13 }}>— {userProfile.preferredCities.join(', ')}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Skills */}
                    {userProfile.keySkills && (
                      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 20 }}>
                        <div style={{ background: 'linear-gradient(135deg,#f0faf6,#e8f4ff)', padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
                          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1a1a2e' }}>🛠 Key Skills</h3>
                        </div>
                        <div style={{ padding: '18px 22px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {userProfile.keySkills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                            <span key={skill} style={{
                              padding: '6px 14px', borderRadius: 20,
                              background: '#e8f5ef', color: '#14a077',
                              fontSize: 13, fontWeight: 600,
                              border: '1px solid #c8e6da',
                            }}>{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preferred Job Roles */}
                    {userProfile.preferredJobRoles && userProfile.preferredJobRoles.length > 0 && (
                      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 20 }}>
                        <div style={{ background: 'linear-gradient(135deg,#f0faf6,#e8f4ff)', padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
                          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1a1a2e' }}>🎯 Preferred Job Roles</h3>
                        </div>
                        <div style={{ padding: '18px 22px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {userProfile.preferredJobRoles.map(role => (
                            <span key={role} style={{
                              padding: '6px 14px', borderRadius: 20,
                              background: '#e8f0fe', color: '#4f46e5',
                              fontSize: 13, fontWeight: 600,
                              border: '1px solid #c7d2fe',
                            }}>{role}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education Details */}
                    {(userProfile.collegeName || userProfile.degree) && (
                      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 20 }}>
                        <div style={{ background: 'linear-gradient(135deg,#f0faf6,#e8f4ff)', padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
                          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1a1a2e' }}>🎓 Education Details</h3>
                        </div>
                        <div style={{ padding: '18px 22px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            {[
                              { label: 'College / Institute', value: userProfile.collegeName, icon: '🏫' },
                              { label: 'Degree', value: userProfile.degree, icon: '📜' },
                              { label: 'Specialization', value: userProfile.specialization, icon: '📚' },
                              { label: 'Completion Year', value: userProfile.completionYear, icon: '📅' },
                            ].filter(f => f.value).map(item => (
                              <div key={item.label} style={{ padding: '12px', background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                                <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                                  {item.icon} {item.label}
                                </div>
                                <div style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 600 }}>{item.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Quick Actions sidebar */}
              <div className="col-lg-4">
                <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(135deg,#f0faf6,#e8f4ff)', padding: '24px 28px', borderBottom: '1px solid #f0f0f0' }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>Quick Actions</h3>
                  </div>
                  <div style={{ padding: '20px' }}>
                    {[
                      { href: '/find-jobs', icon: '🔍', label: 'Browse Jobs', sub: 'Find your next opportunity' },
                      { href: '/profile#applications', icon: '📋', label: 'My Applications', sub: `${statCounts.total} submitted`, onClick: () => setActiveTab(1) },
                      { href: '/find-jobs', icon: '🏢', label: 'Top Companies', sub: 'Explore employers' },
                    ].map(item => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={item.onClick}
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 12px', borderRadius: 10, textDecoration: 'none', marginBottom: 8, transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f8f9fa')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e8f5ef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                          {item.icon}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>{item.label}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>{item.sub}</div>
                        </div>
                        <i className="icon-chevron-right" style={{ marginLeft: 'auto', color: '#ccc', fontSize: 12 }} />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Profile completion CTA */}
                {!isProfileComplete ? (
                  <div style={{ background: 'linear-gradient(135deg,#0f2557,#14a077)', borderRadius: 16, padding: '24px', marginTop: 20, color: '#fff' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>🚀 Complete Your Profile</h4>
                    <p style={{ margin: '0 0 16px', fontSize: 13, opacity: 0.85 }}>Get matched with the best jobs in 2 minutes</p>
                    <button
                      onClick={() => setShowProfileModal(true)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'center', padding: '11px 0',
                        background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                        borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14,
                        cursor: 'pointer',
                      }}
                    >Complete Profile →</button>
                  </div>
                ) : (
                  <div style={{ background: 'linear-gradient(135deg,#e8f5ef,#d1fae5)', borderRadius: 16, padding: '20px', marginTop: 20 }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                    <div style={{ fontWeight: 700, color: '#065f46', fontSize: 15 }}>Profile Complete!</div>
                    <div style={{ color: '#047857', fontSize: 13, marginTop: 4, marginBottom: 16 }}>Your profile is fully set up. You're getting the best job matches.</div>
                    <button
                      onClick={() => {
                        if (user) localStorage.removeItem(`pc_${user.uid}`);
                        setShowProfileModal(true);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        width: '100%', padding: '10px 0', borderRadius: 8,
                        border: '1.5px solid #14a077', background: '#fff',
                        color: '#14a077', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      }}
                    >
                      ✏ Edit Profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab 1: Applications ── */}
          {activeTab === 1 && (
            <div className="profile-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>My Applications</h3>
                  <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>{statCounts.total} total application{statCounts.total !== 1 ? 's' : ''}</p>
                </div>
                <Link href="/find-jobs" style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#14a077,#0f7a5a)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                  + Apply to More Jobs
                </Link>
              </div>

              {appsLoading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                  <div style={{ width: 40, height: 40, border: '3px solid #e0e0e0', borderTopColor: '#14a077', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                  <p>Loading your applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>📭</div>
                  <h4 style={{ margin: '0 0 8px', color: '#1a1a2e' }}>No applications yet</h4>
                  <p style={{ color: '#888', margin: '0 0 24px' }}>Start applying to jobs and track your progress here</p>
                  <Link href="/find-jobs" style={{ padding: '12px 28px', borderRadius: 10, background: 'linear-gradient(135deg,#14a077,#0f7a5a)', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
                    Browse Jobs
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {applications.map((app, i) => (
                    <div
                      key={app.id}
                      className="app-card"
                      style={{
                        background: '#fff', borderRadius: 16,
                        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                        border: '1px solid #f0f0f0',
                        overflow: 'hidden',
                        animationDelay: `${i * 0.05}s`,
                      }}
                    >
                      {/* Card Header */}
                      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        {/* Company Logo */}
                        <div style={{ width: 52, height: 52, borderRadius: 10, background: getColor(app.company), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
                          {getInitial(app.company)}
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>{app.jobTitle}</h4>
                          <p style={{ margin: '0 0 6px', color: '#666', fontSize: 13 }}>
                            <i className="icon-briefcase" style={{ marginRight: 4 }} />{app.company}
                          </p>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                            <StatusBadge status={app.status} />
                            {app.experience && (
                              <span style={{ fontSize: 12, color: '#888', background: '#f5f5f5', padding: '3px 10px', borderRadius: 10 }}>
                                {app.experience}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Date + Expand */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                            Applied {formatDate(app.appliedAt)}
                          </div>
                          <button
                            onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                            style={{
                              padding: '6px 14px', borderRadius: 8, border: '1px solid #e0e0e0',
                              background: '#fff', cursor: 'pointer', fontSize: 12, color: '#555',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            {expandedApp === app.id ? 'Hide Details ▲' : 'View Details ▼'}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedApp === app.id && (
                        <div style={{ padding: '0 24px 24px', borderTop: '1px solid #f8f8f8' }}>
                          <div style={{ paddingTop: 20 }}>
                            <h5 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>Application Details</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
                              {[
                                { label: 'Current Role', value: app.currentRole },
                                { label: 'Phone', value: app.phone },
                                { label: 'Experience', value: app.experience },
                                { label: 'Notice Period', value: (app as any).noticePeriod },
                                { label: 'Current Salary', value: (app as any).currentSalary },
                                { label: 'Status', value: app.status?.toUpperCase() },
                              ].filter(f => f.value).map(field => (
                                <div key={field.label} style={{ padding: '12px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                                  <div style={{ fontSize: 11, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{field.label}</div>
                                  <div style={{ fontSize: 13, color: '#333', fontWeight: 600 }}>{field.value}</div>
                                </div>
                              ))}
                            </div>

                            {/* Links */}
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                              {app.linkedin && (
                                <a href={app.linkedin} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#e8f0fe', color: '#1976d2', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                                  <i className="icon-linkedin2" /> LinkedIn
                                </a>
                              )}
                              {app.portfolio && (
                                <a href={app.portfolio} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#f3e8ff', color: '#7c3aed', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                                  🔗 Portfolio
                                </a>
                              )}
                              {(app as any).resumeUrl && (
                                <a href={(app as any).resumeUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#e8f5ef', color: '#14a077', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                                  📄 View Resume
                                </a>
                              )}
                            </div>

                            {/* Cover Letter */}
                            {app.coverLetter && (
                              <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '16px', border: '1px solid #f0f0f0' }}>
                                <div style={{ fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Cover Letter</div>
                                <p style={{ margin: 0, fontSize: 13, color: '#555', lineHeight: 1.7 }}>{app.coverLetter}</p>
                              </div>
                            )}

                            {/* Action buttons */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                              <Link href={generateJobUrl(app.jobId, app.jobTitle)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #14a077', color: '#14a077', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                                View Job Post
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <Gotop />
    </>
  );
}
