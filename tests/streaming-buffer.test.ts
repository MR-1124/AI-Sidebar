// ─────────────────────────────────────────────────────────────
// Unit Tests: Streaming Buffer
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StreamingBuffer } from '../src/lib/streaming-buffer';

describe('StreamingBuffer', () => {
  let flushCallback: ReturnType<typeof vi.fn>;
  let buffer: StreamingBuffer;

  beforeEach(() => {
    vi.useFakeTimers();
    flushCallback = vi.fn();
    buffer = new StreamingBuffer(flushCallback, 50);
  });

  afterEach(() => {
    buffer.destroy();
    vi.useRealTimers();
  });

  it('should accumulate content tokens', () => {
    buffer.append('msg-1', 'Hello');
    buffer.append('msg-1', ' world');
    expect(buffer.getContent('msg-1')).toBe('Hello world');
  });

  it('should accumulate reasoning tokens', () => {
    buffer.appendReasoning('msg-1', 'Let me think');
    buffer.appendReasoning('msg-1', '...');
    expect(buffer.getReasoning('msg-1')).toBe('Let me think...');
  });

  it('should not flush before interval', () => {
    buffer.append('msg-1', 'Hello');
    expect(flushCallback).not.toHaveBeenCalled();
  });

  it('should flush after interval', () => {
    buffer.append('msg-1', 'Hello');
    vi.advanceTimersByTime(60);
    expect(flushCallback).toHaveBeenCalledWith('msg-1', 'Hello', undefined);
  });

  it('should flush with both content and reasoning', () => {
    buffer.append('msg-1', 'Answer');
    buffer.appendReasoning('msg-1', 'Thinking');
    vi.advanceTimersByTime(60);
    expect(flushCallback).toHaveBeenCalledWith('msg-1', 'Answer', 'Thinking');
  });

  it('should flush immediately when flush() is called', () => {
    buffer.append('msg-1', 'Immediate');
    buffer.flush();
    expect(flushCallback).toHaveBeenCalledTimes(1);
  });

  it('should clear specific message buffers', () => {
    buffer.append('msg-1', 'First');
    buffer.append('msg-2', 'Second');
    buffer.clear('msg-1');
    expect(buffer.getContent('msg-1')).toBe('');
    expect(buffer.getContent('msg-2')).toBe('Second');
  });

  it('should clear all buffers', () => {
    buffer.append('msg-1', 'First');
    buffer.append('msg-2', 'Second');
    buffer.clear();
    expect(buffer.getContent('msg-1')).toBe('');
    expect(buffer.getContent('msg-2')).toBe('');
  });

  it('should handle multiple messages independently', () => {
    buffer.append('msg-1', 'A');
    buffer.append('msg-2', 'B');
    buffer.append('msg-1', 'C');
    expect(buffer.getContent('msg-1')).toBe('AC');
    expect(buffer.getContent('msg-2')).toBe('B');
  });
});
