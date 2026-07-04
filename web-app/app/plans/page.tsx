'use client';

import React, { useEffect, useState } from 'react';
import Header4 from '@/components/header/Header4';
import Footer from '@/components/footer';
import Gotop from '@/components/gotop';
import { auth, googleProvider, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, type User } from 'firebase/auth';
import {
  collection, query, where, onSnapshot, addDoc, updateDoc, doc,
  getDocs, limit, serverTimestamp,
} from 'firebase/firestore';
import { useCandidatePlan } from '@/lib/useCandidatePlan';
import { candidatePlanFeatureDefs } from '@/lib/candidatePlanFeatures';

// Same publishable Razorpay Key ID used by employer-app and the mobile app
// (kamalini_application/lib/config/razorpay_config.dart) — not a secret,
// already shipped client-side elsewhere.
const RAZORPAY_KEY_ID = 'rzp_live_T6xz50l7mKKt42';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (resp?: any) => void) => void };
  }
}

interface CandidatePlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  jobApplicationsPerMonth: number | null;
  featureFlags: Record<string, boolean>;
  isActive: boolean;
}

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  isActive: boolean;
}

function couponIsValid(c: Coupon): boolean {
  if (!c.isActive) return false;
  if (c.expiresAt && c.expiresAt.getTime() < Date.now()) return false;
  if (c.maxUses != null && c.usedCount >= c.maxUses) return false;
  return true;
}

function applyCoupon(c: Coupon, amount: number): number {
  const discounted = c.discountType === 'flat' ? amount - c.discountValue : amount - (amount * c.discountValue) / 100;
  return Math.max(0, discounted);
}

function durationLabel(days: number): string {
  switch (days) {
    case 7: return '7 days';
    case 15: return '15 days';
    case 30: return '1 month';
    case 60: return '2 months';
    case 90: return '3 months';
    case 180: return '6 months';
    case 365: return '1 year';
    default: return `${days} days`;
  }
}

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return; }
    const s = document.createElement('script');
    s.id = 'razorpay-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const PLAN_ACCENT = [
  { gradient: 'linear-gradient(135deg,#14a077,#0f7a5a)', color: '#14a077' },
  { gradient: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#2563eb' },
  { gradient: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#7c3aed' },
];

export default function PlansPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [plans, setPlans] = useState<CandidatePlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  const [selected, setSelected] = useState<CandidatePlan | null>(null);
  const [paying, setPaying] = useState(false);
  const [successPlan, setSuccessPlan] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const candidatePlanState = useCandidatePlan(user?.uid);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'candidatePlans'), where('isActive', '==', true)),
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name ?? '',
            price: data.price ?? 0,
            currency: data.currency ?? 'INR',
            durationDays: data.durationDays ?? 30,
            jobApplicationsPerMonth: data.jobApplicationsPerMonth ?? null,
            featureFlags: data.featureFlags && typeof data.featureFlags === 'object' ? data.featureFlags : {},
            isActive: data.isActive === true,
          } as CandidatePlan;
        });
        list.sort((a, b) => a.price - b.price);
        setPlans(list);
        setPlansLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const fmt = (amount: number, currency: string) => `${currency === 'INR' ? '₹' : currency}${amount.toLocaleString('en-IN')}`;

  const finalPrice = (plan: CandidatePlan) => (appliedCoupon ? applyCoupon(appliedCoupon, plan.price) : plan.price);

  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error(e); }
  };

  const handleApplyCoupon = async () => {
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const trimmed = couponCode.trim().toUpperCase();
      if (!trimmed) throw new Error('Enter a coupon code');
      const snap = await getDocs(query(collection(db, 'coupons'), where('code', '==', trimmed), limit(1)));
      if (snap.empty) throw new Error('Invalid coupon code');
      const d = snap.docs[0];
      const data = d.data();
      const coupon: Coupon = {
        id: d.id,
        code: (data.code ?? '').toString().toUpperCase(),
        discountType: data.discountType === 'flat' ? 'flat' : 'percentage',
        discountValue: data.discountValue ?? 0,
        maxUses: data.maxUses ?? null,
        usedCount: data.usedCount ?? 0,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive === true,
      };
      if (!couponIsValid(coupon)) throw new Error('This coupon is no longer valid');
      setAppliedCoupon(coupon);
    } catch (e: any) {
      setAppliedCoupon(null);
      setCouponError(e.message ?? 'Invalid coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponCode('');
  };

  const writePlanActivation = async (plan: CandidatePlan, amount: number) => {
    if (!user) return;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + plan.durationDays * 86400000);
    await addDoc(collection(db, 'candidatePayments'), {
      userId: user.uid,
      planId: plan.id,
      planName: plan.name,
      amount,
      currency: plan.currency,
      status: 'completed',
      couponCode: appliedCoupon?.code ?? null,
      paymentDate: now.toISOString(),
      expirationDate: expiresAt.toISOString(),
      createdAt: serverTimestamp(),
    });
    const applicationsLimit = (plan.jobApplicationsPerMonth == null || plan.jobApplicationsPerMonth === 0)
      ? null
      : plan.jobApplicationsPerMonth;
    await updateDoc(doc(db, 'users', user.uid), {
      activePlanId: plan.id,
      activePlanName: plan.name,
      planExpiresAt: expiresAt.toISOString(),
      planFeatureFlags: plan.featureFlags,
      planApplicationsLimit: applicationsLimit,
      planApplicationsUsed: 0,
    });
    if (appliedCoupon) {
      await updateDoc(doc(db, 'coupons', appliedCoupon.id), { usedCount: appliedCoupon.usedCount + 1 });
    }
    setSuccessPlan(plan.name);
    setSelected(null);
    removeCoupon();
  };

  const handlePayment = async (plan: CandidatePlan) => {
    setPaying(true);
    const amount = finalPrice(plan);

    if (amount <= 0) {
      try {
        await writePlanActivation(plan, amount);
      } catch (err) {
        console.error('Error activating plan:', err);
        alert('Failed to activate plan. Please try again.');
      }
      setPaying(false);
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert('Failed to load payment gateway. Please check your connection.');
      setPaying(false);
      return;
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: Math.round(amount * 100),
      currency: plan.currency,
      name: 'KA Jobs',
      description: `${plan.name} Plan — Candidate Subscription`,
      prefill: { name: user?.displayName ?? '', email: user?.email ?? '' },
      theme: { color: '#14a077' },
      handler: async () => {
        try {
          await writePlanActivation(plan, amount);
        } catch (err) {
          console.error('Error saving payment:', err);
          alert('Payment recorded but failed to save. Please contact support.');
        }
        setPaying(false);
      },
      modal: { ondismiss: () => setPaying(false) },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', () => {
      alert('Payment failed. Please try again.');
      setPaying(false);
    });
    rzp.open();
  };

  return (
    <>
      <Header4 clname="actJob2" />

      <section style={{ padding: '48px 0 80px', background: '#f8f9fa', minHeight: '60vh' }}>
        <div className="tf-container">
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' }}>Upgrade to Premium</h1>
            <p style={{ color: '#666', fontSize: 15, margin: 0 }}>Get noticed by recruiters faster and apply without limits</p>
          </div>

          {authLoading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Loading...</div>
          ) : !user ? (
            <div style={{ maxWidth: 420, margin: '0 auto', background: '#fff', borderRadius: 16, padding: '36px 32px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 20px', color: '#555', fontSize: 14 }}>Sign in to view and purchase a plan</p>
              <button onClick={handleGoogleLogin} style={{
                padding: '12px 24px', borderRadius: 10, border: '1.5px solid #e0e0e0',
                background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#333',
              }}>
                Continue with Google
              </button>
            </div>
          ) : (
            <>
              {/* Current plan banner */}
              {candidatePlanState.hasActivePlan && (
                <div style={{
                  maxWidth: 720, margin: '0 auto 24px', display: 'flex', alignItems: 'center', gap: 10,
                  background: '#e8f5ef', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 18px',
                }}>
                  <i className="icon-check" style={{ color: '#16a34a' }} />
                  <div style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>
                    You are on the <strong>{candidatePlanState.planName}</strong> plan
                    {candidatePlanState.planExpiresAt && (
                      <span style={{ fontWeight: 400 }}> · expires {candidatePlanState.planExpiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    )}
                  </div>
                </div>
              )}

              {successPlan && (
                <div style={{
                  maxWidth: 720, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#e8f5ef', border: '1px solid #86efac', borderRadius: 10, padding: '12px 18px',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>🎉 {successPlan} plan activated successfully!</span>
                  <button onClick={() => setSuccessPlan(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#86efac' }}>✕</button>
                </div>
              )}

              {/* Coupon box */}
              <div style={{ maxWidth: 420, margin: '0 auto 32px', background: '#fff', borderRadius: 14, padding: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                {appliedCoupon ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="icon-tag" style={{ color: '#14a077' }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>
                      {appliedCoupon.code} applied — {appliedCoupon.discountType === 'flat' ? `₹${appliedCoupon.discountValue} off` : `${appliedCoupon.discountValue}% off`}
                    </span>
                    <button onClick={removeCoupon} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Have a coupon code?"
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, padding: '8px 6px' }}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon}
                        style={{ border: 'none', background: 'none', color: '#14a077', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {applyingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p style={{ margin: '2px 0 0 6px', fontSize: 12, color: '#dc2626' }}>{couponError}</p>}
                  </div>
                )}
              </div>

              {/* Plan cards */}
              {plansLoading ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Loading plans...</div>
              ) : plans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>No plans available right now.</div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(plans.length, 3)}, minmax(240px, 1fr))`,
                  gap: 20, maxWidth: 960, margin: '0 auto',
                }}>
                  {plans.map((plan, idx) => {
                    const ac = PLAN_ACCENT[idx % PLAN_ACCENT.length];
                    const isCurrent = candidatePlanState.hasActivePlan && plan.id === candidatePlanState.activePlanId;
                    const price = finalPrice(plan);
                    const hasDiscount = appliedCoupon != null && price !== plan.price;
                    const features = candidatePlanFeatureDefs.filter((f) => plan.featureFlags[f.key] === true);

                    return (
                      <div key={plan.id} style={{
                        background: '#fff', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        border: isCurrent ? '2px solid #16a34a' : '1.5px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      }}>
                        <div style={{ background: ac.gradient, padding: '24px 22px 20px' }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{plan.name}</div>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                            {hasDiscount && (
                              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'line-through' }}>{fmt(plan.price, plan.currency)}</span>
                            )}
                            <span style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                              {price === 0 ? 'Free' : fmt(price, plan.currency)}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>Valid for {durationLabel(plan.durationDays)}</div>
                        </div>
                        <div style={{ padding: '18px 22px', flex: 1 }}>
                          {features.length > 0 ? (
                            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {features.map((f) => (
                                <li key={f.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151' }}>
                                  <i className="icon-check" style={{ color: ac.color, marginTop: 2, flexShrink: 0 }} />
                                  {f.label}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No extra features listed.</p>
                          )}
                        </div>
                        <div style={{ padding: '0 22px 22px' }}>
                          {isCurrent ? (
                            <div style={{ textAlign: 'center', padding: 12, borderRadius: 10, background: '#e8f5ef', color: '#16a34a', fontWeight: 700, fontSize: 13 }}>
                              Current Plan
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelected(plan)}
                              style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: ac.gradient, color: '#fff' }}
                            >
                              {price === 0 ? 'Activate' : 'Upgrade'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Confirm & pay modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => !paying && setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
            <div style={{ background: 'linear-gradient(135deg,#0f2557,#14a077)', padding: '24px 26px' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{selected.name}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginTop: 6 }}>
                {finalPrice(selected) === 0 ? 'Free' : fmt(finalPrice(selected), selected.currency)}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Valid for {durationLabel(selected.durationDays)}</div>
            </div>
            <div style={{ padding: '22px 26px' }}>
              <button
                onClick={() => handlePayment(selected)}
                disabled={paying}
                style={{
                  width: '100%', padding: 14, borderRadius: 12, border: 'none',
                  background: paying ? '#94d3bc' : 'linear-gradient(135deg,#14a077,#0f7a5a)',
                  color: '#fff', fontWeight: 700, fontSize: 14, cursor: paying ? 'wait' : 'pointer',
                }}
              >
                {paying ? 'Processing...' : finalPrice(selected) === 0 ? 'Activate for Free' : `Pay ${fmt(finalPrice(selected), selected.currency)} & Activate`}
              </button>
              {selected.price > 0 && (
                <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 12 }}>Secured by Razorpay · 256-bit SSL</p>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
      <Gotop />
    </>
  );
}
