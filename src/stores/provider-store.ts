// ─────────────────────────────────────────────────────────────
// Provider Store — Manages provider configs and API keys
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';
import type { ProviderId, ProviderConfig, ProviderStatus } from '../types/provider';
import { STORAGE_KEYS } from '../lib/constants';
import { getAllProviderInfo } from '../providers/registry';

interface ProviderState {
  providers: Record<string, ProviderConfig>;
  loaded: boolean;

  loadProviders: () => Promise<void>;
  saveProviders: () => Promise<void>;

  setProviderConfig: (providerId: ProviderId, config: Partial<ProviderConfig>) => void;
  setProviderStatus: (providerId: ProviderId, status: ProviderStatus, error?: string) => void;
  removeProvider: (providerId: ProviderId) => void;

  getEnabledProviders: () => ProviderConfig[];
  getConfiguredProviders: () => ProviderConfig[];
  isProviderConfigured: (providerId: ProviderId) => boolean;
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  providers: {} as Record<string, ProviderConfig>,
  loaded: false,

  loadProviders: async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        const result = await chrome.storage.local.get(STORAGE_KEYS.PROVIDERS);
        const stored = (result[STORAGE_KEYS.PROVIDERS] || {}) as Record<string, ProviderConfig>;
        set({ providers: stored, loaded: true });
        return;
      }
    } catch (e) {
      console.warn('Failed to load providers:', e);
    }
    set({ loaded: true });
  },

  saveProviders: async () => {
    const { providers } = get();
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.set({ [STORAGE_KEYS.PROVIDERS]: providers });
      }
    } catch (e) {
      console.warn('Failed to save providers:', e);
    }
  },

  setProviderConfig: (providerId, config) => {
    set((s) => ({
      providers: {
        ...s.providers,
        [providerId]: {
          ...s.providers[providerId],
          providerId,
          isEnabled: true,
          status: 'valid' as ProviderStatus,
          ...config,
        } as ProviderConfig,
      },
    }));
    get().saveProviders();
  },

  setProviderStatus: (providerId, status, error) => {
    set((s) => {
      const existing = s.providers[providerId];
      if (!existing) return s;
      return {
        providers: {
          ...s.providers,
          [providerId]: {
            ...existing,
            status,
            validationError: error,
            lastValidated: Date.now(),
          },
        },
      };
    });
    get().saveProviders();
  },

  removeProvider: (providerId) => {
    set((s) => {
      const next = { ...s.providers };
      delete next[providerId];
      return { providers: next };
    });
    get().saveProviders();
  },

  getEnabledProviders: () => {
    const { providers } = get();
    return Object.values(providers).filter(p => p.isEnabled && p.status === 'valid');
  },

  getConfiguredProviders: () => {
    const { providers } = get();
    return Object.values(providers).filter(p => p.encryptedApiKey);
  },

  isProviderConfigured: (providerId) => {
    const { providers } = get();
    return !!providers[providerId]?.encryptedApiKey;
  },
}));
