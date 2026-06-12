// ─────────────────────────────────────────────────────────────
// Provider Types — Interface contract for all LLM providers
// ─────────────────────────────────────────────────────────────

import type { ProviderId, ProviderInfo, ProviderCapabilities, ParameterSchema, ValidationResult } from '../types/provider';
import type { ChatRequest, ChatStreamEvent } from '../types/chat';
import type { ModelInfo } from '../types/model';

/**
 * Core provider interface — every provider adapter must implement this.
 * This is the primary extension point: add a new provider by implementing this.
 */
export interface LLMProvider {
  /** Static provider info (icon, name, docs URL). */
  readonly info: ProviderInfo;

  /** Validate that an API key is correct by making a lightweight API call. */
  validateApiKey(apiKey: string, customBaseUrl?: string): Promise<ValidationResult>;

  /** Discover available models for this provider. */
  listModels(apiKey: string, customBaseUrl?: string): Promise<ModelInfo[]>;

  /** Stream a chat completion. Yields chunks, ends with 'end' or 'error'. */
  createChatCompletion(
    apiKey: string,
    request: ChatRequest,
    customBaseUrl?: string,
    signal?: AbortSignal
  ): AsyncGenerator<ChatStreamEvent, void, unknown>;

  /** Provider capabilities (what features are supported). */
  getCapabilities(): ProviderCapabilities;

  /** Configurable parameter schema for the settings UI. */
  getParameterSchema(): ParameterSchema;
}

/**
 * Configuration for OpenAI-compatible providers.
 * Instead of implementing LLMProvider from scratch, providers that expose
 * the OpenAI API format only need to provide this config object.
 */
export interface OpenAICompatibleConfig {
  info: ProviderInfo;
  baseUrl: string;
  /** Header format for auth. Default: 'Bearer'. */
  authHeaderPrefix?: string;
  /** Custom auth header name. Default: 'Authorization'. */
  authHeaderName?: string;
  /** Endpoint for listing models. Default: '/v1/models'. */
  modelsEndpoint?: string;
  /** Endpoint for chat completions. Default: '/v1/chat/completions'. */
  chatEndpoint?: string;
  /** Filter function to select only chat models from the full list. */
  modelFilter?: (model: any) => boolean;
  /** Transform function for the model list response. */
  modelsResponseTransform?: (response: any) => any[];
  /** Transform the request before sending (add provider-specific fields). */
  requestTransform?: (request: any) => any;
  /** Provider capabilities. */
  capabilities: ProviderCapabilities;
  /** Extra headers to include in every request. */
  extraHeaders?: Record<string, string>;
  /** Parameter schema (merged with common OpenAI params). */
  extraParameters?: ParameterSchema;
}
