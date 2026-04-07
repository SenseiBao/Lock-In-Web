import { useState, useEffect } from 'react';

function formatRemaining(totalSec) {
    const s = Math.max(0, Math.floor(totalSec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, '0')}`;
}

/**
 * Counts down to `endAt` (ISO string). Re-renders every second.
 * All clients use the same `endAt` from the room row so the clock matches everywhere.
 */
export default function CoopTimer({ endAt, compact = false }) {
    const [, setTick] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 1000);
        return () => clearInterval(id);
    }, []);

    const displaySec =
        endAt == null ? null : Math.max(0, (new Date(endAt).getTime() - Date.now()) / 1000);
    const urgent = displaySec !== null && displaySec > 0 && displaySec <= 10;

    if (!endAt) {
        return (
            <div className={`w-full bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm text-center ${compact ? 'py-2 px-3' : 'p-4'}`}>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Co-op timer</p>
                <p className="text-gray-600 text-xs font-bold">Starts when the first card is drawn</p>
            </div>
        );
    }

    return (
        <div className={`w-full bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm text-center ${compact ? 'py-2 px-3' : 'p-4'}`}>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Co-op timer</p>
            <div
                className={`font-black font-mono tabular-nums ${
                    compact ? 'text-3xl' : 'text-5xl'
                } ${urgent ? 'text-red-500 animate-pulse' : displaySec <= 0 ? 'text-red-600' : 'text-card-gold'}`}
            >
                {formatRemaining(displaySec)}
            </div>
            <p className="text-[9px] text-gray-600 mt-1 leading-tight">
                Correct +40s · Buzz −5s · Hint −3s
            </p>
        </div>
    );
}
