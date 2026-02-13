import { useState } from 'react';
import useSound from 'use-sound';
import { useGameLogic } from './hooks/useGameLogic';
import Card from './components/Card';
import Dice from './components/Dice';

// --- ASSETS ---
import drawSfx1 from './assets/sounds/draw.wav';
import drawSfx2 from './assets/sounds/draw2.wav';

import pointMain from './assets/sounds/point.mp3';
import point2 from './assets/sounds/point2.mp3';
import point3 from './assets/sounds/point3.mp3';
import point4 from './assets/sounds/point4.mp3';

function App() {
    const {
        currentWord,
        teamAScore,
        teamBScore,
        teamAWords,
        teamBWords,
        drawCard,
        recordWin,
        diceResult,
        isRolling,
        rollDice
    } = useGameLogic();

    const [isFlipped, setIsFlipped] = useState(false);
    const [useDigitalDice, setUseDigitalDice] = useState(false);

    // --- SOUND SETUP ---
    const [playDraw1] = useSound(drawSfx1);
    const [playDraw2] = useSound(drawSfx2);

    const [playPointMain] = useSound(pointMain);
    const [playPoint2] = useSound(point2);
    const [playPoint3] = useSound(point3);
    const [playPoint4] = useSound(point4);

    // --- LOGIC HELPERS ---
    const playRandomPointSound = () => {
        const chance = Math.random();
        if (chance < 0.8) {
            playPointMain();
        } else {
            const rareSounds = [playPoint2, playPoint3, playPoint4];
            const randomRare = rareSounds[Math.floor(Math.random() * rareSounds.length)];
            randomRare();
        }
    };

    const playRandomDrawSound = () => {
        Math.random() > 0.5 ? playDraw1() : playDraw2();
    };

    const handleDraw = () => {
        playRandomDrawSound();
        setIsFlipped(false);
        setTimeout(() => {
            drawCard();
            setIsFlipped(true);
        }, 200);
    };

    const handleWin = (isTeamA) => {
        playRandomPointSound();
        recordWin(isTeamA);
        setIsFlipped(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center p-8 bg-dark-bg font-sans overflow-y-auto">

            {/* HEADER & DICE TOGGLE */}
            <div className="text-center w-full max-w-4xl mb-6">
                <h1 className="text-card-gold text-5xl font-black mb-4 tracking-widest drop-shadow-lg">
                    LOCK-IN
                </h1>

                <div className="flex items-center justify-center gap-3 mb-6">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Physical Dice</span>
                    <button
                        onClick={() => setUseDigitalDice(!useDigitalDice)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${useDigitalDice ? 'bg-point-green' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${useDigitalDice ? 'left-5.5' : 'left-0.5'}`} />
                    </button>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Digital Dice</span>
                </div>

                {/* SCOREBOARD & HISTORY */}
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm text-center">
                            <p className="text-gray-400 text-xs font-bold tracking-wider mb-1 uppercase">Team A</p>
                            <p className="text-point-green text-4xl font-black">{teamAScore}</p>
                        </div>
                        <div className="flex flex-col-reverse gap-1 text-[10px] text-gray-500 font-mono text-center uppercase">
                            {teamAWords.map((w, i) => <span key={i} className="animate-fade-in">{w}</span>)}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-2">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm text-center">
                            <p className="text-gray-400 text-xs font-bold tracking-wider mb-1 uppercase">Team B</p>
                            <p className="text-point-green text-4xl font-black">{teamBScore}</p>
                        </div>
                        <div className="flex flex-col-reverse gap-1 text-[10px] text-gray-500 font-mono text-center uppercase">
                            {teamBWords.map((w, i) => <span key={i} className="animate-fade-in">{w}</span>)}
                        </div>
                    </div>
                </div>
            </div>

            {/* PLAY AREA */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 py-4 z-10">
                {useDigitalDice && (
                    <Dice value={diceResult} isRolling={isRolling} />
                )}
                <Card word={currentWord} isFlipped={isFlipped} />
            </div>

            {/* CONTROLS */}
            <div className="w-full max-w-md flex flex-col gap-3 mt-6 z-20">
                {useDigitalDice && (
                    <button
                        onClick={rollDice}
                        disabled={isRolling}
                        className="w-full bg-white text-dark-bg text-sm font-black py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all uppercase tracking-widest"
                    >
                        {isRolling ? "Rolling..." : "Roll Dice"}
                    </button>
                )}

                <button
                    onClick={handleDraw}
                    className="w-full bg-card-gold text-dark-bg text-2xl font-black py-4 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                >
                    DRAW CARD
                </button>

                <div className="flex gap-3">
                    <button
                        onClick={() => handleWin(true)}
                        className="flex-1 bg-point-green/10 text-point-green border border-point-green/40 font-bold py-3 rounded-xl hover:bg-point-green hover:text-dark-bg transition-all text-sm"
                    >
                        TEAM A +1
                    </button>
                    <button
                        onClick={() => handleWin(false)}
                        className="flex-1 bg-point-green/10 text-point-green border border-point-green/40 font-bold py-3 rounded-xl hover:bg-point-green hover:text-dark-bg transition-all text-sm"
                    >
                        TEAM B +1
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;