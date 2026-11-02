import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Player, GameConfig } from '../types/avalon';
import type { GameState } from '../types/game';
import { buildSinglePrompt, buildBatchPrompt, parseRobustJson, type LLMResponse, type BatchLLMResponse } from './llm';
import { MISSION_SIZES } from '../types/game';
import { aiProposeTeam, aiVote, aiPlayCard, aiAssassinate } from './ai';
type ActionType = 'propose' | 'vote' | 'mission' | 'assassinate';

interface SingleTask {
  type: 'single';
  targets: Player[];
  state: GameState;
  actionRequired: ActionType;
  allPlayers: Player[];
  config: GameConfig;
  resolve: (value: LLMResponse) => void;
  reject: (reason: unknown) => void;
}

interface BatchTask {
  type: 'batch';
  targets: Player[];
  state: GameState;
  actionRequired: ActionType;
  allPlayers: Player[];
  config: GameConfig;
  resolve: (value: BatchLLMResponse) => void;
  reject: (reason: unknown) => void;
}

type QueuedTask = SingleTask | BatchTask;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export class LlmManager {
  private queue: QueuedTask[] = [];
  private isProcessing = false;
  private cooldownMs = 3000;

  get useMock() {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return true;
    }
    const stored = sessionStorage.getItem('USE_MOCK_LLM');
    if (stored !== null) {
      return stored === 'true' || stored === 'fast';
    }
    const key = sessionStorage.getItem('avalon_gemini_api_key');
    return !key;
  }

  /** enqueue a single player LLM request */
  async enqueueSingle(player: Player, state: GameState, actionR: ActionType, allPlayers: Player[], config: GameConfig): Promise<LLMResponse> {
    return new Promise((resolve, reject) => {
      this.queue.push({ type: 'single', targets: [player], state, actionRequired: actionR, allPlayers, config, resolve, reject });
      this.processQueue();
    });
  }

  /** enqueue a batched request for multiple players */
  async enqueueBatch(targets: Player[], state: GameState, actionR: ActionType, allPlayers: Player[], config: GameConfig): Promise<BatchLLMResponse> {
    return new Promise((resolve, reject) => {
      this.queue.push({ type: 'batch', targets, state, actionRequired: actionR, allPlayers, config, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      await this.executeTask(task);
      // Cooldown to respect rate limits
      if (this.queue.length > 0) {
        await delay(this.cooldownMs);
      }
    }
    this.isProcessing = false;
  }

  private async executeTask(task: QueuedTask) {
    if (this.useMock) {
      const isFast = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('USE_MOCK_LLM') === 'fast';
      if (!isFast) {
        await delay(300);
      }
      if (task.type === 'single') {
        task.resolve(this.getDummySingle(task));
      } else {
        task.resolve(this.getDummyBatch(task));
      }
      return;
    }

    const apiKey = sessionStorage.getItem('avalon_gemini_api_key');
    if (!apiKey) {
      task.reject(new Error('API Key missing'));
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });

      const prompt = task.type === 'single'
        ? buildSinglePrompt(task.targets[0], task.state, task.actionRequired, task.allPlayers, task.config)
        : buildBatchPrompt(task.targets, task.state, task.actionRequired, task.allPlayers);

      const maxRetries = 3;
      for (let i = 0; i <= maxRetries; i++) {
        try {
          const response = await model.generateContent([{ text: prompt }]);
          const responseText = response.response.text();

          if (task.type === 'single') {
            const data = parseRobustJson<LLMResponse>(responseText);
            task.resolve(data);
          } else {
            const data = parseRobustJson<BatchLLMResponse>(responseText);
            task.resolve(data);
          }
          return; // Success, exit retry loop
        } catch (err: unknown) {
          const errObj = err as { message?: string; status?: number };
          const isRateLimit = errObj?.message?.includes('429') || errObj?.status === 429;
          if (isRateLimit && i < maxRetries) {
            console.warn(`[LlmManager] 429 Rate Limit hit. Retrying in ${60 * (i + 1)}s...`);
            await delay(60000 * (i + 1));
            continue;
          }
          console.error('[LlmManager] Generation or Parsing failed', err);
          throw err;
        }
      }
    } catch (e) {
      task.reject(e);
    }
  }

  // ── Mock Data Generators (Strict adherence to TypeScript Interfaces) ──
  private getDummySingle(task: QueuedTask): LLMResponse {
    const p = task.targets[0];
    const teamRequired = MISSION_SIZES[task.config.playerCount]?.[task.state.round] || 2;
    const targetId = aiAssassinate(task.state, p, task.allPlayers);
    const proposed = aiProposeTeam(task.state, p.id, teamRequired);
    return {
      thoughts: `[Mock Mode] 我是 ${p.name}，根據目前局勢進行決策。`,
      chat: `[Mock Mode] 我是 ${p.name}，這是模擬的發言！`,
      action: {
        vote: aiVote(task.state, p, task.state.proposedTeam),
        propose: proposed,
        mission: aiPlayCard(task.state, p),
        assassinate: targetId,
      }
    };
  }

  private getDummyBatch(task: QueuedTask): BatchLLMResponse {
    return {
      responses: task.targets.map((p, idx) => ({
        playerId: p.id,
        thoughts: `[Mock Mode] ${p.name} 的模擬思考。`,
        chat: idx % 2 === 0 ? `[Mock Mode] 我是 ${p.name}，我是好人！` : null,
        action: {
          vote: aiVote(task.state, p, task.state.proposedTeam),
          mission: aiPlayCard(task.state, p),
        }
      }))
    };
  }
}

export const llmManager = new LlmManager();
