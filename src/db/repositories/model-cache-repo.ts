// ─────────────────────────────────────────────────────────────
// Model Cache Repository — Cache discovered models from APIs
// ─────────────────────────────────────────────────────────────

import { db } from '../database';
import type { ModelInfo, ModelPreference } from '../../types/model';
import { MODEL_CACHE_TTL_MS } from '../../lib/constants';

export const modelCacheRepo = {
  async upsertModels(models: ModelInfo[]): Promise<void> {
    await db.modelCache.bulkPut(models);
  },

  async getByProvider(providerId: string): Promise<ModelInfo[]> {
    return db.modelCache.where('providerId').equals(providerId).toArray();
  },

  async getAll(): Promise<ModelInfo[]> {
    return db.modelCache.toArray();
  },

  async getAllValid(): Promise<ModelInfo[]> {
    const now = Date.now();
    return db.modelCache.filter(m => m.expiresAt > now).toArray();
  },

  async isExpired(providerId: string): Promise<boolean> {
    const models = await db.modelCache.where('providerId').equals(providerId).limit(1).toArray();
    if (models.length === 0) return true;
    return models[0].expiresAt < Date.now();
  },

  async clearProvider(providerId: string): Promise<void> {
    await db.modelCache.where('providerId').equals(providerId).delete();
  },

  async clearAll(): Promise<void> {
    await db.modelCache.clear();
  },

  // ── Model Preferences ─────────────────────────────

  async getPreference(modelCompoundId: string): Promise<ModelPreference | undefined> {
    return db.modelPreferences.get(modelCompoundId);
  },

  async setFavorite(modelCompoundId: string, isFavorite: boolean): Promise<void> {
    const existing = await db.modelPreferences.get(modelCompoundId);
    if (existing) {
      await db.modelPreferences.update(modelCompoundId, { isFavorite });
    } else {
      await db.modelPreferences.add({
        modelCompoundId,
        isFavorite,
        usageCount: 0,
      });
    }
  },

  async recordUsage(modelCompoundId: string): Promise<void> {
    const existing = await db.modelPreferences.get(modelCompoundId);
    if (existing) {
      await db.modelPreferences.update(modelCompoundId, {
        lastUsedAt: Date.now(),
        usageCount: existing.usageCount + 1,
      });
    } else {
      await db.modelPreferences.add({
        modelCompoundId,
        isFavorite: false,
        lastUsedAt: Date.now(),
        usageCount: 1,
      });
    }
  },

  async getFavorites(): Promise<ModelPreference[]> {
    return db.modelPreferences.where('isFavorite').equals(1).toArray();
  },

  async getRecent(limit = 5): Promise<ModelPreference[]> {
    return db.modelPreferences
      .orderBy('lastUsedAt')
      .reverse()
      .limit(limit)
      .toArray();
  },
};
