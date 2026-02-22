export default function ScoreBoard({ teamAScore, teamBScore, teamAWords, teamBWords }) {
    return (
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
    );
}