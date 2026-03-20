import { useState, useReducer, useEffect } from 'react';
import type { GameConfig, Player, Side } from '../types/avalon';
import { ROLE_LABELS } from '../types/avalon';
import type { GameState } from '../types/game';
import { MISSION_SIZES } from '../types/game';
import { createInitialGameState, proposeTeam, submitVotes, executeMission, resolveAssassination } from '../engine/gameLoop';
import { inspectPlayer } from '../engine/lake';
import { aiProposeTeam, aiVote, aiPlayCard, aiAssassinate } from '../engine/ai';
import { llmManager } from '../engine/LlmManager';

import MissionTracker from './MissionTracker';
import VoteTracker from './VoteTracker';
import PlayerRing from './PlayerRing';
import ProposalPanel from './ProposalPanel';
import VotingPanel from './VotingPanel';
import MissionPanel from './MissionPanel';
import LakePanel from './LakePanel';
import AssassinationPanel from './AssassinationPanel';
import ChatPanel from './ChatPanel';
import { Terminal } from 'lucide-react';

interface Props {
  players: Player[];
  config: GameConfig;
  onRestart: () => void;
}

export default function GameBoard({ players, config, onRestart }: Props) {
  const [state, dispatch] = useReducer(
    (s: GameState, action: Partial<GameState> | ((s: GameState) => Partial<GameState>)) => {
      const updates = typeof action === 'function' ? action(s) : action;
      return { ...s, ...updates };
    },
    createInitialGameState(config, players)
  );

  const [lakeResult, setLakeResult] = useState<Side | undefined>(undefined);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [isLLMThinking, setIsLLMThinking] = useState<string>('');

  const log = (msg: string) => setGameLog(prev => [...prev, `[R${state.round + 1}] ${msg}`]);
  const pushChat = (senderId: number | 'system', text: string) => {
    dispatch(s => ({ 
      chatHistory: [...s.chatHistory, { id: Math.random().toString(), senderId, text, timestamp: Date.now() }] 
    }));
  };

  const completeLakeInspect = () => {
    setLakeResult(undefined);
    dispatch({ phase: 'proposing' });
  };

  // ── AI LLM Integration ─────────────────────────────────
  useEffect(() => {
    if (state.phase === 'finished') {
       setIsLLMThinking('');
       return;
    }

    let isCancelled = false;

    const runLLM = async () => {
      try {
        if (state.phase === 'proposing') {
          const leader = players[state.leaderIndex];
          if (leader.isAI) {
            setIsLLMThinking(`${leader.name} 正在思考出隊名單...`);
            let team: number[];
            
            try {
              const resp = await llmManager.enqueueSingle(leader, state, 'propose', players, config);
              if (isCancelled) return;
              if (resp.chat) pushChat(leader.id, resp.chat);
              team = resp.action.propose!;
              if (!team || team.length !== MISSION_SIZES[config.playerCount][state.round]) {
                team = aiProposeTeam(state, leader.id, MISSION_SIZES[config.playerCount][state.round]);
              }
            } catch (e) {
              console.error('[GameBoard] Propose fallback', e);
              team = aiProposeTeam(state, leader.id, MISSION_SIZES[config.playerCount][state.round]);
            }
            log(`${leader.name} 提議了隊伍: ${team.map(id => players.find(p => p.id===id)?.name).join(', ')}`);
            dispatch(s => proposeTeam(s, team, players));
          } else {
            setIsLLMThinking('');
          }
        }

        if (state.phase === 'voting') {
          const humanHasVoted = state.votes[config.humanPlayerIndex] !== undefined;
          const needAIVotes = players.filter(p => p.isAI && state.votes[p.id] === undefined);
          
          if (humanHasVoted && needAIVotes.length > 0) {
            setIsLLMThinking('其他玩家正在思考與投票...');
            try {
              const batchResp = await llmManager.enqueueBatch(needAIVotes, state, 'vote', players, config);
              if (isCancelled) return;
              
              const updatedVotes = { ...state.votes };
              for (const resp of batchResp.responses) {
                 if (resp.chat) pushChat(resp.playerId, resp.chat);
                 const aiPlayer = players.find(x => x.id === resp.playerId);
                 updatedVotes[resp.playerId] = resp.action.vote ?? aiVote(state, aiPlayer!, state.proposedTeam);
              }
              for (const p of needAIVotes) {
                 if (updatedVotes[p.id] === undefined) updatedVotes[p.id] = aiVote(state, p, state.proposedTeam);
              }

              const approveNames = players.filter(p => updatedVotes[p.id]).map(p => p.name).join(', ') || '無';
              const rejectNames = players.filter(p => !updatedVotes[p.id]).map(p => p.name).join(', ') || '無';
              log(`【投票結果】贊成: ${approveNames} | 反對: ${rejectNames}`);
              setIsLLMThinking('');
              dispatch(s => submitVotes(s, updatedVotes, config, players));
            } catch (e) {
              console.error('[GameBoard] Voting fallback', e);
              const updatedVotes = { ...state.votes };
              for (const p of needAIVotes) updatedVotes[p.id] = aiVote(state, p, state.proposedTeam);
              setIsLLMThinking('');
              dispatch(s => submitVotes(s, updatedVotes, config, players));
            }
          }
        }

        if (state.phase === 'mission') {
          const humanInTeam = state.proposedTeam.includes(config.humanPlayerIndex);
          const expectedTotal = state.proposedTeam.length;
          
          if (state.missionCards.length === expectedTotal) {
            setIsLLMThinking('');
            const timer = setTimeout(() => {
               dispatch(s => {
                 const successCount = s.missionCards.filter(c => c === 'success').length;
                 const failCount = s.missionCards.filter(c => c === 'fail').length;
                 log(`任務結算完畢！【 ${successCount} 成功 · ${failCount} 失敗 】`);
                 return executeMission(s, s.missionCards, config, players);
               });
            }, 2000);
            return () => { isCancelled = true; clearTimeout(timer); };
          }
          
          if (!humanInTeam || state.missionCards.length > 0) {
            const aiInTeam = state.proposedTeam.filter(id => id !== config.humanPlayerIndex);
            const expectedCards = humanInTeam ? aiInTeam.length + 1 : aiInTeam.length;
            
            if (state.missionCards.length < expectedCards && aiInTeam.length > 0) {
              const aiTargets = aiInTeam.map(id => players.find(x => x.id === id)!);
              setIsLLMThinking('出任務成員正在抉擇卡牌...');
              
              try {
                 const batchResp = await llmManager.enqueueBatch(aiTargets, state, 'mission', players, config);
                 if (isCancelled) return;
                 
                 const newCards: ('success' | 'fail')[] = [...state.missionCards];
                 for (const resp of batchResp.responses) {
                    if (resp.chat) pushChat(resp.playerId, resp.chat);
                    const targetAi = players.find(x => x.id === resp.playerId)!;
                    newCards.push(resp.action.mission === 'fail' && targetAi.side === 'evil' ? 'fail' : 'success');
                 }
                 setIsLLMThinking('');
                 dispatch({ missionCards: newCards });
              } catch (e) {
                 console.error('[GameBoard] Mission fallback', e);
                 const newCards: ('success' | 'fail')[] = [...state.missionCards];
                 for (const ai of aiTargets) newCards.push(aiPlayCard(state, ai));
                 setIsLLMThinking('');
                 dispatch({ missionCards: newCards });
              }
            }
          }
        }

        if (state.phase === 'assassination') {
          const assassin = players.find(p => p.role === 'assassin');
          if (assassin && assassin.isAI && !isLLMThinking.includes(assassin.name)) {
             setIsLLMThinking(`${assassin.name} 正在思考刺殺目標...`);
             try {
                const resp = await llmManager.enqueueSingle(assassin, state, 'assassinate', players, config);
                if (isCancelled) return;
                if (resp.chat) pushChat(assassin.id, resp.chat);
                const targetId = resp.action.assassinate ?? aiAssassinate(state, assassin, players);
                const targetName = players.find(p => p.id === targetId)?.name;
                log(`${assassin.name} (刺客) 選擇刺殺了 ${targetName}！`);
                dispatch(s => resolveAssassination(s, targetId, players));
             } catch (e) {
                const targetId = aiAssassinate(state, assassin, players);
                const targetName = players.find(p => p.id === targetId)?.name;
                log(`${assassin.name} (刺客) 選擇刺殺了 ${targetName}！`);
                dispatch(s => resolveAssassination(s, targetId, players));
             }
          }
        }

      } catch (err) {
        console.error("LLM Global loop error:", err);
      }
    };

    let timerId = window.setTimeout(runLLM, 2000);
    return () => { isCancelled = true; clearTimeout(timerId); };
  }, [state, players, config]);

  const handleProposeTeam = (team: number[]) => {
    log(`你提議了隊伍: ${team.map(id => players.find(p => p.id===id)?.name).join(', ')}`);
    dispatch(proposeTeam(state, team, players));
  };

  const handleTogglePlayer = (id: number) => {
    if (state.phase !== 'proposing' || state.leaderIndex !== config.humanPlayerIndex) return;
    const required = MISSION_SIZES[config.playerCount][state.round];
    let newTeam = [...state.proposedTeam];
    if (newTeam.includes(id)) newTeam = newTeam.filter(t => t !== id);
    else if (newTeam.length < required) newTeam.push(id);
    dispatch({ proposedTeam: newTeam });
  };

  const handleVote = (approve: boolean) => dispatch({ votes: { ...state.votes, [config.humanPlayerIndex]: approve } });
  const handlePlayCard = (card: 'success' | 'fail') => dispatch({ missionCards: [...state.missionCards, card] });

  const handleLakeInspect = (targetId: number) => {
    if (targetId === -1) {
      completeLakeInspect();
    } else {
      const { allegiance, newState } = inspectPlayer(state, targetId, players);
      setLakeResult(allegiance);
      dispatch({ lakeHistory: newState.lakeHistory, lakeHolder: newState.lakeHolder });
    }
  };

  if (state.phase === 'finished') {
    return (
      <div className="h-screen flex flex-col bg-zinc-950 text-slate-200 overflow-hidden font-serif">
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12 medieval-panel border-iron overflow-y-auto">
             <div className="space-y-6">
                <h2 className="text-6xl font-black italic tracking-tighter uppercase">
                  <span className="text-gradient-gold drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">遊戲結束</span>
                </h2>
                <div className="flex justify-center">
                  {state.winner === 'good' ? (
                    <div className="px-8 py-3 rounded-full bg-blue-500/10 border-2 border-blue-500/30 text-blue-400 text-2xl font-black tracking-widest uppercase">
                      正義獲勝 · VICTORY
                    </div>
                  ) : (
                    <div className="px-8 py-3 rounded-full bg-red-500/10 border-2 border-red-500/30 text-red-500 text-2xl font-black tracking-widest uppercase">
                      邪惡獲勝 · DEFEAT
                    </div>
                  )}
                </div>
             </div>

             <div className="max-w-4xl mx-auto space-y-6">
                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">ROLE REVEAL</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {players.map(p => (
                    <div key={p.id} className={`p-3 rounded-xl border border-zinc-800 bg-zinc-900/40`}>
                      <p className="text-[8px] font-black text-slate-600 mb-1">{p.name}</p>
                      <p className={`text-[10px] font-black uppercase ${p.side === 'good' ? 'text-blue-400' : 'text-red-500'}`}>
                        {ROLE_LABELS[p.role]}
                      </p>
                    </div>
                  ))}
                </div>
             </div>

             <button onClick={onRestart} className="btn-primary !px-16 !py-4">
                PLAY AGAIN
             </button>
          </div>
          <div className="w-80 border-l border-zinc-800 bg-zinc-950">
            <ChatPanel messages={state.chatHistory} players={players} humanId={config.humanPlayerIndex} onSendMessage={() => {}} disabled={true} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-slate-200 overflow-hidden font-serif">
      {/* 1. HUD: Prograss & Trackers */}
      <div className="flex-none p-3 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <MissionTracker playerCount={config.playerCount} currentRound={state.round} results={state.missionResults} />
            <div className="h-6 w-px bg-zinc-800" />
            <VoteTracker rejectCount={state.rejectCount} />
          </div>
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 rounded-sm border border-amber-900/30 bg-amber-900/10">
                <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest animate-pulse">
                  {isLLMThinking || 'Standing By'}
                </p>
             </div>
             <button onClick={onRestart} className="p-1.5 border border-zinc-700 hover:bg-zinc-800 rounded-sm transition-colors text-stone-600">
                <Terminal size={12} />
             </button>
          </div>
        </div>
      </div>

      {/* 2. DASHBOARD BODY */}
      <div className="flex-1 flex overflow-hidden">
        {/* Table & Log */}
        <div className="flex-[1.4] relative flex flex-col items-center justify-center p-4 bg-[radial-gradient(circle_at_center,rgba(40,40,40,0.2)_0%,transparent_70%)] overflow-hidden">
          <div className="flex-1 w-full h-full flex items-center justify-center">
             <div className="scale-[0.8] lg:scale-[0.9] xl:scale-100 transform transform-gpu">
                <PlayerRing 
                  players={players} 
                  humanId={config.humanPlayerIndex}
                  leaderId={state.leaderIndex}
                  proposedTeam={state.proposedTeam}
                  lakeHolder={state.lakeHolder}
                  inspectedHistory={state.lakeHistory}
                  onSelectPlayer={handleTogglePlayer}
                  selectionMode={state.phase === 'proposing' ? 'toggle' : 'none'}
                  disabled={state.phase !== 'proposing' || state.leaderIndex !== config.humanPlayerIndex}
                  isLLMThinking={isLLMThinking}
                />
             </div>
          </div>
          
          {/* Integrated Game Log (Bottom of center area) */}
          <div className="flex-none w-full max-w-2xl h-32 bg-black/40 border border-zinc-800/50 rounded-lg p-3 overflow-y-auto scrollbar-hide mb-2 opacity-90 transition-opacity">
            <div className="flex flex-col gap-1.5 text-xs font-mono text-stone-400 uppercase tracking-tight">
              {gameLog.slice().reverse().map((l, i) => (
                <div key={i} className="flex gap-4 items-start border-b border-zinc-800/30 pb-1.5 last:border-0">
                  <span className="text-amber-900 font-black shrink-0">#{ (gameLog.length - i).toString().padStart(3, '0') }</span>
                  <span className="leading-tight text-stone-300">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interaction & Chat */}
        <div className="flex-1 flex flex-col border-l border-zinc-800 bg-zinc-900/10 backdrop-blur-sm overflow-hidden">
          {/* Action Area (Top) */}
          <div className="flex-none p-4 border-b border-zinc-800/50 min-h-[160px] flex items-center justify-center bg-zinc-950/40">
            {state.phase === 'proposing' && (
              <ProposalPanel leader={players[state.leaderIndex]} isHumanLeader={state.leaderIndex === config.humanPlayerIndex} requiredSize={MISSION_SIZES[config.playerCount]?.[state.round] || 0} currentTeam={state.proposedTeam} onSubmit={handleProposeTeam} />
            )}
            {state.phase === 'voting' && (
              <VotingPanel players={players} humanId={config.humanPlayerIndex} proposedTeam={state.proposedTeam} votes={state.votes} onSubmitVote={handleVote} />
            )}
            {state.phase === 'mission' && state.proposedTeam.includes(config.humanPlayerIndex) && (
              <MissionPanel player={players[config.humanPlayerIndex]} onPlayCard={handlePlayCard} missionCardsPlayed={state.missionCards.length} totalRequired={state.proposedTeam.length} />
            )}
            {state.phase === 'mission' && !state.proposedTeam.includes(config.humanPlayerIndex) && (
              <div className="text-center space-y-3 animate-flicker">
                 <div className="w-20 h-0.5 bg-zinc-800 mx-auto overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-amber-900 w-1/2 animate-[shimmer_2s_infinite]" />
                 </div>
                 <p className="text-[10px] text-amber-900 font-black uppercase tracking-[0.4em]">The Quest Proceeds...</p>
              </div>
            )}
            {state.phase === 'lake' && (
               <LakePanel human={players[config.humanPlayerIndex]} players={players} lakeHistory={state.lakeHistory} onSubmit={handleLakeInspect} resultAllegiance={lakeResult} />
            )}
            {state.phase === 'assassination' && (
               <AssassinationPanel assassin={players.find(p => p.role === 'assassin')!} isHuman={players.find(p => p.role === 'assassin')?.id === config.humanPlayerIndex} players={players} onSubmit={(tid) => dispatch(s => resolveAssassination(s, tid, players))} />
            )}
          </div>

          {/* Chat Area (Bottom) */}
          <div className="flex-1 overflow-hidden">
            <ChatPanel messages={state.chatHistory} players={players} humanId={config.humanPlayerIndex} onSendMessage={(text) => pushChat(config.humanPlayerIndex, text)} disabled={!!isLLMThinking || state.phase === 'lake'} />
          </div>
        </div>
      </div>
    </div>
  );
}
