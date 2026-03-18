// ── Sides ──────────────────────────────────────────────
export type Side = 'good' | 'evil';

// ── Roles ──────────────────────────────────────────────
export type Role =
  | 'merlin'
  | 'percival'
  | 'loyal_servant'
  | 'assassin'
  | 'morgana'
  | 'mordred'
  | 'oberon'
  | 'minion';

export const ROLE_LABELS: Record<Role, string> = {
  merlin: '梅林 (Merlin)',
  percival: '派西維爾 (Percival)',
  loyal_servant: '忠臣 (Loyal Servant)',
  assassin: '刺客 (Assassin)',
  morgana: '莫甘娜 (Morgana)',
  mordred: '莫德雷德 (Mordred)',
  oberon: '奧伯倫 (Oberon)',
  minion: '爪牙 (Minion)',
};

export const ROLE_SIDE: Record<Role, Side> = {
  merlin: 'good',
  percival: 'good',
  loyal_servant: 'good',
  assassin: 'evil',
  morgana: 'evil',
  mordred: 'evil',
  oberon: 'evil',
  minion: 'evil',
};

// Special roles the user can toggle on/off
export const SPECIAL_GOOD_ROLES: Role[] = ['merlin', 'percival'];
export const SPECIAL_EVIL_ROLES: Role[] = ['assassin', 'morgana', 'mordred', 'oberon'];

// ── Player ─────────────────────────────────────────────
export interface Player {
  id: number;        // 0-indexed
  name: string;
  role: Role;
  side: Side;
  isAI: boolean;
  /** IDs of players this player can "see" during the night phase */
  visibleTo: number[];
  /** Optional label hint for ambiguous visibility (e.g. Percival sees "Merlin?" ) */
  visibleLabels: Record<number, string>;
}

// ── Good / Evil Ratio per player count ─────────────────
export const TEAM_COMPOSITION: Record<number, { good: number; evil: number }> = {
  5:  { good: 3, evil: 2 },
  6:  { good: 4, evil: 2 },
  7:  { good: 4, evil: 3 },
  8:  { good: 5, evil: 3 },
  9:  { good: 6, evil: 3 },
  10: { good: 6, evil: 4 },
};

// ── Game Config ────────────────────────────────────────
export interface GameConfig {
  playerCount: number;              // 5-10
  specialRoles: Role[];             // toggled special roles
  humanPlayerIndex: number;         // which seat is the human
  useLakeOfAvalon: boolean;         // 湖中女神
}

// ── Visibility result ──────────────────────────────────
export interface VisibilityInfo {
  canSee: number[];
  labels: Record<number, string>;
}
