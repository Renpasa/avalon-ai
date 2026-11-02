import { describe, it, expect } from 'vitest';
import { assignRoles } from '../setup';
import { createInitialGameState, proposeTeam, submitVotes, executeMission, resolveAssassination } from '../gameLoop';
import { MISSION_SIZES } from '../../types/game';
import { aiProposeTeam, aiVote, aiPlayCard, aiAssassinate } from '../ai';
import type { GameConfig, Player } from '../../types/avalon';
import { llmManager } from '../LlmManager';

describe('Avalon Mock Playable Game Loop', () => {
  const config: GameConfig = {
    playerCount: 5,
    specialRoles: ['merlin', 'assassin'],
    useLakeOfAvalon: false,
    humanPlayerIndex: 0,
  };
  const players: Player[] = assignRoles(config);

  it('runs a complete 5-player mock game loop to terminal state with legal transitions', () => {
    let state = createInitialGameState(config, players);
    expect(state.phase).toBe('proposing');
    expect(state.winner).toBeNull();

    let turns = 0;
    const maxTurns = 50;

    while (state.phase !== 'finished' && turns < maxTurns) {
      turns++;

      if (state.phase === 'proposing') {
        const requiredSize = MISSION_SIZES[config.playerCount][state.round];
        const team = aiProposeTeam(state, state.leaderIndex, requiredSize);
        expect(team.length).toBe(requiredSize);
        state = proposeTeam(state, team, players);
        expect(state.phase).toBe('voting');
      } else if (state.phase === 'voting') {
        const votes: Record<number, boolean> = {};
        for (const p of players) {
          votes[p.id] = aiVote(state, p, state.proposedTeam);
        }
        state = submitVotes(state, votes, config, players);
        // Either voting approved -> mission, or rejected -> proposing
        expect(['mission', 'proposing', 'finished']).toContain(state.phase);
      } else if (state.phase === 'mission') {
        const cards: ('success' | 'fail')[] = state.proposedTeam.map(id => {
          const p = players.find(x => x.id === id)!;
          return aiPlayCard(state, p);
        });
        state = executeMission(state, cards, config, players);
        // After mission, can be proposing, lake, assassination, or finished
        expect(['proposing', 'lake', 'assassination', 'finished']).toContain(state.phase);
      } else if (state.phase === 'assassination') {
        const assassin = players.find(p => p.role === 'assassin')!;
        const targetId = aiAssassinate(state, assassin, players);
        const target = players.find(p => p.id === targetId);
        expect(target?.side).toBe('good');
        state = resolveAssassination(state, targetId, players);
        expect(state.phase).toBe('finished');
      }
    }

    expect(state.phase).toBe('finished');
    expect(['good', 'evil']).toContain(state.winner);
  });

  it('correctly transitions to assassination when Good wins 3 missions and Assassin is present', () => {
    let state = createInitialGameState(config, players);
    state.goodWins = 2;
    state.evilWins = 0;
    state.round = 2;
    state.phase = 'mission';
    state.proposedTeam = [0, 1]; // Good mission

    state = executeMission(state, ['success', 'success'], config, players);
    expect(state.goodWins).toBe(3);
    // With assassin in specialRoles, phase must be assassination, NOT prematurely finished!
    expect(state.phase).toBe('assassination');
    expect(state.winner).toBeNull();

    // Resolving assassination
    const merlin = players.find(p => p.role === 'merlin')!;
    const evilWonState = resolveAssassination(state, merlin.id, players);
    expect(evilWonState.phase).toBe('finished');
    expect(evilWonState.winner).toBe('evil');
  });
  it('falls back to mock mode when no API key is present in sessionStorage', () => {
    // When no API key is stored, useMock safely defaults to true
    expect(llmManager.useMock).toBe(true);
  });
});
