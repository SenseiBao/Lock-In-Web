import { useState } from 'react';
import useSound from 'use-sound';
import { useGameLogic } from './hooks/useGameLogic'; // Check this path!
import Card from './components/Card';

// --- ASSETS ---
// Make sure these names match your files EXACTLY
import drawSfx from './assets/sounds/draw.wav';
import pointSfx from './assets/sounds/point.mp3';

function App() {
    const { currentWord, teamAScore, teamBScore, drawCard, recordWin } = useGameLogic();
    const [isFlipped, setIsFlipped] = useState(false);

    const [playDraw] = useSound(drawSfx);
    const [playPoint] = useSound(pointSfx);

    const handleDraw = () => {
        playDraw();
        setIsFlipped(false); // Flip back first

        // Wait for the flip to finish, then change word and flip again
        setTimeout(() => {
            drawCard();
            setIsFlipped(true);
        }, 200);
    };

    const handleWin = (isTeamA) => {
        playPoint();
        recordWin(isTeamA);
        setIsFlipped(false); // Reset card for next round
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-between p-8 bg-dark-bg font-sans">

            {/* SCOREBOARD */}
            <div className="text-center w-full max-w-2xl">
                <h1 className="text-card-gold text-5xl font-black mb-6 tracking-widest drop-shadow-[0_2px_10px_rgba(212,175,55,0.5)]">
                    LOCK-IN
                </h1>

                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="text-center">
                        <p className="text-gray-400 text-sm font-bold tracking-wider mb-1">TEAM A</p>
                        <p className="text-point-green text-4xl font-black">{teamAScore}</p>
                    </div>

                    <div className="h-12 w-[1px] bg-white/10"></div>

                    <div className="text-center">
                        <p className="text-gray-400 text-sm font-bold tracking-wider mb-1">TEAM B</p>
                        <p className="text-point-green text-4xl font-black">{teamBScore}</p>
                    </div>
                </div>
            </div>

            {/* CARD AREA */}
            <div className="flex-1 flex items-center justify-center py-8">
                <Card word={currentWord} isFlipped={isFlipped} />
            </div>

            {/* CONTROLS */}
            <div className="w-full max-w-md flex flex-col gap-4">
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