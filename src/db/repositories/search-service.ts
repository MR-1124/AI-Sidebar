import { db } from '../database';
import { conversationRepo } from './conversation-repo';
import type { Conversation, Message } from '../../types/chat';

export interface SearchResult {
  conversationId: string;
  conversationTitle: string;
  matchType: 'title' | 'message';
  messageId?: string;
  snippet?: string;
  score: number;
}

export const searchService = {
  async search(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    const results: Map<string, SearchResult> = new Map();

    // 1. Search Conversations by Title
    const convos = await db.conversations.toArray();
    for (const c of convos) {
      if (c.title.toLowerCase().includes(lowerQuery)) {
        results.set(c.id, {
          conversationId: c.id,
          conversationTitle: c.title,
          matchType: 'title',
          score: 10,
        });
      }
    }

    // 2. Search Messages by Content
    // In a real production app, you might want to use a Full-Text Search library like FlexSearch,
    // or store a tokenized version of messages. For MVP, we do a JS filter.
    const messages = await db.messages.filter(m => 
      m.role !== 'system' && m.content.toLowerCase().includes(lowerQuery)
    ).toArray();

    for (const m of messages) {
      // If we already matched the title, we might just update the score or keep both.
      // We will prefer the message match if it's highly relevant, but let's just add it if not present.
      
      const snippetStart = Math.max(0, m.content.toLowerCase().indexOf(lowerQuery) - 20);
      const snippetEnd = Math.min(m.content.length, snippetStart + lowerQuery.length + 40);
      let snippet = m.content.substring(snippetStart, snippetEnd);
      if (snippetStart > 0) snippet = '...' + snippet;
      if (snippetEnd < m.content.length) snippet = snippet + '...';

      if (!results.has(m.conversationId)) {
        const c = convos.find(conv => conv.id === m.conversationId);
        if (c) {
          results.set(m.conversationId, {
            conversationId: c.id,
            conversationTitle: c.title,
            matchType: 'message',
            messageId: m.id,
            snippet,
            score: 5,
          });
        }
      } else {
        // Upgrade an existing match if it only matched title
        const existing = results.get(m.conversationId)!;
        existing.score += 2;
        if (existing.matchType === 'title') {
          existing.matchType = 'message';
          existing.messageId = m.id;
          existing.snippet = snippet;
        }
      }
    }

    // Convert map to array and sort by score
    return Array.from(results.values()).sort((a, b) => b.score - a.score);
  }
};
