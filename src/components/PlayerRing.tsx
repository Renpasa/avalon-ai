import type { Player } from '../types/avalon';
import { Crown, Check, User, Bot, Loader2, Shell, Users } from 'lucide-react';

interface Props {
  players: Player[];
  humanId: number;
  leaderId: number;
  proposedTeam: number[];
  lakeHolder: number | null;
  inspectedHistory: number[]; 
  onSelectPlayer?: (id: number) => void; 
  selectionMode?: 'toggle' | 'single' | 'none';
  disabled?: boolean;
  isLLMThinking?: string; // Player name or general message
}

export default function PlayerRing({ 
  players, 
  humanId, 
  leaderId, 
  proposedTeam, 
  lakeHolder,
  inspectedHistory,
  onSelectPlayer, 
  selectionMode = 'none',
  disabled = false,
  isLLMThinking = ''
}: Props) {
  
  const human = players.find(p => p.id === humanId);
  if (!human) return null;

  return (
    <div className="w-full h-full flex flex-col gap-3 p-4 overflow-y-auto scrollbar-hide">
      <div className="flex items-center gap-2 mb-2 px-2">
        <Users size={16} className="text-amber-700" />
        <h4 className="text-xs font-black text-amber-600 uppercase tracking-[0.3em]" style={{ fontFamily: "'Cinzel', serif" }}>
          Council of Players
        </h4>
      </div>

      <div className="flex flex-col gap-2.5">
        {players.map((p) => {
          const isHuman = p.id === humanId;
          const isLeader = p.id === leaderId;
          const inTeam = proposedTeam.includes(p.id);
          const hasLake = p.id === lakeHolder;
          const isInspected = inspectedHistory.includes(p.id);
          const thinking = isLLMThinking.includes(p.name);
          
          const visibilityHint = human.visibleLabels[p.id];
          const canBeSelected = selectionMode !== 'none' && !disabled;

          return (
            <div
              key={p.id}
              onClick={() => canBeSelected && onSelectPlayer?.(p.id)}
              className={`group flex items-center gap-4 p-3 rounded-lg border-2 transition-all duration-300
                ${inTeam ? 'border-amber-600 bg-amber-900/10 shadow-[0_0_15px_rgba(217,119,6,0.2)]' : 'border-zinc-800 bg-zinc-900/40'}
                ${canBeSelected ? 'cursor-pointer hover:border-amber-700/50 hover:bg-zinc-800/60' : ''}
                ${isHuman ? 'ring-1 ring-amber-500/20' : ''}`}
            >
              {/* Avatar Token - Compact */}
              <div className="relative shrink-0">
                {isLeader && (
                  <div className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-900 text-amber-200 shadow-lg z-30 border border-red-950">
                    <Crown size={12} fill="currentColor" />
                  </div>
                )}
                {hasLake && (
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-blue-400 shadow-md z-30 border border-zinc-700">
                    <Shell size={10} />
                  </div>
                )}
                
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black relative overflow-hidden ring-2 ring-offset-2 ring-offset-zinc-950
                  ${inTeam ? 'ring-amber-600' : 'ring-zinc-800'}
                  ${isHuman ? 'bg-zinc-800 text-amber-500' : 'bg-zinc-900 text-stone-600'}`}
                >
                   <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay" />
                   {isHuman ? <User size={24} /> : <Bot size={24} />}
                   {inTeam && (
                     <div className="absolute inset-0 bg-amber-900/30 flex items-center justify-center animate-in zoom-in duration-200">
                        <Check size={32} strokeWidth={4} className="text-amber-500 drop-shadow-md" />
                     </div>
                   )}
                   {thinking && (
                     <div className="absolute inset-0 border-2 border-indigo-500/50 rounded-full animate-pulse" />
                   )}
                </div>
              </div>

              {/* Name and Status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-black tracking-widest uppercase truncate
                    ${isHuman ? 'text-amber-500' : 'text-stone-300'}`}
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {p.name}
                  </p>
                  {isHuman && <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-600 border border-amber-900/50 font-black">YOU</span>}
                </div>
                
                <div className="flex items-center gap-2 mt-0.5">
                   {thinking ? (
                     <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-400 uppercase tracking-widest whitespace-nowrap animate-pulse">
                       <Loader2 size={10} className="animate-spin" />
                       Pondering...
                     </div>
                   ) : (
                     <p className="text-[10px] font-medium text-stone-500 uppercase tracking-widest truncate">
                       {visibilityHint || (isInspected ? '🔍 Inspected' : (isLeader ? 'The Leader' : (inTeam ? 'On Mission' : 'Waiting...')))}
                     </p>
                   )}
                </div>
              </div>

              {/* Interaction Hint */}
              {canBeSelected && (
                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                     ${inTeam ? 'border-amber-600 bg-amber-600/20' : 'border-zinc-700'}`}>
                      <div className={`w-2 h-2 rounded-full ${inTeam ? 'bg-amber-600' : 'bg-transparent'}`} />
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

