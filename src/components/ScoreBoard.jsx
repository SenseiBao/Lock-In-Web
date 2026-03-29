export default function ScoreBoard({ teamAScore, teamBScore, teamAWords, teamBWords, teamAName, teamBName, setTeamAName, setTeamBName, teamAPlayers = [], teamBPlayers = [] }) {
    return (
        <div className="flex justify-between items-start gap-4">
            <div className="flex-1 flex flex-col gap-2">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm text-center">
                    <input
                        value={teamAName}
                        onChange={e => setTeamAName(e.target.value)}
                        className="bg-transparent text-gray-400 text-xs font-bold tracking-wider mb-1 uppercase text-center w-full outline-none border-b border-transparent focus:border-gray-600 transition-colors"
                    />
                    <p className="text-point-green text-4xl font-black">{teamAScore}</p>
                    {teamAPlayers.length > 0 && (
                        <div className="mt-2 flex flex-wrap justify-center gap-1">
                            {teamAPlayers.map((name, i) => (
                                <span key={i} className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-medium">
                                    {name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex flex-col-reverse gap-1 text-[10px] text-gray-500 font-mono text-center uppercase">
                    {teamAWords.map((w, i) => <span key={i} className="animate-fade-in">{w}</span>)}
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-2">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm text-center">
                    <input
                        value={teamBName}
                        onChange={e => setTeamBName(e.target.value)}
                        className="bg-transparent text-gray-400 text-xs font-bold tracking-wider mb-1 uppercase text-center w-full outline-none border-b border-transparent focus:border-gray-600 transition-colors"
                    />
                    <p className="text-point-green text-4xl font-black">{teamBScore}</p>
                    {teamBPlayers.length > 0 && (
                        <div className="mt-2 flex flex-wrap justify-center gap-1">
                            {teamBPlayers.map((name, i) => (
                                <span key={i} className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-medium">
                                    {name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex flex-col-reverse gap-1 text-[10px] text-gray-500 font-mono text-center uppercase">
                    {teamBWords.map((w, i) => <span key={i} className="animate-fade-in">{w}</span>)}
                </div>
            </div>
        </div>
    );
}
