import { useState, useEffect } from 'react';

const TIMER_DURATION = 60;

const playBuzzer = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        // Three short descending beeps
        [0, 0.18, 0.36].forEach((startOffset, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'square';
            osc.frequency.value = 440 - i * 80;
            gain.gain.setValueAtTime(0.3, ctx.currentTime + startOffset);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + 0.15);
            osc.start(ctx.currentTime + startOffset);
            osc.stop(ctx.currentTime + startOffset + 0.15);
        });
    } catch (_) {}
};

export default function Timer({ drawKey }) {
    const [timerSeconds, setTimerSeconds] = useState(TIMER_DURATION);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    // Auto-restart whenever a new card is drawn
    useEffect(() => {
        if (drawKey === 0) return;
        setTimerSeconds(TIMER_DURATION);
        setIsTimerRunning(true);
    }, [drawKey]);

    useEffect(() => {
        if (!isTimerRunning) return;
        const interval = setInterval(() => {
            setTimerSeconds(prev => {
                if (prev <= 1) {
                    setIsTimerRunning(false);
                    playBuzzer();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const handleTimerToggle = () => setIsTimerRunning(r => !r);
    const handleTimerReset = () => {
        setIsTimerRunning(false);
        setTimerSeconds(TIMER_DURATION);
    };

    return (
        <div className="w-full max-w-md mx-auto mb-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
            <div className="text-center mb-3">
                <div className={`text-5xl font-black font-mono ${
                    timerSeconds <= 10 && timerSeconds > 0 ? 'text-red-500 animate-pulse' :
                        timerSeconds === 0 ? 'text-red-600' :
                            'text-white'
                }`}>
                    {timerSeconds}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
                    seconds
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={handleTimerToggle}
                    className={`flex-1 font-bold py-2 px-4 rounded-lg transition-all text-sm ${
                        isTimerRunning
                            ? 'bg-pass-orange text-white hover:bg-pass-orange/80'
                            : 'bg-point-green text-white hover:bg-point-green/80'
                    }`}
                >
                    {isTimerRunning ? '⏸ Pause' : '▶ Start'}
                </button>
                <button
                    onClick={handleTimerReset}
                    className="flex-1 bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-all text-sm"
                >
                    ↺ Reset
                </button>
            </div>
        </div>
    );
}