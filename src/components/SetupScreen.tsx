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
import { Users, Shield, Skull, Sparkles, Crown } from 'lucide-react';

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

  // When player count changes, prune roles that no longer fit
  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    if (humanIndex >= count) setHumanIndex(0);

    // iteratively prune until valid
    let roles = [...selectedRoles];
    const newComp = TEAM_COMPOSITION[count];
    while (true) {
      const goodCount = roles.filter((r) => ROLE_SIDE[r] === 'good').length;
      const evilCount = roles.filter((r) => ROLE_SIDE[r] === 'evil').length;
      if (goodCount <= newComp.good && evilCount <= newComp.evil) break;
      // drop last added that overflows
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

  const handleStart = () => {
    onStart({
      playerCount,
      specialRoles: selectedRoles,
      humanPlayerIndex: humanIndex,
      useLakeOfAvalon: useLake,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          ⚔ 阿瓦隆 Avalon AI
        </h1>
        <p className="text-slate-400 text-sm">邏輯博弈模擬器 · Logic Game Simulator</p>
      </div>

      {/* ── Player Count ───────────────────────────────── */}
      <section className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6 backdrop-blur space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-200">
          <Users size={18} /> 玩家人數 (Players)
        </h2>
        <div className="flex gap-2">
          {[5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              onClick={() => handlePlayerCountChange(n)}
              className={`flex-1 rounded-xl py-3 text-lg font-bold transition ${
                playerCount === n
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-700/40 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex gap-4 text-sm">
          <span className="rounded-full bg-blue-500/15 px-3 py-1 text-blue-400">
            <Shield size={12} className="inline mr-1" />
            正義 {comp.good}
          </span>
          <span className="rounded-full bg-red-500/15 px-3 py-1 text-red-400">
            <Skull size={12} className="inline mr-1" />
            邪惡 {comp.evil}
          </span>
        </div>
      </section>

      {/* ── Special Roles ──────────────────────────────── */}
      <section className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6 backdrop-blur space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-200">
          <Sparkles size={18} /> 特殊角色 (Special Roles)
        </h2>

        {/* Good */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            正義陣營 · Good ({slot.selectedGood}/{comp.good})
          </p>
          <div className="flex flex-wrap gap-2">
            {SPECIAL_GOOD_ROLES.map((role) => {
              const active = selectedRoles.includes(role);
              const disabled = !active && slot.blocked.includes(role);
              return (
                <button
                  key={role}
                  onClick={() => !disabled && toggleRole(role)}
                  disabled={disabled}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : disabled
                      ? 'border-slate-700 bg-slate-800/30 text-slate-600 cursor-not-allowed'
                      : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-blue-500/50 hover:text-blue-300'
                  }`}
                >
                  {ROLE_LABELS[role]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Evil */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
            邪惡陣營 · Evil ({slot.selectedEvil}/{comp.evil})
          </p>
          <div className="flex flex-wrap gap-2">
            {SPECIAL_EVIL_ROLES.map((role) => {
              const active = selectedRoles.includes(role);
              const disabled = !active && slot.blocked.includes(role);
              return (
                <button
                  key={role}
                  onClick={() => !disabled && toggleRole(role)}
                  disabled={disabled}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'border-red-500 bg-red-500/20 text-red-300'
                      : disabled
                      ? 'border-slate-700 bg-slate-800/30 text-slate-600 cursor-not-allowed'
                      : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-red-500/50 hover:text-red-300'
                  }`}
                >
                  {ROLE_LABELS[role]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slot summary */}
        <div className="flex gap-4 text-xs text-slate-500">
          <span>剩餘忠臣: {slot.remainingGood}</span>
          <span>剩餘爪牙: {slot.remainingEvil}</span>
        </div>
      </section>

      {/* ── Your Seat ──────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6 backdrop-blur space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-200">
          <Crown size={18} /> 你的座位 (Your Seat)
        </h2>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: playerCount }, (_, i) => (
            <button
              key={i}
              onClick={() => setHumanIndex(i)}
              className={`w-12 h-12 rounded-xl text-sm font-bold transition ${
                humanIndex === i
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-slate-700/40 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              P{i}
            </button>
          ))}
        </div>
      </section>

      {/* ── Lake of Avalon Toggle ──────────────────────── */}
      <section className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6 backdrop-blur">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-slate-200 font-medium">湖中女神 (Lady of the Lake)</span>
          <div
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
              useLake ? 'bg-indigo-600' : 'bg-slate-600'
            }`}
            onClick={() => setUseLake(!useLake)}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                useLake ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </div>
        </label>
      </section>

      {/* ── Start button ───────────────────────────────── */}
      <button
        onClick={handleStart}
        className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-4 text-lg font-bold text-white shadow-xl shadow-indigo-500/20 transition hover:shadow-indigo-500/40 hover:brightness-110 active:scale-[0.98]"
      >
        開始遊戲 · Start Game
      </button>
    </div>
  );
}
