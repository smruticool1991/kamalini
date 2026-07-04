'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface CandidatePlanState {
  loading: boolean;
  hasActivePlan: boolean;
  activePlanId: string | null;
  planName: string | null;
  planExpiresAt: Date | null;
  featureFlags: Record<string, boolean>;
  // null = unlimited
  applicationsLimit: number | null;
  applicationsUsed: number;
}

const EMPTY_STATE: CandidatePlanState = {
  loading: true,
  hasActivePlan: false,
  activePlanId: null,
  planName: null,
  planExpiresAt: null,
  featureFlags: {},
  applicationsLimit: null,
  applicationsUsed: 0,
};

/**
 * Tracks the candidate's plan entitlements from users/{uid}, written by
 * either this app's /plans page or the mobile app's PlanService.
 *
 * If a plan has expired but planApplicationsLimit/planFeatureFlags were
 * never cleared (nothing runs on the expiry date itself), this self-heals
 * by clearing them back to unlimited/no-flags the next time this hook is
 * mounted for that user.
 */
export function useCandidatePlan(uid: string | null | undefined): CandidatePlanState {
  const [state, setState] = useState<CandidatePlanState>(EMPTY_STATE);

  useEffect(() => {
    if (!uid) {
      setState(EMPTY_STATE);
      return;
    }
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      const data = snap.data();
      if (!data) {
        setState({ ...EMPTY_STATE, loading: false });
        return;
      }

      const expiresAt = data.planExpiresAt ? new Date(data.planExpiresAt) : null;
      const active = !!expiresAt && expiresAt.getTime() > Date.now();

      if (!active && (data.planApplicationsLimit != null || (data.planFeatureFlags && Object.keys(data.planFeatureFlags).length > 0))) {
        updateDoc(doc(db, 'users', uid), {
          planApplicationsLimit: null,
          planFeatureFlags: {},
        }).catch(() => { /* best effort cleanup */ });
      }

      setState({
        loading: false,
        hasActivePlan: active,
        activePlanId: active ? (data.activePlanId ?? null) : null,
        planName: active ? (data.activePlanName ?? null) : null,
        planExpiresAt: expiresAt,
        featureFlags: active && data.planFeatureFlags ? data.planFeatureFlags : {},
        applicationsLimit: active ? (data.planApplicationsLimit ?? null) : null,
        applicationsUsed: data.planApplicationsUsed ?? 0,
      });
    });
    return () => unsub();
  }, [uid]);

  return state;
}
