import type { Player } from '../types/avalon';
import { ROLE_SIDE } from '../types/avalon';
import type { GameActionEvent, GameState } from '../types/game';

// ── 1. Initialization ─────────────────────────────────────

/**
 * Trust is a value from 0.0 (enemy) to 1.0 (ally). 0.5 is neutral.
 */
export function initializeTrustMatrix(players: Player[]): number[][] {
  const count = players.length;
  const matrix: number[][] = Array(count).fill(0).map(() => Array(count).fill(0.5));

  for (let viewerId = 0; viewerId < count; viewerId++) {
    const viewer = players.find((p) => p.id === viewerId);
    if (!viewer) continue;

    for (let targetId = 0; targetId < count; targetId++) {
      if (viewerId === targetId) {
        matrix[viewerId][targetId] = 1.0; // Trust self fully
        continue;
      }

      const target = players.find((p) => p.id === targetId);
      if (!target) continue;

      // Adjust based on perfect night visibility
      const visibility = viewer.visibleLabels[targetId];

      if (viewer.role === 'merlin') {
        if (visibility === '邪惡 (Evil)') {
          matrix[viewerId][targetId] = 0.0; // Merlin deeply distrusts known evil
        }
      } else if (viewer.role === 'percival') {
        if (visibility === '梅林？ (Merlin?)') {
          matrix[viewerId][targetId] = 0.8; // High baseline trust for possible Merlin/Morgana
        }
      } else if (ROLE_SIDE[viewer.role] === 'evil') {
        // Evil players fully trust their comrades
        if (visibility === '同伴 (Ally)') {
          matrix[viewerId][targetId] = 1.0;
        } else if (target.role !== 'oberon' && ROLE_SIDE[target.role] !== 'evil') {
          // They know Good players are enemies
          matrix[viewerId][targetId] = 0.0;
        }
      }
    }
  }

  return matrix;
}

// ── 2. Dynamics (Updates) ────────────────────────────────

export function applyActionToTrustMatrix(
  matrix: number[][],
  action: GameActionEvent,
  players: Player[]
): number[][] {
  // Deep clone matrix
  const newMatrix = matrix.map((row) => [...row]);

  if (action.type === 'mission') {
    const { team, fails } = action;
    if (fails > 0) {
      // Good players heavily distrust everyone on a failed mission team
      for (const p of players) {
        if (ROLE_SIDE[p.role] === 'evil') continue; // Evil knows what happened, trust doesn't change
        
        // If 1 fail on a 2-person team, and I am on it, the other guy is 100% evil
        const amIOnTeam = team.includes(p.id);

        for (const memberId of team) {
          if (memberId === p.id) continue;
          
          if (amIOnTeam && team.length === 2 && fails === 1) {
            newMatrix[p.id][memberId] = 0.0; // Absolute certainty
          } else {
            // General drop
            newMatrix[p.id][memberId] = Math.max(0.0, newMatrix[p.id][memberId] - 0.3);
          }
        }
      }
    } else {
      // Success builds trust slowly
      for (const p of players) {
        if (ROLE_SIDE[p.role] === 'evil') continue;
        for (const memberId of team) {
          if (memberId === p.id) continue;
          newMatrix[p.id][memberId] = Math.min(1.0, newMatrix[p.id][memberId] + 0.15);
        }
      }
    }
  }

  // (Future tuning options: analyze voting patterns, etc.)

  return newMatrix;
}

// ── 3. Behaviors ─────────────────────────────────────────

export function aiProposeTeam(state: GameState, leaderId: number, countToPick: number): number[] {
  const viewerTrust = state.trustMatrix[leaderId];
  
  const sortedByTrust = viewerTrust
    .map((score, id) => ({ id, score }))
    .sort((a, b) => b.score - a.score);

  // Take the top N most trusted ids
  return sortedByTrust.slice(0, countToPick).map((x) => x.id);
}

export function aiVote(state: GameState, voter: Player, proposedTeam: number[]): boolean {
  if (state.rejectCount === 4 && ROLE_SIDE[voter.role] === 'good') {
    return true; // Auto-approve to prevent game loss for Good
  }

  if (ROLE_SIDE[voter.role] === 'good') {
    // Good evaluates average trust
    const trustSum = proposedTeam.reduce((sum, id) => sum + state.trustMatrix[voter.id][id], 0);
    const avgTrust = trustSum / proposedTeam.length;
    return avgTrust >= 0.55; 
  } else {
    // Evil evaluates if comrades are on the mission
    const evilOnTeam = proposedTeam.some((id) => state.trustMatrix[voter.id][id] >= 1.0);
    return evilOnTeam;
  }
}

export function aiPlayCard(state: GameState, aiPlayer: Player): 'success' | 'fail' {
  if (ROLE_SIDE[aiPlayer.role] === 'good') return 'success';

  // Evil Logic:
  // Is this a match point for Evil? (i.e., we already have 2 evil wins)
  if (state.evilWins >= 2) return 'fail';

  // Lay low logic: if I am the only evil on this team, and I want to gain trust early?
  // Let's count how many evil I know are on the team
  const comradesOnTeam = state.proposedTeam.filter(id => state.trustMatrix[aiPlayer.id][id] >= 1.0); // including self
  
  if (comradesOnTeam.length === 1 && state.round < 2) {
    // 60% chance to lay low early game if alone
    if (Math.random() < 0.6) {
       return 'success';
    }
  }

  // Otherwise, default to dropping evil card
  return 'fail';
}

export function aiAssassinate(state: GameState, assassin: Player, players: Player[]): number {
  // Good players pool (excl self since Assassin is evil anyway)
  const validTargets = players.filter(p => ROLE_SIDE[p.role] === 'good');
  // AI picks a random Good player for now until M4 LLM Logic
  return validTargets[Math.floor(Math.random() * validTargets.length)].id;
}
