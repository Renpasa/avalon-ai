import type { Player, Side } from '../types/avalon';
import { ROLE_SIDE } from '../types/avalon';
import type { GameState, GameActionEvent } from '../types/game';

/**
 * The Lake of Avalon can be used after round 2, 3, and 4.
 * Internally, rounds are 0-indexed (0=R1, 1=R2, 2=R3, 3=R4, 4=R5).
 * So after round 1, round 2, and round 3.
 */
export function shouldTriggerLake(finishedRoundIndex: number, hasLake: boolean): boolean {
  if (!hasLake) return false;
  // trigger after 2nd, 3rd, 4th rounds (indexes 1, 2, 3)
  return finishedRoundIndex === 2 || finishedRoundIndex === 3 || finishedRoundIndex === 4;
}

export function inspectPlayer(state: GameState, targetId: number, players: Player[]): { allegiance: Side, newState: GameState } {
  if (state.phase !== 'lake') {
    throw new Error('Not in lake phase');
  }
  
  if (state.lakeHistory.includes(targetId) || targetId === state.lakeHolder) {
    throw new Error('Invalid lake target'); // already inspected or self
  }
  
  const target = players.find(p => p.id === targetId);
  if (!target) throw new Error('Player not found');
  
  // Rule: Lancelot variants might have specific lake rules, but standard Avalon gives Good/Evil
  const allegiance: Side = ROLE_SIDE[target.role];
  
  const action: GameActionEvent = { type: 'lake', round: state.round, holderId: state.lakeHolder!, targetId };

  // Update state: new holder, add to history, back to proposing
  const newState: GameState = {
    ...state,
    lakeHistory: [...state.lakeHistory, targetId],
    lakeHolder: targetId,
    phase: 'proposing',
    gameHistory: [...state.gameHistory, action],
  };
  
  return { allegiance, newState };
}
