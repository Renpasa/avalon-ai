import { useState } from 'react';
import type { Player } from '../types/avalon';
import { Skull, Target } from 'lucide-react';

interface Props {
  assassin: Player;
  isHuman: boolean;
  players: Player[];
  onSubmit: (targetId: number) => void;
}

export default function AssassinationPanel({ assassin, isHuman, players, onSubmit }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  // Targets are everyone except the assassin and known evils (Oberon is unknown to assassin though, 
  // but for simplicity, let's just let the assassin pick anyone else).
  const validTargets = players.filter(p => p.id !== assassin.id);

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-6 backdrop-blur space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h3 className="flex items-center justify-center gap-2 text-xl font-bold text-red-500">
          <Skull size={24} />
          刺殺階段 (Assassination)
        </h3>
        
        {isHuman ? (
          <p className="text-sm text-red-200">
            正義陣營即將獲勝！你是<strong>刺客</strong>，請指認出誰是「梅林」。若刺殺正確，邪惡陣營將反敗為勝！
          </p>
        ) : (
          <p className="text-sm text-red-200">
            正義陣營取得了 3 次任務成功！等待刺客 <strong>{assassin.name}</strong> 進行最後的刺殺...
          </p>
        )}
      </div>

      {isHuman ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {validTargets.map(target => (
              <button
                key={target.id}
                onClick={() => setSelected(target.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${
                  selected === target.id
                    ? 'bg-red-600/20 border-red-500 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)] scale-105 relative'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-red-500/50 hover:bg-slate-800'
                }`}
              >
                {selected === target.id && (
                  <Target size={32} className="absolute text-red-500/30 w-full h-full p-2" />
                )}
                <span className="font-medium z-10">{target.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => selected !== null && onSubmit(selected)}
            disabled={selected === null}
            className={`w-full rounded-xl py-3 font-bold transition ${
              selected !== null
                ? 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-500/30'
                : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
            }`}
          >
            確認刺殺
          </button>
        </div>
      ) : (
        <div className="flex justify-center py-6">
          <Target className="animate-spin text-red-500/50" size={48} />
        </div>
      )}
    </div>
  );
}
