// ─────────────────────────────────────────────────────────────
// Streaming Buffer — Batched streaming updates to avoid
// per-token React state updates during LLM streaming
// ─────────────────────────────────────────────────────────────

type FlushCallback = (messageId: string, content: string, reasoning?: string) => void;

/**
 * Accumulates streaming tokens outside of React/Zustand state
 * and flushes to the store at a configurable interval.
 * This avoids creating N array copies for N tokens during streaming.
 */
export class StreamingBuffer {
  private contentBuffers = new Map<string, string>();
  private reasoningBuffers = new Map<string, string>();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private flushCallback: FlushCallback;
  private flushIntervalMs: number;

  constructor(flushCallback: FlushCallback, flushIntervalMs = 50) {
    this.flushCallback = flushCallback;
    this.flushIntervalMs = flushIntervalMs;
  }

  /**
   * Append a content token for a message.
   */
  append(messageId: string, token: string): void {
    const current = this.contentBuffers.get(messageId) || '';
    this.contentBuffers.set(messageId, current + token);
    this.scheduleFlush();
  }

  /**
   * Append a reasoning token for a message.
   */
  appendReasoning(messageId: string, token: string): void {
    const current = this.reasoningBuffers.get(messageId) || '';
    this.reasoningBuffers.set(messageId, current + token);
    this.scheduleFlush();
  }

  /**
   * Get the currently accumulated content for a message.
   */
  getContent(messageId: string): string {
    return this.contentBuffers.get(messageId) || '';
  }

  /**
   * Get the currently accumulated reasoning for a message.
   */
  getReasoning(messageId: string): string {
    return this.reasoningBuffers.get(messageId) || '';
  }

  /**
   * Force an immediate flush of all buffers to the store.
   * Call this on CHAT_STREAM_END to ensure final content is committed.
   */
  flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    for (const [messageId, content] of this.contentBuffers.entries()) {
      const reasoning = this.reasoningBuffers.get(messageId);
      this.flushCallback(messageId, content, reasoning);
    }
  }

  /**
   * Clear all buffers for a specific message or all messages.
   */
  clear(messageId?: string): void {
    if (messageId) {
      this.contentBuffers.delete(messageId);
      this.reasoningBuffers.delete(messageId);
    } else {
      this.contentBuffers.clear();
      this.reasoningBuffers.clear();
    }

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Destroy the buffer, clearing all timers.
   */
  destroy(): void {
    this.clear();
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, this.flushIntervalMs);
  }
}
