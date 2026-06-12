// ─────────────────────────────────────────────────────────────
// Unit Tests: Conversation Import
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
  importFromJSON,
  importFromMarkdown,
  importFromChatGPT,
} from '../src/lib/import';

describe('importFromJSON (AISiDE format)', () => {
  it('should import a valid AISiDE JSON export', () => {
    const json = JSON.stringify({
      conversation: {
        title: 'Test Chat',
        providerId: 'openai',
        modelId: 'gpt-4o',
        tags: ['test'],
      },
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ],
    });
    const result = importFromJSON(json);
    expect(result.conversation.title).toBe('Test Chat');
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].role).toBe('user');
    expect(result.messages[1].role).toBe('assistant');
  });

  it('should throw on unrecognized JSON format', () => {
    expect(() => importFromJSON('{"random": "data"}')).toThrow('Unrecognized');
  });
});

describe('importFromMarkdown', () => {
  it('should parse markdown with ### User / ### Assistant headings', () => {
    const md = `# My Chat

### 👤 User
Hello, how are you?

### 🤖 Assistant
I'm doing great, thanks!

### 👤 User
What's the weather?
`;
    const result = importFromMarkdown(md);
    expect(result.conversation.title).toBe('My Chat');
    expect(result.messages).toHaveLength(3);
    expect(result.messages[0].role).toBe('user');
    expect(result.messages[0].content).toContain('Hello, how are you?');
    expect(result.messages[1].role).toBe('assistant');
    expect(result.messages[2].role).toBe('user');
  });

  it('should parse **User:** / **Assistant:** bold format', () => {
    const md = `**User:**
What is 2+2?

**Assistant:**
4
`;
    const result = importFromMarkdown(md);
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].content).toContain('What is 2+2?');
    expect(result.messages[1].content).toContain('4');
  });

  it('should skip separator lines (---)', () => {
    const md = `### User
Hello

---

### Assistant
World
`;
    const result = importFromMarkdown(md);
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].content).not.toContain('---');
  });
});

describe('importFromChatGPT', () => {
  it('should parse ChatGPT export format with mapping', () => {
    const chatGPTExport = JSON.stringify([{
      title: 'Test GPT Chat',
      default_model_slug: 'gpt-4',
      mapping: {
        'node-1': {
          message: {
            author: { role: 'user' },
            content: { parts: ['Hello'] },
            create_time: 1000,
          },
        },
        'node-2': {
          message: {
            author: { role: 'assistant' },
            content: { parts: ['Hi!'] },
            create_time: 2000,
          },
        },
        'node-0': {
          message: {
            author: { role: 'system' },
            content: { parts: [] },
            create_time: 0,
          },
        },
      },
    }]);

    const results = importFromChatGPT(chatGPTExport);
    expect(results).toHaveLength(1);
    expect(results[0].conversation.title).toBe('Test GPT Chat');
    expect(results[0].messages.length).toBe(2);
    expect(results[0].conversation.tags).toContain('chatgpt');
  });
});
