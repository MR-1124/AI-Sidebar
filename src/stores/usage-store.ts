// ─────────────────────────────────────────────────────────────
// Usage Store — Token usage and cost tracking
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';
import type { UsageRecord } from '../types/analytics';
import { usageRepo } from '../db/repositories/usage-repo';

interface UsageState {
  totalCost: number;
  totalTokens: number;
  records: UsageRecord[];
  loaded: boolean;

  loadUsageSummary: () => Promise<void>;
  recordUsage: (record: Omit<UsageRecord, 'id' | 'createdAt'>) => Promise<void>;
}

export const useUsageStore = create<UsageState>((set, get) => ({
  totalCost: 0,
  totalTokens: 0,
  records: [],
  loaded: false,

  loadUsageSummary: async () => {
    try {
      const records = await usageRepo.getAll();
      const cost = records.reduce((sum, r) => sum + r.estimatedCost, 0);
      const tokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
      set({ totalCost: cost, totalTokens: tokens, records, loaded: true });
    } catch (e) {
      console.warn('Failed to load usage summary:', e);
      set({ loaded: true });
    }
  },

  recordUsage: async (recordParams) => {
    const record = await usageRepo.create(recordParams);
    set((s) => ({
      totalCost: s.totalCost + record.estimatedCost,
      totalTokens: s.totalTokens + record.totalTokens,
      records: [...s.records, record],
    }));
  },
}));
