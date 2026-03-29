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

    return (
        <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-8 font-sans gap-8">

            <p className="text-gray-600 text-[10px] font-bold tracking-widest uppercase">
                🔑 {roomCode.toUpperCase()} · Describer View
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
