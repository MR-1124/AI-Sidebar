// ─────────────────────────────────────────────────────────────
// Model Types — Metadata and capabilities for AI models
// ─────────────────────────────────────────────────────────────

import type { ProviderId } from './provider';

/**
 * Comprehensive model information — cached after discovery.
 */
export interface ModelInfo {
  /** Unique compound key: `${providerId}:${modelId}` */
  id: string;
  /** Raw model ID as returned by the provider API. */
  modelId: string;
  /** Provider this model belongs to. */
  providerId: ProviderId;
  /** Human-readable display name. */
  displayName: string;
  /** Short description (if available from provider). */
  description?: string;

  // ── Capabilities ──────────────────────────────────
  contextWindow: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsReasoning: boolean;
  supportsStreaming: boolean;
  supportsJsonMode: boolean;
  supportsStructuredOutput: boolean;

  // ── Pricing (per million tokens) ──────────────────
  inputPricePerMToken: number;
  outputPricePerMToken: number;

  // ── Metadata ──────────────────────────────────────
  /** Categories: 'chat', 'coding', 'reasoning', 'vision', 'fast', etc. */
  tags: string[];
  /** Whether this model is deprecated by the provider. */
  deprecated: boolean;
  /** When this model info was cached. */
  cachedAt: number;
  /** When the cache expires (24h default). */
  expiresAt: number;
}

/**
 * User preferences for a specific model.
 */
export interface ModelPreference {
  modelCompoundId: string;   // `${providerId}:${modelId}`
  isFavorite: boolean;
  lastUsedAt?: number;
  usageCount: number;
  customLabel?: string;
}

/**
 * Filters for the model selector UI.
 */
export interface ModelFilter {
  search: string;
  providers: ProviderId[];
  capabilities: {
    vision?: boolean;
    tools?: boolean;
    reasoning?: boolean;
    jsonMode?: boolean;
  };
  sortBy: 'name' | 'price-asc' | 'price-desc' | 'context' | 'recent' | 'popular';
  showFavoritesOnly: boolean;
  showDeprecated: boolean;
}

/**
 * Grouped models for the selector dropdown.
 */
export interface ModelGroup {
  providerId: ProviderId;
  providerName: string;
  models: ModelInfo[];
}
