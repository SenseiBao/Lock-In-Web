import { GAME_MODES, COOP_FREE_SKIPS } from '../hooks/useGameLogic';

export default function ScoreBoard({
    gameMode = GAME_MODES.TEAMS,
    teamAScore, teamBScore, teamAWords, teamBWords, teamAName, teamBName, setTeamAName, setTeamBName,
    teamAPlayers = [], teamBPlayers = [],
    soloScore = 0, soloWords = [], soloFreeSkipsRemaining = COOP_FREE_SKIPS,
}) {
    if (gameMode === GAME_MODES.SOLO) {
        return (
            <div className="flex justify-center items-start gap-4 max-w-md mx-auto">
                <div className="flex-1 flex flex-col gap-2 w-full">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm text-center">
                        <input
                            value={teamAName}
                            onChange={e => setTeamAName(e.target.value)}
                            className="bg-transparent text-gray-400 text-xs font-bold tracking-wider mb-1 uppercase text-center w-full outline-none border-b border-transparent focus:border-gray-600 transition-colors"
                            title="Name this co-op run"
                        />
                        <p className="text-point-green text-4xl font-black">{soloScore}</p>
                        <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mt-1">words guessed</p>
                        <p className="text-gray-500 text-[10px] mt-2 leading-snug">
                            {soloFreeSkipsRemaining > 0
                                ? `${soloFreeSkipsRemaining} free skip${soloFreeSkipsRemaining === 1 ? '' : 's'} left · then −1 pt each`
                                : 'Skips cost −1 pt each'}
                        </p>
                        {teamAPlayers.length > 0 && (
                            <div className="mt-2 flex flex-wrap justify-center gap-1">
                                <span className="text-[9px] text-gray-500 uppercase tracking-tighter w-full mb-0.5">Guessers</span>
                                {teamAPlayers.map((name, i) => (
                                    <span key={i} className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-medium">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col-reverse gap-1 text-[10px] text-gray-500 font-mono text-center uppercase max-h-32 overflow-y-auto">
                        {soloWords.map((w, i) => <span key={i} className="animate-fade-in">{w}</span>)}
                    </div>
                </div>
            </div>
        );
    }

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
