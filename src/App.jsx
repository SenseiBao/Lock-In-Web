import { useState } from 'react';
import useSound from 'use-sound';
import { useGameLogic } from './hooks/useGameLogic';
import Card from './components/Card';

// Assets
import drawSfx from './assets/sounds/draw.wav';
import pointSfx from './assets/sounds/point.mp3';

function App() {
    // 1. Destructure the word lists here
    const {
        currentWord,
        teamAScore,
        teamBScore,
        teamAWords,
        teamBWords,
        drawCard,
        recordWin
    } = useGameLogic();

    const [isFlipped, setIsFlipped] = useState(false);

    const [playDraw] = useSound(drawSfx);
    const [playPoint] = useSound(pointSfx);

    const handleDraw = () => {
        playDraw();
        setIsFlipped(false);
        setTimeout(() => {
            drawCard();
            setIsFlipped(true);
        }, 200);
    };

    const handleWin = (isTeamA) => {
        playPoint();
        recordWin(isTeamA);
        setIsFlipped(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center p-8 bg-dark-bg font-sans overflow-y-auto">

            {/* HEADER / SCOREBOARD */}
            <div className="text-center w-full max-w-4xl mb-8">
                <h1 className="text-card-gold text-5xl font-black mb-6 tracking-widest drop-shadow-lg">
                    LOCK-IN
                </h1>

                <div className="flex justify-between items-start gap-4">
                    {/* Team A History Column */}
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm text-center">
                            <p className="text-gray-400 text-sm font-bold tracking-wider mb-1">TEAM A</p>
                            <p className="text-point-green text-4xl font-black">{teamAScore}</p>
                        </div>
                        {/* Word History List */}
                        <div className="flex flex-col-reverse gap-1 text-xs text-gray-400 font-mono text-center opacity-70">
                            {teamAWords.map((w, i) => <span key={i}>{w}</span>)}
                        </div>
                    </div>

                    {/* Team B History Column */}
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm text-center">
                            <p className="text-gray-400 text-sm font-bold tracking-wider mb-1">TEAM B</p>
                            <p className="text-point-green text-4xl font-black">{teamBScore}</p>
                        </div>
                        {/* Word History List */}
                        <div className="flex flex-col-reverse gap-1 text-xs text-gray-400 font-mono text-center opacity-70">
                            {teamBWords.map((w, i) => <span key={i}>{w}</span>)}
                        </div>
                    </div>
                </div>
            </div>

            {/* CARD AREA */}
            <div className="flex-1 flex items-center justify-center py-8 z-10">
                <Card word={currentWord} isFlipped={isFlipped} />
            </div>

            {/* CONTROLS */}
            <div className="w-full max-w-md flex flex-col gap-4 mt-8 z-20">
                <button
                    onClick={handleDraw}
                    className="w-full bg-card-gold text-dark-bg text-2xl font-black py-4 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                >
                    DRAW CARD
                </button>

                <div className="flex gap-4">
                    <button
                        onClick={() => handleWin(true)}
                        className="flex-1 bg-point-green/20 text-point-green border-2 border-point-green font-bold py-3 rounded-xl hover:bg-point-green hover:text-dark-bg transition-all"
                    >
                        TEAM A +1
                    </button>
                    <button
                        onClick={() => handleWin(false)}
                        className="flex-1 bg-point-green/20 text-point-green border-2 border-point-green font-bold py-3 rounded-xl hover:bg-point-green hover:text-dark-bg transition-all"
                    >
                        TEAM B +1
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;