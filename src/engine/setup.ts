import type {
  GameConfig,
  Player,
  Role,
  Side,
  VisibilityInfo,
} from '../types/avalon';
import {
  ROLE_SIDE,
  SPECIAL_EVIL_ROLES,
  SPECIAL_GOOD_ROLES,
  TEAM_COMPOSITION,
} from '../types/avalon';

// ── Helpers ────────────────────────────────────────────

/** Fisher-Yates shuffle (in-place, returns same ref) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Slot Validation ────────────────────────────────────

export interface SlotStatus {
  goodSlots: number;
  evilSlots: number;
  selectedGood: number;
  selectedEvil: number;
  remainingGood: number;
  remainingEvil: number;
  /** Roles that can still be toggled on */
  canEnable: Role[];
  /** Roles that must stay disabled (would exceed cap) */
  blocked: Role[];
}

/**
 * Given a player count and currently selected special roles,
 * compute how many slots remain and which roles are still selectable.
 */
export function getSlotStatus(playerCount: number, selected: Role[]): SlotStatus {
  const comp = TEAM_COMPOSITION[playerCount];
  if (!comp) throw new Error(`Invalid player count: ${playerCount}`);

  const selectedGood = selected.filter((r) => ROLE_SIDE[r] === 'good').length;
  const selectedEvil = selected.filter((r) => ROLE_SIDE[r] === 'evil').length;

  const remainingGood = comp.good - selectedGood;
  const remainingEvil = comp.evil - selectedEvil;

  const canEnable: Role[] = [];
  const blocked: Role[] = [];

  const allSpecial = [...SPECIAL_GOOD_ROLES, ...SPECIAL_EVIL_ROLES];
  for (const role of allSpecial) {
    if (selected.includes(role)) continue; // already selected
    const side: Side = ROLE_SIDE[role];
    if (side === 'good' && remainingGood <= 0) blocked.push(role);
    else if (side === 'evil' && remainingEvil <= 0) blocked.push(role);
    else canEnable.push(role);
  }

  return {
    goodSlots: comp.good,
    evilSlots: comp.evil,
    selectedGood,
    selectedEvil,
    remainingGood,
    remainingEvil,
    canEnable,
    blocked,
  };
}

// ── Role Assignment ────────────────────────────────────

/**
 * Given a config, produce a shuffled list of Players with roles assigned.
 *
 * Algorithm:
 * 1. Place all selected special roles into a pool.
 * 2. Fill remaining good slots with 'loyal_servant'.
 * 3. Fill remaining evil slots with 'minion'.
 * 4. Shuffle the pool, assign to seats.
 * 5. Compute visibility for each player.
 */
export function assignRoles(config: GameConfig): Player[] {
  const { playerCount, specialRoles, humanPlayerIndex } = config;
  const comp = TEAM_COMPOSITION[playerCount];
  if (!comp) throw new Error(`Invalid player count: ${playerCount}`);

  // Build role pool
  const rolePool: Role[] = [...specialRoles];

  const specialGoodCount = specialRoles.filter((r) => ROLE_SIDE[r] === 'good').length;
  const specialEvilCount = specialRoles.filter((r) => ROLE_SIDE[r] === 'evil').length;

  // Fill generic roles
  for (let i = 0; i < comp.good - specialGoodCount; i++) rolePool.push('loyal_servant');
  for (let i = 0; i < comp.evil - specialEvilCount; i++) rolePool.push('minion');

  if (rolePool.length !== playerCount) {
    throw new Error(
      `Role pool size (${rolePool.length}) ≠ player count (${playerCount})`
    );
  }

  shuffle(rolePool);

  // Create players
  const players: Player[] = rolePool.map((role, idx) => ({
    id: idx,
    name: idx === humanPlayerIndex ? '你 (You)' : `AI-${idx}`,
    role,
    side: ROLE_SIDE[role],
    isAI: idx !== humanPlayerIndex,
    visibleTo: [],
    visibleLabels: {},
  }));

  // Compute visibility
  for (const player of players) {
    const vis = calculateVisibility(player, players);
    player.visibleTo = vis.canSee;
    player.visibleLabels = vis.labels;
  }

  return players;
}

// ── Visibility Mask ────────────────────────────────────

/**
 * Compute what a given player can see during the night phase.
 *
 * Rules:
 * - Merlin:    sees all evil EXCEPT Mordred
 * - Percival:  sees Merlin and Morgana (unlabelled — can't tell which is which)
 * - Evil:      see each other EXCEPT Oberon (and Oberon sees nobody on evil side)
 * - Others:    see nothing
 */
export function calculateVisibility(
  player: Player,
  allPlayers: Player[]
): VisibilityInfo {
  const canSee: number[] = [];
  const labels: Record<number, string> = {};

  switch (player.role) {
    case 'merlin': {
      // Sees all evil except Mordred
      for (const p of allPlayers) {
        if (p.id === player.id) continue;
        if (p.side === 'evil' && p.role !== 'mordred') {
          canSee.push(p.id);
          labels[p.id] = '邪惡 (Evil)';
        }
      }
      break;
    }

    case 'percival': {
      // Sees Merlin and Morgana but can't distinguish
      for (const p of allPlayers) {
        if (p.role === 'merlin' || p.role === 'morgana') {
          canSee.push(p.id);
          labels[p.id] = '梅林？ (Merlin?)';
        }
      }
      break;
    }

    case 'assassin':
    case 'morgana':
    case 'mordred':
    case 'minion': {
      // Evil players see each other EXCEPT Oberon
      for (const p of allPlayers) {
        if (p.id === player.id) continue;
        if (p.side === 'evil' && p.role !== 'oberon') {
          canSee.push(p.id);
          labels[p.id] = '同伴 (Ally)';
        }
      }
      break;
    }

    case 'oberon': {
      // Oberon sees nobody
      break;
    }

    case 'loyal_servant':
    default:
      // Sees nothing
      break;
  }

  return { canSee, labels };
}
