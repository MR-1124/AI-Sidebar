// ─────────────────────────────────────────────────────────────
// Conversation Repository — CRUD + queries for conversations
// ─────────────────────────────────────────────────────────────

import { db } from '../database';
import type { Conversation, Folder } from '../../types/chat';
import { generateId } from '../../lib/utils';

export const conversationRepo = {
  /**
   * Create a new conversation.
   */
  async create(params: {
    title?: string;
    providerId: string;
    modelId: string;
    systemPrompt?: string;
    folderId?: string;
  }): Promise<Conversation> {
    const now = Date.now();
    const conversation: Conversation = {
      id: generateId(),
      title: params.title || 'New Chat',
      folderId: params.folderId,
      providerId: params.providerId as Conversation['providerId'],
      modelId: params.modelId,
      systemPrompt: params.systemPrompt,
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      tags: [],
      messageCount: 0,
      totalTokens: 0,
      estimatedCost: 0,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
    };

    await db.conversations.add(conversation);
    return conversation;
  },

  /**
   * Get a conversation by ID.
   */
  async getById(id: string): Promise<Conversation | undefined> {
    return db.conversations.get(id);
  },

  /**
   * List conversations, sorted by most recent activity.
   * Excludes archived by default.
   */
  async list(options?: {
    includeArchived?: boolean;
    folderId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Conversation[]> {
    let query = db.conversations.orderBy('lastMessageAt').reverse();

    let results = await query.toArray();

    if (!options?.includeArchived) {
      results = results.filter(c => !c.isArchived);
    }

    if (options?.folderId) {
      results = results.filter(c => c.folderId === options.folderId);
    }

    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    return results.slice(offset, offset + limit);
  },

  /**
   * Search conversations by title content.
   */
  async search(query: string): Promise<Conversation[]> {
    const lowerQuery = query.toLowerCase();
    return db.conversations
      .filter(c => c.title.toLowerCase().includes(lowerQuery))
      .limit(20)
      .toArray();
  },

  /**
   * Update a conversation's fields.
   */
  async update(id: string, changes: Partial<Conversation>): Promise<void> {
    await db.conversations.update(id, {
      ...changes,
      updatedAt: Date.now(),
    });
  },

  /**
   * Delete a conversation and all its messages.
   */
  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.conversations, db.messages, db.usageRecords], async () => {
      await db.messages.where('conversationId').equals(id).delete();
      await db.usageRecords.where('conversationId').equals(id).delete();
      await db.conversations.delete(id);
    });
  },

  /**
   * Duplicate a conversation (without messages).
   */
  async duplicate(id: string): Promise<Conversation | undefined> {
    const original = await db.conversations.get(id);
    if (!original) return undefined;

    const now = Date.now();
    const copy: Conversation = {
      ...original,
      id: generateId(),
      title: `${original.title} (copy)`,
      isPinned: false,
      messageCount: 0,
      totalTokens: 0,
      estimatedCost: 0,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
    };

    await db.conversations.add(copy);
    return copy;
  },

  /**
   * Get pinned conversations.
   */
  async getPinned(): Promise<Conversation[]> {
    return db.conversations
      .where('isPinned')
      .equals(true as any)
      .sortBy('lastMessageAt');
  },

  /**
   * Get favorite conversations.
   */
  async getFavorites(): Promise<Conversation[]> {
    return db.conversations
      .where('isFavorite')
      .equals(true as any)
      .sortBy('lastMessageAt');
  },

  /**
   * Get total conversation count.
   */
  async count(): Promise<number> {
    return db.conversations.count();
  },

  // ── Folder operations ───────────────────────────────

  async createFolder(name: string, parentId?: string, color?: string): Promise<Folder> {
    const count = await db.folders.count();
    const folder: Folder = {
      id: generateId(),
      name,
      parentId,
      color,
      sortOrder: count,
      createdAt: Date.now(),
    };
    await db.folders.add(folder);
    return folder;
  },

  async listFolders(): Promise<Folder[]> {
    return db.folders.orderBy('sortOrder').toArray();
  },

  async deleteFolder(id: string): Promise<void> {
    // Move conversations out of folder before deleting
    await db.conversations
      .where('folderId')
      .equals(id)
      .modify({ folderId: undefined });
    await db.folders.delete(id);
  },
};

// Re-export Dexie for use in compound queries
import Dexie from 'dexie';
