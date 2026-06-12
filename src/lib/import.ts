// ─────────────────────────────────────────────────────────────
// Conversation Import — Import chats from various formats
// ─────────────────────────────────────────────────────────────

import type { Conversation, Message, MessageRole } from '../types/chat';
import { generateId } from './utils';

export interface ImportResult {
  conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'lastMessageAt'>;
  messages: Array<Omit<Message, 'id' | 'createdAt' | 'version'>>;
}

/**
 * Import from AISiDE JSON export format.
 */
export function importFromJSON(jsonString: string): ImportResult {
  const data = JSON.parse(jsonString);

  // Handle AISiDE export format
  if (data.conversation && data.messages) {
    return {
      conversation: {
        title: data.conversation.title || 'Imported Chat',
        providerId: data.conversation.providerId || 'openai',
        modelId: data.conversation.modelId || 'unknown',
        systemPrompt: data.conversation.systemPrompt,
        isPinned: false,
        isFavorite: false,
        isArchived: false,
        tags: data.conversation.tags || [],
        messageCount: data.messages.length,
        totalTokens: data.conversation.totalTokens || 0,
        estimatedCost: data.conversation.estimatedCost || 0,
      },
      messages: data.messages.map((m: any) => ({
        conversationId: '', // Will be set during actual import
        role: m.role as MessageRole,
        content: m.content || '',
        providerId: m.providerId,
        modelId: m.modelId,
        reasoningContent: m.reasoningContent,
        promptTokens: m.promptTokens,
        completionTokens: m.completionTokens,
        totalTokens: m.totalTokens,
      })),
    };
  }

  throw new Error('Unrecognized JSON format. Expected AISiDE export format.');
}

/**
 * Import from ChatGPT export format (conversations.json from data export).
 */
export function importFromChatGPT(jsonString: string): ImportResult[] {
  const data = JSON.parse(jsonString);
  const conversations: ImportResult[] = [];

  // ChatGPT exports an array of conversations
  const items = Array.isArray(data) ? data : [data];

  for (const item of items) {
    const messages: ImportResult['messages'] = [];

    // ChatGPT uses a tree structure with mapping
    if (item.mapping) {
      const nodeIds = Object.keys(item.mapping);
      // Sort by create_time for correct ordering
      const sortedNodes = nodeIds
        .map(id => ({ id, ...item.mapping[id] }))
        .filter((n: any) => n.message?.content?.parts?.length > 0)
        .sort((a: any, b: any) => (a.message?.create_time || 0) - (b.message?.create_time || 0));

      for (const node of sortedNodes) {
        const msg = (node as any).message;
        if (!msg) continue;

        const role = msg.author?.role === 'assistant' ? 'assistant' : 'user';
        const content = msg.content?.parts?.join('\n') || '';

        if (content.trim()) {
          messages.push({
            conversationId: '',
            role: role as MessageRole,
            content,
          });
        }
      }
    }

    if (messages.length > 0) {
      conversations.push({
        conversation: {
          title: item.title || 'Imported from ChatGPT',
          providerId: 'openai',
          modelId: item.default_model_slug || 'gpt-4o',
          isPinned: false,
          isFavorite: false,
          isArchived: false,
          tags: ['imported', 'chatgpt'],
          messageCount: messages.length,
          totalTokens: 0,
          estimatedCost: 0,
        },
        messages,
      });
    }
  }

  return conversations;
}

/**
 * Import from a markdown file containing a conversation.
 * Expects format:
 * ### 👤 User / ### 🤖 Assistant
 * or
 * **User:** / **Assistant:**
 */
export function importFromMarkdown(markdownString: string): ImportResult {
  const messages: ImportResult['messages'] = [];
  const lines = markdownString.split('\n');

  let currentRole: MessageRole | null = null;
  let currentContent: string[] = [];
  let title = 'Imported Conversation';

  // Try to extract title from first heading
  const titleMatch = markdownString.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  for (const line of lines) {
    // Check for role indicators
    const userMatch = line.match(/^###?\s*(👤\s*User|User|Human)/i);
    const assistantMatch = line.match(/^###?\s*(🤖\s*Assistant|Assistant|AI)/i);
    const userBoldMatch = line.match(/^\*\*User:\*\*/i);
    const assistantBoldMatch = line.match(/^\*\*Assistant:\*\*/i);

    if (userMatch || userBoldMatch) {
      // Save previous message
      if (currentRole && currentContent.length > 0) {
        const content = currentContent.join('\n').trim();
        if (content) {
          messages.push({ conversationId: '', role: currentRole, content });
        }
      }
      currentRole = 'user';
      currentContent = [];
    } else if (assistantMatch || assistantBoldMatch) {
      if (currentRole && currentContent.length > 0) {
        const content = currentContent.join('\n').trim();
        if (content) {
          messages.push({ conversationId: '', role: currentRole, content });
        }
      }
      currentRole = 'assistant';
      currentContent = [];
    } else if (currentRole) {
      // Skip separator lines
      if (line.trim() === '---') continue;
      // Skip timestamps
      if (line.match(/^\*\d+:\d+/)) continue;
      currentContent.push(line);
    }
  }

  // Save last message
  if (currentRole && currentContent.length > 0) {
    const content = currentContent.join('\n').trim();
    if (content) {
      messages.push({ conversationId: '', role: currentRole, content });
    }
  }

  return {
    conversation: {
      title,
      providerId: 'openai',
      modelId: 'unknown',
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      tags: ['imported'],
      messageCount: messages.length,
      totalTokens: 0,
      estimatedCost: 0,
    },
    messages,
  };
}

/**
 * Detect the format of a file and import accordingly.
 */
export async function importConversation(
  file: File
): Promise<ImportResult | ImportResult[]> {
  const text = await file.text();
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'json') {
    try {
      // Try ChatGPT format first (has 'mapping' key)
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed[0]?.mapping) {
        return importFromChatGPT(text);
      }
      if (parsed.mapping) {
        return importFromChatGPT(text);
      }
      // Fall back to AISiDE format
      return importFromJSON(text);
    } catch {
      throw new Error('Failed to parse JSON file.');
    }
  }

  if (ext === 'md' || ext === 'txt' || ext === 'markdown') {
    return importFromMarkdown(text);
  }

  throw new Error(`Unsupported file format: .${ext}. Use .json, .md, or .txt`);
}
