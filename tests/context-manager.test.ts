// ─────────────────────────────────────────────────────────────
// Unit Tests: Context Manager
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { trimMessagesToFit } from '../src/lib/context-manager';

describe('trimMessagesToFit', () => {
  const makeMessages = (count: number, contentLength = 100) => {
    const msgs: Array<{ role: string; content: string }> = [
      { role: 'system', content: 'You are a helpful assistant.' },
    ];
    for (let i = 0; i < count; i++) {
      msgs.push({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: 'x'.repeat(contentLength),
      });
    }
    return msgs;
  };

  it('should return messages as-is when under budget', () => {
    const messages = makeMessages(4, 10);
    const result = trimMessagesToFit(messages, 100000);
    expect(result.length).toBe(messages.length);
  });

  it('should keep system messages', () => {
    const messages = makeMessages(20, 200);
    const result = trimMessagesToFit(messages, 500);
    const systemMsgs = result.filter(m => m.role === 'system');
    expect(systemMsgs.length).toBeGreaterThanOrEqual(1);
  });

  it('should keep the first conversation message', () => {
    const messages = makeMessages(20, 200);
    const result = trimMessagesToFit(messages, 500);
    // First non-system message should be preserved
    const nonSystem = result.filter(m => m.role !== 'system');
    if (nonSystem.length > 0) {
      expect(nonSystem[0].content).toBe(messages[1].content);
    }
  });

  it('should insert truncation notice when messages are removed', () => {
    // Use enough messages with large content to force truncation
    const messages = makeMessages(50, 1000);
    // Very small budget forces heavy truncation
    const result = trimMessagesToFit(messages, 800, 100);
    // Verify that messages were actually removed
    expect(result.length).toBeLessThan(messages.length);
    const hasNotice = result.some(
      m => m.role === 'system' && m.content.includes('truncated')
    );
    expect(hasNotice).toBe(true);
  });

  it('should prioritize most recent messages', () => {
    const messages = makeMessages(20, 100);
    const lastMsg = messages[messages.length - 1];
    const result = trimMessagesToFit(messages, 2000);
    // Last non-system message should be the most recent conversation message
    const nonSystemResult = result.filter(m => m.role !== 'system');
    if (nonSystemResult.length > 0) {
      expect(nonSystemResult[nonSystemResult.length - 1].content).toBe(lastMsg.content);
    }
  });

  it('should handle empty conversation messages', () => {
    const messages = [{ role: 'system', content: 'System prompt' }];
    const result = trimMessagesToFit(messages, 500);
    expect(result.length).toBe(1);
  });
});
