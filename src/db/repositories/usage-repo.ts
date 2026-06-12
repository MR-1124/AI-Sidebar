// ─────────────────────────────────────────────────────────────
// Usage Repository — Track token usage, cost, performance
// ─────────────────────────────────────────────────────────────

import { db } from '../database';
import type { UsageRecord } from '../../types/analytics';
import { generateId } from '../../lib/utils';

export const usageRepo = {
  async create(params: Omit<UsageRecord, 'id' | 'createdAt'>): Promise<UsageRecord> {
    const record: UsageRecord = {
      ...params,
      id: generateId(),
      createdAt: Date.now(),
    };
    await db.usageRecords.add(record);
    return record;
  },

  async getByDateRange(startDate: number, endDate: number): Promise<UsageRecord[]> {
    return db.usageRecords
      .where('createdAt')
      .between(startDate, endDate)
      .toArray();
  },

  async getAll(): Promise<UsageRecord[]> {
    return db.usageRecords.toArray();
  },

  async getByProvider(providerId: string, limit = 100): Promise<UsageRecord[]> {
    return db.usageRecords
      .where('providerId')
      .equals(providerId)
      .reverse()
      .limit(limit)
      .toArray();
  },

  async getTotalCost(startDate?: number, endDate?: number): Promise<number> {
    let records: UsageRecord[];
    if (startDate && endDate) {
      records = await db.usageRecords.where('createdAt').between(startDate, endDate).toArray();
    } else {
      records = await db.usageRecords.toArray();
    }
    return records.reduce((sum, r) => sum + r.estimatedCost, 0);
  },

  async getTotalTokens(startDate?: number, endDate?: number): Promise<{ prompt: number; completion: number; total: number }> {
    let records: UsageRecord[];
    if (startDate && endDate) {
      records = await db.usageRecords.where('createdAt').between(startDate, endDate).toArray();
    } else {
      records = await db.usageRecords.toArray();
    }
    return records.reduce(
      (acc, r) => ({
        prompt: acc.prompt + r.promptTokens,
        completion: acc.completion + r.completionTokens,
        total: acc.total + r.totalTokens,
      }),
      { prompt: 0, completion: 0, total: 0 }
    );
  },

  async count(): Promise<number> {
    return db.usageRecords.count();
  },
};
