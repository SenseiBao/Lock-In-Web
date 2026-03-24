import { useState } from 'react';
import useSound from 'use-sound';
import { useGameLogic } from './hooks/useGameLogic';

// --- COMPONENTS ---
import Card from './components/Card';
import Dice from './components/Dice';
import ScoreBoard from './components/ScoreBoard';
import Timer from './components/Timer';
import MusicPlayer from './components/MusicPlayer';

// --- SOUND EFFECTS ---
import drawSfx1 from './assets/sounds/draw.wav';
import drawSfx2 from './assets/sounds/draw2.wav';
import pointMain from './assets/sounds/point.mp3';
import point2 from './assets/sounds/point2.mp3';
import point3 from './assets/sounds/point3.mp3';
import point4 from './assets/sounds/point4.mp3';

export default function App() {
    const {
        currentWord, teamAScore, teamBScore, teamAWords, teamBWords,
        drawCard, recordWin, diceResult, isRolling, rollDice, activePowerUp, lookaheadCards
    } = useGameLogic();

    const [isFlipped, setIsFlipped] = useState(false);
    const [useDigitalDice, setUseDigitalDice] = useState(false);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);

    const [playDraw1] = useSound(drawSfx1);
    const [playDraw2] = useSound(drawSfx2);
    const [playPointMain] = useSound(pointMain);
    const [playPoint2] = useSound(point2);
    const [playPoint3] = useSound(point3);
    const [playPoint4] = useSound(point4);

    const playRandomPointSound = () => {
        Math.random() < 0.8 ? playPointMain() : [playPoint2, playPoint3, playPoint4][Math.floor(Math.random() * 3)]();
    };

    const handleDraw = () => {
        Math.random() > 0.5 ? playDraw1() : playDraw2();
        setIsFlipped(false);
        if (useDigitalDice) rollDice();
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

            {/* HEADER & SCOREBOARD */}
            <div className="text-center w-full max-w-4xl mb-6">
                <h1 className="text-card-gold text-5xl font-black mb-4 tracking-widest drop-shadow-lg">
                    LOCK-IN
                </h1>

                {/* TOGGLES CONTAINER */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-6">

                    {/* Dice Toggle */}
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Physical Dice</span>
                        <button
                            onClick={() => setUseDigitalDice(!useDigitalDice)}
                            className={`w-10 h-5 rounded-full transition-colors relative ${useDigitalDice ? 'bg-point-green' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${useDigitalDice ? 'left-5.5' : 'left-0.5'}`} />
                        </button>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Digital Dice</span>
                    </div>

                    {/* Music Toggle */}
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Music Off</span>
                        <button
                            onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                            className={`w-10 h-5 rounded-full transition-colors relative ${isMusicPlaying ? 'bg-card-gold' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isMusicPlaying ? 'left-5.5' : 'left-0.5'}`} />
                        </button>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Music On</span>
                    </div>

                </div>

                <MusicPlayer isMusicPlaying={isMusicPlaying} />

                {/* Timer was removed from here and moved down! */}

                <ScoreBoard
                    teamAScore={teamAScore}
                    teamBScore={teamBScore}
                    teamAWords={teamAWords}
                    teamBWords={teamBWords}
                />
            </div>

            {/* PLAY AREA - 3 COLUMN LAYOUT */}
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center w-full max-w-6xl gap-8 py-4 z-10">

                {/* LEFT COLUMN: DICE */}
                <div className="flex-1 flex justify-end items-center w-full">
                    {useDigitalDice && (
                        <div className="flex flex-col items-center gap-4">
                            <Dice value={diceResult} isRolling={isRolling} />
                            {activePowerUp && !isRolling && (
                                <div className="max-w-xs bg-pass-orange/20 border-2 border-pass-orange p-4 rounded-xl text-center animate-bounce-short">
                                    <h3 className="text-pass-orange font-black uppercase tracking-tighter text-sm">
                                        ⚡ {activePowerUp.name}
                                    </h3>
                                    <p className="text-white text-[10px] leading-tight mt-1 font-medium italic">
                                        {activePowerUp.desc}
                                    </p>
                                    {lookaheadCards.length > 0 && (
                                        <div className="mt-3 flex flex-col gap-1">
                                            {lookaheadCards.map((word, i) => (
                                                <div key={i} className="bg-dark-bg/60 border border-pass-orange/40 rounded px-2 py-1 text-card-gold text-xs font-black tracking-widest">
                                                    {word}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* CENTER COLUMN: CARD */}
                <div className="flex-shrink-0 z-20">
                    <Card word={currentWord} isFlipped={isFlipped} />
                </div>

                {/* RIGHT COLUMN: TIMER */}
                <div className="flex-1 flex justify-start items-center w-full">
                    {/* Constraining the width so it looks proportional next to the card */}
                    <div className="w-full max-w-[280px]">
                        <Timer />
                    </div>
                </div>

            </div>

            {/* BOTTOM CONTROLS */}
            <div className="w-full max-w-md flex flex-col gap-3 mt-6 z-20">
                {useDigitalDice && (
                    <button onClick={rollDice} disabled={isRolling} className="w-full bg-white text-dark-bg text-sm font-black py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all uppercase tracking-widest">
                        {isRolling ? "Rolling..." : "Roll Dice"}
                    </button>
                )}
                <button onClick={handleDraw} className="w-full bg-card-gold text-dark-bg text-2xl font-black py-4 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                    DRAW CARD
                </button>
                <div className="flex gap-3">
                    <button onClick={() => handleWin(true)} className="flex-1 bg-point-green/10 text-point-green border border-point-green/40 font-bold py-3 rounded-xl hover:bg-point-green hover:text-dark-bg transition-all text-sm">
                        TEAM A +1
                    </button>
                    <button onClick={() => handleWin(false)} className="flex-1 bg-point-green/10 text-point-green border border-point-green/40 font-bold py-3 rounded-xl hover:bg-point-green hover:text-dark-bg transition-all text-sm">
                        TEAM B +1
                    </button>
                </div>
            </div>
        </div>
    );
}