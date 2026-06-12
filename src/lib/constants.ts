// ─────────────────────────────────────────────────────────────
// App-wide Constants
// ─────────────────────────────────────────────────────────────

/** Default sidebar width in pixels. */
export const DEFAULT_SIDEBAR_WIDTH = 420;
export const MIN_SIDEBAR_WIDTH = 320;
export const MAX_SIDEBAR_WIDTH = 800;

/** Model cache TTL: 24 hours. */
export const MODEL_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Maximum conversation title length. */
export const MAX_TITLE_LENGTH = 100;

/** Default number of messages to load per page. */
export const MESSAGES_PAGE_SIZE = 50;

/** Settings schema version — increment on breaking changes. */
export const SETTINGS_VERSION = 1;

/** Chrome storage keys. */
export const STORAGE_KEYS = {
  SETTINGS: 'ais_settings',
  PROVIDERS: 'ais_providers',
  ENCRYPTION_VERIFY: 'ais_encryption_verify',
} as const;

/** IndexedDB database name. */
export const DB_NAME = 'UniversalAISidebar';
export const DB_VERSION = 1;

/** Port name for streaming connections. */
export const STREAM_PORT_NAME = 'ais-stream';

import type { KeyboardShortcut } from '../types/settings';

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { id: 'new-chat', label: 'New Chat', description: 'Start a new conversation', keys: ['Alt', 'N'], action: 'newChat', isCustom: false },
  { id: 'toggle-sidebar', label: 'Toggle Sidebar', description: 'Show/hide chat list', keys: ['Alt', 'B'], action: 'toggleSidebar', isCustom: false },
  { id: 'search', label: 'Search', description: 'Search conversations', keys: ['Alt', 'K'], action: 'search', isCustom: false },
  { id: 'settings', label: 'Settings', description: 'Open settings', keys: ['Alt', ','], action: 'openSettings', isCustom: false },
  { id: 'focus-input', label: 'Focus Input', description: 'Focus the message input', keys: ['Alt', 'L'], action: 'focusInput', isCustom: false },
  { id: 'stop-generation', label: 'Stop Generation', description: 'Stop the current response', keys: ['Escape'], action: 'stopGeneration', isCustom: false },
];
