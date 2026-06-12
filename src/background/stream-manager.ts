// ─────────────────────────────────────────────────────────────
// Stream Manager — Manages active streaming connections
// ─────────────────────────────────────────────────────────────

import { getProvider } from '../providers/registry';
import type { ProviderId } from '../types/provider';
import type { ChatRequest } from '../types/chat';
import { decryptApiKey } from './crypto';
import { STORAGE_KEYS } from '../lib/constants';

/** Active abort controllers for cancellation. */
const activeStreams = new Map<string, AbortController>();

/**
 * Retrieve and decrypt the API key for a provider, along with its customBaseUrl.
 */
async function getProviderCredentials(providerId: ProviderId): Promise<{ apiKey: string, customBaseUrl?: string }> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PROVIDERS);
  const providers: Record<string, any> = result[STORAGE_KEYS.PROVIDERS] || {};
  const config = providers[providerId as string];

  if (!config?.encryptedApiKey) {
    throw new Error(`No API key configured for ${providerId}`);
  }

  const apiKey = await decryptApiKey({
    ciphertext: config.encryptedApiKey,
    iv: config.iv,
    salt: config.salt,
  });

  return { apiKey, customBaseUrl: config.customBaseUrl };
}

/**
 * Execute a streaming chat request and send chunks over a port.
 */
export async function handleChatStream(
  port: chrome.runtime.Port,
  request: ChatRequest,
  requestId: string
): Promise<void> {
  const provider = getProvider(request.providerId);
  if (!provider) {
    port.postMessage({
      type: 'CHAT_STREAM_ERROR',
      payload: { requestId, error: `Unknown provider: ${request.providerId}` },
    });
    return;
  }

  let apiKey: string;
  let customBaseUrl: string | undefined;
  try {
    const creds = await getProviderCredentials(request.providerId);
    apiKey = creds.apiKey;
    customBaseUrl = creds.customBaseUrl;
  } catch (e) {
    port.postMessage({
      type: 'CHAT_STREAM_ERROR',
      payload: {
        requestId,
        error: e instanceof Error ? e.message : 'Failed to decrypt API key',
      },
    });
    return;
  }

  const controller = new AbortController();
  activeStreams.set(requestId, controller);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
  const maxRetries = 2;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const stream = provider.createChatCompletion(apiKey, request, customBaseUrl, controller.signal);

      for await (const event of stream) {
        if (controller.signal.aborted) {
          port.postMessage({
            type: 'CHAT_STREAM_END',
            payload: { requestId, content: '', finishReason: 'stop' },
          });
          return;
        }

        switch (event.type) {
          case 'chunk':
            port.postMessage({
              type: 'CHAT_STREAM_CHUNK',
              payload: { 
                requestId, 
                content: event.content,
                reasoningContent: event.reasoningContent,
                fullReasoningContent: event.fullReasoningContent
              },
            });
            break;

          case 'end':
            port.postMessage({
              type: 'CHAT_STREAM_END',
              payload: {
                requestId,
                content: event.content,
                finishReason: event.finishReason,
                toolCalls: event.toolCalls,
                usage: event.usage,
              },
            });
            return;

          case 'error': {
            const errMsg = (event.error || '').toLowerCase();
            const isRetryable = errMsg.includes('429') || errMsg.includes('rate limit') || errMsg.includes('50') || errMsg.includes('fetch failed') || errMsg.includes('timeout');
            
            if (isRetryable && attempt < maxRetries) {
              throw new Error(`RETRY_TRIGGER: ${event.error}`);
            }

            port.postMessage({
              type: 'CHAT_STREAM_ERROR',
              payload: {
                requestId,
                error: `API Error: ${event.error}`,
                code: event.code,
              },
            });
            return;
          }
        }
      }
      
      // Successfully finished stream loop without throwing, break out of retry loop
      break;

    } catch (error) {
      if (controller.signal.aborted) return;
      
      const errMsg = error instanceof Error ? error.message : String(error);
      const lowerErr = errMsg.toLowerCase();
      const isRetryable = errMsg.startsWith('RETRY_TRIGGER:') || lowerErr.includes('429') || lowerErr.includes('rate limit') || lowerErr.includes('fetch failed') || lowerErr.includes('timeout') || lowerErr.includes('50');

      if (isRetryable && attempt < maxRetries) {
        attempt++;
        // Send a temporary error chunk to notify user of retry
        port.postMessage({
          type: 'CHAT_STREAM_CHUNK',
          payload: { 
            requestId, 
            content: `\n\n*[Connection failed. Retrying... (Attempt ${attempt}/${maxRetries})]*\n\n`
          },
        });
        
        await delay(1500 * attempt); // Backoff: 1.5s, 3.0s
        continue;
      }

      // If we run out of retries or it's a non-retryable error (like 401 Unauthorized or 400 Bad Request)
      port.postMessage({
        type: 'CHAT_STREAM_ERROR',
        payload: {
          requestId,
          error: errMsg.replace('RETRY_TRIGGER: ', '') + (attempt > 0 ? ` (Failed after ${attempt} retries)` : ''),
        },
      });
      break;
    }
  }

  activeStreams.delete(requestId);
}

/**
 * Cancel an active stream.
 */
export function cancelStream(requestId: string): boolean {
  const controller = activeStreams.get(requestId);
  if (controller) {
    controller.abort();
    activeStreams.delete(requestId);
    return true;
  }
  return false;
}
