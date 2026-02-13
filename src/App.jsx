import { useState, useEffect, useRef } from 'react';
import useSound from 'use-sound';
import ReactPlayer from 'react-player';
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
        rollDice,
        activePowerUp
    } = useGameLogic();

    const [isFlipped, setIsFlipped] = useState(false);
    const [useDigitalDice, setUseDigitalDice] = useState(false);

    // --- MUSIC STATE ---
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [playerReady, setPlayerReady] = useState(false);
    const [needsInteraction, setNeedsInteraction] = useState(true);
    const playerRef = useRef(null);

    const PLAYLIST_URL = "https://www.youtube.com/watch?v=jfKfPfyJRdk";

    // --- SOUND SETUP ---
    const [playDraw1] = useSound(drawSfx1);
    const [playDraw2] = useSound(drawSfx2);

    const [playPointMain] = useSound(pointMain);
    const [playPoint2] = useSound(point2);
    const [playPoint3] = useSound(point3);
    const [playPoint4] = useSound(point4);

    // When music starts playing and player is ready, try to ensure audio works
    useEffect(() => {
        if (isMusicPlaying && playerReady && playerRef.current) {
            // Get the internal player
            const internalPlayer = playerRef.current.getInternalPlayer();
            if (internalPlayer && internalPlayer.playVideo) {
                // Force play (this requires a user gesture, which we have)
                setTimeout(() => {
                    internalPlayer.playVideo();
                    console.log('🔊 Attempting to play with sound');
                }, 100);
            }
        }
    }, [isMusicPlaying, playerReady]);

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

    const handleMusicToggle = () => {
        console.log('Music toggle clicked. Current state:', isMusicPlaying);

        if (!isMusicPlaying) {
            setNeedsInteraction(false);
        }

        setIsMusicPlaying(prev => {
            const newState = !prev;

            // If turning on and player exists, manually trigger play
            if (newState && playerRef.current) {
                setTimeout(() => {
                    const internalPlayer = playerRef.current.getInternalPlayer();
                    if (internalPlayer && internalPlayer.playVideo) {
                        internalPlayer.playVideo();
                        console.log('🎵 Manually triggered playVideo');
                    }
                }, 200);
            }

            return newState;
        });
    };

    const handleDraw = () => {
        playRandomDrawSound();
        setIsFlipped(false);

        if (useDigitalDice) {
            rollDice();
        }

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

            {/* HEADER & CONTROLS */}
            <div className="text-center w-full max-w-4xl mb-6">
                <h1 className="text-card-gold text-5xl font-black mb-4 tracking-widest drop-shadow-lg">
                    LOCK-IN
                </h1>

                {/* TOGGLES CONTAINER */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-6">

                    {/* Dice Toggle */}
                    <div className="flex items-center gap-3">
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
                            onClick={handleMusicToggle}
                            className={`w-10 h-5 rounded-full transition-colors relative ${isMusicPlaying ? 'bg-card-gold' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isMusicPlaying ? 'left-5.5' : 'left-0.5'}`} />
                        </button>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Music On</span>
                    </div>
                </div>

                {/* Music Status */}
                {isMusicPlaying && (
                    <div className="text-xs mb-2">
                        {!playerReady ? (
                            <div className="text-gray-400 flex items-center justify-center gap-2">
                                <div className="w-2 h-2 bg-card-gold rounded-full animate-pulse"></div>
                                Loading music...
                            </div>
                        ) : (
                            <div className="text-point-green flex items-center justify-center gap-2">
                                <div className="w-2 h-2 bg-point-green rounded-full animate-pulse"></div>
                                🎵 Music playing {needsInteraction && '(Click player if no sound)'}
                            </div>
                        )}
                    </div>
                )}

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
                            </div>
                        )}
                    </div>
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

            {/* YOUTUBE MUSIC PLAYER - Now clickable for manual interaction */}
            {isMusicPlaying && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        width: '320px',
                        height: '180px',
                        opacity: 0.3,
                        border: '2px solid rgba(212, 175, 55, 0.5)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        zIndex: 50,
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.6'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.3'}
                >
                    <ReactPlayer
                        ref={playerRef}
                        url={PLAYLIST_URL}
                        playing={isMusicPlaying}
                        loop={true}
                        volume={0.25}
                        width="320px"
                        height="180px"
                        onReady={() => {
                            console.log('✅ Player ready!');
                            setPlayerReady(true);
                        }}
                        onStart={() => {
                            console.log('▶️ Video started playing');
                        }}
                        onPlay={() => {
                            console.log('▶️ onPlay triggered');
                        }}
                        onError={(e) => {
                            console.error('❌ Player error:', e);
                        }}
                        config={{
                            youtube: {
                                playerVars: {
                                    autoplay: 1,
                                    controls: 1, // Enable controls so user can click play if needed
                                    modestbranding: 1,
                                    rel: 0,
                                    showinfo: 0,
                                    fs: 0
                                }
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export default App;