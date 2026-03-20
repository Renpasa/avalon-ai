import { useState } from 'react';
import type { GameConfig, Player } from './types/avalon';
import { assignRoles } from './engine/setup';
import ApiKeyInput from './components/ApiKeyInput';
import SetupScreen from './components/SetupScreen';
import RoleReveal from './components/RoleReveal';
import GameBoard from './components/GameBoard';

type Phase = 'setup' | 'reveal' | 'game';

function App() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [config, setConfig] = useState<GameConfig | null>(null);

  const handleStart = (cfg: GameConfig) => {
    const assigned = assignRoles(cfg);
    setConfig(cfg);
    setPlayers(assigned);
    setPhase('reveal');
  };

  const handleContinue = () => {
    setPhase('game');
  };

  const epicBg = "/assets/epic_bg.png";

  return (
    <div className="min-h-screen bg-zinc-950 text-stone-300 relative overflow-x-hidden">
      {/* Dynamic Background */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ 
          backgroundImage: `url(${epicBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Dark Overlay as requested */}
      <div className="fixed inset-0 z-0 bg-black/50 pointer-events-none" />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-10 min-h-screen flex flex-col items-center">
        {/* content wrapper */}
        <div className="w-full">
          {phase === 'setup' && <SetupScreen onStart={handleStart} />}

          {phase === 'reveal' && config && (
            <RoleReveal
              players={players}
              humanIndex={config.humanPlayerIndex}
              onContinue={handleContinue}
            />
          )}

          {phase === 'game' && config && (
            <div className="w-full animate-in fade-in duration-1000">
              <GameBoard players={players} config={config} onRestart={() => setPhase('setup')} />
            </div>
          )}
        </div>

        {/* API Key — Moved to the bottom in setup phase */}
        {phase === 'setup' && (
          <div className="w-full max-w-4xl mt-12 animate-in slide-in-from-bottom-4 duration-1000">
            <div className="medieval-panel p-6 border-iron">
               <ApiKeyInput />
            </div>
          </div>
        )}

        {/* Subtle Footer */}
        <footer className="mt-auto pt-20 pb-10 opacity-20 text-[10px] font-black tracking-[0.5em] uppercase text-center w-full">
          Camelot AI Engine v2.0 • Eternal Shadow vs Sacred Light
        </footer>
      </main>

      {/* Global Grain/Noise/Parchment Overlay for texture as requested */}
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay z-50" />
      <div className="fixed inset-0 pointer-events-none bg-[#f4ecd8] mix-blend-multiply opacity-30 z-40" />
    </div>
  );
}

export default App;
