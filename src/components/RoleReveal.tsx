import { useState } from 'react';
import type { Player } from '../types/avalon';
import { ROLE_LABELS } from '../types/avalon';
import { Eye, EyeOff, Shield, Skull, ArrowRight } from 'lucide-react';
import CharacterCard from './CharacterCard';

interface Props {
  players: Player[];
  humanIndex: number;
  onContinue: () => void;
}

export default function RoleReveal({ players, humanIndex, onContinue }: Props) {
  const [revealed, setRevealed] = useState(false);

  const human = players[humanIndex];
  const isGood = human.side === 'good';

  return (
    <div className="mx-auto max-w-4xl space-y-12 py-10 animate-in fade-in duration-700">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-black tracking-widest text-slate-100 uppercase italic">
          夜晚階段 <span className="text-amber-500">Night Phase</span>
        </h2>
        <p className="text-slate-500 font-medium tracking-wider">確認你的身份與潛伏的勢力</p>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-slate-700 to-transparent mx-auto" />
      </div>

      <div className="flex flex-col md:flex-row gap-10 items-center justify-center">
        {/* Main Role Card Container */}
        <div className="flex flex-col items-center space-y-8">
          <div className="relative">
            <CharacterCard
              role={human.role}
              side={human.side}
              revealed={revealed}
              onClick={() => setRevealed(true)}
            />
          </div>

          {!revealed && (
            <div className="text-center animate-pulse">
              <p className="text-amber-500 font-bold text-sm tracking-widest uppercase">點擊牌面揭示身份</p>
              <EyeOff className="mx-auto mt-2 text-amber-600/50" size={24} />
            </div>
          )}
        </div>

        {/* Vision & Info Panel */}
        {revealed && (
          <div className="flex-1 w-full max-w-md space-y-6 animate-in slide-in-from-right-8 fade-in duration-1000">
            <div className="medieval-panel p-6 border-iron">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">你的陣營</p>
                  <div className={`flex items-center gap-2 text-xl font-black ${isGood ? 'text-blue-400' : 'text-red-500'}`}>
                    {isGood ? <Shield size={20} /> : <Skull size={20} />}
                    {isGood ? '正義 (GOOD)' : '邪惡 (EVIL)'}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/5">
                  <span className="text-lg font-black text-amber-500">{humanIndex}</span>
                </div>
              </div>

              {/* Visibility List */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                  <Eye size={14} className="text-amber-500" /> 你的視野資訊
                </h3>

                {human.visibleTo.length > 0 ? (
                  <div className="grid gap-3">
                    {human.visibleTo.map((targetId) => {
                      const target = players[targetId];
                      return (
                        <div key={targetId} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-white/5 group hover:border-amber-500/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                              {targetId}
                            </div>
                            <span className="font-bold text-slate-200">{target.name}</span>
                          </div>
                          <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-black uppercase tracking-tighter">
                            {human.visibleLabels[targetId]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 rounded-3xl border-2 border-dashed border-slate-800 text-center">
                    <p className="text-slate-600 font-medium italic italic">你在黑夜中一無所獲...只能依靠直覺與推理。</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={onContinue}
              className="w-full btn-primary group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              <span className="flex items-center justify-center gap-3">
                進入遊戲
                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Background reveal list */}
      {revealed && (
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 opacity-30 px-4">
          {players.map(p => (
            <div key={p.id} className={`p-2 rounded-lg text-center text-[10px] font-bold border ${p.id === humanIndex ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800 bg-slate-900/50'}`}>
              {p.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
