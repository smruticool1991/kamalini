'use client';

import React, { useEffect, useRef, useState } from 'react';
import './ticker.css';

const TOTAL_USERS = 200507;

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
    const userCount = useCountUp(TOTAL_USERS);

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
