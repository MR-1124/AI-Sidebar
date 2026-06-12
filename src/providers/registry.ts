// ─────────────────────────────────────────────────────────────
// Provider Registry — Central registry of all LLM providers
// ─────────────────────────────────────────────────────────────

import type { LLMProvider } from './types';
import type { ProviderId, ProviderInfo } from '../types/provider';
import { createOpenAICompatibleProvider } from './base/openai-compatible';

// Provider configs
import { openaiConfig } from './openai/config';
import { openrouterConfig } from './openrouter/config';
import { deepseekConfig } from './deepseek/config';
import { groqConfig } from './groq/config';
import { nvidiaConfig } from './nvidia/config';
import { togetherConfig } from './together/config';
import { mistralConfig } from './mistral/config';
import { ollamaConfig } from './ollama/config';
import { lmstudioConfig } from './lmstudio/config';
import { cohereConfig } from './cohere/config';

// Custom adapters
import { anthropicAdapter } from './anthropic/adapter';
import { geminiAdapter } from './gemini/adapter';

/**
 * Provider registry — single source of truth for all available providers.
 */
const registry = new Map<ProviderId, LLMProvider>();

// ── Register OpenAI-compatible providers (8) ──────────────
const openAICompatibleConfigs = [
  openaiConfig,
  openrouterConfig,
  deepseekConfig,
  groqConfig,
  nvidiaConfig,
  togetherConfig,
  mistralConfig,
  ollamaConfig,
  lmstudioConfig,
  cohereConfig,
];

for (const config of openAICompatibleConfigs) {
  registry.set(config.info.id, createOpenAICompatibleProvider(config));
}

// ── Register custom adapters (2) ──────────────────────────
registry.set('anthropic', anthropicAdapter);
registry.set('gemini', geminiAdapter);

// ── Public API ────────────────────────────────────────────

/**
 * Get a provider by ID.
 */
export function getProvider(id: ProviderId): LLMProvider | undefined {
  return registry.get(id);
}

/**
 * Get all registered providers.
 */
export function getAllProviders(): LLMProvider[] {
  return Array.from(registry.values());
}

/**
 * Get all provider info objects (for UI listing).
 */
export function getAllProviderInfo(): ProviderInfo[] {
  return Array.from(registry.values()).map(p => p.info);
}

/**
 * Get the number of registered providers.
 */
export function getProviderCount(): number {
  return registry.size;
}

/**
 * Check if a provider is registered.
 */
export function hasProvider(id: ProviderId): boolean {
  return registry.has(id);
}

/**
 * Register a new provider at runtime (for future plugins).
 */
export function registerProvider(provider: LLMProvider): void {
  registry.set(provider.info.id, provider);
}
