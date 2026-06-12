// ─────────────────────────────────────────────────────────────
// Message Repository — CRUD for chat messages
// ─────────────────────────────────────────────────────────────

import { db } from '../database';
import type { Message } from '../../types/chat';
import { generateId } from '../../lib/utils';

export const messageRepo = {
  async create(params: Omit<Message, 'id' | 'createdAt' | 'version'>): Promise<Message> {
    const message: Message = {
      ...params,
      id: generateId(),
      version: 1,
      createdAt: Date.now(),
    };
    await db.messages.add(message);

    // Update conversation stats
    await db.conversations.where('id').equals(params.conversationId).modify(conv => {
      conv.messageCount = (conv.messageCount || 0) + 1;
      conv.lastMessageAt = message.createdAt;
      conv.updatedAt = message.createdAt;
      if (params.totalTokens) conv.totalTokens = (conv.totalTokens || 0) + params.totalTokens;
      if (params.estimatedCost) conv.estimatedCost = (conv.estimatedCost || 0) + params.estimatedCost;
    });

    return message;
  },

  async getById(id: string): Promise<Message | undefined> {
    return db.messages.get(id);
  },

  async getByConversation(conversationId: string, limit = 100, offset = 0): Promise<Message[]> {
    return db.messages
      .where('[conversationId+createdAt]')
      .between([conversationId, -Infinity], [conversationId, Infinity])
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async update(id: string, changes: Partial<Message>): Promise<void> {
    await db.messages.update(id, changes);
  },

  async delete(id: string): Promise<void> {
    const msg = await db.messages.get(id);
    if (msg) {
      await db.messages.delete(id);
      await db.conversations.where('id').equals(msg.conversationId).modify(conv => {
        conv.messageCount = Math.max(0, (conv.messageCount || 0) - 1);
      });
    }
  },

  async deleteByConversation(conversationId: string): Promise<void> {
    await db.messages.where('conversationId').equals(conversationId).delete();
  },

  async search(conversationId: string, query: string): Promise<Message[]> {
    const lower = query.toLowerCase();
    return db.messages
      .where('conversationId')
      .equals(conversationId)
      .filter(m => m.content.toLowerCase().includes(lower))
      .toArray();
  },

  async count(conversationId: string): Promise<number> {
    return db.messages.where('conversationId').equals(conversationId).count();
  },
};
