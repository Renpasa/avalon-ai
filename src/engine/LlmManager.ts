import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Player, GameConfig } from '../types/avalon';
import type { GameState } from '../types/game';
import { buildSinglePrompt, buildBatchPrompt, parseRobustJson, type LLMResponse, type BatchLLMResponse } from './llm';
import { MISSION_SIZES } from '../types/game';

type ActionType = 'propose' | 'vote' | 'mission' | 'assassinate';

interface QueuedTask {
  type: 'single' | 'batch';
  targets: Player[];
  state: GameState;
  actionRequired: ActionType;
  allPlayers: Player[];
  config: GameConfig;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export class LlmManager {
  private queue: QueuedTask[] = [];
  private isProcessing = false;
  private cooldownMs = 3000;

  get useMock() {
    return sessionStorage.getItem('USE_MOCK_LLM') === 'true';
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
      await delay(2000); // UI Loading sensation
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
        : buildBatchPrompt(task.targets, task.state, task.actionRequired, task.allPlayers, task.config);

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
        } catch (err: any) {
          const isRateLimit = err?.message?.includes('429') || err?.status === 429;
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
    return {
      thoughts: "[Mock Mode] 我是一段被模擬出來的思考邏輯。",
      chat: `[Mock Mode] 我是 ${p.name}，這是模擬的發言！`,
      action: {
        vote: true,
        propose: Array.from({ length: teamRequired }, (_, i) => task.allPlayers[i].id),
        mission: 'success',
        assassinate: task.allPlayers.find(x => x.id !== p.id)?.id || 0
      }
    };
  }

  private getDummyBatch(task: QueuedTask): BatchLLMResponse {
    return {
      responses: task.targets.map((p, idx) => ({
        playerId: p.id,
        thoughts: `[Mock Mode] ${p.name} 的模擬思考。`,
        chat: idx % 2 === 0 ? `[Mock Mode] 我是 ${p.name}，我是好人！` : null, // mix of chat and silence
        action: {
          vote: Math.random() > 0.5,
          mission: p.side === 'good' ? 'success' : 'fail'
        }
      }))
    };
  }
}

export const llmManager = new LlmManager();
