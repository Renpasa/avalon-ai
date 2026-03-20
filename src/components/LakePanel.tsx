import { useState } from 'react';
import type { Player, Side } from '../types/avalon';
import { Sparkles, Shield, Skull } from 'lucide-react';

interface Props {
  human: Player;
  players: Player[];
  lakeHistory: number[];
  onSubmit: (targetId: number) => void;
  resultAllegiance?: Side; // if set, we show the result
}

export default function LakePanel({ human, players, lakeHistory, onSubmit, resultAllegiance }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  
  // Exclude self and previously inspected
  const validTargets = players.filter(p => p.id !== human.id && !lakeHistory.includes(p.id));

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/40 p-6 backdrop-blur space-y-6">
      <div className="text-center space-y-2">
        <h3 className="flex items-center justify-center gap-2 text-xl font-bold text-cyan-300">
          <Sparkles size={24} />
          湖中女神 (Lake of Avalon)
        </h3>
        
        {!resultAllegiance ? (
          <p className="text-sm text-cyan-100">
            你目前持有湖中女神，請選擇一名玩家查驗其陣營，查驗後將女神交給他。
          </p>
        ) : (
          <p className="text-sm text-cyan-100">查驗結果如下 (僅你可見)</p>
        )}
      </div>

      {!resultAllegiance ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {validTargets.map(target => (
              <button
                key={target.id}
                onClick={() => setSelected(target.id)}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                  selected === target.id
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-800/60 text-slate-300 border border-slate-700 hover:border-cyan-500/50'
                }`}
              >
                {target.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => selected !== null && onSubmit(selected)}
            disabled={selected === null}
            className={`w-full rounded-xl py-3 font-bold transition ${
              selected !== null
                ? 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
            }`}
          >
            確認查驗
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 space-y-6 animate-in zoom-in duration-300">
          <div className={`flex flex-col items-center justify-center gap-4 rounded-2xl border p-8 ${
            resultAllegiance === 'good' 
              ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
              : 'border-red-500/50 bg-red-500/10 text-red-400'
          }`}>
            {resultAllegiance === 'good' ? <Shield size={64} /> : <Skull size={64} />}
            <span className="text-2xl font-bold tracking-widest uppercase">
              {resultAllegiance === 'good' ? '正義 (Good)' : '邪惡 (Evil)'}
            </span>
          </div>
          
          <button
            onClick={() => onSubmit(-1)} // signal to close via a dummy id when acknowledging
            className="w-full rounded-xl bg-slate-700 hover:bg-slate-600 text-white py-3 font-bold transition"
          >
            隱藏結果並繼續
          </button>
        </div>
      )}
    </div>
  );
}
