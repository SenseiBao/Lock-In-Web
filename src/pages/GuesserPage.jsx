import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const COOLDOWN_SECONDS = 6;
const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function GuesserPage() {
    const { roomCode } = useParams();
    const [roomData, setRoomData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Join state
    const [playerName, setPlayerName] = useState('');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [joined, setJoined] = useState(false);

    // Buzzer state
    const [timeLeft, setTimeLeft] = useState(0);
    const [justBuzzed, setJustBuzzed] = useState(false);
    const cooldownRef = useRef(null);
    const channelRef = useRef(null);

    const canBuzz = timeLeft === 0;

    useEffect(() => {
        document.title = 'Lock-In · Guesser';
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
                .channel(`guesser-${code}`)
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
            if (cooldownRef.current) clearInterval(cooldownRef.current);
        };
    }, [roomCode]);

    const handleBuzz = async () => {
        if (!canBuzz) return;

        setJustBuzzed(true);
        setTimeLeft(COOLDOWN_SECONDS);
        setTimeout(() => setJustBuzzed(false), 600);

        cooldownRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(cooldownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        const teamName = selectedTeam === 'A'
            ? (roomData?.team_a_name || 'Team A')
            : (roomData?.team_b_name || 'Team B');
        const buzzerLabel = `${playerName.trim() || 'Player'} (${teamName})`;

        await supabase.from('rooms').update({
            buzzer_locked_by: buzzerLabel,
            buzzer_locked_at: new Date().toISOString(),
        }).eq('room_code', roomCode.toUpperCase());
    };

    const handleJoin = async () => {
        if (!playerName.trim() || !selectedTeam) return;
        const col = selectedTeam === 'A' ? 'team_a_players' : 'team_b_players';
        const existing = roomData?.[col] || [];
        if (!existing.includes(playerName.trim())) {
            await supabase.from('rooms').update({
                [col]: [...existing, playerName.trim()],
            }).eq('room_code', roomCode.toUpperCase());
        }
        setJoined(true);
    };

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
                    Room {roomCode.toUpperCase()} · Guesser
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
                                    ? 'bg-point-green text-dark-bg border-point-green'
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
                    Join
                </button>
            </div>
        );
    }

    // Cooldown ring: full circle when cooldown starts, drains to empty
    const strokeDashoffset = CIRCUMFERENCE * (1 - timeLeft / COOLDOWN_SECONDS);

    // --- BUZZER SCREEN ---
    return (
        <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-between py-10 px-8 font-sans">

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

            {/* Power-up */}
            <AnimatePresence>
                {roomData?.active_power_up && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-pass-orange/20 border border-pass-orange p-3 rounded-xl text-center max-w-xs"
                    >
                        <p className="text-pass-orange font-black text-xs uppercase tracking-tighter">
                            ⚡ {roomData.active_power_up.name}
                        </p>
                        <p className="text-white text-[10px] mt-0.5 italic leading-tight">
                            {roomData.active_power_up.desc}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Buzzer */}
            <div className="flex flex-col items-center gap-5">
                <div className="relative w-[200px] h-[200px] flex items-center justify-center">
                    {/* Ring track — pointer-events none so clicks pass through to button */}
                    <svg
                        className="absolute inset-0"
                        style={{ transform: 'rotate(-90deg)', pointerEvents: 'none' }}
                        width="200"
                        height="200"
                    >
                        <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="#1f2937" strokeWidth="10" />
                        {timeLeft > 0 && (
                            <circle
                                cx="100" cy="100" r={RADIUS}
                                fill="none"
                                stroke="#f97316"
                                strokeWidth="10"
                                strokeDasharray={CIRCUMFERENCE}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 1s linear' }}
                            />
                        )}
                    </svg>

                    <motion.button
                        onClick={handleBuzz}
                        disabled={!canBuzz}
                        whileTap={canBuzz ? { scale: 0.88 } : {}}
                        animate={justBuzzed ? { scale: [1, 1.12, 1] } : {}}
                        transition={{ duration: 0.25 }}
                        className={`relative z-10 w-40 h-40 rounded-full font-black text-2xl shadow-2xl transition-colors select-none ${
                            canBuzz
                                ? 'bg-pass-orange text-dark-bg cursor-pointer active:brightness-110'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {canBuzz ? 'BUZZ' : `${timeLeft}s`}
                    </motion.button>
                </div>

                <p className="text-gray-600 text-xs font-bold uppercase tracking-widest text-center">
                    {playerName} · {selectedTeam === 'A' ? (roomData?.team_a_name || 'Team A') : (roomData?.team_b_name || 'Team B')}
                </p>

                <p className="text-gray-500 text-xs text-center max-w-[220px] leading-relaxed">
                    {canBuzz
                        ? 'Press the button when you\'re ready to make a guess!'
                        : 'Wait for the cooldown before guessing again...'}
                </p>
            </div>

            <div />
        </div>
    );
}
