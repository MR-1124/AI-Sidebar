// ─────────────────────────────────────────────────────────────
// Database — Dexie.js (IndexedDB wrapper) schema definition
// ─────────────────────────────────────────────────────────────

import Dexie, { type EntityTable } from 'dexie';
import type { Conversation, Message, Folder } from '../types/chat';
import type { UsageRecord } from '../types/analytics';
import type { ModelInfo, ModelPreference } from '../types/model';
import { DB_NAME } from '../lib/constants';

/**
 * Application database — all large, queryable data lives here.
 * 
 * chrome.storage.local is reserved for small, critical data
 * (settings, encrypted API keys) that needs to survive extension updates.
 */
export class AppDatabase extends Dexie {
  conversations!: EntityTable<Conversation, 'id'>;
  messages!: EntityTable<Message, 'id'>;
  folders!: EntityTable<Folder, 'id'>;
  usageRecords!: EntityTable<UsageRecord, 'id'>;
  modelCache!: EntityTable<ModelInfo, 'id'>;
  modelPreferences!: EntityTable<ModelPreference, 'modelCompoundId'>;

  prompts!: EntityTable<import('./repositories/prompt-repo').PromptTemplate, 'id'>;

  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      // Index design: only index fields used in queries/filters.
      // The full objects are stored but only indexed fields are searchable.
      conversations: [
        'id',
        'folderId',
        'providerId',
        'isPinned',
        'isFavorite',
        'isArchived',
        'createdAt',
        'updatedAt',
        'lastMessageAt',
        // Compound index for sorted listing
        '[isArchived+lastMessageAt]',
      ].join(', '),

      messages: [
        'id',
        'conversationId',
        'role',
        'createdAt',
        // Compound index for loading messages in a conversation
        '[conversationId+createdAt]',
      ].join(', '),

      folders: 'id, parentId, sortOrder',

      usageRecords: [
        'id',
        'messageId',
        'conversationId',
        'providerId',
        'modelId',
        'createdAt',
        // Compound indexes for analytics queries
        '[providerId+createdAt]',
        '[modelId+createdAt]',
      ].join(', '),

      modelCache: 'id, providerId, modelId, cachedAt, expiresAt',

      modelPreferences: 'modelCompoundId, isFavorite, lastUsedAt, usageCount',
    });

    this.version(2).stores({
      prompts: 'id, name, category, updatedAt',
    });
  }
}

/** Singleton database instance. */
export const db = new AppDatabase();
