import type { GameConfig, Player, Side } from '../types/avalon';
import type { GameState, GamePhase, GameActionEvent } from '../types/game';
import { requiresTwoFails } from '../types/game';
import { shouldTriggerLake } from './lake';
import { initializeTrustMatrix, applyActionToTrustMatrix } from './ai';
export function createInitialGameState(config: GameConfig, players: Player[]): GameState {
  const leaderIndex = Math.floor(Math.random() * config.playerCount);
  
  return {
    round: 0,
    leaderIndex,
    rejectCount: 0,
    proposedTeam: [],
    votes: {},
    missionCards: [],
    missionResults: ['pending', 'pending', 'pending', 'pending', 'pending'],
    phase: 'proposing',
    goodWins: 0,
    evilWins: 0,
    lakeHolder: config.useLakeOfAvalon ? (leaderIndex + 1) % config.playerCount : null,
    lakeHistory: [], // The holder is NOT inspected yet
    winner: null,
    gameHistory: [],
    trustMatrix: initializeTrustMatrix(players),
    chatHistory: [],
  };
}

// ── Transitions ────────────────────────────────────────

// 1. Propose team -> Voting phase
export function proposeTeam(state: GameState, teamIds: number[], players: Player[]): GameState {
  if (state.phase !== 'proposing') return state;
  const action: GameActionEvent = { type: 'propose', round: state.round, leaderId: state.leaderIndex, team: teamIds };
  const trustMatrix = applyActionToTrustMatrix(state.trustMatrix, action, players);
  return { 
    ...state, 
    proposedTeam: teamIds, 
    phase: 'voting', 
    votes: {},
    gameHistory: [...state.gameHistory, action],
    trustMatrix
  };
}

// 2. Submit votes -> Mission phase OR next proposal
export function submitVotes(state: GameState, votes: Record<number, boolean>, config: GameConfig, players: Player[]): GameState {
  if (state.phase !== 'voting') return state;
  
  const action: GameActionEvent = { type: 'vote', round: state.round, proposedTeam: state.proposedTeam, votes };
  const trustMatrix = applyActionToTrustMatrix(state.trustMatrix, action, players);
  const gameHistory = [...state.gameHistory, action];

  const approveCount = Object.values(votes).filter(v => v).length;
  const rejectCount = Object.values(votes).filter(v => !v).length;
  const isApproved = approveCount > rejectCount;

  if (isApproved) {
    // Mission approved, go to mission phase
    return { ...state, votes, phase: 'mission', missionCards: [], gameHistory, trustMatrix };
  } else {
    // Mission rejected
    const newRejectCount = state.rejectCount + 1;
    
    // Check auto-lose condition (5 rejects)
    if (newRejectCount >= 5) {
      // Evil wins this round
      const newResults = [...state.missionResults];
      newResults[state.round] = 'fail';
      
      const evilWins = state.evilWins + 1;
      
      let nextState = {
        ...state,
        votes,
        rejectCount: newRejectCount,
        missionResults: newResults,
        evilWins,
        gameHistory,
        trustMatrix
      };
      
      if (nextState.rejectCount >= 5) {
        nextState.phase = 'finished';
        nextState.winner = 'evil';
      }
      return nextState;
    } else {
      // Advance leader, stay in proposing
      return {
        ...state,
        votes,
        rejectCount: newRejectCount,
        leaderIndex: (state.leaderIndex + 1) % config.playerCount,
        phase: 'proposing',
        proposedTeam: [],
        gameHistory,
        trustMatrix
      };
    }
  }
}

// 3. Execute mission -> RoundEnd phase
export function executeMission(state: GameState, cards: ('success' | 'fail')[], config: GameConfig, players: Player[]): GameState {
  if (state.phase !== 'mission') return state;
  
  const failCount = cards.filter(c => c === 'fail').length;
  const successCount = cards.length - failCount;
  const needsTwo = requiresTwoFails(config.playerCount, state.round);
  
  const action: GameActionEvent = { type: 'mission', round: state.round, team: state.proposedTeam, fails: failCount, successes: successCount };
  const trustMatrix = applyActionToTrustMatrix(state.trustMatrix, action, players);
  const gameHistory = [...state.gameHistory, action];

  const isSuccess = needsTwo ? failCount < 2 : failCount === 0;
  
  const newResults = [...state.missionResults];
  newResults[state.round] = isSuccess ? 'success' : 'fail';
  
  const goodWins = isSuccess ? state.goodWins + 1 : state.goodWins;
  const evilWins = isSuccess ? state.evilWins : state.evilWins + 1;
  
  let nextState = {
    ...state,
    missionCards: cards,
    missionResults: newResults,
    goodWins,
    evilWins,
    gameHistory,
    trustMatrix
  };
  
  const winner = checkWinCondition(nextState);
  if (winner) {
    return { ...nextState, winner, phase: 'finished' };
  }
  
  return resolveRound(nextState, config, players);
}

// 4. Resolve round -> Lake OR next Proposing phase
export function resolveRound(state: GameState, config: GameConfig, players: Player[]): GameState {
  const nextRound = state.round + 1;
  const nextLeader = (state.leaderIndex + 1) % config.playerCount;
  
  let nextState = {
    ...state,
    round: nextRound,
    leaderIndex: nextLeader,
    rejectCount: 0,
    proposedTeam: [],
    votes: {},
    missionCards: [],
  };
  
  if (shouldTriggerLake(nextState.round, nextState.lakeHolder !== null)) {
    nextState.phase = 'lake';
  } else {
    nextState.phase = 'proposing';
  }

  if (nextState.evilWins >= 3) {
    nextState.phase = 'finished';
    nextState.winner = 'evil';
  } else if (nextState.goodWins >= 3) {
    const hasAssassin = players.some(p => p.role === 'assassin');
    if (hasAssassin) {
      nextState.phase = 'assassination';
    } else {
      nextState.phase = 'finished';
      nextState.winner = 'good';
    }
  }
  
  return nextState;
}

// 4. Assassination Phase Resolution
export function resolveAssassination(state: GameState, targetId: number, players: Player[]): GameState {
  if (state.phase !== 'assassination') return state;
  const target = players.find(p => p.id === targetId);
  const isMerlin = target?.role === 'merlin';
  
  return {
    ...state,
    phase: 'finished',
    winner: isMerlin ? 'evil' : 'good',
  };
}

// ── Utils ──────────────────────────────────────────────
export function checkWinCondition(state: GameState): Side | null {
  if (state.goodWins >= 3) return 'good';
  if (state.evilWins >= 3) return 'evil';
  return null;
}
