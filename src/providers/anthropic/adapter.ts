// ─────────────────────────────────────────────────────────────
// Anthropic Adapter — Custom adapter for Claude's Messages API
// API is fundamentally different from OpenAI: /v1/messages with
// different auth headers, request/response format, and SSE format.
// ─────────────────────────────────────────────────────────────

import type { LLMProvider } from '../types';
import type { ValidationResult, ProviderCapabilities, ParameterSchema } from '../../types/provider';
import type { ChatRequest, ChatStreamEvent } from '../../types/chat';
import type { ModelInfo } from '../../types/model';
import { getModelPricing } from '../../lib/pricing';
import { MODEL_CACHE_TTL_MS } from '../../lib/constants';

const BASE_URL = 'https://api.anthropic.com';
const API_VERSION = '2023-06-01';

/** Known Claude models — Anthropic doesn't have a list-models endpoint. */
const CLAUDE_MODELS = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', tags: ['balanced'] },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', tags: ['powerful', 'reasoning'] },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', tags: ['fast', 'cheap'] },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', tags: ['balanced'] },
];

function buildHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': API_VERSION,
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

export const anthropicAdapter: LLMProvider = {
  info: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude Opus 4, Sonnet 4, Haiku — advanced reasoning',
    icon: 'sparkles',
    docsUrl: 'https://docs.anthropic.com',
    apiKeyUrl: 'https://console.anthropic.com/account/keys',
    apiKeyPattern: /^sk-ant-api[a-zA-Z0-9_-]{80,}$/,
    apiKeyPlaceholder: 'sk-ant-api...',
  },

  async validateApiKey(apiKey: string, customBaseUrl?: string): Promise<ValidationResult> {
    try {
      // Anthropic has no lightweight validation endpoint.
      // Send a minimal messages request to check the key.
      const response = await fetch(`${BASE_URL}/v1/messages`, {
        method: 'POST',
        headers: buildHeaders(apiKey),
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      });

      if (response.ok) {
        return { valid: true };
      }

      // 401 = invalid key, 429 = rate limited (key is valid)
      if (response.status === 429) {
        return { valid: true, metadata: { note: 'Rate limited — key is valid' } };
      }

      const data = await response.json().catch(() => ({}));
      return {
        valid: false,
        error: data?.error?.message || `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  async listModels(_apiKey: string, _customBaseUrl?: string): Promise<ModelInfo[]> {
    // Anthropic doesn't have a models list endpoint.
    // Return our hardcoded list with pricing from static data.
    const now = Date.now();
    return CLAUDE_MODELS.map(m => {
      const pricing = getModelPricing('anthropic', m.id);
      return {
        id: `anthropic:${m.id}`,
        modelId: m.id,
        providerId: 'anthropic' as const,
        displayName: m.name,
        contextWindow: pricing.contextWindow,
        maxOutputTokens: pricing.maxOutputTokens,
        supportsVision: true,
        supportsTools: true,
        supportsReasoning: m.tags.includes('reasoning'),
        supportsStreaming: true,
        supportsJsonMode: false,
        supportsStructuredOutput: false,
        inputPricePerMToken: pricing.inputPricePerMToken,
        outputPricePerMToken: pricing.outputPricePerMToken,
        tags: m.tags,
        deprecated: false,
        cachedAt: now,
        expiresAt: now + MODEL_CACHE_TTL_MS,
      };
    });
  },

  async *createChatCompletion(
    apiKey: string,
    request: ChatRequest,
    customBaseUrl?: string,
    signal?: AbortSignal
  ): AsyncGenerator<ChatStreamEvent, void, unknown> {
    // Anthropic uses a different message format:
    // - system prompt is a top-level field, not a message
    // - no 'system' role in messages array
    const messages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const systemPrompt =
      request.systemPrompt ||
      request.messages.find(m => m.role === 'system')?.content;

    const body: any = {
      model: request.model,
      messages,
      max_tokens: request.maxTokens || 4096,
      stream: request.stream !== false,
    };

    if (systemPrompt) body.system = systemPrompt;
    if (request.temperature !== undefined) body.temperature = request.temperature;
    if (request.topP !== undefined) body.top_p = request.topP;
    if (request.topK !== undefined) body.top_k = request.topK;
    if (request.stopSequences?.length) body.stop_sequences = request.stopSequences;

    const response = await fetch(`${BASE_URL}/v1/messages`, {
      method: 'POST',
      headers: buildHeaders(apiKey),
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      yield {
        type: 'error',
        error: errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`,
        code: response.status,
      };
      return;
    }

    // ── Non-streaming ───────────────────────────────
    if (!body.stream) {
      const data = await response.json();
      const textBlock = data.content?.find((b: any) => b.type === 'text');
      yield {
        type: 'end',
        content: textBlock?.text || '',
        finishReason: data.stop_reason === 'end_turn' ? 'stop' : data.stop_reason,
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
      };
      return;
    }

    // ── Streaming (Anthropic SSE format) ─────────────
    const reader = response.body?.getReader();
    if (!reader) {
      yield { type: 'error', error: 'No response body' };
      return;
    }

    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';
    let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));

              switch (data.type) {
                case 'content_block_delta':
                  if (data.delta?.type === 'text_delta' && data.delta.text) {
                    accumulated += data.delta.text;
                    yield {
                      type: 'chunk',
                      content: data.delta.text,
                      fullContent: accumulated,
                    };
                  }
                  break;

                case 'message_delta':
                  if (data.usage) {
                    usage.completionTokens = data.usage.output_tokens || 0;
                  }
                  break;

                case 'message_start':
                  if (data.message?.usage) {
                    usage.promptTokens = data.message.usage.input_tokens || 0;
                  }
                  break;

                case 'message_stop':
                  usage.totalTokens = usage.promptTokens + usage.completionTokens;
                  yield {
                    type: 'end',
                    content: accumulated,
                    finishReason: 'stop',
                    usage,
                  };
                  return;

                case 'error':
                  yield {
                    type: 'error',
                    error: data.error?.message || 'Anthropic stream error',
                  };
                  return;
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      // Stream ended without message_stop
      if (accumulated) {
        usage.totalTokens = usage.promptTokens + usage.completionTokens;
        yield { type: 'end', content: accumulated, finishReason: 'stop', usage };
      }
    } finally {
      reader.releaseLock();
    }
  },

  getCapabilities(): ProviderCapabilities {
    return {
      streaming: true,
      vision: true,
      toolCalling: true,
      jsonMode: false,
      structuredOutput: false,
      reasoning: true,
      systemPrompt: true,
      maxConcurrent: 0,
    };
  },

  getParameterSchema(): ParameterSchema {
    return {
      parameters: [
        { key: 'temperature', label: 'Temperature', description: 'Controls randomness (0=deterministic, 1=creative)', type: 'number', default: 1, min: 0, max: 1, step: 0.05 },
        { key: 'top_p', label: 'Top P', description: 'Nucleus sampling threshold', type: 'number', default: 0.999, min: 0, max: 1, step: 0.05 },
        { key: 'top_k', label: 'Top K', description: 'Sample from top K tokens', type: 'number', default: 0, min: 0, max: 500, step: 1 },
        { key: 'max_tokens', label: 'Max Tokens', description: 'Maximum tokens to generate', type: 'number', default: 4096, min: 1, max: 32000, step: 1 },
        { key: 'stream', label: 'Stream', description: 'Stream the response', type: 'boolean', default: true },
      ],
    };
  },
};
