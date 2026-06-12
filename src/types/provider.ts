// ─────────────────────────────────────────────────────────────
// Provider Types — Core abstraction for all LLM providers
// ─────────────────────────────────────────────────────────────

/**
 * Unique identifier for each supported provider.
 * Adding a new provider = adding a new literal here + a config/adapter.
 */
export type ProviderId =
  | 'openai'
  | 'anthropic'
  | 'openrouter'
  | 'nvidia'
  | 'deepseek'
  | 'gemini'
  | 'groq'
  | 'mistral'
  | 'together'
  | 'cohere'
  | 'ollama'
  | 'lmstudio';

/**
 * Provider connection/validation status.
 */
export type ProviderStatus =
  | 'unconfigured'  // No API key entered
  | 'validating'    // Key validation in progress
  | 'valid'         // Key validated, models loaded
  | 'invalid'       // Key validation failed
  | 'error';        // Network or other error

/**
 * Result of API key validation.
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  /** Provider-specific info returned on success (e.g., account name, quota). */
  metadata?: Record<string, unknown>;
}

/**
 * Provider capabilities — what features this provider supports.
 */
export interface ProviderCapabilities {
  streaming: boolean;
  vision: boolean;
  toolCalling: boolean;
  jsonMode: boolean;
  structuredOutput: boolean;
  reasoning: boolean;
  systemPrompt: boolean;
  /** Max number of concurrent requests (0 = unlimited). */
  maxConcurrent: number;
}

/**
 * Static metadata about a provider (does not change at runtime).
 */
export interface ProviderInfo {
  id: ProviderId;
  name: string;
  description: string;
  icon: string;              // Lucide icon name or SVG path
  docsUrl: string;
  apiKeyUrl: string;         // URL to create/manage API keys
  /** Pattern to validate key format before hitting the network. */
  apiKeyPattern?: RegExp;
  /** Placeholder text for the API key input. */
  apiKeyPlaceholder: string;
}

/**
 * Runtime configuration for a provider (stored in chrome.storage).
 */
export interface ProviderConfig {
  providerId: ProviderId;
  encryptedApiKey: string;
  iv: string;                // Base64 encoded AES-GCM IV
  salt: string;              // Base64 encoded PBKDF2 salt
  isEnabled: boolean;
  status: ProviderStatus;
  lastValidated?: number;    // Unix timestamp
  validationError?: string;
  customBaseUrl?: string;    // Override default Base URL (e.g. for localhost models)
}

/**
 * Schema for a single configurable parameter.
 * Used to generate the advanced parameters UI dynamically.
 */
export interface ParameterDef {
  key: string;
  label: string;
  description: string;
  type: 'number' | 'string' | 'boolean' | 'select' | 'string-array';
  default: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: unknown }[];
  /** If true, this parameter is only available for this provider. */
  providerSpecific?: boolean;
}

/**
 * Full parameter schema for a provider's chat completion API.
 */
export interface ParameterSchema {
  parameters: ParameterDef[];
}
