import { useState, useEffect } from 'react';
import type { Player } from '../types/avalon';
import { ThumbsUp, ThumbsDown, Vote, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  players: Player[];
  humanId: number;
  proposedTeam: number[];
  votes: Record<number, boolean>;
  onSubmitVote: (approve: boolean) => void;
}

export default function VotingPanel({ players, humanId, proposedTeam, votes, onSubmitVote }: Props) {
  const [hasVoted, setHasVoted] = useState(false);
  const totalVotes = Object.keys(votes).length;
  const isComplete = totalVotes === players.length;

  useEffect(() => {
    if (totalVotes === 0) setHasVoted(false);
  }, [totalVotes]);

  const handleVote = (approve: boolean) => {
    setHasVoted(true);
    onSubmitVote(approve);
  };

  const human = players.find(p => p.id === humanId);
  if (!human) return null;

  return (
    <div className="relative group overflow-hidden rounded-2xl medieval-panel p-4 border-iron shadow-2xl animate-in zoom-in-95 duration-500">
      <div className="relative flex flex-col items-center text-center space-y-4">
        {/* Phase Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-900/50 border border-purple-500/30 text-purple-400">
            <Vote size={20} />
          </div>
          <h3 className="text-lg font-black tracking-tight uppercase italic text-slate-100">
            出隊投票 <span className="text-purple-500/80 text-sm">Voting</span>
          </h3>
        </div>

        <div className="space-y-1">
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
             正在審查隊伍提案。你是否信任此名單？
           </p>
           <div className="flex flex-wrap justify-center gap-1.5 mt-1">
             {proposedTeam.map(id => {
               const p = players.find(x => x.id === id);
               return (
                 <span key={id} className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-tighter border border-indigo-500/20">
                   {p?.name}
                 </span>
               )
             })}
           </div>
        </div>

        {!hasVoted && !isComplete ? (
          <div className="grid grid-cols-2 gap-3 w-full pt-2 animate-in fade-in duration-700">
            <button
              onClick={() => handleVote(true)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-black tracking-widest transition-all duration-300 hover:bg-emerald-500 hover:text-slate-950 active:scale-95 group/vbox"
            >
              <ThumbsUp size={16} />
              贊成
            </button>
            
            <button
              onClick={() => handleVote(false)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-rose-500 text-xs font-black tracking-widest transition-all duration-300 hover:bg-rose-500 hover:text-slate-950 active:scale-95 group/vbox"
            >
              <ThumbsDown size={16} />
              反對
            </button>
          </div>
        ) : (
          <div className="w-full space-y-4 animate-in fade-in duration-700">
            {/* Progress / Status */}
            <div className="space-y-2">
               <div className="flex items-center justify-between">
                  {!isComplete ? (
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-purple-400 uppercase tracking-widest">
                       <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                       等待投票中...
                    </div>
                  ) : <div />}
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    進度: <span className="text-slate-300">{totalVotes} / {players.length}</span>
                  </div>
               </div>
               <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-1000" 
                    style={{ width: `${(totalVotes / players.length) * 100}%` }} 
                  />
               </div>
            </div>

            {/* Results Revealed only when done */}
            {isComplete && (
               <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 space-y-3 pt-4 animate-in slide-in-from-bottom-2">
                <h4 className="flex items-center justify-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                  <Vote size={10} /> 投票明細
                </h4>
                <div className="grid grid-cols-2 gap-3 items-start">
                  {players.map(p => {
                    const vote = votes[p.id];
                    return (
                      <div key={p.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-500 ${vote ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                        <span className="text-[10px] font-black uppercase truncate max-w-[60%]">{p.name}</span>
                        {vote ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
