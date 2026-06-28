'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Collapse } from 'react-collapse';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Header4 from '@/components/header/Header4';
import Footer from '@/components/footer';
import Gotop from '@/components/gotop';
import logo from '@/assets/images/logo.png';
import { useFirebaseJob, useFirebaseJobs } from '@/lib/useFirebaseData';
import { auth, googleProvider, db } from '@/lib/firebase';
import {
  signInWithPopup, signOut, onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { collection, addDoc, serverTimestamp, getDoc, doc, setDoc } from 'firebase/firestore';
import { extractId, generateJobUrl } from '@/lib/slug';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitial = (name?: string) => (name || '?')[0]?.toUpperCase() ?? '?';
const COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];
const getColor = (name?: string) => COLORS[(name?.charCodeAt(0) ?? 0) % COLORS.length];

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

// ─── Google Login Modal ───────────────────────────────────────────────────────
function LoginModal({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const u = result.user;
      // Create a minimal users doc on first Google sign-in so candidateProfile
      // has at least name/email when the user applies before completing profile
      const userRef = doc(db, 'users', u.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          name: u.displayName ?? '',
          email: u.email ?? '',
          signInMethod: 'google',
          profileComplete: false,
          createdAt: serverTimestamp(),
        });
      }
      onLogin();
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, padding: '44px 40px',
        width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
        textAlign: 'center', position: 'relative',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 20, background: 'none', border: 'none',
          fontSize: 24, cursor: 'pointer', color: '#999', lineHeight: 1,
        }}>×</button>

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg,#14a077,#0f7a5a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 32,
        }}>💼</div>

        <h3 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>
          Sign in to Apply
        </h3>
        <p style={{ color: '#666', fontSize: 14, margin: '0 0 28px', lineHeight: 1.6 }}>
          Sign in with your Google account to continue your application. Your profile will be auto-filled.
        </p>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '14px 20px', borderRadius: 12,
            border: '2px solid #e0e0e0', background: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            fontSize: 15, fontWeight: 600, color: '#333',
            transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)')}
        >
          {loading ? (
            <span style={{ width: 20, height: 20, border: '2px solid #ccc', borderTopColor: '#14a077', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          )}
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <p style={{ fontSize: 12, color: '#aaa', marginTop: 20 }}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Application Form Modal ───────────────────────────────────────────────────
interface AppForm {
  fullName: string;
  email: string;
  phone: string;
  currentRole: string;
  experience: string;
  currentSalary: string;
  noticePeriod: string;
  linkedin: string;
  portfolio: string;
  resumeUrl: string;
  coverLetter: string;
  agreeTerms: boolean;
}

function ApplicationModal({
  user, job, onClose,
}: {
  user: User;
  job: { id: string; title: string; company: string; companyId?: string; location?: string; category?: string };
  onClose: () => void;
}) {
  const [step, setStep] = useState(1); // 1=Personal, 2=Professional, 3=Documents, 4=Success
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AppForm>({
    fullName: user.displayName || '',
    email: user.email || '',
    phone: '',
    currentRole: '',
    experience: '',
    currentSalary: '',
    noticePeriod: '',
    linkedin: '',
    portfolio: '',
    resumeUrl: '',
    coverLetter: '',
    agreeTerms: false,
  });

  const update = (field: keyof AppForm, value: string | boolean) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    if (!form.agreeTerms) return;
    setSubmitting(true);
    try {
      // Fetch candidate profile — user can always read their own doc
      let candidateProfile: Record<string, any> = {};
      try {
        const profileSnap = await getDoc(doc(db, 'users', user.uid));
        if (profileSnap.exists()) {
          const p = profileSnap.data();
          candidateProfile = {
            dateOfBirth:       p.dateOfBirth       ?? '',
            gender:            p.gender             ?? '',
            currentCity:       p.currentCity || p.location || '',
            workStatus:        p.workStatus         ?? '',
            profileSummary:    p.profileSummary     ?? '',
            keySkills:         p.keySkills          ?? '',
            preferredJobRoles: p.preferredJobRoles  ?? [],
            educationLevel:    p.educationLevel     ?? '',
            collegeName:       p.collegeName        ?? '',
            degree:            p.degree             ?? '',
            specialization:    p.specialization     ?? '',
            completionYear:    p.completionYear     ?? '',
            englishLevel:      p.englishLevel       ?? '',
            openToRelocation:  p.openToRelocation   ?? false,
            preferredCities:   p.preferredCities    ?? [],
            profileComplete:   p.profileComplete    ?? false,
            signInMethod:      p.signInMethod       ?? 'google',
            employmentHistory: p.employmentHistory  ?? [],
            educationHistory:  p.educationHistory   ?? [],
          };
        }
      } catch { /* profile not found or not yet created */ }

      await addDoc(collection(db, 'applications'), {
        jobId:          job.id,
        jobTitle:       job.title,
        company:        job.company,
        companyId:      job.companyId ?? '',
        applicantUid:   user.uid,
        applicantName:  form.fullName,
        applicantEmail: form.email,
        phone:          form.phone,
        currentRole:    form.currentRole,
        experience:     form.experience,
        currentSalary:  form.currentSalary,
        noticePeriod:   form.noticePeriod,
        linkedin:       form.linkedin,
        portfolio:      form.portfolio,
        resumeUrl:      form.resumeUrl,
        coverLetter:    form.coverLetter,
        status:         'Applied',
        appliedAt:      serverTimestamp(),
        candidateProfile,
      });
      setStep(4);
    } catch (err) {
      console.error('Application submit failed:', err);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 14,
    border: '1.5px solid #e0e0e0', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s', background: '#fafafa', color: '#333',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: '#555', display: 'block',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  };
  const stepColors = ['#14a077', '#0891b2', '#7c3aed'];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
      padding: '16px',
    }} onClick={step === 4 ? onClose : undefined}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20,
        width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 32px 100px rgba(0,0,0,0.2)',
        position: 'relative',
      }}>

        {/* ── Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f2557, #14a077)',
          borderRadius: '20px 20px 0 0', padding: '28px 32px',
          color: '#fff',
        }}>
          {step < 4 && (
            <button onClick={onClose} style={{
              position: 'absolute', top: 16, right: 20, background: 'rgba(255,255,255,0.2)',
              border: 'none', borderRadius: '50%', width: 32, height: 32,
              cursor: 'pointer', color: '#fff', fontSize: 18, lineHeight: 1,
            }}>×</button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            {user.photoURL && (
              <img src={user.photoURL} alt={user.displayName || ''} style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)' }} />
            )}
            <div>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Applying as</p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{user.displayName} · {user.email}</p>
            </div>
          </div>
          <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>Apply for: {job.title}</h3>
          <p style={{ margin: 0, opacity: 0.8, fontSize: 13 }}>{job.company} {job.location ? `· ${job.location}` : ''}</p>

          {/* Progress bar */}
          {step < 4 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              {['Personal Info', 'Professional', 'Documents'].map((label, i) => (
                <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    height: 4, borderRadius: 2,
                    background: step > i + 1 ? '#fff' : step === i + 1 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                    marginBottom: 4,
                  }} />
                  <span style={{ fontSize: 10, opacity: step === i + 1 ? 1 : 0.6 }}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '28px 32px' }}>

          {/* Step 1 — Personal Info */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>Personal Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input style={inputStyle} value={form.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Your full name" required />
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input value={form.email} readOnly placeholder="Email" style={{ ...inputStyle, background: '#f0f9f5', color: '#14a077', cursor: 'not-allowed' }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Phone Number *</label>
                <input style={inputStyle} value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 98765 43210" type="tel" required />
              </div>
              <div>
                <label style={labelStyle}>Current Job Title</label>
                <input style={inputStyle} value={form.currentRole} onChange={e => update('currentRole', e.target.value)} placeholder="e.g. Software Engineer" />
              </div>
            </div>
          )}

          {/* Step 2 — Professional */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>Professional Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Years of Experience *</label>
                  <select style={inputStyle} value={form.experience} onChange={e => update('experience', e.target.value)} required>
                    <option value="">Select experience</option>
                    {['Fresher (0 yrs)', '1-2 years', '2-4 years', '4-6 years', '6-9 years', '9+ years'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Notice Period *</label>
                  <select style={inputStyle} value={form.noticePeriod} onChange={e => update('noticePeriod', e.target.value)} required>
                    <option value="">Select notice period</option>
                    {['Immediately', '15 days', '30 days', '45 days', '60 days', '90 days'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Current Salary (per year)</label>
                <input style={inputStyle} value={form.currentSalary} onChange={e => update('currentSalary', e.target.value)} placeholder="e.g. ₹ 8,00,000" />
              </div>
              <div>
                <label style={labelStyle}>LinkedIn Profile</label>
                <input style={inputStyle} value={form.linkedin} onChange={e => update('linkedin', e.target.value)} placeholder="https://linkedin.com/in/yourname" type="url" />
              </div>
              <div>
                <label style={labelStyle}>Portfolio / GitHub (optional)</label>
                <input style={inputStyle} value={form.portfolio} onChange={e => update('portfolio', e.target.value)} placeholder="https://github.com/yourname" type="url" />
              </div>
            </div>
          )}

          {/* Step 3 — Documents & Cover Letter */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>Documents & Cover Letter</h4>
              <div>
                <label style={labelStyle}>Resume / CV Link *</label>
                <input
                  style={inputStyle} value={form.resumeUrl}
                  onChange={e => update('resumeUrl', e.target.value)}
                  placeholder="Paste Google Drive / Dropbox link to your resume"
                  required
                />
                <p style={{ fontSize: 11, color: '#aaa', marginTop: 5 }}>
                  Upload your resume to Google Drive and share the link here (make sure it's publicly accessible)
                </p>
              </div>
              <div>
                <label style={labelStyle}>Cover Letter *</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }}
                  value={form.coverLetter}
                  onChange={e => update('coverLetter', e.target.value)}
                  placeholder="Tell the employer why you're a great fit for this role. Highlight your key skills, experiences, and what excites you about this opportunity..."
                  required
                />
              </div>
              {/* Terms */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: '#555' }}>
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={e => update('agreeTerms', e.target.checked)}
                  style={{ marginTop: 2, width: 16, height: 16, accentColor: '#14a077', flexShrink: 0 }}
                />
                <span>
                  I confirm that all information provided is accurate. I agree to the{' '}
                  <Link href="#" style={{ color: '#14a077' }}>Terms of Service</Link> and{' '}
                  <Link href="#" style={{ color: '#14a077' }}>Privacy Policy</Link>.
                </span>
              </label>
            </div>
          )}

          {/* Step 4 — Success */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%', margin: '0 auto 24px',
                background: 'linear-gradient(135deg, #14a077, #0f7a5a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
              }}>✓</div>
              <h3 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>
                Application Submitted! 🎉
              </h3>
              <p style={{ color: '#666', lineHeight: 1.7, marginBottom: 8 }}>
                Your application for <strong>{job.title}</strong> at <strong>{job.company}</strong> has been received.
              </p>
              <p style={{ color: '#999', fontSize: 13, marginBottom: 28 }}>
                A confirmation has been sent to <strong>{user.email}</strong>. The employer will contact you soon.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={onClose} style={{
                  padding: '12px 28px', borderRadius: 10, border: '1.5px solid #e0e0e0',
                  background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#555',
                }}>Close</button>
                <Link href="/find-jobs" style={{
                  padding: '12px 28px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg,#14a077,#0f7a5a)', color: '#fff',
                  fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-block',
                }}>Browse More Jobs</Link>
              </div>
            </div>
          )}

          {/* ── Navigation Buttons ── */}
          {step < 4 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'space-between' }}>
              {step > 1 ? (
                <button onClick={() => setStep(s => s - 1)} style={{
                  padding: '12px 24px', borderRadius: 10, border: '1.5px solid #e0e0e0',
                  background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#555',
                }}>← Back</button>
              ) : <div />}
              {step < 3 ? (
                <button
                  onClick={() => {
                    if (step === 1 && (!form.fullName || !form.phone)) { alert('Please fill in required fields.'); return; }
                    if (step === 2 && (!form.experience || !form.noticePeriod)) { alert('Please select experience and notice period.'); return; }
                    setStep(s => s + 1);
                  }}
                  style={{
                    padding: '12px 28px', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg,#14a077,#0f7a5a)', color: '#fff',
                    cursor: 'pointer', fontWeight: 700, fontSize: 14,
                    boxShadow: '0 4px 16px rgba(20,160,119,0.35)',
                  }}>
                  Continue →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !form.agreeTerms || !form.resumeUrl || !form.coverLetter}
                  style={{
                    padding: '12px 28px', borderRadius: 10, border: 'none',
                    background: submitting || !form.agreeTerms || !form.resumeUrl || !form.coverLetter
                      ? '#ccc' : 'linear-gradient(135deg,#14a077,#0f7a5a)',
                    color: '#fff', cursor: submitting ? 'wait' : 'pointer',
                    fontWeight: 700, fontSize: 14,
                    boxShadow: '0 4px 16px rgba(20,160,119,0.35)',
                  }}>
                  {submitting ? 'Submitting...' : '🚀 Submit Application'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const actualId = extractId(id);
  const { job, loading, error } = useFirebaseJob(actualId);
  const { jobs: relatedJobs } = useFirebaseJobs(6);

  const [toggle, setToggle] = useState({ key: '', status: false });
  const [wishlisted, setWishlisted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAppModal, setShowAppModal] = useState(false);

  const handleToggle = (key: string) =>
    setToggle(prev => prev.key === key ? { key: '', status: false } : { key, status: true });


  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const WOW = require('wowjs');
    window.wow = new WOW.WOW({ live: false });
    window.wow.init();
  }, []);

  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginModal(true);
    } else {
      setShowAppModal(true);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    setShowAppModal(true);
  };

  const otherJobs = relatedJobs.filter(j => j.id !== actualId).slice(0, 3);

  if (loading) return (
    <>
      <Header4 clname="actJob2" />
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 18, color: '#999' }}>Loading job details...</p>
      </div>
      <Footer />
    </>
  );

  if (error || !job) return (
    <>
      <Header4 clname="actJob2" />
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ fontSize: 20, fontWeight: 600, color: '#333' }}>Job not found</p>
        <Link href="/find-jobs" style={{ color: '#14a077', textDecoration: 'underline' }}>Browse all jobs</Link>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      {/* ── Modals ── */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLoginSuccess}
        />
      )}
      {showAppModal && user && (
        <ApplicationModal
          user={user}
          job={{ id: actualId, title: job.title, company: job.company, companyId: job.companyId, location: job.location, category: job.category }}
          onClose={() => setShowAppModal(false)}
        />
      )}

      {/* ── Header ── */}
      <Header4 clname="actJob2" />

      {/* ── Hero Banner ── */}
      <section className="single-job-thumb">
        <div style={{
          height: 280, background: 'linear-gradient(135deg, #0f2557 0%, #14a077 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.08,
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
          <div style={{ textAlign: 'center', color: '#fff', zIndex: 1 }}>
            <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 8 }}>{job.category || 'Career Opportunity'}</p>
            <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0 }}>{job.title}</h1>
          </div>
        </div>
      </section>

      {/* ── Sticky Job Author Bar ── */}
      <section className="form-sticky fixed-space">
        <div className="tf-container">
          <div className="row">
            <div className="col-lg-12">
              <div className="wd-job-author2">
                <div className="content-left">
                  <div className="thumb">
                    <div style={{
                      width: 68, height: 68, borderRadius: 12,
                      background: getColor(job.company), color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 28, fontWeight: 800, flexShrink: 0,
                    }}>{getInitial(job.company)}</div>
                  </div>
                  <div className="content">
                    <Link href="#" className="category">{job.company}</Link>
                    <h6><Link href="#">{job.title} <span className="icon-bolt"></span></Link></h6>
                    <ul className="job-info">
                      {job.location && <li><span className="icon-map-pin"></span><span>{job.location}</span></li>}
                      {job.createdAt && <li><span className="icon-calendar"></span><span>{timeAgo(job.createdAt)}</span></li>}
                    </ul>
                    <ul className="tags">
                      {job.jobType && <li><Link href="#">{job.jobType}</Link></li>}
                      {job.experience && <li><Link href="#">{job.experience}</Link></li>}
                      {job.category && <li><Link href="#">{job.category}</Link></li>}
                    </ul>
                  </div>
                </div>
                <div className="content-right">
                  <div className="top">
                    <Link href="#" className="share"><i className="icon-share2" /></Link>
                    <Link href="#" className="wishlist" onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}>
                      <i className="icon-heart" style={{ color: wishlisted ? '#e74c3c' : undefined }} />
                    </Link>
                    {/* ── Apply Now Button ── */}
                    {user ? (
                      <button
                        onClick={handleApplyClick}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '10px 20px', borderRadius: 8, border: 'none',
                          background: 'linear-gradient(135deg,#14a077,#0f7a5a)',
                          color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                          boxShadow: '0 4px 14px rgba(20,160,119,0.4)',
                        }}
                      >
                        <i className="icon-send" /> Apply Now
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyClick}
                        className="btn btn-popup"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', border: 'none' }}
                      >
                        <i className="icon-send" /> Apply Now
                      </button>
                    )}
                  </div>
                  {/* User info chip if logged in */}
                  {user && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />}
                      <span style={{ fontSize: 12, color: '#666' }}>{user.displayName}</span>
                      <button
                        onClick={() => signOut(auth)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#aaa', textDecoration: 'underline' }}
                      >Sign out</button>
                    </div>
                  )}
                  <div className="bottom">
                    <div className="gr-rating">
                      {job.deadline
                        ? <p>{Math.max(0, Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000))} days left to apply</p>
                        : <p>Apply Now</p>
                      }
                      <ul className="list-star">
                        {[...Array(5)].map((_, i) => <li key={i} className="icon-star-full" />)}
                      </ul>
                    </div>
                    {job.salary && (
                      <div className="price">
                        <span className="icon-dollar" />
                        <p>{job.currency || '₹'} {job.salary}<span className="year">/year</span></p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <section className="inner-jobs-section">
        <div className="tf-container">
          <div className="row">
            <div className="col-lg-8">
              <Tabs className="job-article tf-tab single-job">
                <TabList className="menu-tab">
                  <Tab className="ct-tab">About</Tab>
                  <Tab className="ct-tab">Related Jobs ({otherJobs.length})</Tab>
                  <Tab className="ct-tab">Reviews</Tab>
                </TabList>
                <div className="content-tab">
                  <TabPanel className="inner-content animation-tab">
                    <h5>Full Job Description</h5>
                    {job.description
                      ? job.description.split('\n').map((para, i) => para.trim() && <p key={i} className={i > 0 ? 'mg-19' : ''}>{para}</p>)
                      : <p>Detailed job description will be provided by the employer. Please apply to get more information about this role.</p>
                    }
                    {job.skills && job.skills.length > 0 && (
                      <><h6>Required Skills:</h6><ul className="list-dot mg-bt-15">{job.skills.map((s, i) => <li key={i}>{s}</li>)}</ul></>
                    )}
                    {job.requirements && (
                      <><h6>Requirements:</h6>{job.requirements.split('\n').map((l, i) => l.trim() && <ul key={i} className="list-dot mg-bt-15"><li>{l}</li></ul>)}</>
                    )}

                    {/* ── Apply CTA Banner ── */}
                    <div style={{
                      margin: '32px 0', padding: '24px 28px', borderRadius: 16,
                      background: 'linear-gradient(135deg, #e8f5ef, #e3f4ff)',
                      border: '1px solid #c3e6cb', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
                    }}>
                      <div>
                        <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#1a1a2e', fontSize: 16 }}>
                          Interested in this role?
                        </p>
                        <p style={{ margin: 0, color: '#666', fontSize: 13 }}>
                          {user ? `Logged in as ${user.email}` : 'Sign in with Google to apply in minutes'}
                        </p>
                      </div>
                      <button
                        onClick={handleApplyClick}
                        style={{
                          padding: '12px 24px', borderRadius: 10, border: 'none',
                          background: 'linear-gradient(135deg,#14a077,#0f7a5a)', color: '#fff',
                          fontWeight: 700, fontSize: 14, cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(20,160,119,0.35)',
                          display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
                        }}
                      >
                        {user ? '🚀 Apply Now' : '🔑 Sign in & Apply'}
                      </button>
                    </div>

                    <div className="post-navigation d-flex aln-center">
                      <div className="wd-social d-flex aln-center">
                        <span>Share:</span>
                        <ul className="list-social d-flex aln-center">
                          {['facebook', 'linkedin2', 'twitter', 'pinterest'].map(icon => (
                            <li key={icon}><Link href="#"><i className={`icon-${icon}`}></i></Link></li>
                          ))}
                        </ul>
                      </div>
                      <Link href="#" className="frag-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="15" viewBox="0 0 14 15" fill="none">
                          <path fillRule="evenodd" clipRule="evenodd" d="M0 3C0 2.20435 0.316071 1.44129 0.87868 0.87868C1.44129 0.316071 2.20435 0 3 0H13C13.1857 0 13.3678 0.0517147 13.5257 0.149349C13.6837 0.246984 13.8114 0.386681 13.8944 0.552786C13.9775 0.718892 14.0126 0.904844 13.996 1.08981C13.9793 1.27477 13.9114 1.45143 13.8 1.6L11.25 5L13.8 8.4C13.9114 8.54857 13.9793 8.72523 13.996 8.91019C14.0126 9.09516 13.9775 9.28111 13.8944 9.44721C13.8114 9.61332 13.6837 9.75302 13.5257 9.85065C13.3678 9.94829 13.1857 10 13 10H3C2.73478 10 2.48043 10.1054 2.29289 10.2929C2.10536 10.4804 2 10.7348 2 11V14C2 14.2652 1.89464 14.5196 1.70711 14.7071C1.51957 14.8946 1.26522 15 1 15C0.734784 15 0.48043 14.8946 0.292893 14.7071C0.105357 14.5196 0 14.2652 0 14V3Z" fill="#64666C" />
                        </svg>
                        Report job
                      </Link>
                    </div>

                    <div className="job-rating">
                      <h6>Company Reviews</h6>
                      <div className="rating-review">
                        <div className="left-rating">
                          <h2>4.8</h2>
                          <ul className="list-star">{[...Array(5)].map((_, i) => <li key={i} className="icon-star-full"></li>)}</ul>
                          <p className="count-rating">(1,968 Ratings)</p>
                        </div>
                        <div className="right-rating">
                          <ul className="rating-list">
                            {[{ num: 5, pct: 60 }, { num: 4, pct: 20 }, { num: 3, pct: 10 }, { num: 2, pct: 7 }, { num: 1, pct: 3 }].map(r => (
                              <li key={r.num} className="rating-details">
                                <span className="number-rating">{r.num}</span>
                                <div style={{ flex: 1, height: 6, background: '#e0e0e0', borderRadius: 3, margin: '0 8px' }}>
                                  <div style={{ width: `${r.pct}%`, height: '100%', background: '#14a077', borderRadius: 3 }} />
                                </div>
                                <span className="percent">{r.pct}%</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {otherJobs.length > 0 && (
                      <div className="related-job">
                        <h6>Related Jobs</h6>
                        {otherJobs.map(rj => (
                          <div key={rj.id} className="features-job mg-bt-0">
                            <div className="job-archive-header">
                              <div className="inner-box">
                                <div className="logo-company">
                                  <div style={{ width: 54, height: 54, borderRadius: 8, background: getColor(rj.company), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>
                                    {getInitial(rj.company)}
                                  </div>
                                </div>
                                <div className="box-content">
                                  <h4><Link href={generateJobUrl(rj.id, rj.company)}>{rj.company}</Link></h4>
                                  <h3><Link href={generateJobUrl(rj.id, rj.title)}>{rj.title}</Link><span className="icon-bolt"></span></h3>
                                  <ul>
                                    {rj.location && <li><span className="icon-map-pin"></span>{rj.location}</li>}
                                  </ul>
                                  <span className="icon-heart"></span>
                                </div>
                              </div>
                            </div>
                            <div className="job-archive-footer">
                              <div className="job-footer-left">
                                <ul className="job-tag">
                                  {rj.jobType && <li><Link href="#">{rj.jobType}</Link></li>}
                                  {rj.experience && <li><Link href="#">{rj.experience}</Link></li>}
                                </ul>
                              </div>
                              <div className="job-footer-right">
                                {rj.salary && <div className="price"><span className="icon-dolar1"></span><p>{rj.currency || '₹'} {rj.salary}<span className="year">/year</span></p></div>}
                                <p className="days">Apply Now</p>
                              </div>
                            </div>
                            <Link href={generateJobUrl(rj.id, rj.title)} className="jobtex-link-item" tabIndex={0}></Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabPanel>

                  <TabPanel className="inner-content animation-tab">
                    <h5>Related Jobs ({otherJobs.length})</h5>
                    {otherJobs.map(rj => (
                      <div key={rj.id} className="features-job mg-bt-0">
                        <div className="job-archive-header">
                          <div className="inner-box">
                            <div className="logo-company">
                              <div style={{ width: 54, height: 54, borderRadius: 8, background: getColor(rj.company), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>
                                {getInitial(rj.company)}
                              </div>
                            </div>
                            <div className="box-content">
                              <h4><Link href={generateJobUrl(rj.id, rj.company)}>{rj.company}</Link></h4>
                              <h3><Link href={generateJobUrl(rj.id, rj.title)}>{rj.title}</Link><span className="icon-bolt"></span></h3>
                              <span className="icon-heart"></span>
                            </div>
                          </div>
                        </div>
                        <div className="job-archive-footer">
                          <div className="job-footer-left">
                            <ul className="job-tag">
                              {rj.jobType && <li><Link href="#">{rj.jobType}</Link></li>}
                            </ul>
                          </div>
                          <div className="job-footer-right">
                            <p className="days">Apply Now</p>
                          </div>
                        </div>
                        <Link href={generateJobUrl(rj.id, rj.title)} className="jobtex-link-item" tabIndex={0}></Link>
                      </div>
                    ))}
                  </TabPanel>

                  <TabPanel className="inner-content animation-tab">
                    <h5>Company Reviews</h5>
                    <p>Reviews for {job.company}.</p>
                    <div className="rating-review" style={{ marginTop: 20 }}>
                      <div className="left-rating">
                        <h2>4.8</h2>
                        <ul className="list-star">{[...Array(5)].map((_, i) => <li key={i} className="icon-star-full"></li>)}</ul>
                        <p className="count-rating">(1,968 Ratings)</p>
                      </div>
                    </div>
                  </TabPanel>
                </div>
              </Tabs>
            </div>

            {/* Right Sidebar */}
            <div className="col-lg-4">
              <div className="cv-form-details po-sticky job-sg single-stick">
                <div style={{ height: 180, borderRadius: 12, background: 'linear-gradient(135deg,#e8f5e9,#e3f2fd)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, border: '1px solid #e0e0e0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 40 }}>📍</span>
                    <p style={{ margin: '8px 0 4px', fontWeight: 600, color: '#333' }}>{job.location || 'Location'}</p>
                    <p style={{ fontSize: 13, color: '#888' }}>{job.company}</p>
                  </div>
                </div>
                <ul className="list-infor">
                  {job.location && <li><div className="category">Location</div><div className="detail">{job.location}</div></li>}
                  {job.salary && <li><div className="category">Salary</div><div className="detail">{job.currency || '₹'} {job.salary} / year</div></li>}
                  {job.experience && <li><div className="category">Experience</div><div className="detail">{job.experience}</div></li>}
                  {job.jobType && <li><div className="category">Job Type</div><div className="detail">{job.jobType}</div></li>}
                  {job.category && <li><div className="category">Category</div><div className="detail">{job.category}</div></li>}
                  {job.createdAt && <li><div className="category">Posted</div><div className="detail">{new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div></li>}
                </ul>
                <div className="wd-social d-flex aln-center">
                  <span>Socials:</span>
                  <ul className="list-social d-flex aln-center">
                    {['facebook', 'linkedin2', 'twitter', 'instagram1'].map(icon => (
                      <li key={icon}><Link href="#"><i className={`icon-${icon}`}></i></Link></li>
                    ))}
                  </ul>
                </div>
                <div className="form-job-single">
                  <h6>Contact Employer</h6>
                  <form onSubmit={(e) => e.preventDefault()}>
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
