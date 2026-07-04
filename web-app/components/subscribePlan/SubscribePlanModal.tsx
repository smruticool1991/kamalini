'use client';

import React from 'react';
import Link from 'next/link';

interface Props {
  onDismiss: () => void;
}

export default function SubscribePlanModal({ onDismiss }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', padding: 16,
      }}
      onClick={onDismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440,
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)', overflow: 'hidden', position: 'relative',
        }}
      >
        <button
          onClick={onDismiss}
          style={{
            position: 'absolute', top: 14, right: 16, background: 'rgba(255,255,255,0.2)',
            border: 'none', borderRadius: '50%', width: 30, height: 30, padding: 0,
            boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fff', fontSize: 16, lineHeight: 1, zIndex: 1,
          }}
        >×</button>

        <div style={{ background: 'linear-gradient(135deg, #0f2557 0%, #14a077 100%)', padding: '32px 28px 26px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🚀</div>
          <h3 style={{ margin: '0 0 6px', color: '#fff', fontSize: 20, fontWeight: 800 }}>Get Noticed Faster</h3>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
            You don&apos;t have an active plan yet
          </p>
        </div>

        <div style={{ padding: '24px 28px 28px' }}>
          <ul style={{ margin: '0 0 22px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Priority profile in recruiter search',
              'Know who viewed your profile',
              'Apply beyond the free monthly limit',
            ].map((f) => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151' }}>
                <i className="icon-check" style={{ color: '#14a077', flexShrink: 0 }} />
                {f}
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onDismiss}
              style={{
                flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #e0e0e0',
                background: '#fff', color: '#555', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              Maybe Later
            </button>
            <Link
              href="/plans"
              onClick={onDismiss}
              style={{
                flex: 2, padding: '12px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#14a077,#0f7a5a)', color: '#fff',
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
