// ─────────────────────────────────────────────────────────────
// Token Counter — Estimates token counts for context management
// ─────────────────────────────────────────────────────────────

/**
 * Estimate token count from text.
 * Uses a ~4 characters per token heuristic for English text,
 * which is a reasonable approximation for GPT/Claude tokenizers.
 * For CJK text, uses ~1.5 chars per token.
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;

  // Count CJK characters (roughly 1.5 chars per token)
  const cjkChars = (text.match(/[\u3000-\u9fff\uf900-\ufaff]/g) || []).length;
  const nonCjkLength = text.length - cjkChars;

  // Standard English: ~4 chars per token
  // CJK: ~1.5 chars per token
  // Add overhead for message formatting (~4 tokens per message)
  return Math.ceil(nonCjkLength / 4) + Math.ceil(cjkChars / 1.5);
}

/**
 * Estimate token count for an array of API messages.
 * Accounts for role tags, content, and message framing overhead.
 */
export function estimateMessagesTokenCount(
  messages: Array<{ role: string; content: any }>
): number {
  let total = 0;

  for (const msg of messages) {
    // Per-message overhead (role tag, delimiters)
    total += 4;

    if (typeof msg.content === 'string') {
      total += estimateTokenCount(msg.content);
    } else if (Array.isArray(msg.content)) {
      // Multimodal content (text + images)
      for (const part of msg.content) {
        if (part.type === 'text') {
          total += estimateTokenCount(part.text || '');
        } else if (part.type === 'image_url') {
          // Vision tokens vary by resolution; use a conservative estimate
          total += 765; // ~768 tokens for a medium resolution image
        }
      }
    }
  }

  // Priming overhead
  total += 3;

  return total;
}

/**
 * Get context window usage information.
 */
export function getContextWindowUsage(
  messages: Array<{ role: string; content: any }>,
  modelContextWindow: number
): { used: number; available: number; percentage: number } {
  const used = estimateMessagesTokenCount(messages);
  const available = Math.max(0, modelContextWindow - used);
  const percentage = modelContextWindow > 0 ? (used / modelContextWindow) * 100 : 0;

  return { used, available, percentage };
}
