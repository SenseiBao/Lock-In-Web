import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

export default function DescriberPage() {
    const { roomCode } = useParams();
    const [roomData, setRoomData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const channelRef = useRef(null);

    // Join state
    const [playerName, setPlayerName] = useState('');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [joined, setJoined] = useState(false);

    // Skip state
    const [showSkipConfirm, setShowSkipConfirm] = useState(false);
    const [skipNotification, setSkipNotification] = useState(null);
    const prevSkipVotesRef = useRef([]);

    useEffect(() => {
        document.title = 'Lock-In · Describer';
        return () => { document.title = 'Lock-In'; };
    }, []);

    useEffect(() => {
        const code = roomCode.toUpperCase();

        const init = async () => {
            const { data, error } = await supabase
                .from('rooms')
                .select('*')
                .eq('room_code', code)
                .single();

            if (error || !data) {
                setError('Room not found. Check the code and try again.');
                setLoading(false);
                return;
            }

            setRoomData(data);
            setLoading(false);

            channelRef.current = supabase
                .channel(`describer-${code}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rooms',
                    filter: `room_code=eq.${code}`,
                }, (payload) => {
                    setRoomData(payload.new);
                })
                .subscribe();
        };

        init();
        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current);
        };
    }, [roomCode]);

    // Show toast when another describer votes to skip
    useEffect(() => {
        if (!joined || !roomData) return;
        const currentVotes = roomData.skip_votes || [];
        const prevVotes = prevSkipVotesRef.current;
        const newVoters = currentVotes.filter(v => !prevVotes.includes(v) && v !== playerName);
        if (newVoters.length > 0) {
            setSkipNotification(`${newVoters[0]} voted to skip`);
            setTimeout(() => setSkipNotification(null), 3500);
        }
        prevSkipVotesRef.current = currentVotes;
    }, [roomData?.skip_votes]);  // eslint-disable-line react-hooks/exhaustive-deps

    const handleJoin = async () => {
        if (!playerName.trim() || !selectedTeam) return;
        const name = playerName.trim();
        const col = selectedTeam === 'A' ? 'team_a_players' : 'team_b_players';
        const existing = roomData?.[col] || [];
        const existingDescribers = roomData?.describer_names || [];

        const updates = {};
        if (!existing.includes(name)) {
            updates[col] = [...existing, name];
        }
        if (!existingDescribers.includes(name)) {
            updates.describer_names = [...existingDescribers, name];
        }

        if (Object.keys(updates).length > 0) {
            await supabase.from('rooms').update(updates).eq('room_code', roomCode.toUpperCase());
        }
        setJoined(true);
    };

    const handleSkipVote = async () => {
        setShowSkipConfirm(false);
        const currentVotes = roomData?.skip_votes || [];
        if (currentVotes.includes(playerName)) return;
        await supabase.from('rooms').update({
            skip_votes: [...currentVotes, playerName],
        }).eq('room_code', roomCode.toUpperCase());
    };

    const skipVotes = roomData?.skip_votes || [];
    const describerNames = roomData?.describer_names || [];
    const hasVotedSkip = skipVotes.includes(playerName);
    const totalDescribers = describerNames.length;
    const voteCount = skipVotes.length;

    if (loading) return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center">
            <p className="text-gray-500 font-bold animate-pulse">Connecting...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-8 font-sans">
            <div className="text-center">
                <p className="text-5xl mb-4">❌</p>
                <p className="text-white font-bold text-lg">{error}</p>
            </div>
        </div>
    );

    // --- JOIN SCREEN ---
    if (!joined) {
        return (
            <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-8 font-sans gap-5">
                <h1 className="text-card-gold text-4xl font-black tracking-widest">LOCK-IN</h1>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                    Room {roomCode.toUpperCase()} · Describer
                </p>

                <input
                    type="text"
                    placeholder="Your name"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    maxLength={20}
                    className="bg-white/5 border border-white/20 rounded-xl px-5 py-3 text-white text-center font-bold w-full max-w-xs outline-none focus:border-card-gold transition-colors placeholder-gray-600"
                />

                <div className="flex gap-3 w-full max-w-xs">
                    {[
                        { key: 'A', name: roomData?.team_a_name || 'Team A' },
                        { key: 'B', name: roomData?.team_b_name || 'Team B' },
                    ].map(({ key, name }) => (
                        <button
                            key={key}
                            onClick={() => setSelectedTeam(key)}
                            className={`flex-1 py-3 rounded-xl font-bold border transition-all text-sm uppercase tracking-wide ${
                                selectedTeam === key
                                    ? 'bg-card-gold text-dark-bg border-card-gold'
                                    : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'
                            }`}
                        >
                            {name}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleJoin}
                    disabled={!playerName.trim() || !selectedTeam}
                    className="w-full max-w-xs bg-card-gold text-dark-bg font-black py-4 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 text-lg uppercase tracking-widest"
                >
                    Join as Describer
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-8 font-sans gap-8 relative">

            {/* Skip vote toast notification */}
            <AnimatePresence>
                {skipNotification && (
                    <motion.div
                        initial={{ opacity: 0, y: -30, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -30, x: '-50%' }}
                        className="fixed top-6 left-1/2 bg-white/10 border border-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-2xl font-bold text-sm z-50 shadow-2xl whitespace-nowrap"
                    >
                        ⏭️ {skipNotification}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Skip confirmation modal */}
            <AnimatePresence>
                {showSkipConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6"
                        onClick={() => setShowSkipConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                            className="bg-dark-bg border border-white/15 rounded-2xl p-8 flex flex-col items-center gap-5 shadow-2xl max-w-xs w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <p className="text-3xl">⏭️</p>
                            <div className="text-center">
                                <h2 className="text-white font-black text-xl uppercase tracking-tight mb-2">Skip this card?</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    All describers must agree to skip. A new card will only be drawn once everyone votes.
                                </p>
                            </div>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowSkipConfirm(false)}
                                    className="flex-1 py-3 rounded-xl font-bold border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white transition-all text-sm uppercase tracking-wide"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSkipVote}
                                    className="flex-1 py-3 rounded-xl font-black bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all text-sm uppercase tracking-wide"
                                >
                                    Vote to Skip
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="text-gray-600 text-[10px] font-bold tracking-widest uppercase">
                🔑 {roomCode.toUpperCase()} · {playerName} · Describer ·{' '}
                {selectedTeam === 'A' ? (roomData?.team_a_name || 'Team A') : (roomData?.team_b_name || 'Team B')}
            </p>

            {/* Word */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={roomData?.current_word || 'empty'}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                    className="text-center"
                >
                    {roomData?.current_word ? (
                        <>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">Your word is</p>
                            <h1 className="text-card-gold font-black tracking-tight break-words max-w-[90vw] leading-none"
                                style={{ fontSize: 'clamp(3rem, 12vw, 6rem)' }}>
                                {roomData.current_word}
                            </h1>
                        </>
                    ) : (
                        <p className="text-gray-600 text-xl font-bold">Waiting for a card to be drawn...</p>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Power-up */}
            <AnimatePresence>
                {roomData?.active_power_up && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        className="bg-pass-orange/20 border-2 border-pass-orange p-4 rounded-xl text-center max-w-sm"
                    >
                        <h3 className="text-pass-orange font-black uppercase tracking-tighter text-sm">
                            ⚡ {roomData.active_power_up.name}
                        </h3>
                        <p className="text-white text-xs leading-tight mt-1 font-medium italic">
                            {roomData.active_power_up.desc}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Skip button + vote status */}
            <AnimatePresence>
                {roomData?.current_word && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex flex-col items-center gap-2"
                    >
                        {hasVotedSkip ? (
                            <div className="flex flex-col items-center gap-1.5">
                                <div className="flex items-center gap-2 text-gray-400 text-sm font-bold">
                                    <span className="w-2 h-2 rounded-full bg-card-gold animate-pulse inline-block" />
                                    Waiting for others…
                                </div>
                                {totalDescribers > 1 && (
                                    <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">
                                        {voteCount} / {totalDescribers} voted to skip
                                    </p>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowSkipConfirm(true)}
                                className="px-6 py-2.5 rounded-xl font-bold border border-white/15 text-gray-400 hover:border-white/30 hover:text-white transition-all text-sm uppercase tracking-widest"
                            >
                                Skip Card
                            </button>
                        )}

                        {/* Show who else voted */}
                        {skipVotes.length > 0 && !hasVotedSkip && (
                            <p className="text-gray-600 text-xs font-medium">
                                {skipVotes.filter(v => v !== playerName).join(', ')} voted to skip
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scores */}
            <div className="flex gap-10 text-center">
                <div>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                        {roomData?.team_a_name || 'Team A'}
                    </p>
                    <p className="text-point-green text-4xl font-black">{roomData?.team_a_score ?? 0}</p>
                </div>
                <div className="text-gray-700 text-4xl font-black self-center">—</div>
                <div>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                        {roomData?.team_b_name || 'Team B'}
                    </p>
                    <p className="text-point-green text-4xl font-black">{roomData?.team_b_score ?? 0}</p>
                </div>
            </div>
        </div>
    );
}
