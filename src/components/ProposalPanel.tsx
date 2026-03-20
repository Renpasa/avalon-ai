import { useState, useEffect } from 'react';
import type { Player } from '../types/avalon';
import { Target, Users, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface Props {
  leader: Player;
  isHumanLeader: boolean;
  requiredSize: number;
  currentTeam: number[];
  onSubmit: (teamIds: number[]) => void;
}

export default function ProposalPanel({ leader, isHumanLeader, requiredSize, currentTeam, onSubmit }: Props) {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSubmitted(false);
  }, [leader.id]);

  const handleSubmit = () => {
    if (currentTeam.length === requiredSize) {
      setSubmitted(true);
      onSubmit(currentTeam);
    }
  };

  const isComplete = currentTeam.length === requiredSize;

  return (
    <div className="relative group overflow-hidden rounded-2xl medieval-panel p-4 border-iron shadow-2xl animate-in zoom-in-95 duration-500">
      <div className="relative flex flex-col items-center text-center space-y-4">
        {/* Phase Header */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border shadow-sm 
            ${isHumanLeader ? 'bg-indigo-900/50 border-indigo-500/30 text-indigo-400' : 'bg-slate-900/50 border-slate-700 text-slate-500'}`}>
            <Target size={20} />
          </div>
          <h3 className="text-lg font-black tracking-tight uppercase italic text-slate-100">
            出隊提案 <span className="text-indigo-500/80 text-sm">Proposal</span>
          </h3>
        </div>
        
        {isHumanLeader ? (
          <div className="space-y-4 w-full animate-in fade-in duration-700">
            <div className="space-y-1">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                 你是隊長！請從圓桌選擇 <span className="text-amber-500 font-black px-1 text-sm">{requiredSize}</span> 名隊員。
               </p>
            </div>

            <div className="flex items-center justify-center py-2">
               <div className="relative">
                  {isComplete && <div className="absolute -inset-1 bg-emerald-500/20 rounded-full animate-ping" />}
                  <div className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-500
                    ${isComplete ? 'bg-emerald-500/10 border-emerald-500' : 'bg-slate-900 border-slate-700'}`}>
                    <Users size={16} className={isComplete ? 'text-emerald-400' : 'text-slate-600'} />
                    <span className={`text-sm font-black ${isComplete ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {currentTeam.length}/{requiredSize}
                    </span>
                  </div>
               </div>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={!isComplete || submitted}
              className={`w-full py-3 rounded-xl font-black tracking-widest transition-all duration-300 relative overflow-hidden group/btn border
                ${isComplete && !submitted
                  ? 'btn-primary text-xs'
                  : 'bg-slate-800/50 border-slate-700 text-slate-600 cursor-not-allowed text-[10px]'}`}
            >
              {isComplete ? (
                <span className="flex items-center justify-center gap-2">
                  確認執行任務 <CheckCircle2 size={14} />
                </span>
              ) : (
                '等待選擇隊員...'
              )}
            </button>
          </div>
        ) : (
          <div className="py-4 space-y-4 w-full animate-in fade-in duration-700">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/10 blur-md animate-pulse rounded-full" />
                <Loader2 size={32} className="text-amber-600 animate-spin relative" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-300">
                  隊長 <span className="text-amber-500 px-1 font-black">{leader.name}</span> 正在決策...
                </p>
                <div className="flex items-center justify-center gap-1">
                   <Sparkles size={8} className="text-amber-700" />
                   <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">AI DECIDING MISSION ROSTER</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
