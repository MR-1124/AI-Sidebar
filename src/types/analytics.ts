// ─────────────────────────────────────────────────────────────
// Analytics Types — Usage tracking, cost, and performance
// ─────────────────────────────────────────────────────────────

import type { ProviderId } from './provider';

/**
 * Individual usage record — created for each assistant response.
 */
export interface UsageRecord {
  id: string;
  messageId: string;
  conversationId: string;
  providerId: ProviderId;
  modelId: string;

  // ── Token usage ───────────────────────────────────
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  // ── Cost ──────────────────────────────────────────
  estimatedCost: number;       // USD

  // ── Performance ───────────────────────────────────
  latencyMs: number;           // Total response time
  firstTokenLatencyMs: number; // Time to first token
  tokensPerSecond: number;     // Generation speed

  // ── Metadata ──────────────────────────────────────
  success: boolean;
  errorMessage?: string;
  createdAt: number;
}

/**
 * Aggregated usage stats for a time period.
 */
export interface UsageSummary {
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
  startDate: number;
  endDate: number;

  totalChats: number;
  totalMessages: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCost: number;

  /** Breakdown by provider. */
  byProvider: Record<ProviderId, {
    messages: number;
    tokens: number;
    cost: number;
  }>;

  /** Breakdown by model. */
  byModel: Record<string, {
    messages: number;
    tokens: number;
    cost: number;
  }>;
}

/**
 * Performance metrics for a provider/model.
 */
export interface PerformanceMetrics {
  providerId: ProviderId;
  modelId: string;
  avgLatencyMs: number;
  avgFirstTokenMs: number;
  avgTokensPerSecond: number;
  successRate: number;
  totalRequests: number;
  failedRequests: number;
}

/**
 * Daily usage data point for charts.
 */
export interface DailyUsage {
  date: string;              // YYYY-MM-DD
  messages: number;
  tokens: number;
  cost: number;
  providerId?: ProviderId;
}
