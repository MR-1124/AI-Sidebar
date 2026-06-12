// ─────────────────────────────────────────────────────────────
// Chat Store — Conversations and messages state
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';
import type { Conversation, Message } from '../types/chat';
import type { ProviderId } from '../types/provider';
import { conversationRepo } from '../db/repositories/conversation-repo';
import { messageRepo } from '../db/repositories/message-repo';
import { folderRepo } from '../db/repositories/folder-repo';
import { useSettingsStore } from './settings-store';
import { generateId } from '../lib/utils';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  folders: import('../types/chat').Folder[];
  loaded: boolean;

  // ── Conversation Actions ─────────────────────────
  loadConversations: () => Promise<void>;
  createConversation: (providerId: ProviderId, modelId: string, systemPrompt?: string) => Promise<Conversation>;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  duplicateConversation: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  archiveConversation: (id: string) => Promise<void>;
  moveToFolder: (conversationId: string, folderId: string | undefined) => Promise<void>;

  // ── Folder Actions ───────────────────────────────
  loadFolders: () => Promise<void>;
  createFolder: (name: string, parentId?: string, color?: string) => Promise<import('../types/chat').Folder>;
  updateFolder: (id: string, updates: Partial<Omit<import('../types/chat').Folder, 'id' | 'createdAt'>>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  // ── Message Actions ──────────────────────────────
  loadMessages: (conversationId: string) => Promise<void>;
  addUserMessage: (content: string, metadata?: Partial<Message>) => Promise<Message | undefined>;
  addAssistantMessage: (content: string, metadata?: Partial<Message>) => Promise<Message | undefined>;
  addToolMessage: (content: string, metadata?: Partial<Message>) => Promise<Message | undefined>;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  /** Batch update message content — used by StreamingBuffer for efficient flushing */
  batchUpdateMessage: (id: string, content: string, reasoning?: string) => void;
  appendToMessage: (id: string, token: string) => void;
  appendToReasoning: (id: string, token: string) => void;
  deleteMessage: (id: string) => Promise<void>;
  /** Get all versions of a message at a given branch point */
  getMessageVersions: (parentMessageId: string) => Message[];

  // ── Helpers ──────────────────────────────────────
  getActiveConversation: () => Conversation | undefined;
  searchConversations: (query: string) => Promise<Conversation[]>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  folders: [],
  loaded: false,

  loadConversations: async () => {
    try {
      const conversations = await conversationRepo.list();
      set({ conversations, loaded: true });
    } catch (e) {
      console.warn('Failed to load conversations:', e);
      set({ loaded: true });
    }
  },

  loadFolders: async () => {
    try {
      const folders = await folderRepo.list();
      set({ folders });
    } catch (e) {
      console.warn('Failed to load folders:', e);
    }
  },

  createFolder: async (name, parentId, color) => {
    const folder = await folderRepo.create(name, parentId, color);
    set(s => ({ folders: [...s.folders, folder].sort((a, b) => a.sortOrder - b.sortOrder) }));
    return folder;
  },

  updateFolder: async (id, updates) => {
    await folderRepo.update(id, updates);
    set(s => ({
      folders: s.folders.map(f => f.id === id ? { ...f, ...updates } : f)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    }));
  },

  deleteFolder: async (id) => {
    await folderRepo.delete(id);
    set(s => ({
      folders: s.folders.filter(f => f.id !== id),
      conversations: s.conversations.map(c => c.folderId === id ? { ...c, folderId: undefined } : c)
    }));
  },

  moveToFolder: async (conversationId, folderId) => {
    await conversationRepo.update(conversationId, { folderId });
    set(s => ({
      conversations: s.conversations.map(c => 
        c.id === conversationId ? { ...c, folderId, updatedAt: Date.now() } : c
      )
    }));
  },

  createConversation: async (providerId, modelId, systemPrompt) => {
    const conversation = await conversationRepo.create({
      providerId,
      modelId,
      systemPrompt,
    });
    set((s) => ({
      conversations: [conversation, ...s.conversations],
      activeConversationId: conversation.id,
      messages: [],
    }));
    useSettingsStore.getState().updateChat({ lastActiveConversationId: conversation.id });
    return conversation;
  },

  selectConversation: async (id) => {
    set({ activeConversationId: id });
    useSettingsStore.getState().updateChat({ lastActiveConversationId: id || null });
    if (id) {
      const messages = await messageRepo.getByConversation(id);
      set({ messages });
    } else {
      set({ messages: [] });
    }
  },

  deleteConversation: async (id) => {
    await conversationRepo.delete(id);
    set((s) => {
      const conversations = s.conversations.filter(c => c.id !== id);
      const isActive = s.activeConversationId === id;
      const nextActiveId = isActive ? conversations[0]?.id || null : s.activeConversationId;
      
      if (isActive) {
        useSettingsStore.getState().updateChat({ lastActiveConversationId: nextActiveId });
      }

      return {
        conversations,
        activeConversationId: nextActiveId,
        messages: isActive ? [] : s.messages,
      };
    });
  },

  renameConversation: async (id, title) => {
    await conversationRepo.update(id, { title });
    set((s) => ({
      conversations: s.conversations.map(c =>
        c.id === id ? { ...c, title, updatedAt: Date.now() } : c
      ),
    }));
  },

  duplicateConversation: async (id) => {
    const copy = await conversationRepo.duplicate(id);
    if (copy) {
      set((s) => ({ conversations: [copy, ...s.conversations] }));
    }
  },

  togglePin: async (id) => {
    const conv = get().conversations.find(c => c.id === id);
    if (!conv) return;
    await conversationRepo.update(id, { isPinned: !conv.isPinned });
    set((s) => ({
      conversations: s.conversations.map(c =>
        c.id === id ? { ...c, isPinned: !c.isPinned } : c
      ),
    }));
  },

  toggleFavorite: async (id) => {
    const conv = get().conversations.find(c => c.id === id);
    if (!conv) return;
    await conversationRepo.update(id, { isFavorite: !conv.isFavorite });
    set((s) => ({
      conversations: s.conversations.map(c =>
        c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
      ),
    }));
  },

  archiveConversation: async (id) => {
    await conversationRepo.update(id, { isArchived: true });
    set((s) => ({
      conversations: s.conversations.filter(c => c.id !== id),
    }));
  },

  loadMessages: async (conversationId) => {
    const messages = await messageRepo.getByConversation(conversationId);
    set({ messages });
  },

  addUserMessage: async (content, metadata) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return undefined;

    const message = await messageRepo.create({
      conversationId: activeConversationId,
      role: 'user',
      content,
      ...metadata,
    });

    set((s) => ({
      messages: [...s.messages, message],
      conversations: s.conversations.map(c =>
        c.id === activeConversationId
          ? { ...c, messageCount: c.messageCount + 1, lastMessageAt: Date.now(), updatedAt: Date.now() }
          : c
      ),
    }));

    return message;
  },

  addAssistantMessage: async (content, metadata) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return undefined;

    const message = await messageRepo.create({
      conversationId: activeConversationId,
      role: 'assistant',
      content,
      ...metadata,
    });

    set((s) => ({
      messages: [...s.messages, message],
      conversations: s.conversations.map(c =>
        c.id === activeConversationId
          ? {
              ...c,
              messageCount: c.messageCount + 1,
              lastMessageAt: Date.now(),
              updatedAt: Date.now(),
              totalTokens: c.totalTokens + (metadata?.totalTokens || 0),
              estimatedCost: c.estimatedCost + (metadata?.estimatedCost || 0),
            }
          : c
      ),
    }));

    return message;
  },

  addToolMessage: async (content, metadata) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return undefined;

    const message = await messageRepo.create({
      conversationId: activeConversationId,
      role: 'tool',
      content,
      ...metadata,
    });

    set((s) => ({
      messages: [...s.messages, message],
      conversations: s.conversations.map(c =>
        c.id === activeConversationId
          ? { ...c, messageCount: c.messageCount + 1, lastMessageAt: Date.now(), updatedAt: Date.now() }
          : c
      ),
    }));

    return message;
  },

  updateMessage: (id, updates) => {
    set((s) => ({
      messages: s.messages.map(m => (m.id === id ? { ...m, ...updates } : m)),
    }));
    messageRepo.update(id, updates).catch(console.warn);
  },

  appendToMessage: (id, token) => {
    set((s) => ({
      messages: s.messages.map(m =>
        m.id === id ? { ...m, content: m.content + token } : m
      ),
    }));
  },

  appendToReasoning: (id, token) => {
    set((s) => ({
      messages: s.messages.map(m =>
        m.id === id ? { ...m, reasoningContent: (m.reasoningContent || '') + token } : m
      ),
    }));
  },

  batchUpdateMessage: (id, content, reasoning) => {
    set((s) => ({
      messages: s.messages.map(m => {
        if (m.id !== id) return m;
        const updates: Partial<Message> = { content };
        if (reasoning !== undefined) updates.reasoningContent = reasoning;
        return { ...m, ...updates };
      }),
    }));
  },

  deleteMessage: async (id) => {
    await messageRepo.delete(id);
    set((s) => ({
      messages: s.messages.filter(m => m.id !== id),
    }));
  },

  getActiveConversation: () => {
    const { conversations, activeConversationId } = get();
    return conversations.find(c => c.id === activeConversationId);
  },

  searchConversations: async (query) => {
    return conversationRepo.search(query);
  },

  getMessageVersions: (parentMessageId) => {
    const { messages } = get();
    return messages.filter(m => m.parentMessageId === parentMessageId);
  },
}));
