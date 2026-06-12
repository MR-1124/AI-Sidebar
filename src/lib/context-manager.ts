// ─────────────────────────────────────────────────────────────
// Context Manager — Trims messages to fit context windows
// ─────────────────────────────────────────────────────────────

import { estimateTokenCount, estimateMessagesTokenCount } from './token-counter';

type ApiMessage = { role: string; content: any };

/**
 * Trim messages to fit within a token budget using a sliding window strategy.
 *
 * Keeps:
 * - System prompt (always)
 * - First user message (provides conversation context)
 * - Last N messages that fit within the budget
 *
 * Inserts a "[Earlier messages truncated]" marker when messages are removed.
 */
export function trimMessagesToFit(
  messages: ApiMessage[],
  maxTokens: number,
  reserveForOutput: number = 2048
): ApiMessage[] {
  // Never reserve more than 30% of the context window to guarantee room for the prompt
  const actualReserve = Math.min(reserveForOutput, Math.floor(maxTokens * 0.3));
  const budget = Math.max(1024, maxTokens - actualReserve);
  const currentUsage = estimateMessagesTokenCount(messages);

  // If we're within budget, return as-is
  if (currentUsage <= budget) {
    return messages;
  }

  // Separate system messages from conversation messages
  const systemMessages = messages.filter(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  if (conversationMessages.length === 0) {
    return messages;
  }

  // Calculate system prompt token cost
  const systemTokens = estimateMessagesTokenCount(systemMessages);
  const availableForConversation = budget - systemTokens;

  if (availableForConversation <= 0) {
    // System prompt alone exceeds budget — we MUST truncate the system prompt string
    // to prevent API failures.
    const ratio = budget / systemTokens;
    return systemMessages.map(msg => {
      if (typeof msg.content === 'string') {
        const limit = Math.max(10, Math.floor(msg.content.length * ratio));
        return { ...msg, content: msg.content.substring(0, limit) + '...[System Prompt Truncated]...' };
      }
      return msg;
    });
  }

  // Keep the first user message for context
  let firstUserMsg = { ...conversationMessages[0] };
  let firstUserTokens = estimateMessagesTokenCount([firstUserMsg]);

  // If the first message ALONE exceeds the available tokens, truncate its text
  if (firstUserTokens > availableForConversation) {
    const ratio = availableForConversation / firstUserTokens;
    if (typeof firstUserMsg.content === 'string') {
      const limit = Math.floor(firstUserMsg.content.length * ratio);
      firstUserMsg.content = firstUserMsg.content.substring(0, limit) + '\n\n...[Content truncated to fit context window]...';
    } else if (Array.isArray(firstUserMsg.content)) {
      firstUserMsg.content = firstUserMsg.content.map((part: any) => {
        if (part.type === 'text' && typeof part.text === 'string') {
          const limit = Math.floor(part.text.length * ratio);
          return { ...part, text: part.text.substring(0, limit) + '\n\n...[Content truncated]...' };
        }
        return part;
      });
    }
    // Return immediately since budget is consumed
    return [...systemMessages, firstUserMsg];
  }

  // Build from the end (most recent messages first)
  const result: ApiMessage[] = [];
  let usedTokens = firstUserTokens;

  // Add messages from the end until we hit the budget
  for (let i = conversationMessages.length - 1; i >= 1; i--) {
    const msg = conversationMessages[i];
    const msgTokens = estimateMessagesTokenCount([msg]);

    if (usedTokens + msgTokens > availableForConversation) {
      break;
    }

    result.unshift(msg);
    usedTokens += msgTokens;
  }

  // Check if we truncated any messages
  const truncated = conversationMessages.length - 1 - result.length > 0;

  // Build final array
  const finalMessages: ApiMessage[] = [...systemMessages, firstUserMsg];

  if (truncated) {
    finalMessages.push({
      role: 'system',
      content: '[Note: Earlier messages in this conversation have been truncated to fit the context window. The first message and most recent messages are preserved.]',
    });
  }

  finalMessages.push(...result);
  return finalMessages;
}
