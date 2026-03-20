import { Shield, Skull, Sword, Sparkles } from 'lucide-react';
import { MISSION_SIZES, requiresTwoFails } from '../types/game';
import type { MissionResult } from '../types/game';

interface Props {
  playerCount: number;
  currentRound: number; // 0-4
  results: MissionResult[]; // length 5
}

export default function MissionTracker({ playerCount, currentRound, results }: Props) {
  const sizes = MISSION_SIZES[playerCount];
  if (!sizes) return null;

  return (
    <div className="flex flex-col items-center gap-4 group">
      <div className="flex items-center gap-2">
        <Sword size={14} className="text-slate-600 group-hover:text-amber-500 transition-colors" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
          聖杯任務進度 <span className="text-slate-700">QUEST PROGRESS</span>
        </h3>
      </div>
      
      <div className="flex items-center gap-5 p-2 rounded-[30px] bg-slate-950/20">
        {sizes.map((size, index) => {
          const res = results[index];
          const isCurrent = currentRound === index;
          const isUpcoming = index > currentRound;
          const isFinished = res !== 'pending';
          const needsTwo = requiresTwoFails(playerCount, index);

          // Advanced circle styling
          let circleClass = 'border-2 transition-all duration-700 w-16 h-16 flex items-center justify-center rounded-2xl relative overflow-hidden';
          let iconColor = 'text-slate-600';
          
          if (res === 'success') {
            circleClass += ' bg-blue-600/10 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.25)]';
            iconColor = 'text-blue-400';
          } else if (res === 'fail') {
            circleClass += ' bg-red-600/10 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)]';
            iconColor = 'text-red-500';
          } else if (isCurrent) {
            circleClass += ' bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)] scale-110 z-10';
            iconColor = 'text-amber-500';
          } else {
            circleClass += ' bg-slate-900 border-slate-800 text-slate-500 opacity-40';
          }

          return (
            <div key={index} className="flex flex-col items-center gap-3">
              <div className={circleClass}>
                {/* Visual effects for finished states */}
                {isFinished && (
                   <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
                )}
                
                {/* Icons */}
                {res === 'success' ? (
                  <Shield size={28} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                ) : res === 'fail' ? (
                  <Skull size={28} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                ) : isCurrent ? (
                  <div className="flex flex-col items-center gap-0">
                     <span className="text-2xl font-black italic tracking-tighter leading-none">{size}</span>
                     <Sparkles size={10} className="animate-pulse" />
                  </div>
                ) : (
                  <span className="text-xl font-black opacity-30">{size}</span>
                )}
                
                {/* 2-fail warning marker */}
                {needsTwo && !isFinished && (
                  <div className="absolute top-1 right-1 h-4 w-4 rounded-md bg-red-500 flex items-center justify-center text-[8px] font-black text-white shadow-lg border border-red-400 animate-pulse">
                    2!
                  </div>
                )}

                {/* Shimmer on current */}
                {isCurrent && (
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                )}
              </div>
              
              <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border
                ${isCurrent ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-slate-950 text-slate-600 border-white/5 opacity-50'}`}>
                R{index + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
