// ─────────────────────────────────────────────────────────────
// Static Pricing Data — fallback when providers don't report pricing
// Prices are per million tokens in USD.
// Updated: 2025-06 — maintain manually or fetch from OpenRouter.
// ─────────────────────────────────────────────────────────────

import type { ProviderId } from '../types/provider';

interface ModelPricing {
  inputPricePerMToken: number;
  outputPricePerMToken: number;
  contextWindow: number;
  maxOutputTokens: number;
}

/**
 * Keyed by `${providerId}:${modelId}` or just the model ID slug
 * for OpenAI-compatible providers that use standard model names.
 */
export const PRICING: Record<string, ModelPricing> = {
  // ── OpenAI ──────────────────────────────────────────
  'openai:gpt-4o': { inputPricePerMToken: 2.5, outputPricePerMToken: 10, contextWindow: 128000, maxOutputTokens: 16384 },
  'openai:gpt-4o-mini': { inputPricePerMToken: 0.15, outputPricePerMToken: 0.6, contextWindow: 128000, maxOutputTokens: 16384 },
  'openai:gpt-4.1': { inputPricePerMToken: 2, outputPricePerMToken: 8, contextWindow: 1047576, maxOutputTokens: 32768 },
  'openai:gpt-4.1-mini': { inputPricePerMToken: 0.4, outputPricePerMToken: 1.6, contextWindow: 1047576, maxOutputTokens: 32768 },
  'openai:gpt-4.1-nano': { inputPricePerMToken: 0.1, outputPricePerMToken: 0.4, contextWindow: 1047576, maxOutputTokens: 32768 },
  'openai:o4-mini': { inputPricePerMToken: 1.1, outputPricePerMToken: 4.4, contextWindow: 200000, maxOutputTokens: 100000 },
  'openai:o3': { inputPricePerMToken: 10, outputPricePerMToken: 40, contextWindow: 200000, maxOutputTokens: 100000 },

  // ── Anthropic ───────────────────────────────────────
  'anthropic:claude-sonnet-4-20250514': { inputPricePerMToken: 3, outputPricePerMToken: 15, contextWindow: 200000, maxOutputTokens: 16384 },
  'anthropic:claude-3-5-haiku-20241022': { inputPricePerMToken: 0.8, outputPricePerMToken: 4, contextWindow: 200000, maxOutputTokens: 8192 },
  'anthropic:claude-opus-4-20250514': { inputPricePerMToken: 15, outputPricePerMToken: 75, contextWindow: 200000, maxOutputTokens: 32000 },

  // ── DeepSeek ────────────────────────────────────────
  'deepseek:deepseek-chat': { inputPricePerMToken: 0.27, outputPricePerMToken: 1.10, contextWindow: 65536, maxOutputTokens: 8192 },
  'deepseek:deepseek-reasoner': { inputPricePerMToken: 0.55, outputPricePerMToken: 2.19, contextWindow: 65536, maxOutputTokens: 8192 },

  // ── Google Gemini ───────────────────────────────────
  'gemini:gemini-2.5-flash': { inputPricePerMToken: 0.15, outputPricePerMToken: 0.6, contextWindow: 1048576, maxOutputTokens: 65536 },
  'gemini:gemini-2.5-pro': { inputPricePerMToken: 1.25, outputPricePerMToken: 10, contextWindow: 1048576, maxOutputTokens: 65536 },

  // ── Groq ────────────────────────────────────────────
  'groq:llama-3.3-70b-versatile': { inputPricePerMToken: 0.59, outputPricePerMToken: 0.79, contextWindow: 128000, maxOutputTokens: 32768 },
  'groq:llama-3.1-8b-instant': { inputPricePerMToken: 0.05, outputPricePerMToken: 0.08, contextWindow: 128000, maxOutputTokens: 8192 },
  'groq:gemma2-9b-it': { inputPricePerMToken: 0.20, outputPricePerMToken: 0.20, contextWindow: 8192, maxOutputTokens: 8192 },

  // ── Mistral ─────────────────────────────────────────
  'mistral:mistral-large-latest': { inputPricePerMToken: 2, outputPricePerMToken: 6, contextWindow: 128000, maxOutputTokens: 8192 },
  'mistral:mistral-small-latest': { inputPricePerMToken: 0.1, outputPricePerMToken: 0.3, contextWindow: 32000, maxOutputTokens: 8192 },
  'mistral:codestral-latest': { inputPricePerMToken: 0.3, outputPricePerMToken: 0.9, contextWindow: 256000, maxOutputTokens: 8192 },
};

/**
 * Look up pricing for a model. Falls back to zero if unknown.
 */
export function getModelPricing(providerId: ProviderId, modelId: string): ModelPricing {
  const key = `${providerId}:${modelId}`;
  return PRICING[key] ?? {
    inputPricePerMToken: 0,
    outputPricePerMToken: 0,
    contextWindow: 4096,
    maxOutputTokens: 4096,
  };
}
