import { useState, useEffect, useRef } from 'react';
import useSound from 'use-sound';
import { AnimatePresence, motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useGameLogic, GAME_MODES } from '../hooks/useGameLogic';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// --- COMPONENTS ---
import Card from '../components/Card';
import Dice from '../components/Dice';
import ScoreBoard from '../components/ScoreBoard';
import Timer from '../components/Timer';
import MusicPlayer from '../components/MusicPlayer';

// --- SOUND EFFECTS ---
import drawSfx1 from '../assets/sounds/draw.wav';
import drawSfx2 from '../assets/sounds/draw2.wav';
import pointMain from '../assets/sounds/point.mp3';
import point2 from '../assets/sounds/point2.mp3';
import point3 from '../assets/sounds/point3.mp3';
import point4 from '../assets/sounds/point4.mp3';

const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export default function MainGame() {
    const {
        gameMode, setGameMode,
        currentWord, teamAScore, teamBScore, teamAWords, teamBWords,
        soloScore, soloWords, soloFreeSkipsRemaining,
        drawCard, recordTeamWin, recordSoloWin, recordCoopSkip, resetGame, diceResult, isRolling, rollDice, activePowerUp,
    } = useGameLogic();

    const [isFlipped, setIsFlipped] = useState(false);
    const [useDigitalDice, setUseDigitalDice] = useState(false);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [hideWord, setHideWord] = useState(false);
    const [teamAName, setTeamAName] = useState('Team A');
    const [teamBName, setTeamBName] = useState('Team B');
    const [drawKey, setDrawKey] = useState(0);

    // Room state
    const [roomCode, setRoomCode] = useState(null);
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [buzzerNotification, setBuzzerNotification] = useState(null);
    const [qrModal, setQrModal] = useState(null); // 'describe' | 'join' | null
    const [teamAPlayers, setTeamAPlayers] = useState([]);
    const [teamBPlayers, setTeamBPlayers] = useState([]);
    const [skipVotes, setSkipVotes] = useState([]);
    const [describerNames, setDescriberNames] = useState([]);
    const [allVotedToSkip, setAllVotedToSkip] = useState(false);
    const [skipNotification, setSkipNotification] = useState(null);
    const channelRef = useRef(null);
    // Guard: prevents re-triggering a skip draw while one is already in progress
    const skipInProgressRef = useRef(false);
    // Flag: merges skip_votes clear into the next sync effect update atomically
    const pendingSkipClearRef = useRef(false);
    const pendingDescriberCorrectClearRef = useRef(false);
    const lastDescriberCorrectAtRef = useRef(null);
    const gameModeRef = useRef(gameMode);
    const currentWordRef = useRef(currentWord);
    const coopCorrectHandlersRef = useRef({ playRandomPointSound: () => {}, recordSoloWin: () => {}, handleDraw: () => {} });
    const [linkCopied, setLinkCopied] = useState(false);

    useEffect(() => {
        gameModeRef.current = gameMode;
    }, [gameMode]);
    useEffect(() => {
        currentWordRef.current = currentWord;
    }, [currentWord]);
    useEffect(() => {
        lastDescriberCorrectAtRef.current = null;
    }, [roomCode]);

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
            setDrawKey(k => k + 1);
        }, 200);
        // Mark that the next sync update should also clear skip_votes atomically
        skipInProgressRef.current = false;
        pendingSkipClearRef.current = true;
        setSkipVotes([]);
    };

    const changeGameMode = (next) => {
        if (next === gameMode) return;
        resetGame();
        setGameMode(next);
    };

    const handleWin = (isTeamA) => {
        playRandomPointSound();
        if (gameMode === GAME_MODES.SOLO) {
            recordSoloWin();
        } else {
            recordTeamWin(isTeamA);
        }
        handleDraw();
    };

    useEffect(() => {
        coopCorrectHandlersRef.current = { playRandomPointSound, recordSoloWin, handleDraw };
    }, [playRandomPointSound, recordSoloWin, handleDraw]);

    // Create a Supabase room
    const createRoom = async () => {
        if (!isSupabaseConfigured) return;
        setIsCreatingRoom(true);
        const code = generateRoomCode();
        const { error } = await supabase.from('rooms').insert({
            room_code: code,
            current_word: currentWord,
            team_a_score: teamAScore,
            team_b_score: teamBScore,
            team_a_name: teamAName,
            team_b_name: teamBName,
            active_power_up: activePowerUp,
            team_a_players: [],
            team_b_players: [],
            describer_names: [],
            skip_votes: [],
            game_mode: gameMode,
            solo_score: soloScore,
            solo_words: soloWords,
            solo_free_skips_remaining: soloFreeSkipsRemaining,
        });
        if (!error) setRoomCode(code);
        setIsCreatingRoom(false);
    };

    // Sync game state to Supabase whenever anything relevant changes
    useEffect(() => {
        if (!roomCode) return;
        const sync = async () => {
            const update = {
                current_word: currentWord,
                team_a_score: teamAScore,
                team_b_score: teamBScore,
                team_a_name: teamAName,
                team_b_name: teamBName,
                active_power_up: activePowerUp,
                game_mode: gameMode,
                solo_score: soloScore,
                solo_words: soloWords,
                solo_free_skips_remaining: soloFreeSkipsRemaining,
                updated_at: new Date().toISOString(),
            };
            // Merge skip_votes clear atomically with the word update so clients
            // always receive both changes in one payload — no race condition.
            if (pendingSkipClearRef.current) {
                update.skip_votes = [];
                pendingSkipClearRef.current = false;
            }
            if (pendingDescriberCorrectClearRef.current) {
                update.describer_correct_at = null;
                update.describer_correct_by = null;
                pendingDescriberCorrectClearRef.current = false;
            }
            await supabase.from('rooms').update(update).eq('room_code', roomCode);
        };
        sync();
    }, [roomCode, currentWord, teamAScore, teamBScore, teamAName, teamBName, activePowerUp, gameMode, soloScore, soloWords, soloFreeSkipsRemaining]);

    // Subscribe to buzzer presses from guessers
    useEffect(() => {
        if (!roomCode) return;

        channelRef.current = supabase
            .channel(`host-${roomCode}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'rooms',
                filter: `room_code=eq.${roomCode}`,
            }, (payload) => {
                const {
                    buzzer_locked_by,
                    buzzer_locked_at,
                    team_a_players,
                    team_b_players,
                    skip_votes: newSkipVotes,
                    describer_names: newDescriberNames,
                    describer_correct_at,
                    describer_correct_by,
                } = payload.new;
                const prevTime = payload.old?.buzzer_locked_at;
                if (buzzer_locked_by && buzzer_locked_at !== prevTime) {
                    setBuzzerNotification(buzzer_locked_by);
                    setTimeout(() => setBuzzerNotification(null), 3000);
                }
                const prevCorrectAt = payload.old?.describer_correct_at;
                if (
                    describer_correct_at &&
                    describer_correct_at !== prevCorrectAt &&
                    payload.new?.game_mode === GAME_MODES.SOLO
                ) {
                    if (lastDescriberCorrectAtRef.current === describer_correct_at) return;
                    if (gameModeRef.current !== GAME_MODES.SOLO || !currentWordRef.current) return;
                    lastDescriberCorrectAtRef.current = describer_correct_at;
                    const h = coopCorrectHandlersRef.current;
                    h.playRandomPointSound();
                    h.recordSoloWin();
                    h.handleDraw();
                    pendingDescriberCorrectClearRef.current = true;
                    const label = describer_correct_by ? `✓ ${describer_correct_by} marked correct` : '✓ Describer marked correct';
                    setBuzzerNotification(label);
                    setTimeout(() => setBuzzerNotification(null), 3000);
                }
                if (team_a_players) setTeamAPlayers(team_a_players);
                if (team_b_players) setTeamBPlayers(team_b_players);
                if (newDescriberNames) setDescriberNames(newDescriberNames);
                if (Array.isArray(newSkipVotes)) {
                    setSkipVotes(newSkipVotes);
                    const resolvedNames = newDescriberNames || [];

                    if (newSkipVotes.length === 0) {
                        // Votes were cleared (new card drawn) — reset guard
                        skipInProgressRef.current = false;
                    } else {
                        // Show notification for each new voter
                        const prevVotes = payload.old?.skip_votes || [];
                        const newVoters = newSkipVotes.filter(v => !prevVotes.includes(v));
                        if (newVoters.length > 0) {
                            const total = resolvedNames.length;
                            const count = newSkipVotes.length;
                            setSkipNotification(`⏭️ ${newVoters[0]} voted to skip (${count}/${total})`);
                            setTimeout(() => setSkipNotification(null), 3500);
                        }
                        // Trigger auto-draw only once per skip round
                        if (resolvedNames.length > 0 && newSkipVotes.length >= resolvedNames.length && !skipInProgressRef.current) {
                            skipInProgressRef.current = true;
                            setAllVotedToSkip(true);
                        }
                    }
                }
            })
            .subscribe();

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current);
        };
    }, [roomCode]);

    // Auto-draw when all describers have voted to skip
    useEffect(() => {
        if (!allVotedToSkip || !roomCode) return;
        setAllVotedToSkip(false);
        if (gameMode === GAME_MODES.SOLO) {
            recordCoopSkip();
        }
        handleDraw();
    }, [allVotedToSkip]); // eslint-disable-line react-hooks/exhaustive-deps

    const getLink = (type) => `${window.location.origin}/${type}/${roomCode}`;

    return (
        <div className="min-h-screen flex flex-col items-center p-8 bg-dark-bg font-sans overflow-y-auto">

            {/* QR Code modal */}
            <AnimatePresence>
                {qrModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6"
                        onClick={() => setQrModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                            className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <p className="text-dark-bg text-xs font-black uppercase tracking-widest">
                                {qrModal === 'describe' ? '📝 Describer Link' : '🔔 Guesser Link'}
                            </p>
                            <QRCodeSVG
                                value={getLink(qrModal)}
                                size={220}
                                bgColor="#ffffff"
                                fgColor="#0f172a"
                                level="M"
                            />
                            <p className="text-gray-400 text-[10px] font-mono break-all text-center max-w-[220px]">
                                {getLink(qrModal)}
                            </p>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(getLink(qrModal));
                                    setLinkCopied(true);
                                    setTimeout(() => setLinkCopied(false), 2000);
                                }}
                                className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all bg-dark-bg text-white hover:bg-gray-800"
                            >
                                {linkCopied ? '✓ Copied!' : 'Copy Link'}
                            </button>
                            <button
                                onClick={() => { setQrModal(null); setLinkCopied(false); }}
                                className="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-dark-bg transition-colors"
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Buzzer notification */}
            <AnimatePresence>
                {buzzerNotification && (
                    <motion.div
                        initial={{ opacity: 0, y: -30, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -30, x: '-50%' }}
                        className="fixed top-6 left-1/2 bg-pass-orange text-dark-bg px-8 py-3 rounded-2xl font-black text-lg z-50 shadow-2xl"
                    >
                        {buzzerNotification.startsWith('✓')
                            ? buzzerNotification
                            : `🔔 ${buzzerNotification} buzzed in!`}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Skip vote notification */}
            <AnimatePresence>
                {skipNotification && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 30, x: '-50%' }}
                        className="fixed bottom-8 left-1/2 bg-white/10 border border-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-2xl font-bold text-sm z-50 shadow-2xl whitespace-nowrap"
                    >
                        {skipNotification}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER & SCOREBOARD */}
            <div className="text-center w-full max-w-4xl mb-6">
                <h1 className="text-card-gold text-5xl font-black mb-4 tracking-widest drop-shadow-lg">
                    LOCK-IN
                </h1>

                {/* GAME MODE */}
                <div className="flex flex-col items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Game mode</span>
                    <div className="flex rounded-xl border border-white/15 overflow-hidden bg-white/5 p-0.5">
                        <button
                            type="button"
                            onClick={() => changeGameMode(GAME_MODES.TEAMS)}
                            className={`px-4 py-2 text-[11px] font-black uppercase tracking-tight rounded-lg transition-all ${
                                gameMode === GAME_MODES.TEAMS
                                    ? 'bg-card-gold text-dark-bg shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Two teams
                        </button>
                        <button
                            type="button"
                            onClick={() => changeGameMode(GAME_MODES.SOLO)}
                            className={`px-4 py-2 text-[11px] font-black uppercase tracking-tight rounded-lg transition-all ${
                                gameMode === GAME_MODES.SOLO
                                    ? 'bg-card-gold text-dark-bg shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Co-op run
                        </button>
                    </div>
                    <p className="text-gray-600 text-[10px] max-w-xs text-center leading-relaxed">
                        {gameMode === GAME_MODES.TEAMS
                            ? 'Two describers (one per team) — teams race to capture the deck.'
                            : 'One describer — guessers work together to score as many words as possible.'}
                    </p>
                </div>

                {/* TOGGLES */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-4">
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

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Hide Word</span>
                        <button
                            onClick={() => setHideWord(!hideWord)}
                            className={`w-10 h-5 rounded-full transition-colors relative ${hideWord ? 'bg-gray-700' : 'bg-point-green'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${hideWord ? 'left-0.5' : 'left-5.5'}`} />
                        </button>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Show Word</span>
                    </div>

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

                {/* ROOM PANEL */}
                {isSupabaseConfigured && (
                    <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                        {roomCode ? (
                            <>
                                <span className="text-card-gold text-xs font-black tracking-widest bg-card-gold/10 border border-card-gold/30 px-3 py-1.5 rounded-lg">
                                    🔑 {roomCode}
                                </span>
                                <button
                                    onClick={() => setQrModal('describe')}
                                    className="text-[10px] font-bold text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-tight"
                                >
                                    📝 Describer Link
                                </button>
                                <button
                                    onClick={() => setQrModal('join')}
                                    className="text-[10px] font-bold text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-tight"
                                >
                                    🔔 Guesser Link
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={createRoom}
                                disabled={isCreatingRoom}
                                className="text-[10px] font-bold text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 px-4 py-1.5 rounded-lg transition-colors uppercase tracking-tight disabled:opacity-50"
                            >
                                {isCreatingRoom ? 'Creating...' : '+ Create Room'}
                            </button>
                        )}
                    </div>
                )}

                <ScoreBoard
                    gameMode={gameMode}
                    teamAScore={teamAScore}
                    teamBScore={teamBScore}
                    teamAWords={teamAWords}
                    teamBWords={teamBWords}
                    teamAName={teamAName}
                    teamBName={teamBName}
                    setTeamAName={setTeamAName}
                    setTeamBName={setTeamBName}
                    teamAPlayers={teamAPlayers}
                    teamBPlayers={teamBPlayers}
                    soloScore={soloScore}
                    soloWords={soloWords}
                    soloFreeSkipsRemaining={soloFreeSkipsRemaining}
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
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* CENTER COLUMN: CARD — word hidden when room is active */}
                <div className="flex-shrink-0 z-20">
                    <Card word={currentWord} isFlipped={isFlipped} hideWord={hideWord} />
                </div>

                {/* RIGHT COLUMN: TIMER */}
                <div className="flex-1 flex justify-start items-center w-full">
                    <div className="w-full max-w-[280px]">
                        <Timer drawKey={drawKey} />
                    </div>
                </div>

            </div>

            {/* BOTTOM CONTROLS */}
            <div className="w-full max-w-md flex flex-col gap-3 mt-6 z-20">
                {useDigitalDice && (
                    <button onClick={rollDice} disabled={isRolling} className="w-full bg-white text-dark-bg text-sm font-black py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all uppercase tracking-widest">
                        {isRolling ? 'Rolling...' : 'Roll Dice'}
                    </button>
                )}
                <button onClick={handleDraw} className="w-full bg-card-gold text-dark-bg text-2xl font-black py-4 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                    DRAW CARD
                </button>
                {gameMode === GAME_MODES.SOLO ? (
                    <button
                        onClick={() => handleWin()}
                        className="w-full bg-point-green/10 text-point-green border border-point-green/40 font-black py-4 rounded-xl hover:bg-point-green hover:text-dark-bg transition-all text-base uppercase tracking-[0.2em]"
                    >
                        Correct — +1
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <button onClick={() => handleWin(true)} className="flex-1 bg-point-green/10 text-point-green border border-point-green/40 font-bold py-3 rounded-xl hover:bg-point-green hover:text-dark-bg transition-all text-sm uppercase">
                            {teamAName} +1
                        </button>
                        <button onClick={() => handleWin(false)} className="flex-1 bg-point-green/10 text-point-green border border-point-green/40 font-bold py-3 rounded-xl hover:bg-point-green hover:text-dark-bg transition-all text-sm uppercase">
                            {teamBName} +1
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
