import { useState } from 'react';
import type { GameConfig, Player } from './types/avalon';
import { assignRoles } from './engine/setup';
import ApiKeyInput from './components/ApiKeyInput';
import SetupScreen from './components/SetupScreen';
import RoleReveal from './components/RoleReveal';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {/* API Key — always accessible at top */}
        {phase === 'setup' && (
          <div className="mb-10">
            <ApiKeyInput />
          </div>
        )}

        {phase === 'setup' && <SetupScreen onStart={handleStart} />}

        {phase === 'reveal' && config && (
          <RoleReveal
            players={players}
            humanIndex={config.humanPlayerIndex}
            onContinue={handleContinue}
          />
        )}

        {phase === 'game' && (
          <div className="text-center space-y-4 py-20">
            <h2 className="text-2xl font-bold text-slate-200">
              🏰 遊戲進行中…
            </h2>
            <p className="text-slate-400 text-sm">Milestone 2 will implement the core game loop here.</p>
            {/* Debug: show all roles */}
            <div className="mt-8 rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6 text-left">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">⚙ Debug: Role Assignments</h3>
              <pre className="text-xs text-slate-400 font-mono overflow-x-auto">
                {JSON.stringify(
                  players.map((p) => ({ id: p.id, name: p.name, role: p.role, side: p.side })),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
