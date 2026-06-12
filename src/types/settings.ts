// ─────────────────────────────────────────────────────────────
// Settings Types — User preferences and configuration
// ─────────────────────────────────────────────────────────────

import type { ProviderId } from './provider';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface GeneralSettings {
  theme: ThemeMode;
  language: string;           // ISO 639-1 (e.g., 'en')
  sidebarWidth: number;       // pixels
  sidebarCollapsed: boolean;
  startupBehavior: 'last-chat' | 'new-chat' | 'home';
  sendOnEnter: boolean;
  showTokenCount: boolean;
  showCostEstimate: boolean;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  prompt: string;
  isCustom: boolean;
}

export interface ChatSettings {
  autoGenerateTitle: boolean;
  autoSave: boolean;
  /** Days to retain conversations (0 = forever). */
  retentionDays: number;
  defaultSystemPrompt: string; // legacy, keeping for backward compatibility
  activePersonaId: string | null;
  personas: Persona[];
  streamResponses: boolean;
  lastActiveConversationId?: string | null;
}

export interface ModelSettings {
  defaultProviderId: ProviderId | null;
  defaultModelId: string | null;
  /** Default parameters applied to all chats. */
  defaultTemperature: number;
  defaultMaxTokens: number;
  defaultTopP: number;
  favoriteModels?: string[];
}

export interface PrivacySettings {
  /** Enable encryption with user passphrase (beyond base encryption). */
  enablePassphraseEncryption: boolean;
  /** Whether to collect anonymous usage analytics (local only). */
  enableLocalAnalytics: boolean;
}

export interface ExportSettings {
  defaultFormat: 'markdown' | 'json' | 'txt';
  includeMetadata: boolean;
  includeTimestamps: boolean;
  includeTokenUsage: boolean;
}

export interface KeyboardShortcut {
  id: string;
  label: string;
  description: string;
  keys: string[];             // e.g., ['Ctrl', 'Shift', 'L']
  action: string;
  isCustom: boolean;
}

export interface ToolsSettings {
  searchEngine: 'tavily' | 'duckduckgo';
  tavilyApiKey?: string;
  enableBrowserInteraction: boolean;
  browserInteractionPermission: 'ask' | 'automatic';
}

/**
 * Root settings object — persisted in chrome.storage.local.
 */
export interface AppSettings {
  general: GeneralSettings;
  chat: ChatSettings;
  model: ModelSettings;
  privacy: PrivacySettings;
  export: ExportSettings;
  keyboardShortcuts: KeyboardShortcut[];
  tools: ToolsSettings;
  /** Tracks whether onboarding is complete. */
  onboardingCompleted: boolean;
  /** Schema version for future migrations. */
  settingsVersion: number;
}
