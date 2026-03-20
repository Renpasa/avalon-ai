import { useState, useEffect } from 'react';
import type { Player } from '../types/avalon';
import { Shield, Skull } from 'lucide-react';

interface Props {
  player: Player;
  onPlayCard: (card: 'success' | 'fail') => void;
  missionCardsPlayed: number; // how many cards have been played so far
  totalRequired: number;
}

export default function MissionPanel({ player, onPlayCard, missionCardsPlayed, totalRequired }: Props) {
  const [played, setPlayed] = useState(false);

  // If this component mounts for a new round/player, reset
  useEffect(() => {
    setPlayed(false);
  }, [player.id, totalRequired]);

  const handlePlay = (card: 'success' | 'fail') => {
    setPlayed(true);
    onPlayCard(card);
  };

  const isEvil = player.side === 'evil';

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-900/10 p-4 backdrop-blur space-y-4 w-full">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold text-blue-400 font-serif uppercase tracking-widest">
          任務執行 <span className="text-blue-500/50 text-xs italic">Mission</span>
        </h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          請秘密打出你的任務卡。
        </p>
      </div>

      {!played ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handlePlay('success')}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/5 py-4 text-blue-400 transition hover:bg-blue-500 hover:text-slate-950 active:scale-95 group/mbtn"
          >
            <Shield size={24} className="group-hover/mbtn:scale-110 transition-transform" />
            <span className="text-xs font-black tracking-widest">成功 SUCCESS</span>
          </button>

          <button
            onClick={() => handlePlay('fail')}
            disabled={!isEvil}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border py-4 transition ${
              isEvil
                ? 'border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-slate-950 active:scale-95 group/mbtn'
                : 'border-slate-800/50 bg-slate-900/50 text-slate-700 cursor-not-allowed opacity-50'
            }`}
          >
            <Skull size={24} className="group-hover/mbtn:scale-110 transition-transform" />
            <span className="text-xs font-black tracking-widest">失敗 FAIL</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2 py-4">
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-black uppercase tracking-widest">
            <Shield size={16} />
            <span>已出牌！等待隊員...</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
             {missionCardsPlayed} / {totalRequired}
          </div>
        </div>
      )}
    </div>
  );
}
