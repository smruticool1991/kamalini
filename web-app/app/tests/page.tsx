'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  collection, query, where, getDocs, addDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, type User } from 'firebase/auth';
import { db, auth, googleProvider } from '@/lib/firebase';
import Header4 from '@/components/header/Header4';
import Footer from '@/components/footer';
import Gotop from '@/components/gotop';

// ─── Firestore types ─────────────────────────────────────────────────────────

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
}

interface Test {
  id: string;
  title: string;
  description?: string;
  status?: string;
  questions: Question[];
  timeLimit: number;       // minutes
  passingScore: number;    // percentage
  retakeAllowed?: boolean;
  maxRetakes?: number;
  retakeCooldownHours?: number;
  retakeCriteria?: 'all' | 'failed_only' | 'below_percentage';
  retakeBelowPercentage?: number;
  publishedAt?: Timestamp | string | null;
}

interface TestResult {
  id?: string;
  testId: string;
  userId: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  answers: number[];
  attemptNumber: number;
  completedAt?: Timestamp | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pad2(n: number) { return String(n).padStart(2, '0'); }

function formatCountdown(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function tsToDate(ts: Timestamp | string | null | undefined): Date | null {
  if (!ts) return null;
  if (typeof ts === 'string') { try { return new Date(ts); } catch { return null; } }
  if (ts instanceof Timestamp) return ts.toDate();
  return null;
}

// ─── Retake logic (mirrors mobile TestsScreen._retakeStatus) ─────────────────

function retakeStatus(test: Test, results: TestResult[]): {
  canRetake: boolean; blockReason: string; countdownMs: number | null;
} {
  if (!test.retakeAllowed) return { canRetake: false, blockReason: '', countdownMs: null };

  const maxRetakes = test.maxRetakes ?? 0;
  const cooldownHours = test.retakeCooldownHours ?? 0;
  const attemptCount = results.length;

  if (maxRetakes > 0 && attemptCount >= maxRetakes) {
    return { canRetake: false, blockReason: `Max attempts reached (${attemptCount}/${maxRetakes})`, countdownMs: null };
  }

  if (cooldownHours > 0 && results.length > 0) {
    const completedAt = tsToDate(results[0].completedAt);
    if (completedAt) {
      const canAt = new Date(completedAt.getTime() + cooldownHours * 3600000);
      const now = new Date();
      if (now < canAt) {
        return { canRetake: false, blockReason: '', countdownMs: canAt.getTime() - now.getTime() };
      }
    }
  }

  const criteria = test.retakeCriteria ?? 'all';
  if (criteria !== 'all' && results.length > 0) {
    const latest = results[0];
    if (criteria === 'failed_only' && latest.passed) {
      return { canRetake: false, blockReason: 'Only failed users can retake', countdownMs: null };
    }
    if (criteria === 'below_percentage') {
      const threshold = test.retakeBelowPercentage ?? 50;
      if (latest.percentage >= threshold) {
        return { canRetake: false, blockReason: `Score ${latest.percentage}% meets the ${threshold}% threshold`, countdownMs: null };
      }
    }
  }

  return { canRetake: true, blockReason: '', countdownMs: null };
}

// ─── Login Modal ──────────────────────────────────────────────────────────────

function LoginModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    setLoading(true);
    try { await signInWithPopup(auth, googleProvider); onClose(); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: '44px 40px', width: '100%', maxWidth: 400, boxShadow: '0 24px 80px rgba(0,0,0,0.18)', textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f0edff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="#7c3aed" strokeWidth="2"/></svg>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8 }}>Sign in to take tests</h3>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>Your progress and results will be saved to your account.</p>
        <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Signing in…' : '🔑 Continue with Google'}
        </button>
        <button onClick={onClose} style={{ marginTop: 14, background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Test List View ───────────────────────────────────────────────────────────

function TestListView({
  tests, resultsMap, user,
  onStart, onViewResult,
  showLoginModal,
}: {
  tests: Test[];
  resultsMap: Record<string, TestResult[]>;
  user: User | null;
  onStart: (test: Test) => void;
  onViewResult: (test: Test, results: TestResult[]) => void;
  showLoginModal: () => void;
}) {
  return (
    <section style={{ padding: '60px 0', minHeight: '60vh', background: '#f8fafc' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#f0edff', borderRadius: 30, padding: '8px 20px', marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ color: '#7c3aed', fontWeight: 600, fontSize: 13 }}>Skill Assessments</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Tests &amp; Assessments</h1>
          <p style={{ color: '#64748b', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>Prove your skills with timed assessments. Pass a test to stand out to employers.</p>
        </div>

        {tests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16, opacity: 0.4 }}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <p style={{ fontSize: 16, fontWeight: 600 }}>No tests available</p>
            <p style={{ fontSize: 14, marginTop: 4 }}>Check back later for new assessments.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {tests.map(test => {
              const results = resultsMap[test.id] ?? [];
              const isDone = results.length > 0;
              const latest = results[0];
              const rtk = isDone && test.retakeAllowed ? retakeStatus(test, results) : null;

              return (
                <div key={test.id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12l2 2 4-4" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', lineHeight: 1.3 }}>{test.title}</div>
                        {test.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{test.description}</div>}
                      </div>
                    </div>
                    {isDone && <span style={{ flexShrink: 0, background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>Done</span>}
                  </div>

                  {/* Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {[
                      { icon: '⏱', label: `${test.timeLimit} min` },
                      { icon: '✓', label: `${test.passingScore}% to pass` },
                      { icon: '?', label: `${test.questions.length} question${test.questions.length !== 1 ? 's' : ''}` },
                      ...(isDone ? [{ icon: '↺', label: `Attempt ${results.length}${(test.maxRetakes ?? 0) > 0 ? `/${test.maxRetakes}` : ''}`, purple: true }] : []),
                    ].map((chip, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: (chip as any).purple ? 'rgba(124,58,237,0.08)' : '#f1f5f9', color: (chip as any).purple ? '#7c3aed' : '#64748b', borderRadius: 8, padding: '4px 9px', fontSize: 11, fontWeight: 500 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{chip.icon}</span>{chip.label}
                      </span>
                    ))}
                  </div>

                  {/* Latest result bar */}
                  {isDone && latest && (
                    <div style={{ background: latest.passed ? '#f0fdf4' : '#fef2f2', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: latest.passed ? '#16a34a' : '#dc2626' }}>
                        {latest.passed ? '🎉 Passed' : '✗ Failed'} — {latest.percentage}%
                      </span>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{latest.score}/{latest.total} correct</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                    {/* View result button */}
                    {isDone && (
                      <button onClick={() => onViewResult(test, results)} style={{ width: '100%', padding: '11px 0', borderRadius: 10, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                        View Result
                      </button>
                    )}

                    {/* Start / Retake button */}
                    {!isDone ? (
                      <button onClick={() => user ? onStart(test) : showLoginModal()} style={{ width: '100%', padding: '11px 0', borderRadius: 10, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                        Start Test
                      </button>
                    ) : rtk?.canRetake ? (
                      <button onClick={() => onStart(test)} style={{ width: '100%', padding: '11px 0', borderRadius: 10, border: '2px solid #7c3aed', background: '#fff', color: '#7c3aed', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                        ↺ Retake Test
                      </button>
                    ) : rtk?.countdownMs ? (
                      <div style={{ width: '100%', padding: '11px 0', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>
                        ⏱ Retake available in {formatCountdown(rtk.countdownMs)}
                      </div>
                    ) : rtk?.blockReason ? (
                      <div style={{ width: '100%', padding: '11px 0', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', textAlign: 'center', color: '#dc2626', fontSize: 13, fontWeight: 500 }}>
                        🚫 {rtk.blockReason}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Test Taking View ─────────────────────────────────────────────────────────

function TestTakingView({
  test, user,
  onFinish, onQuit,
}: {
  test: Test;
  user: User;
  onFinish: (score: number, total: number, pct: number, passed: boolean, answers: number[]) => void;
  onQuit: () => void;
}) {
  const questions = test.questions;
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(questions.length).fill(null));
  const [secondsLeft, setSecondsLeft] = useState((test.timeLimit) * 60);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isWarning = secondsLeft <= 60;

  const submit = useCallback(async (auto = false) => {
    if (submitting) return;

    if (!auto) {
      const unanswered = answers.filter(a => a === null).length;
      if (unanswered > 0) {
        const ok = window.confirm(`You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`);
        if (!ok) return;
      }
    }

    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    let score = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correctIndex) score++; });
    const total = questions.length;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const passed = pct >= test.passingScore;
    const finalAnswers = answers.map(a => a ?? -1);

    // Count previous attempts
    let attemptNumber = 1;
    try {
      const prev = await getDocs(query(
        collection(db, 'testResults'),
        where('testId', '==', test.id),
        where('userId', '==', user.uid),
      ));
      attemptNumber = prev.docs.length + 1;
    } catch { /* ignore */ }

    await addDoc(collection(db, 'testResults'), {
      testId: test.id,
      userId: user.uid,
      userName: user.displayName ?? '',
      userEmail: user.email ?? '',
      score,
      total,
      percentage: pct,
      passed,
      answers: finalAnswers,
      attemptNumber,
      completedAt: serverTimestamp(),
    });

    onFinish(score, total, pct, passed, finalAnswers);
  }, [submitting, answers, questions, test, user, onFinish]);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          submit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [submit]);

  const q = questions[current];
  const opts = q.options ?? [];
  const answered = answers.filter(a => a !== null).length;
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 60 }}>
      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => { if (window.confirm('Your progress will not be saved. Quit the test?')) onQuit(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> Quit
        </button>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{test.title}</span>
        <span style={{ fontWeight: 800, fontSize: 17, color: isWarning ? '#dc2626' : '#7c3aed', background: isWarning ? '#fef2f2' : '#f5f3ff', padding: '6px 14px', borderRadius: 20, minWidth: 72, textAlign: 'center', transition: 'color 0.3s, background 0.3s' }}>
          {pad2(Math.floor(secondsLeft / 60))}:{pad2(secondsLeft % 60)}
        </span>
      </div>

      {/* Progress */}
      <div style={{ height: 4, background: '#e2e8f0' }}>
        <div style={{ height: '100%', background: '#7c3aed', width: `${progress}%`, transition: 'width 0.3s' }} />
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 40 }}>
        {/* Question header */}
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Question {current + 1} of {questions.length}</span>
          <span style={{ fontSize: 13, color: '#64748b' }}>{answered} answered</span>
        </div>

        {/* Question card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <p style={{ fontSize: 17, fontWeight: 600, color: '#0f172a', lineHeight: 1.6, marginBottom: 28 }}>{q.text}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {opts.map((opt, i) => {
              const selected = answers[current] === i;
              return (
                <button key={i} onClick={() => setAnswers(prev => { const next = [...prev]; next[current] = i; return next; })}
                  style={{ textAlign: 'left', padding: '14px 18px', borderRadius: 12, border: `2px solid ${selected ? '#7c3aed' : '#e2e8f0'}`, background: selected ? '#f5f3ff' : '#fff', color: selected ? '#7c3aed' : '#374151', fontWeight: selected ? 700 : 500, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${selected ? '#7c3aed' : '#d1d5db'}`, background: selected ? '#7c3aed' : '#fff', color: selected ? '#fff' : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
            style={{ padding: '11px 24px', borderRadius: 10, border: '2px solid #e2e8f0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? 0.4 : 1 }}>
            ← Previous
          </button>

          {/* Question dots — windowed to avoid overflow */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', flex: 1, flexWrap: 'wrap' }}>
            {(() => {
              const total = questions.length;
              const WING = 2; // questions shown on each side of current
              const EDGE = 2; // questions always shown at start/end
              const visible = new Set<number>();
              for (let i = 0; i < Math.min(EDGE, total); i++) visible.add(i);
              for (let i = Math.max(0, total - EDGE); i < total; i++) visible.add(i);
              for (let i = Math.max(0, current - WING); i <= Math.min(total - 1, current + WING); i++) visible.add(i);

              const indices = Array.from(visible).sort((a, b) => a - b);
              const items: React.ReactNode[] = [];
              let prev = -1;
              for (const i of indices) {
                if (prev !== -1 && i > prev + 1) {
                  items.push(<span key={`ellipsis-${i}`} style={{ color: '#94a3b8', fontSize: 13, padding: '0 2px' }}>…</span>);
                }
                items.push(
                  <button key={i} onClick={() => setCurrent(i)}
                    style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: i === current ? '#7c3aed' : answers[i] !== null ? '#dcfce7' : '#e2e8f0', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: i === current ? '#fff' : answers[i] !== null ? '#16a34a' : '#94a3b8', flexShrink: 0 }}>
                    {i + 1}
                  </button>
                );
                prev = i;
              }
              return items;
            })()}
          </div>

          {current < questions.length - 1 ? (
            <button onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))}
              style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Next →
            </button>
          ) : (
            <button onClick={() => submit(false)} disabled={submitting}
              style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: submitting ? '#a78bfa' : '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer' }}>
              {submitting ? 'Submitting…' : 'Submit Test'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Test Result View ─────────────────────────────────────────────────────────

function TestResultView({
  test, score, total, pct, passed, questions, answers, results,
  onBack, onRetake,
}: {
  test: Test;
  score: number; total: number; pct: number; passed: boolean;
  questions: Question[]; answers: number[];
  results: TestResult[];
  onBack: () => void;
  onRetake: () => void;
}) {
  const rtk = test.retakeAllowed ? retakeStatus(test, results) : null;
  const [showReview, setShowReview] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> All Tests
        </button>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Test Result</span>
        <div style={{ width: 80 }} />
      </div>

      <div className="container" style={{ maxWidth: 680, paddingTop: 40 }}>
        {/* Score card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 36, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', textAlign: 'center', marginBottom: 24 }}>
          {/* Circle */}
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: passed ? '#f0fdf4' : '#fef2f2', border: `5px solid ${passed ? '#16a34a' : '#dc2626'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: passed ? '#16a34a' : '#dc2626', lineHeight: 1 }}>{pct}%</span>
            <span style={{ fontSize: 12, color: passed ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{passed ? 'PASS' : 'FAIL'}</span>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
            {passed ? '🎉 Congratulations!' : '😔 Better Luck Next Time'}
          </h2>
          <p style={{ color: '#64748b', fontSize: 15, marginBottom: 24 }}>
            You scored <strong>{score}/{total}</strong> on <strong>{test.title}</strong>
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, padding: '20px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Score', value: `${score}/${total}` },
              { label: 'Percentage', value: `${pct}%` },
              { label: 'Pass Mark', value: `${test.passingScore}%` },
              { label: 'Attempts', value: String(results.length) },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={onBack} style={{ padding: '12px 24px', borderRadius: 10, border: '2px solid #e2e8f0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Back to Tests
            </button>
            {rtk?.canRetake && (
              <button onClick={onRetake} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                ↺ Retake Test
              </button>
            )}
            {rtk?.countdownMs && (
              <div style={{ padding: '12px 20px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8', fontSize: 13 }}>
                ⏱ Retake in {formatCountdown(rtk.countdownMs)}
              </div>
            )}
            {rtk?.blockReason && (
              <div style={{ padding: '12px 20px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>
                🚫 {rtk.blockReason}
              </div>
            )}
          </div>
        </div>

        {/* Question Review toggle */}
        {questions.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <button onClick={() => setShowReview(v => !v)} style={{ width: '100%', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>📋 Review Answers ({questions.length} questions)</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ transform: showReview ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M19 9l-7 7-7-7" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>

            {showReview && (
              <div style={{ borderTop: '1px solid #f1f5f9', padding: '0 24px 24px' }}>
                {questions.map((q, i) => {
                  const userAns = answers[i] ?? -1;
                  const correct = q.correctIndex;
                  const isCorrect = userAns === correct;
                  return (
                    <div key={i} style={{ marginTop: 20, padding: 18, borderRadius: 12, background: isCorrect ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isCorrect ? '#bbf7d0' : '#fecaca'}` }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: isCorrect ? '#16a34a' : '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', lineHeight: 1.5, margin: 0 }}>{q.text}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 30 }}>
                        {(q.options ?? []).map((opt, j) => {
                          const isUserChoice = j === userAns;
                          const isCorrectOpt = j === correct;
                          const bg = isCorrectOpt ? '#dcfce7' : isUserChoice ? '#fee2e2' : 'transparent';
                          const border = isCorrectOpt ? '1px solid #86efac' : isUserChoice ? '1px solid #fca5a5' : '1px solid transparent';
                          const color = isCorrectOpt ? '#15803d' : isUserChoice ? '#dc2626' : '#6b7280';
                          return (
                            <div key={j} style={{ padding: '8px 12px', borderRadius: 8, background: bg, border, color, fontSize: 13, fontWeight: (isCorrectOpt || isUserChoice) ? 600 : 400, display: 'flex', alignItems: 'center', gap: 8 }}>
                              {isCorrectOpt && <span style={{ color: '#16a34a' }}>✓</span>}
                              {isUserChoice && !isCorrectOpt && <span style={{ color: '#dc2626' }}>✗</span>}
                              {!isCorrectOpt && !isUserChoice && <span style={{ width: 16 }} />}
                              <span style={{ fontWeight: 600, marginRight: 4 }}>{String.fromCharCode(65 + j)}.</span>{opt}
                            </div>
                          );
                        })}
                      </div>
                      {!isCorrect && userAns === -1 && (
                        <div style={{ paddingLeft: 30, marginTop: 8, fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Not answered</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type View = 'list' | 'taking' | 'result';

export default function TestsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tests, setTests] = useState<Test[]>([]);
  const [testsLoading, setTestsLoading] = useState(true);
  const [resultsMap, setResultsMap] = useState<Record<string, TestResult[]>>({});

  const [view, setView] = useState<View>('list');
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [resultData, setResultData] = useState<{ score: number; total: number; pct: number; passed: boolean; answers: number[]; results: TestResult[] } | null>(null);
  const [showLogin, setShowLogin] = useState(false);


  // Auth
  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); }), []);

  // Fetch published tests
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'tests'), where('status', '==', 'published')));
        const data = snap.docs.map(d => {
          const raw = d.data();
          return {
            id: d.id,
            title: raw.title ?? 'Untitled',
            description: raw.description ?? '',
            status: raw.status,
            questions: (raw.questions ?? []).map((q: any) => ({
              text: q.text ?? '',
              options: Array.isArray(q.options) ? q.options.map(String) : [],
              correctIndex: q.correctIndex ?? 0,
            })),
            timeLimit: raw.timeLimit ?? 30,
            passingScore: raw.passingScore ?? 70,
            retakeAllowed: raw.retakeAllowed ?? false,
            maxRetakes: raw.maxRetakes ?? 0,
            retakeCooldownHours: raw.retakeCooldownHours ?? 0,
            retakeCriteria: raw.retakeCriteria ?? 'all',
            retakeBelowPercentage: raw.retakeBelowPercentage ?? 50,
            publishedAt: raw.publishedAt ?? null,
          } as Test;
        });
        data.sort((a, b) => {
          const at = tsToDate(a.publishedAt)?.getTime() ?? 0;
          const bt = tsToDate(b.publishedAt)?.getTime() ?? 0;
          return bt - at;
        });
        setTests(data);
      } catch (e) { console.error(e); }
      finally { setTestsLoading(false); }
    })();
  }, []);

  // Fetch user's results when user is known
  useEffect(() => {
    if (!user) { setResultsMap({}); return; }
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'testResults'), where('userId', '==', user.uid)));
        const map: Record<string, TestResult[]> = {};
        snap.docs.forEach(d => {
          const data = d.data() as TestResult & { completedAt?: Timestamp };
          const tid = data.testId;
          if (!tid) return;
          if (!map[tid]) map[tid] = [];
          map[tid].push({ ...data, id: d.id });
        });
        // Sort each list newest first
        Object.values(map).forEach(arr => arr.sort((a, b) => {
          const at = tsToDate(a.completedAt)?.getTime() ?? 0;
          const bt = tsToDate(b.completedAt)?.getTime() ?? 0;
          return bt - at;
        }));
        setResultsMap(map);
      } catch (e) { console.error(e); }
    })();
  }, [user]);

  const handleStart = (test: Test) => {
    if (!user) { setShowLogin(true); return; }
    setActiveTest(test);
    setView('taking');
    window.scrollTo(0, 0);
  };

  const handleFinish = async (score: number, total: number, pct: number, passed: boolean, answers: number[]) => {
    if (!activeTest || !user) return;
    // Re-fetch results for this test to get the updated list
    let updatedResults: TestResult[] = [];
    try {
      const snap = await getDocs(query(
        collection(db, 'testResults'),
        where('testId', '==', activeTest.id),
        where('userId', '==', user.uid),
      ));
      updatedResults = snap.docs.map(d => ({ ...d.data(), id: d.id } as TestResult));
      updatedResults.sort((a, b) => {
        const at = tsToDate(a.completedAt)?.getTime() ?? 0;
        const bt = tsToDate(b.completedAt)?.getTime() ?? 0;
        return bt - at;
      });
      setResultsMap(prev => ({ ...prev, [activeTest.id]: updatedResults }));
    } catch { /* ignore */ }

    setResultData({ score, total, pct, passed, answers, results: updatedResults });
    setView('result');
    window.scrollTo(0, 0);
  };

  const handleViewResult = (test: Test, results: TestResult[]) => {
    if (!results.length) return;
    const latest = results[0];
    setActiveTest(test);
    setResultData({
      score: latest.score,
      total: latest.total,
      pct: latest.percentage,
      passed: latest.passed,
      answers: latest.answers ?? [],
      results,
    });
    setView('result');
    window.scrollTo(0, 0);
  };

  const handleRetake = () => {
    if (!activeTest) return;
    setResultData(null);
    setView('taking');
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setView('list');
    setActiveTest(null);
    setResultData(null);
    window.scrollTo(0, 0);
  };

  // Taking / Result views are full-screen (no site header/footer)
  if (view === 'taking' && activeTest && user) {
    return (
      <>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        <TestTakingView
          test={activeTest}
          user={user}
          onFinish={handleFinish}
          onQuit={handleBack}
        />
      </>
    );
  }

  if (view === 'result' && activeTest && resultData) {
    return (
      <TestResultView
        test={activeTest}
        score={resultData.score}
        total={resultData.total}
        pct={resultData.pct}
        passed={resultData.passed}
        questions={activeTest.questions}
        answers={resultData.answers}
        results={resultData.results}
        onBack={handleBack}
        onRetake={handleRetake}
      />
    );
  }

  // List view — with site chrome
  return (
    <>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      <Header4 clname="actPage1" />

      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '16px 0' }}>
        <div className="container">
          <nav style={{ fontSize: 13, color: '#94a3b8' }}>
            <a href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</a>
            <span style={{ margin: '0 8px' }}>›</span>
            <span style={{ color: '#7c3aed', fontWeight: 600 }}>Tests</span>
          </nav>
        </div>
      </div>

      {testsLoading || authLoading ? (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, border: '4px solid #f1f5f9', borderTop: '4px solid #7c3aed', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading tests…</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <TestListView
          tests={tests}
          resultsMap={resultsMap}
          user={user}
          onStart={handleStart}
          onViewResult={handleViewResult}
          showLoginModal={() => setShowLogin(true)}
        />
      )}

      <Footer />
      <Gotop />
    </>
  );
}
