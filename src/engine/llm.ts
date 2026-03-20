import type { Player, GameConfig } from '../types/avalon';
import type { GameState } from '../types/game';
import { ROLE_LABELS, ROLE_SIDE } from '../types/avalon';
import { MISSION_SIZES } from '../types/game';

export interface LLMResponse {
  thoughts: string;
  chat: string | null;
  action: {
    vote?: boolean;
    propose?: number[];
    mission?: 'success' | 'fail';
    assassinate?: number;
  };
}

export interface BatchLLMResponse {
  responses: Array<{
    playerId: number;
    thoughts: string;
    chat: string | null;
    action: {
      vote?: boolean;
      propose?: number[];
      mission?: 'success' | 'fail';
      assassinate?: number;
    };
  }>;
}

// Robust JSON parser to strip markdown wrappers like ```json
export function parseRobustJson<T>(text: string): T {
  const cleaned = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
  return JSON.parse(cleaned) as T;
}

// ── Single Prompt Builder ──────────────────────────────────────
export function buildSinglePrompt(
  player: Player,
  state: GameState,
  actionRequired: 'propose' | 'vote' | 'mission' | 'assassinate',
  allPlayers: Player[],
  config: GameConfig
): string {
  const roleName = ROLE_LABELS[player.role];
  const side = ROLE_SIDE[player.role] === 'good' ? '正義 (Good)' : '邪惡 (Evil)';
  
  const knownPlayers = Object.entries(player.visibleLabels)
    .filter(([_, label]) => label !== '未知 (Unknown)')
    .map(([id, label]) => {
      const p = allPlayers.find(x => x.id === Number(id));
      return `- ${p?.name}: ${label}`;
    }).join('\n');

  const trustScores = state.trustMatrix[player.id];
  const trustContext = allPlayers.map(p => {
    if (p.id === player.id) return null;
    return `${p.name}: ${trustScores[p.id].toFixed(2)} (0=鐵狼, 0.5=中立, 1=鐵好人/同伴)`;
  }).filter(Boolean).join('\n');

  const historyContext = state.gameHistory.slice(-3).map(h => JSON.stringify(h)).join('\n');
  const chatContext = state.chatHistory.slice(-5).map(c => {
    const sender = c.senderId === 'system' ? 'System' : allPlayers.find(p => p.id === c.senderId)?.name;
    return `[${sender}]: ${c.text}`;
  }).join('\n');

  let actionRequirement = '';
  const requiredSize = actionRequired === 'propose' ? MISSION_SIZES[config.playerCount][state.round] : 0;

  if (actionRequired === 'propose') {
    actionRequirement = `Your turn to PROPOSE a team of ${requiredSize} players. Return an array of player IDs in \`action.propose\`. Valid IDs: ${allPlayers.map(p=>`${p.name}=${p.id}`).join(', ')}.`;
  } else if (actionRequired === 'vote') {
    const teamNames = state.proposedTeam.map(id => allPlayers.find(p => p.id === id)?.name).join(', ');
    actionRequirement = `A team has been proposed: [${teamNames}]. You must VOTE. Return true (Approve) or false (Reject) in \`action.vote\`. Remember, 5 rejects = Evil wins. Current reject count: ${state.rejectCount}.`;
  } else if (actionRequired === 'mission') {
    actionRequirement = `You are on the mission! You must play a card. Return "success" or "fail" in \`action.mission\`. IF YOU ARE GOOD, YOU CAN ONLY PLAY "success".`;
  } else if (actionRequired === 'assassinate') {
    actionRequirement = `Good is about to win. You are the Assassin. You must assassinate a player you believe is Merlin. Return their player ID in \`action.assassinate\`. Valid targets: ${allPlayers.filter(p=>p.id!==player.id).map(p=>`${p.name}=${p.id}`).join(', ')}`;
  }

  return `
You are playing the social deduction game Avalon.
Your name is ${player.name}.
Your Role: ${roleName}
Your Faction: ${side}

VISION (What you know for sure from the night phase):
${knownPlayers || 'You know nothing. You must deduce who is good/evil.'}

YOUR CURRENT TRUST MATRIX (Heuristic evaluation of others):
${trustContext}

GAME STATE:
Round: ${state.round + 1} (0-indexed ${state.round})
Good Wins: ${state.goodWins}, Evil Wins: ${state.evilWins}
Consecutive Rejects: ${state.rejectCount}/5

RECENT GAME HISTORY EVENTS:
${historyContext}

RECENT CHAT LOG:
${chatContext || '(No chats yet)'}

RULES FOR YOUR CHAT:
1. Speak in Traditional Chinese (繁體中文).
2. Keep it concise, 1-2 sentences maximum. Act like a player at a table.
3. If you are Evil, you MUST bluff. Pretend to be Good. Defend yourself if accused.
4. If you are Good, try to find other Good players. If you are Merlin, guide subtly without exposing yourself.
5. If it makes sense to stay silent, return \`null\` for chat.

ACTION REQUIRED:
${actionRequirement}

OUTPUT FORMAT:
You must strictly output JSON matching this structure exactly (NO markdown wrapping):
{
  "thoughts": "String of your internal hidden deduction logic",
  "chat": "String of what you say to the table right now (or null if silent)",
  "action": {
    // Only include the one field corresponding to the ACTION REQUIRED
    "vote": boolean, // if voting
    "propose": [number], // if proposing
    "mission": "success" | "fail", // if mission
    "assassinate": number // if assassinate
  }
}
`;
}

// ── Batch Prompt Builder ──────────────────────────────────────
export function buildBatchPrompt(
  targets: Player[],
  state: GameState,
  actionRequired: 'propose' | 'vote' | 'mission' | 'assassinate',
  allPlayers: Player[],
  config: GameConfig
): string {
  const historyContext = state.gameHistory.slice(-3).map(h => JSON.stringify(h)).join('\n');
  const chatContext = state.chatHistory.slice(-5).map(c => {
    const sender = c.senderId === 'system' ? 'System' : allPlayers.find(p => p.id === c.senderId)?.name;
    return `[${sender}]: ${c.text}`;
  }).join('\n');

  const playersContext = targets.map(p => {
    const roleName = ROLE_LABELS[p.role];
    const side = ROLE_SIDE[p.role] === 'good' ? '正義 (Good)' : '邪惡 (Evil)';
    
    const known = Object.entries(p.visibleLabels).filter(([id, label]) => label !== '未知 (Unknown)').map(([id, label]) => `- ${allPlayers.find(x=>x.id===Number(id))?.name}: ${label}`).join(', ');
    const trust = allPlayers.map(x => x.id !== p.id ? `${x.name}:${state.trustMatrix[p.id][x.id].toFixed(2)}` : null).filter(Boolean).join(', ');
    return `
--- Player ID: ${p.id} (${p.name}) ---
Role: ${roleName} (${side})
Vision: ${known || 'None'}
Trust Matrix: ${trust}
`;
  }).join('\n');

  let actionRequirement = '';
  if (actionRequired === 'vote') {
    const teamNames = state.proposedTeam.map(id => allPlayers.find(p => p.id === id)?.name).join(', ');
    actionRequirement = `A team has been proposed: [${teamNames}]. All designated players must VOTE. Return true (Approve) or false (Reject) in \`action.vote\`. Remember, 5 rejects = Evil wins. Current reject count: ${state.rejectCount}.`;
  } else if (actionRequired === 'mission') {
    actionRequirement = `All designated players are on the mission! They must play a card. Return "success" or "fail" in \`action.mission\`. IF A PLAYER IS GOOD, THEY MUST PLAY "success".`;
  }

  return `
You are playing Avalon. You are simulating MULTIPLE AI players simultaneously.
Instead of playing as one person, you will provide the thoughts, actions, and chat messages for several distinct players in one response.

GLOBAL GAME STATE: Round ${state.round + 1}, Good Wins: ${state.goodWins}, Evil Wins: ${state.evilWins}. Reject Count: ${state.rejectCount}/5
RECENT HISTORY:
${historyContext}
RECENT CHATS:
${chatContext || '(No chats yet)'}

PLAYERS YOU MUST SIMULATE:
${playersContext}

RULES FOR EACH PLAYER:
1. Speak in Traditional Chinese. Keep chat concisely to 1-2 sentences. Return \`null\` if they stay silent.
2. If the player is Evil, they MUST bluff to look Good.
3. If the player is Good, they must act purely on their limited knowledge and Trust Matrix.
4. DO NOT mix up their roles. Ensure responses align perfectly with each individual's Role and Faction.

ACTION REQUIRED FOR ALL PLAYERS:
${actionRequirement}

OUTPUT FORMAT:
Return strictly a JSON object matching this structure EXACTLY (NO markdown wrapping):
{
  "responses": [
    {
      "playerId": 1, 
      "thoughts": "String logic",
      "chat": "Public chat or null",
      "action": {
        // e.g. "vote": boolean
      }
    },
    // ... repeat for EVERY player requested
  ]
}
`;
}
