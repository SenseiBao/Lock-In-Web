import { useState, useEffect, useRef } from 'react';
import useSound from 'use-sound';
import { Howl } from 'howler';
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
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [bgMusic, setBgMusic] = useState(null);
    const [playedTracks, setPlayedTracks] = useState([0]);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showTrackList, setShowTrackList] = useState(false);
    //shuffle
    const [isShuffleOn, setIsShuffleOn] = useState(true); // Defaulting to your existing behavior
    const isShuffleRef = useRef(isShuffleOn);

    // Keep the ref in sync with state so Howler can always read the latest value
    useEffect(() => {
        isShuffleRef.current = isShuffleOn;
    }, [isShuffleOn]);
    
    // Timer states
    const [timerSeconds, setTimerSeconds] = useState(30);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    // --- MULTIPLE TRACKS SETUP ---
    const tracks = [
        {
            name: "Dededes Royal Payback Kirby Triple Deluxe",
            url: "https://res.cloudinary.com/dhknbfdat/video/upload/v1771753150/Dededes_Royal_Payback_Kirby_Triple_Deluxe_yek51w.mp3"
        },
        {
            name: "Zombotany - Modern Day - PvZ2",
            url: "https://res.cloudinary.com/dhknbfdat/video/upload/v1771753175/Zombotany_-_Modern_Day_-_Plants_vs._Zombies_2_Fanmade_Music_kbyy7p.mp3"
        },
        {
            name: "아른(Arn)-think of you (Official Lyric Video)",
            url: "https://res.cloudinary.com/dhknbfdat/video/upload/v1771753793/%EC%95%84%EB%A5%B8_Arn_-think_of_you_Official_Lyric_Video_etzgy3.mp3"
        },
    ];

    // --- SOUND SETUP ---
    const [playDraw1] = useSound(drawSfx1);
    const [playDraw2] = useSound(drawSfx2);

    const [playPointMain] = useSound(pointMain);
    const [playPoint2] = useSound(point2);
    const [playPoint3] = useSound(point3);
    const [playPoint4] = useSound(point4);

    // Update progress bar
    useEffect(() => {
        let interval;
        if (bgMusic && isMusicPlaying) {
            interval = setInterval(() => {
                const seek = bgMusic.seek();
                setCurrentTime(seek);
            }, 100);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [bgMusic, isMusicPlaying]);

    // Timer countdown
    useEffect(() => {
        let interval;
        if (isTimerRunning && timerSeconds > 0) {
            interval = setInterval(() => {
                setTimerSeconds(prev => {
                    if (prev <= 1) {
                        setIsTimerRunning(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTimerRunning, timerSeconds]);

    // Get random track index (avoiding the current one)
    const getRandomTrackIndex = () => {
        if (!isShuffleRef.current) {
            return (currentTrackIndex + 1) % tracks.length;
        }

        // If shuffle is ON, use your existing random logic
        if (tracks.length === 1) return 0;

        let currentPlayed = [...playedTracks];
        if (currentPlayed.length > tracks.length / 2) {
            currentPlayed = [currentTrackIndex];
            setPlayedTracks(currentPlayed);
        }

        const availableTracks = tracks
            .map((_, index) => index)
            .filter(index => !currentPlayed.includes(index));

        if (availableTracks.length === 0) {
            const newIndex = Math.floor(Math.random() * tracks.length);
            return newIndex === currentTrackIndex
                ? (newIndex + 1) % tracks.length
                : newIndex;
        }

        return availableTracks[Math.floor(Math.random() * availableTracks.length)];
    };

    // Initialize music player when track changes
    useEffect(() => {
        if (bgMusic) {
            bgMusic.unload();
        }

        const sound = new Howl({
            src: [tracks[currentTrackIndex].url],
            loop: false,
            volume: 0.25,
            html5: true,
            onload: () => {
                console.log(`🎵 Loaded: ${tracks[currentTrackIndex].name}`);
                setDuration(sound.duration());
            },
            onloaderror: (id, error) => console.error('❌ Music load error:', error),
            onplayerror: (id, error) => console.error('❌ Music play error:', error),
            onend: () => {
                const nextIndex = getRandomTrackIndex();
                setCurrentTrackIndex(nextIndex);
                setPlayedTracks(prev => [...prev, nextIndex]);
            }
        });

        setBgMusic(sound);

        if (isMusicPlaying) {
            sound.play();
            sound.fade(0, 0.25, 300);
        }

        return () => {
            sound.unload();
        };
    }, [currentTrackIndex]);

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            if (bgMusic) {
                bgMusic.unload();
            }
        };
    }, []);

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
        if (!bgMusic) return;
        
        if (isMusicPlaying) {
            bgMusic.fade(0.25, 0, 300);
            setTimeout(() => bgMusic.pause(), 300);
        } else {
            bgMusic.play();
            bgMusic.fade(0, 0.25, 300);
        }
        setIsMusicPlaying(!isMusicPlaying);
    };

    const handleNextTrack = () => {
        const nextIndex = getRandomTrackIndex();
        setCurrentTrackIndex(nextIndex);
        setPlayedTracks(prev => [...prev, nextIndex]);
    };

    const handlePrevTrack = () => {
        if (playedTracks.length > 1) {
            const prevIndex = playedTracks[playedTracks.length - 2];
            setPlayedTracks(prev => prev.slice(0, -1));
            setCurrentTrackIndex(prevIndex);
        } else {
            handleNextTrack();
        }
    };

    const handleSeek = (e) => {
        if (!bgMusic) return;
        const seekTime = parseFloat(e.target.value);
        bgMusic.seek(seekTime);
        setCurrentTime(seekTime);
    };

    const handleTrackSelect = (index) => {
        setCurrentTrackIndex(index);
        setPlayedTracks(prev => [...prev, index]);
        setShowTrackList(false);
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleTimerToggle = () => {
        setIsTimerRunning(!isTimerRunning);
    };

    const handleTimerReset = () => {
        setIsTimerRunning(false);
        setTimerSeconds(30);
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

                {/* Music Player Controls */}
                {isMusicPlaying && (
                    <div className="w-full max-w-md mx-auto mb-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                        {/* Track Info & Controls */}
                        <div className="flex items-center justify-between gap-3 mb-3">
                            {/* Shuffle Button */}
                            <button
                                onClick={() => setIsShuffleOn(!isShuffleOn)}
                                className={`transition-colors text-xl px-2 hover:scale-110 active:scale-95 ${isShuffleOn ? 'text-card-gold' : 'text-gray-600 hover:text-gray-400'}`}
                                title="Toggle Shuffle"
                            >
                                🔀
                            </button>

                            <button
                                onClick={handlePrevTrack}
                                className="text-white hover:text-card-gold transition-colors text-xl px-2 hover:scale-110 active:scale-95"
                                title="Previous track"
                            >
                                ⏮️
                            </button>

                            <div className="flex-1 text-center">
                                <div className="text-xs text-point-green flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 bg-point-green rounded-full animate-pulse"></div>
                                    <span className="font-medium">🎵 {tracks[currentTrackIndex].name}</span>
                                </div>
                                {isShuffleOn && (
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                        <div className="w-1.5 h-1.5 bg-card-gold rounded-full animate-pulse"></div>
                                        <span className="text-[9px] text-card-gold font-bold uppercase tracking-wider">Shuffle On</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleNextTrack}
                                className="text-white hover:text-card-gold transition-colors text-xl px-2 hover:scale-110 active:scale-95"
                                title={isShuffleOn ? "Next track (random)" : "Next track"}
                            >
                                ⏭️
                            </button>

                            {/* Spacer to keep the song title perfectly centered since we added a button on the left */}
                            <div className="w-[36px]"></div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={handleSeek}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                                style={{
                                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
                                }}
                            />
                            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Track List Button */}
                        <button
                            onClick={() => setShowTrackList(!showTrackList)}
                            className="w-full mt-3 text-xs text-gray-400 hover:text-card-gold transition-colors font-medium uppercase tracking-wider"
                        >
                            {showTrackList ? '▲ Hide Tracks' : '▼ View All Tracks'}
                        </button>

                        {/* Track List Dropdown */}
                        {showTrackList && (
                            <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                                {tracks.map((track, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleTrackSelect(index)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                                            index === currentTrackIndex
                                                ? 'bg-card-gold/20 text-card-gold font-bold'
                                                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            {index === currentTrackIndex && (
                                                <div className="w-1.5 h-1.5 bg-point-green rounded-full animate-pulse"></div>
                                            )}
                                            {track.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 30 Second Timer */}
                <div className="w-full max-w-md mx-auto mb-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="text-center mb-3">
                        <div className={`text-5xl font-black font-mono ${
                            timerSeconds <= 5 && timerSeconds > 0 ? 'text-red-500 animate-pulse' : 
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
                            {isTimerRunning ? '⏸️ Pause' : '▶️ Start'}
                        </button>
                        <button
                            onClick={handleTimerReset}
                            className="flex-1 bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-all text-sm"
                        >
                            🔄 Reset
                        </button>
                    </div>
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

            {/* Custom Slider Styles */}
            <style jsx>{`
                input[type="range"].slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #10b981;
                    cursor: pointer;
                    border: 2px solid #fff;
                }
                
                input[type="range"].slider::-moz-range-thumb {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #10b981;
                    cursor: pointer;
                    border: 2px solid #fff;
                }
            `}</style>
        </div>
    );
}

export default App;
