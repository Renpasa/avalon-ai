import { useState, useMemo } from 'react';
import {
  ROLE_LABELS,
  ROLE_SIDE,
  SPECIAL_GOOD_ROLES,
  SPECIAL_EVIL_ROLES,
  TEAM_COMPOSITION,
  type GameConfig,
  type Role,
} from '../types/avalon';
import { getSlotStatus } from '../engine/setup';
import { Users, Shield, Skull, Sparkles, Crown, Swords, Ghost, Check, X } from 'lucide-react';

interface Props {
  onStart: (config: GameConfig) => void;
}

export default function SetupScreen({ onStart }: Props) {
  const [playerCount, setPlayerCount] = useState(5);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(['merlin', 'assassin']);
  const [humanIndex, setHumanIndex] = useState(0);
  const [useLake, setUseLake] = useState(false);

  const slot = useMemo(
    () => getSlotStatus(playerCount, selectedRoles),
    [playerCount, selectedRoles]
  );

  const comp = TEAM_COMPOSITION[playerCount];

  const toggleRole = (role: Role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles((prev) => prev.filter((r) => r !== role));
    } else if (!slot.blocked.includes(role)) {
      setSelectedRoles((prev) => [...prev, role]);
    }
  };

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    if (humanIndex >= count) setHumanIndex(0);

    let roles = [...selectedRoles];
    const newComp = TEAM_COMPOSITION[count];
    while (true) {
      const goodCount = roles.filter((r) => ROLE_SIDE[r] === 'good').length;
      const evilCount = roles.filter((r) => ROLE_SIDE[r] === 'evil').length;
      if (goodCount <= newComp.good && evilCount <= newComp.evil) break;
      if (goodCount > newComp.good) {
        const idx = roles.findLastIndex((r) => ROLE_SIDE[r] === 'good');
        if (idx >= 0) roles.splice(idx, 1);
      }
      if (evilCount > newComp.evil) {
        const idx = roles.findLastIndex((r) => ROLE_SIDE[r] === 'evil');
        if (idx >= 0) roles.splice(idx, 1);
      }
    }
    setSelectedRoles(roles);
  };

  const parchmentPanel = "bg-gradient-to-br from-[#f4ecd8] to-[#e0c9a3] text-[#3a2718] border-4 border-[#4a3525] border-t-[#7b5c43] border-l-[#7b5c43] rounded-sm shadow-[0_0_20px_rgba(212,175,55,0.4),inset_0_0_60px_rgba(60,40,20,0.6)] overflow-hidden relative";
  const unselectedBtn = "bg-gradient-to-b from-[#dcd0b3] to-[#c4b18c] border border-t-[#e8dcb8] border-l-[#e8dcb8] border-r-[#8c7355] border-b-[#8c7355] border-b-4 border-r-2 text-[#5c4033] shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] hover:brightness-110 active:border-b-0 active:border-r-0 active:translate-y-1";
  const selectedBtn = "bg-gradient-to-b from-[#990000] to-[#550000] border border-[#ff4444]/20 border-r-[#220000] border-b-[#220000] border-b-4 border-r-2 text-[#f4ecd8] shadow-[inset_0_2px_4px_rgba(255,100,100,0.3)]";
  const letterpress = "text-[#3a2718] [text-shadow:0_1px_1px_rgba(255,255,255,0.5)]";

  return (
    <div className="mx-auto max-w-4xl space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 font-serif">
      {/* ── Hero Section ─────────────────────────────────────── */}
      <div className="text-center space-y-6 pt-10">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-[#8b0000]/80 border border-[#4a0000] mb-4 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
          <Swords className="text-[#f4ecd8]" size={32} />
        </div>
        <h1 className="text-6xl md:text-7xl font-black tracking-tighter uppercase italic drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]">
          <span className="bg-gradient-to-b from-amber-200 via-[#e0c9a3] to-amber-700 bg-clip-text text-transparent" style={{ fontFamily: "'Cinzel', serif" }}>
            AVALON
          </span>
        </h1>
        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-[#8b0000] to-transparent mx-auto opacity-70" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
          {/* ── Player Count ───────────────────────────────── */}
          <section className={`${parchmentPanel} p-8 space-y-6 group`}>
            {/* Inner noise overlay just for the parchment */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay" />
            
            <h2 className={`relative z-10 flex items-center gap-3 text-xl font-bold ${letterpress}`}>
              <Users size={24} className="text-[#8b0000]" /> Number of Souls
            </h2>
            <div className="relative z-10 grid grid-cols-3 gap-3">
              {[5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => handlePlayerCountChange(n)}
                  className={`rounded-sm py-4 text-xl font-black transition-all duration-300 transform active:scale-95
                    ${playerCount === n ? selectedBtn : unselectedBtn}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="relative z-10 flex gap-4 p-4 rounded-sm border border-[#a89070] justify-center bg-[#e0c9a3]/50">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <Shield size={18} /> Loyal {comp.good}
              </div>
              <div className="w-px h-4 bg-[#a89070]" />
              <div className="flex items-center gap-2 text-red-900 font-bold">
                <Skull size={18} /> Minions {comp.evil}
              </div>
            </div>
          </section>

          {/* ── Your Seat ──────────────────────────────────── */}
          <section className={`${parchmentPanel} p-8 space-y-6`}>
            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay" />
            
            <h2 className={`relative z-10 flex items-center gap-3 text-xl font-bold ${letterpress}`}>
              <Crown size={24} className="text-[#8b0000]" /> Claim Your Seat
            </h2>
            <div className="relative z-10 grid grid-cols-5 gap-3">
              {Array.from({ length: playerCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setHumanIndex(i)}
                  className={`aspect-square rounded-sm text-lg font-black transition-all duration-300
                    ${humanIndex === i ? `${selectedBtn} scale-110 z-10` : unselectedBtn}`}
                >
                  {i}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* ── Special Roles ──────────────────────────────── */}
          <section className={`${parchmentPanel} p-8 space-y-8`}>
            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay" />
            
            <h2 className={`relative z-10 flex items-center gap-3 text-xl font-bold ${letterpress}`}>
              <Sparkles size={24} className="text-[#8b0000]" /> Legends & Myths
            </h2>

            <div className="relative z-10 space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-blue-900 mb-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-900" />
                Champions of the Light ({slot.selectedGood}/{comp.good})
              </p>
              <div className="grid grid-cols-2 gap-3">
                {SPECIAL_GOOD_ROLES.map((role) => {
                  const active = selectedRoles.includes(role);
                  const disabled = !active && slot.blocked.includes(role);
                  return (
                    <button
                      key={role}
                      onClick={() => !disabled && toggleRole(role)}
                      disabled={disabled}
                      className={`px-4 py-3 rounded-sm text-sm font-bold transition-all duration-300 text-left relative overflow-hidden group
                        ${active 
                          ? selectedBtn 
                          : disabled 
                          ? 'bg-[#d4c3a3]/50 border border-[#a89070]/50 text-[#5c4033]/50 cursor-not-allowed'
                          : unselectedBtn}`}
                    >
                      {ROLE_LABELS[role]}
                      {active && <div className="absolute top-1 right-2 text-[#f4ecd8] opacity-50"><Check size={14} /></div>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative z-10 space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-red-900 mb-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-900" />
                Agents of Darkness ({slot.selectedEvil}/{comp.evil})
              </p>
              <div className="grid grid-cols-2 gap-3">
                {SPECIAL_EVIL_ROLES.map((role) => {
                  const active = selectedRoles.includes(role);
                  const disabled = !active && slot.blocked.includes(role);
                  return (
                    <button
                      key={role}
                      onClick={() => !disabled && toggleRole(role)}
                      disabled={disabled}
                      className={`px-4 py-3 rounded-sm text-sm font-bold transition-all duration-300 text-left relative overflow-hidden group
                        ${active 
                          ? selectedBtn 
                          : disabled 
                          ? 'bg-[#d4c3a3]/50 border border-[#a89070]/50 text-[#5c4033]/50 cursor-not-allowed'
                          : unselectedBtn}`}
                    >
                      {ROLE_LABELS[role]}
                      {active && <div className="absolute top-1 right-2 text-[#f4ecd8] opacity-50"><Check size={14} /></div>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative z-10 p-4 rounded-sm border border-[#a89070] bg-[#e0c9a3]/50 space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-[#5c4033]">Remaining Commoners:</span>
                <span className="text-blue-900 font-black">{slot.remainingGood}</span>
              </div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-[#5c4033]">Remaining Thugs:</span>
                <span className="text-red-900 font-black">{slot.remainingEvil}</span>
              </div>
            </div>
          </section>

          {/* ── Lake of Avalon Toggle ──────────────────────── */}
          <button 
            onClick={() => setUseLake(!useLake)}
            className={`w-full ${parchmentPanel} p-6 flex items-center justify-between group transition-all duration-500`}
          >
            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay" />
            
            <div className="relative z-10 flex items-center gap-4">
              <div className={`p-3 rounded-sm transition-colors border-2 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] ${useLake ? 'border-[#220000] border-b-4 border-r-2 bg-gradient-to-b from-[#990000] to-[#550000] text-[#f4ecd8]' : 'bg-gradient-to-b from-[#dcd0b3] to-[#c4b18c] border-b-4 border-r-2 border-[#8c7355] text-[#5c4033]'}`}>
                <Ghost size={20} />
              </div>
              <div className="text-left">
                <p className={`font-bold transition-colors ${letterpress} ${useLake ? 'text-[#8b0000]' : 'text-[#3a2718]'}`}>Lady of the Lake</p>
                <p className="text-xs text-[#5c4033] opacity-80 font-medium">Add allegiance inspection tool</p>
              </div>
            </div>
            
            {/* Retro Checkbox */}
            <div className={`relative z-10 w-8 h-8 rounded-sm border-2 border-[#5c4033] flex items-center justify-center transition-colors ${useLake ? 'bg-[#f4ecd8]' : 'bg-[#d4c3a3]'}`}>
              {useLake && <X size={20} strokeWidth={4} className="text-[#8b0000]" />}
            </div>
          </button>
        </div>
      </div>

      <div className="fixed bottom-10 left-0 right-0 px-4 flex justify-center z-50 pointer-events-none">
        <button
          onClick={() => onStart({ playerCount, specialRoles: selectedRoles, humanPlayerIndex: humanIndex, useLakeOfAvalon: useLake })}
          className="pointer-events-auto w-full max-w-md group px-8 py-4 text-xl tracking-widest uppercase font-black transition-all duration-300
                     bg-gradient-to-b from-[#3a3a3a] to-[#111111] border-[#000000] border-b-8 border-r-4 border-t-2 border-t-[#666666] border-l-2 border-l-[#666666]
                     text-amber-500 shadow-[0_0_30px_rgba(212,175,55,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] rounded-md
                     hover:brightness-125 focus:scale-95 focus:border-b-2 focus:border-r-2 focus:translate-y-2"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <span className="flex items-center justify-center gap-3">
            Embark on Quest
            <Swords className="group-hover:rotate-12 transition-transform" />
          </span>
        </button>
      </div>
    </div>
  );
}
