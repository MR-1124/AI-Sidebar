// ─────────────────────────────────────────────────────────────
// Model Store — Available models, preferences, selection
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';
import type { ModelInfo, ModelGroup } from '../types/model';
import type { ProviderId } from '../types/provider';
import { modelCacheRepo } from '../db/repositories/model-cache-repo';
import { getAllProviderInfo } from '../providers/registry';
import { useSettingsStore } from './settings-store';

interface ModelState {
  models: ModelInfo[];
  loaded: boolean;
  loading: boolean;

  // ── Currently selected model ─────────────────────
  selectedProviderId: ProviderId | null;
  selectedModelId: string | null;

  loadModels: () => Promise<void>;
  setModels: (providerId: ProviderId, models: ModelInfo[]) => void;
  selectModel: (providerId: ProviderId, modelId: string) => void;
  getModelsByProvider: (providerId: ProviderId) => ModelInfo[];
  getSelectedModel: () => ModelInfo | undefined;
  getGroupedModels: () => ModelGroup[];
  refreshModels: (providerId: ProviderId) => Promise<void>;
}

export const useModelStore = create<ModelState>((set, get) => ({
  models: [],
  loaded: false,
  loading: false,
  selectedProviderId: null,
  selectedModelId: null,

  loadModels: async () => {
    set({ loading: true });
    try {
      const cached = await modelCacheRepo.getAllValid();
      set({ models: cached, loaded: true, loading: false });
    } catch (e) {
      console.warn('Failed to load models:', e);
      set({ loaded: true, loading: false });
    }
  },

  refreshModels: async (providerId) => {
    try {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'LIST_MODELS', payload: { providerId } },
          resolve
        );
      });
      if (response && response.payload && response.payload.models) {
        get().setModels(providerId, response.payload.models);
      }
    } catch (e) {
      console.warn(`Failed to refresh models for ${providerId}:`, e);
    }
  },

  setModels: (providerId, newModels) => {
    set((s) => {
      // Replace models for this provider, keep others
      const otherModels = s.models.filter(m => m.providerId !== providerId);
      return { models: [...otherModels, ...newModels] };
    });
    // Persist to IndexedDB
    modelCacheRepo.upsertModels(newModels).catch(console.warn);
  },

  selectModel: (providerId, modelId) => {
    set({ selectedProviderId: providerId, selectedModelId: modelId });
    useSettingsStore.getState().setDefaultModel(providerId, modelId);
    // Track usage
    modelCacheRepo.recordUsage(`${providerId}:${modelId}`).catch(console.warn);
  },

  getModelsByProvider: (providerId) => {
    return get().models.filter(m => m.providerId === providerId);
  },

  getSelectedModel: () => {
    const { models, selectedProviderId, selectedModelId } = get();
    if (!selectedProviderId || !selectedModelId) return undefined;
    return models.find(
      m => m.providerId === selectedProviderId && m.modelId === selectedModelId
    );
  },

  getGroupedModels: () => {
    const { models } = get();
    const providerInfoList = getAllProviderInfo();
    const groups: ModelGroup[] = [];

    for (const info of providerInfoList) {
      const providerModels = models.filter(m => m.providerId === info.id);
      if (providerModels.length > 0) {
        groups.push({
          providerId: info.id,
          providerName: info.name,
          models: providerModels.sort((a, b) => a.displayName.localeCompare(b.displayName)),
        });
      }
    }

    return groups;
  },
}));
