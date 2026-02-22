import { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';

const tracks = [
    { name: "Dededes Royal Payback Kirby Triple Deluxe", url: "https://res.cloudinary.com/dhknbfdat/video/upload/v1771753150/Dededes_Royal_Payback_Kirby_Triple_Deluxe_yek51w.mp3" },
    { name: "Zombotany - Modern Day - PvZ2", url: "https://res.cloudinary.com/dhknbfdat/video/upload/v1771753175/Zombotany_-_Modern_Day_-_Plants_vs._Zombies_2_Fanmade_Music_kbyy7p.mp3" },
    { name: "아른(Arn)-think of you", url: "https://res.cloudinary.com/dhknbfdat/video/upload/v1771753793/%EC%95%84%EB%A5%B8_Arn_-think_of_you_Official_Lyric_Video_etzgy3.mp3" },
    { name: "George Benson - Nothing Gonna Change My Love For You", url: "https://res.cloudinary.com/dhknbfdat/video/upload/v1771755064/George_Benson_-_Nothing_s_Gonna_Change_My_Love_For_You_Lyrics_mdaykg.mp3"},
];

export default function MusicPlayer({ isMusicPlaying }) {
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [bgMusic, setBgMusic] = useState(null);
    const [playedTracks, setPlayedTracks] = useState([0]);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showTrackList, setShowTrackList] = useState(false);
    const [isShuffleOn, setIsShuffleOn] = useState(true);

    // REFS: These stop Howler from using "stale" data
    const isShuffleRef = useRef(isShuffleOn);
    const currentTrackIndexRef = useRef(currentTrackIndex);
    const playedTracksRef = useRef(playedTracks);

    useEffect(() => { isShuffleRef.current = isShuffleOn; }, [isShuffleOn]);
    useEffect(() => { currentTrackIndexRef.current = currentTrackIndex; }, [currentTrackIndex]);
    useEffect(() => { playedTracksRef.current = playedTracks; }, [playedTracks]);

    useEffect(() => {
        let interval;
        if (bgMusic && isMusicPlaying) {
            interval = setInterval(() => setCurrentTime(bgMusic.seek()), 100);
        }
        return () => clearInterval(interval);
    }, [bgMusic, isMusicPlaying]);

    // Remote control from App.jsx
    useEffect(() => {
        if (!bgMusic) return;
        if (isMusicPlaying && !bgMusic.playing()) {
            bgMusic.play();
            bgMusic.fade(0, 0.25, 300);
        } else if (!isMusicPlaying && bgMusic.playing()) {
            bgMusic.fade(0.25, 0, 300);
            setTimeout(() => bgMusic.pause(), 300);
        }
    }, [isMusicPlaying, bgMusic]);

    // Centralized track calculation using Refs
    const advanceTrack = () => {
        const currentIndex = currentTrackIndexRef.current;
        const history = playedTracksRef.current;
        let nextIndex;

        if (!isShuffleRef.current) {
            nextIndex = (currentIndex + 1) % tracks.length;
        } else {
            let validHistory = [...history];
            if (validHistory.length >= Math.ceil(tracks.length / 2)) {
                validHistory = [currentIndex];
            }
            const available = tracks.map((_, i) => i).filter(i => !validHistory.includes(i));

            if (available.length === 0) {
                let fallback = Math.floor(Math.random() * tracks.length);
                nextIndex = fallback === currentIndex ? (fallback + 1) % tracks.length : fallback;
            } else {
                nextIndex = available[Math.floor(Math.random() * available.length)];
            }
        }

        setCurrentTrackIndex(nextIndex);
        setPlayedTracks(prev => {
            if (prev.length >= Math.ceil(tracks.length / 2)) {
                return [currentIndex, nextIndex];
            }
            return [...prev, nextIndex];
        });
    };

    useEffect(() => {
        if (bgMusic) bgMusic.unload();

        const sound = new Howl({
            src: [tracks[currentTrackIndex].url],
            loop: false, volume: 0.25, html5: true,
            onload: () => setDuration(sound.duration()),
            onend: advanceTrack // Clean reference to our function
        });

        setBgMusic(sound);
        if (isMusicPlaying) { sound.play(); sound.fade(0, 0.25, 300); }
        return () => sound.unload();
    }, [currentTrackIndex]);

    const handleToggleShuffle = () => {
        const turningOn = !isShuffleOn;
        setIsShuffleOn(turningOn);

        // Instantly switch to a random track if they turn shuffle ON
        if (turningOn) {
            advanceTrack();
        }
    };

    const handlePrevTrack = () => {
        if (playedTracks.length > 1) {
            const prevIndex = playedTracks[playedTracks.length - 2];
            setPlayedTracks(prev => prev.slice(0, -1));
            setCurrentTrackIndex(prevIndex);
        } else advanceTrack();
    };

    const handleSeek = (e) => {
        if (!bgMusic) return;
        const seekTime = parseFloat(e.target.value);
        bgMusic.seek(seekTime);
        setCurrentTime(seekTime);
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center w-full">
            {isMusicPlaying && (
                <div className="w-full max-w-md mx-auto mb-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <button onClick={handleToggleShuffle} className={`transition-colors text-xl px-2 hover:scale-110 active:scale-95 ${isShuffleOn ? 'text-card-gold' : 'text-gray-600 hover:text-gray-400'}`} title="Toggle Shuffle">🔀</button>
                        <button onClick={handlePrevTrack} className="text-white hover:text-card-gold transition-colors text-xl px-2 hover:scale-110 active:scale-95">⏮️</button>
                        <div className="flex-1 text-center">
                            {/* Song Title */}
                            <div className="text-xs text-point-green flex items-center justify-center gap-2">
                                <div className="w-2 h-2 bg-point-green rounded-full animate-pulse"></div>
                                <span className="font-medium">🎵 {tracks[currentTrackIndex].name}</span>
                            </div>

                            {/* Shuffle Indicator */}
                            {isShuffleOn && (
                                <div className="flex items-center justify-center gap-1 mt-1">
                                    <div className="w-1.5 h-1.5 bg-card-gold rounded-full animate-pulse"></div>
                                    <span className="text-[9px] text-card-gold font-bold uppercase tracking-wider">Shuffle On</span>
                                </div>
                            )}
                        </div>
                        <button onClick={advanceTrack} className="text-white hover:text-card-gold transition-colors text-xl px-2 hover:scale-110 active:scale-95">⏭️</button>
                        <div className="w-[36px]"></div>
                    </div>

                    <div className="space-y-1">
                        <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek}
                               className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                               style={{ background: `linear-gradient(to right, #10b981 0%, #10b981 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)` }}
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                            <span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <button onClick={() => setShowTrackList(!showTrackList)} className="w-full mt-3 text-xs text-gray-400 hover:text-card-gold transition-colors font-medium uppercase tracking-wider">
                        {showTrackList ? '▲ Hide Tracks' : '▼ View All Tracks'}
                    </button>

                    {showTrackList && (
                        <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                            {tracks.map((track, index) => (
                                <button key={index} onClick={() => { setCurrentTrackIndex(index); setPlayedTracks(prev => [...prev, index]); setShowTrackList(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${index === currentTrackIndex ? 'bg-card-gold/20 text-card-gold font-bold' : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'}`}>
                                    <span className="flex items-center gap-2">
                                        {index === currentTrackIndex && <div className="w-1.5 h-1.5 bg-point-green rounded-full animate-pulse"></div>}
                                        {track.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}