import { useState } from 'react';
import type { Player } from '../types/avalon';
import { ROLE_LABELS } from '../types/avalon';
import { Eye, EyeOff, Shield, Skull } from 'lucide-react';

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
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-200">夜晚階段 · Night Phase</h2>
        <p className="text-sm text-slate-400">確認你的角色與視野</p>
      </div>

      {/* Role card */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-8 text-center backdrop-blur transition-all duration-500 ${
          revealed
            ? isGood
              ? 'border-blue-500/50 bg-blue-500/10'
              : 'border-red-500/50 bg-red-500/10'
            : 'border-slate-700 bg-slate-800/60'
        }`}
      >
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="flex flex-col items-center gap-4 mx-auto text-slate-400 hover:text-slate-200 transition"
          >
            <EyeOff size={48} className="opacity-40" />
            <span className="text-lg font-medium">點擊揭示身份</span>
            <span className="text-sm text-slate-500">Click to reveal your role</span>
          </button>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${
              isGood ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'
            }`}>
              {isGood ? <Shield size={14} /> : <Skull size={14} />}
              {isGood ? '正義陣營' : '邪惡陣營'}
            </div>
            <h3 className="text-3xl font-bold text-white">
              {ROLE_LABELS[human.role]}
            </h3>
          </div>
        )}
      </div>

      {/* Visibility info — only shown after reveal */}
      {revealed && human.visibleTo.length > 0 && (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6 backdrop-blur space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <Eye size={14} /> 你的視野 (Your Vision)
          </h3>
          <div className="grid gap-2">
            {human.visibleTo.map((targetId) => {
              const target = players[targetId];
              return (
                <div
                  key={targetId}
                  className="flex items-center justify-between rounded-xl bg-slate-700/30 px-4 py-3"
                >
                  <span className="font-medium text-slate-200">{target.name}</span>
                  <span className="text-sm text-amber-400/80 font-mono">
                    {human.visibleLabels[targetId]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All players (no roles shown except self) */}
      {revealed && (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6 backdrop-blur space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">所有玩家</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {players.map((p) => (
              <div
                key={p.id}
                className={`rounded-xl px-4 py-3 text-sm ${
                  p.id === humanIndex
                    ? isGood
                      ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                      : 'bg-red-500/15 text-red-300 border border-red-500/30'
                    : 'bg-slate-700/30 text-slate-400'
                }`}
              >
                <span className="font-medium">{p.name}</span>
                {p.id === humanIndex && (
                  <span className="block text-xs opacity-60 mt-0.5">{ROLE_LABELS[p.role]}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continue */}
      {revealed && (
        <button
          onClick={onContinue}
          className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-4 text-lg font-bold text-white shadow-xl shadow-indigo-500/20 transition hover:shadow-indigo-500/40 hover:brightness-110 active:scale-[0.98]"
        >
          確認 · Continue
        </button>
      )}
    </div>
  );
}
