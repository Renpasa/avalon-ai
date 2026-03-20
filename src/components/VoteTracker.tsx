import { XCircle, AlertTriangle, ShieldX } from 'lucide-react';

interface Props {
  rejectCount: number; // 0 to 5
}

export default function VoteTracker({ rejectCount }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 group">
      <div className="flex items-center gap-2">
        <ShieldX size={14} className="text-slate-600 group-hover:text-red-500 transition-colors" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
          提案否決計數 <span className="text-slate-700">REJECT TRACKER</span>
        </h3>
      </div>
      
      <div className="relative p-2 rounded-2xl bg-slate-950/20 backdrop-blur-sm border border-white/5 shadow-inner">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((num) => {
            const isFilled = num <= rejectCount;
            const isCritical = num === 5;
            const isNext = num === rejectCount + 1;

            return (
              <div
                key={num}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all duration-500 overflow-hidden
                  ${isFilled
                    ? isCritical
                      ? 'bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse scale-110 z-10'
                      : 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                    : isNext 
                      ? 'bg-slate-900 border-slate-700 text-slate-500 animate-in fade-in' 
                      : 'bg-slate-900 border-slate-800 text-slate-700'
                  }`}
              >
                {/* Visual feedback for filled */}
                {isFilled && (
                  <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
                )}
                
                <XCircle size={20} className={`transition-all duration-500 
                  ${isFilled ? 'scale-110 opacity-100 rotate-12' : 'scale-90 opacity-20'}
                  ${isCritical ? 'animate-bounce' : ''}`} 
                />
                
                {/* Danger indicator on 5 */}
                {isCritical && !isFilled && (
                   <div className="absolute inset-0 border border-red-500/50 rounded-xl animate-ping opacity-20" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="min-h-[16px]">
        {rejectCount === 4 ? (
          <div className="flex items-center gap-1 text-[10px] font-black italic text-red-500 animate-pulse tracking-widest uppercase">
            <AlertTriangle size={12} /> 危險！下次否決將直接終結正義
          </div>
        ) : (
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest opacity-50">
            5 次否決後，由邪惡陣營控制局面獲勝。
          </p>
        )}
      </div>
    </div>
  );
}
