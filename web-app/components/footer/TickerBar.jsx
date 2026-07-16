'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import './ticker.css';

const BASE_USERS = 200507;
// Date the count above was accurate as of — daily increments accrue starting the day after this
const BASE_DATE = '2026-07-16';

// Deterministic PRNG (mulberry32) so the same day always produces the same increment
// for every visitor, instead of a fresh random number on every page load
function mulberry32(seed) {
    return function () {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function daysSinceBase() {
    const base = new Date(BASE_DATE + 'T00:00:00Z');
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.max(0, Math.floor((today - base.getTime()) / 86400000));
}

// Total grows by a random amount between 50–200 each day since BASE_DATE
function getTodayUserCount() {
    let total = BASE_USERS;
    const days = daysSinceBase();
    for (let d = 1; d <= days; d++) {
        total += 50 + Math.floor(mulberry32(d)() * 151);
    }
    return total;
}

function useCountUp(end, duration = 2200) {
    const [value, setValue] = useState(0);
    const startedRef = useRef(false);

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        const start = performance.now();
        let frame;

        const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(end * eased));
            if (progress < 1) {
                frame = requestAnimationFrame(tick);
            }
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [end, duration]);

    return value;
}

function TickerGroup({ userCount }) {
    return (
        <div className="ticker-group">
            <span className="ticker-item">
                <strong>{userCount.toLocaleString('en-IN')}</strong> Total Users
            </span>
            <span className="ticker-sep">•</span>
            <span className="ticker-item">10,000+ candidates appearing for Self Test daily</span>
            <span className="ticker-sep">•</span>
            <span className="ticker-item">50,000+ users active per hour</span>
            <span className="ticker-sep">•</span>
            <span className="ticker-item">10 users joining every 30 minutes</span>
            <span className="ticker-sep">•</span>
        </div>
    );
}

function TickerBar() {
    const totalUsers = useMemo(() => getTodayUserCount(), []);
    const userCount = useCountUp(totalUsers);

    return (
        <div className="sticky-ticker-bar">
            <div className="ticker-track">
                <TickerGroup userCount={userCount} />
                <TickerGroup userCount={userCount} />
            </div>
        </div>
    );
}

export default TickerBar;
