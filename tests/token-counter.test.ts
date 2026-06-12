// ─────────────────────────────────────────────────────────────
// Unit Tests: Token Counter
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
  estimateTokenCount,
  estimateMessagesTokenCount,
  getContextWindowUsage,
} from '../src/lib/token-counter';

describe('estimateTokenCount', () => {
  it('should return 0 for empty string', () => {
    expect(estimateTokenCount('')).toBe(0);
  });

  it('should return 0 for null/undefined-like input', () => {
    expect(estimateTokenCount(undefined as any)).toBe(0);
  });

  it('should estimate English text at ~4 chars per token', () => {
    const text = 'Hello world this is a test'; // 26 chars
    const tokens = estimateTokenCount(text);
    // ~26/4 = 7 tokens
    expect(tokens).toBeGreaterThan(3);
    expect(tokens).toBeLessThan(15);
  });

  it('should estimate CJK text at ~1.5 chars per token', () => {
    const text = '你好世界测试'; // 6 CJK chars
    const tokens = estimateTokenCount(text);
    // ~6/1.5 = 4 tokens
    expect(tokens).toBeGreaterThan(2);
    expect(tokens).toBeLessThan(10);
  });

  it('should handle mixed English and CJK text', () => {
    const text = 'Hello 你好 world 世界';
    const tokens = estimateTokenCount(text);
    expect(tokens).toBeGreaterThan(3);
  });
});

describe('estimateMessagesTokenCount', () => {
  it('should count tokens for string content messages', () => {
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'World' },
    ];
    const tokens = estimateMessagesTokenCount(messages);
    // 2 messages * ~4 overhead + content tokens + 3 priming
    expect(tokens).toBeGreaterThan(5);
  });

  it('should handle multimodal content with images', () => {
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Describe this image' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,...' } },
        ],
      },
    ];
    const tokens = estimateMessagesTokenCount(messages);
    // Should include ~765 tokens for the image
    expect(tokens).toBeGreaterThan(760);
  });

  it('should handle empty messages array', () => {
    const tokens = estimateMessagesTokenCount([]);
    expect(tokens).toBe(3); // priming overhead only
  });
});

describe('getContextWindowUsage', () => {
  it('should calculate percentage correctly', () => {
    const messages = [
      { role: 'user', content: 'Hello world this is a test message with some content' },
    ];
    const result = getContextWindowUsage(messages, 1000);
    expect(result.used).toBeGreaterThan(0);
    expect(result.available).toBeLessThan(1000);
    expect(result.percentage).toBeGreaterThan(0);
    expect(result.percentage).toBeLessThan(100);
  });

  it('should handle zero context window', () => {
    const result = getContextWindowUsage([], 0);
    expect(result.percentage).toBe(0);
    expect(result.available).toBe(0);
  });
});
