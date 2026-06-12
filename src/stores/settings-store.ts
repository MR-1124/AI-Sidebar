// ─────────────────────────────────────────────────────────────
// Settings Store — User preferences (persisted to chrome.storage)
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';
import type { AppSettings, ThemeMode, Persona } from '../types/settings';
import type { ProviderId } from '../types/provider';
import { STORAGE_KEYS, SETTINGS_VERSION, DEFAULT_SHORTCUTS } from '../lib/constants';

const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'general-assistant',
    name: 'General Assistant',
    description: 'Helpful, versatile, and concise assistant.',
    prompt: 'You are a helpful and concise AI assistant.',
    isCustom: false
  },
  {
    id: 'expert-programmer',
    name: 'Expert Programmer',
    description: 'Strict, best-practices-focused coding assistant.',
    prompt: 'You are an expert programmer. You provide clean, secure, and well-documented code. You prioritize best practices and explain your reasoning concisely.',
    isCustom: false
  },
  {
    id: 'creative-copywriter',
    name: 'Creative Copywriter',
    description: 'Engaging, marketing-focused writing assistant.',
    prompt: 'You are a creative copywriter. Your tone is engaging, persuasive, and tailored to the target audience. Focus on high-impact vocabulary and clear formatting.',
    isCustom: false
  },
  {
    id: 'concise-summarizer',
    name: 'Concise Summarizer',
    description: 'Extracts key facts with absolutely zero fluff.',
    prompt: 'You are a precise summarizer. Output only the absolute most critical facts and takeaways using bullet points. Do not include any conversational filler.',
    isCustom: false
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  general: {
    theme: 'dark',
    language: 'en',
    sidebarWidth: 420,
    sidebarCollapsed: false,
    startupBehavior: 'last-chat',
    sendOnEnter: true,
    showTokenCount: true,
    showCostEstimate: true,
  },
  chat: {
    autoGenerateTitle: true,
    autoSave: true,
    retentionDays: 0,
    defaultSystemPrompt: '',
    activePersonaId: 'general-assistant',
    personas: DEFAULT_PERSONAS,
    streamResponses: true,
    lastActiveConversationId: null,
  },
  model: {
    defaultProviderId: null,
    defaultModelId: null,
    defaultTemperature: 1,
    defaultMaxTokens: 4096,
    defaultTopP: 1,
    favoriteModels: [],
  },
  privacy: {
    enablePassphraseEncryption: false,
    enableLocalAnalytics: true,
  },
  export: {
    defaultFormat: 'markdown',
    includeMetadata: true,
    includeTimestamps: true,
    includeTokenUsage: false,
  },
  tools: {
    searchEngine: 'duckduckgo',
    tavilyApiKey: '',
    enableBrowserInteraction: false,
    browserInteractionPermission: 'ask',
  },
  keyboardShortcuts: [...DEFAULT_SHORTCUTS],
  onboardingCompleted: false,
  settingsVersion: SETTINGS_VERSION,
};

interface SettingsState {
  settings: AppSettings;
  loaded: boolean;

  // ── Loaders ──────────────────────────────────────
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;

  // ── Setters ──────────────────────────────────────
  updateGeneral: (updates: Partial<AppSettings['general']>) => void;
  updateChat: (updates: Partial<AppSettings['chat']>) => void;
  updateModel: (updates: Partial<AppSettings['model']>) => void;
  updatePrivacy: (updates: Partial<AppSettings['privacy']>) => void;
  updateExport: (updates: Partial<AppSettings['export']>) => void;
  updateTools: (updates: Partial<AppSettings['tools']>) => void;
  setTheme: (theme: ThemeMode) => void;
  setDefaultModel: (providerId: ProviderId, modelId: string) => void;
  toggleFavoriteModel: (providerModelId: string) => void;
  completeOnboarding: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  loadSettings: async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        const stored = result[STORAGE_KEYS.SETTINGS] as (Partial<AppSettings> & { _encTavily?: { ciphertext: string; iv: string; salt: string } }) | undefined;
        if (stored) {
          // Decrypt Tavily API key if it was stored encrypted
          let decryptedTavilyKey = '';
          if (stored._encTavily) {
            try {
              const { encryptApiKey, decryptApiKey } = await import('../background/crypto');
              decryptedTavilyKey = await decryptApiKey(stored._encTavily);
            } catch {
              console.warn('Failed to decrypt Tavily API key');
            }
          } else if (stored.tools?.tavilyApiKey) {
            // Migration: old unencrypted key — will be encrypted on next save
            decryptedTavilyKey = stored.tools.tavilyApiKey;
          }

          set({
            settings: {
              general: { ...DEFAULT_SETTINGS.general, ...(stored.general || {}) },
              chat: { ...DEFAULT_SETTINGS.chat, ...(stored.chat || {}) },
              model: { ...DEFAULT_SETTINGS.model, ...(stored.model || {}) },
              privacy: { ...DEFAULT_SETTINGS.privacy, ...(stored.privacy || {}) },
              export: { ...DEFAULT_SETTINGS.export, ...(stored.export || {}) },
              tools: {
                ...DEFAULT_SETTINGS.tools,
                ...(stored.tools || {}),
                tavilyApiKey: decryptedTavilyKey, // Always use decrypted key in state
              },
              keyboardShortcuts: stored.keyboardShortcuts || DEFAULT_SETTINGS.keyboardShortcuts,
              onboardingCompleted: stored.onboardingCompleted ?? DEFAULT_SETTINGS.onboardingCompleted,
              settingsVersion: stored.settingsVersion || DEFAULT_SETTINGS.settingsVersion,
            },
            loaded: true,
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load settings from chrome.storage:', e);
    }
    set({ loaded: true });
  },

  saveSettings: async () => {
    const { settings } = get();
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        // Clone settings and encrypt Tavily key before writing to storage
        const toStore: any = { ...settings };
        if (settings.tools.tavilyApiKey) {
          try {
            const { encryptApiKey } = await import('../background/crypto');
            const encrypted = await encryptApiKey(settings.tools.tavilyApiKey);
            toStore._encTavily = encrypted;
            toStore.tools = { ...settings.tools, tavilyApiKey: '' }; // Don't store plaintext
          } catch {
            // If encryption fails (e.g. in content script context), store as-is
            console.warn('Could not encrypt Tavily key, saving as-is');
          }
        }
        await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: toStore });
      }
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  },

  updateGeneral: (updates) => {
    set((s) => ({
      settings: {
        ...s.settings,
        general: { ...s.settings.general, ...updates },
      },
    }));
    get().saveSettings();
  },

  updateChat: (updates) => {
    set((s) => ({
      settings: {
        ...s.settings,
        chat: { ...s.settings.chat, ...updates },
      },
    }));
    get().saveSettings();
  },

  updateModel: (updates) => {
    set((s) => ({
      settings: {
        ...s.settings,
        model: { ...s.settings.model, ...updates },
      },
    }));
    get().saveSettings();
  },

  updatePrivacy: (updates) => {
    set((s) => ({
      settings: {
        ...s.settings,
        privacy: { ...s.settings.privacy, ...updates },
      },
    }));
    get().saveSettings();
  },

  updateExport: (updates) => {
    set((s) => ({
      settings: {
        ...s.settings,
        export: { ...s.settings.export, ...updates },
      },
    }));
    get().saveSettings();
  },

  updateTools: (updates) => {
    set((s) => ({
      settings: {
        ...s.settings,
        tools: { ...s.settings.tools, ...updates },
      },
    }));
    get().saveSettings();
  },

  setTheme: (theme) => {
    set((s) => ({
      settings: {
        ...s.settings,
        general: { ...s.settings.general, theme },
      },
    }));
    get().saveSettings();
  },

  setDefaultModel: (providerId, modelId) => {
    set((s) => ({
      settings: {
        ...s.settings,
        model: {
          ...s.settings.model,
          defaultProviderId: providerId,
          defaultModelId: modelId,
        },
      },
    }));
    get().saveSettings();
  },

  toggleFavoriteModel: (providerModelId) => {
    set((s) => {
      const currentFavorites = s.settings.model.favoriteModels || [];
      const isFavorite = currentFavorites.includes(providerModelId);
      const newFavorites = isFavorite
        ? currentFavorites.filter((id) => id !== providerModelId)
        : [...currentFavorites, providerModelId];
        
      return {
        settings: {
          ...s.settings,
          model: {
            ...s.settings.model,
            favoriteModels: newFavorites,
          },
        },
      };
    });
    get().saveSettings();
  },

  completeOnboarding: () => {
    set((s) => ({
      settings: { ...s.settings, onboardingCompleted: true },
    }));
    get().saveSettings();
  },
}));
