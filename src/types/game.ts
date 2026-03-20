import type { Side } from './avalon';

export type GamePhase = 'proposing' | 'voting' | 'mission' | 'roundEnd' | 'lake' | 'assassination' | 'finished';
export type MissionResult = 'success' | 'fail' | 'pending';

export interface VoteRecord {
  playerId: number;
  approve: boolean;
}

export type GameActionEvent = 
  | { type: 'propose'; round: number; leaderId: number; team: number[] }
  | { type: 'vote'; round: number; proposedTeam: number[]; votes: Record<number, boolean> }
  | { type: 'mission'; round: number; team: number[]; fails: number; successes: number }
  | { type: 'lake'; round: number; holderId: number; targetId: number };

export interface ChatMessage {
  id: string;
  senderId: number | 'system';
  text: string;
  timestamp: number;
}

export interface GameState {
  // Turn ordering
  round: number; // 0 to 4 (representing 1st to 5th round)
  leaderIndex: number;
  rejectCount: number; // 0 to 5. 5 = evil auto-win current round

  // Proposal phase
  proposedTeam: number[];

  // Voting phase
  votes: Record<number, boolean>; // playerId -> approve

  // Mission phase
  missionCards: ('success' | 'fail')[];
  missionResults: MissionResult[]; // length 5
  
  // Game progression
  phase: GamePhase;
  goodWins: number;
  evilWins: number;

  // Lake of Avalon
  lakeHolder: number | null; // null if not enabled
  lakeHistory: number[]; // those who have been inspected

  // End game
  winner: Side | null;

  // Milestone 3: AI Memory & Logs
  gameHistory: GameActionEvent[];
  trustMatrix: number[][]; // [viewerId][targetId] -> 0.0 to 1.0

  // Milestone 4: Chat Integration
  chatHistory: ChatMessage[];
}

// ── Mission Sizes Table ──────────────────────────────
export const MISSION_SIZES: Record<number, number[]> = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
};

// Returns whether the current mission requires 2 fails to actually fail
export function requiresTwoFails(playerCount: number, round: number): boolean {
  return playerCount >= 7 && round === 3; // round is 0-indexed, so 3 is the 4th round
}
