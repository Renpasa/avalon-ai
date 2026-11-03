import { describe, it, expect } from 'vitest';
import { assignRoles, calculateVisibility } from '../setup';
import { createInitialGameState, proposeTeam, submitVotes } from '../gameLoop';
import { shouldTriggerLake } from '../lake';
import type { GameConfig, Player } from '../../types/avalon';

describe('Avalon Game Engine - Setup & Visibility', () => {
  it('correctly calculates team slots for 5 players', () => {
    const config5: GameConfig = {
      playerCount: 5,
      specialRoles: ['merlin', 'assassin'],
      useLakeOfAvalon: false,
      humanPlayerIndex: 0,
    };
    const players5 = assignRoles(config5);
    expect(players5).toHaveLength(5);
    const good = players5.filter(p => p.side === 'good');
    const evil = players5.filter(p => p.side === 'evil');
    expect(good).toHaveLength(3);
    expect(evil).toHaveLength(2);
  });

  it('correctly constructs visibility graph for Merlin and Percival', () => {
    const players: Player[] = [
      { id: 0, name: 'P0', role: 'merlin', side: 'good', isAI: false, visibleTo: [], visibleLabels: {} },
      { id: 1, name: 'P1', role: 'percival', side: 'good', isAI: true, visibleTo: [], visibleLabels: {} },
      { id: 2, name: 'P2', role: 'morgana', side: 'evil', isAI: true, visibleTo: [], visibleLabels: {} },
      { id: 3, name: 'P3', role: 'mordred', side: 'evil', isAI: true, visibleTo: [], visibleLabels: {} },
      { id: 4, name: 'P4', role: 'assassin', side: 'evil', isAI: true, visibleTo: [], visibleLabels: {} },
    ];

    const merlinVis = calculateVisibility(players[0], players);
    expect(merlinVis.canSee).toContain(2); // Morgana
    expect(merlinVis.canSee).toContain(4); // Assassin
    expect(merlinVis.canSee).not.toContain(3); // Mordred is hidden from Merlin

    const percivalVis = calculateVisibility(players[1], players);
    expect(percivalVis.canSee).toContain(0);
    expect(percivalVis.canSee).toContain(2);
    expect(percivalVis.canSee).not.toContain(4);
  });
});

describe('Avalon Game Engine - State Transitions', () => {
  const config: GameConfig = {
    playerCount: 5,
    specialRoles: ['merlin', 'assassin'],
    useLakeOfAvalon: true,
    humanPlayerIndex: 0,
  };
  const players: Player[] = assignRoles(config);

  it('transitions through propose -> vote (reject count logic)', () => {
    let state = createInitialGameState(config, players);
    expect(state.phase).toBe('proposing');

    state = proposeTeam(state, [0, 1], players);
    expect(state.phase).toBe('voting');
    expect(state.proposedTeam).toEqual([0, 1]);

    const tieVotes = { 0: true, 1: true, 2: false, 3: false, 4: false };
    state = submitVotes(state, tieVotes, config, players);
    expect(state.phase).toBe('proposing');
    expect(state.rejectCount).toBe(1);
  });

  it('triggers Lake of Avalon only after rounds 2, 3, 4', () => {
    expect(shouldTriggerLake(0, true)).toBe(false);
    expect(shouldTriggerLake(1, true)).toBe(false);
    expect(shouldTriggerLake(2, true)).toBe(true);
    expect(shouldTriggerLake(3, true)).toBe(true);
    expect(shouldTriggerLake(4, true)).toBe(true);
    expect(shouldTriggerLake(5, true)).toBe(false);
  });
});
