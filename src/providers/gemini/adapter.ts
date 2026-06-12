// ─────────────────────────────────────────────────────────────
// Google Gemini Adapter — Custom adapter for Gemini API
// Uses generateContent / streamGenerateContent endpoints.
// ─────────────────────────────────────────────────────────────

import type { LLMProvider } from '../types';
import type { ValidationResult, ProviderCapabilities, ParameterSchema } from '../../types/provider';
import type { ChatRequest, ChatStreamEvent } from '../../types/chat';
import type { ModelInfo } from '../../types/model';
import { getModelPricing } from '../../lib/pricing';
import { MODEL_CACHE_TTL_MS } from '../../lib/constants';

const BASE_URL = 'https://generativelanguage.googleapis.com';

export const geminiAdapter: LLMProvider = {
  info: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini 2.5 Flash & Pro — Google\'s frontier models',
    icon: 'gem',
    docsUrl: 'https://ai.google.dev/docs',
    apiKeyUrl: 'https://aistudio.google.com/app/apikey',
    apiKeyPattern: /^AIza[a-zA-Z0-9_-]{35}$/,
    apiKeyPlaceholder: 'AIza...',
  },

  async validateApiKey(apiKey: string, customBaseUrl?: string): Promise<ValidationResult> {
    try {
      const response = await fetch(
        `${BASE_URL}/v1beta/models?key=${apiKey}`
      );

      if (response.ok) {
        return { valid: true };
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

  async listModels(apiKey: string, customBaseUrl?: string): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${BASE_URL}/v1beta/models?key=${apiKey}`);
      if (!response.ok) return [];

      const data = await response.json();
      const models = (data.models || []).filter((m: any) => {
        const name = m.name as string;
        return (
          m.supportedGenerationMethods?.includes('generateContent') &&
          name.includes('gemini') &&
          !name.includes('embedding') &&
          !name.includes('aqa')
        );
      });

      const now = Date.now();
      return models.map((m: any) => {
        const modelId = m.name.replace('models/', '');
        const pricing = getModelPricing('gemini', modelId);

        return {
          id: `gemini:${modelId}`,
          modelId,
          providerId: 'gemini' as const,
          displayName: m.displayName || modelId,
          description: m.description || '',
          contextWindow: m.inputTokenLimit || pricing.contextWindow,
          maxOutputTokens: m.outputTokenLimit || pricing.maxOutputTokens,
          supportsVision: true,
          supportsTools: true,
          supportsReasoning: modelId.includes('pro') || modelId.includes('think'),
          supportsStreaming: true,
          supportsJsonMode: true,
          supportsStructuredOutput: true,
          inputPricePerMToken: pricing.inputPricePerMToken,
          outputPricePerMToken: pricing.outputPricePerMToken,
          tags: [],
          deprecated: false,
          cachedAt: now,
          expiresAt: now + MODEL_CACHE_TTL_MS,
        } satisfies ModelInfo;
      });
    } catch (error) {
      console.error('[gemini] Failed to list models:', error);
      return [];
    }
  },

  async *createChatCompletion(
    apiKey: string,
    request: ChatRequest,
    customBaseUrl?: string,
    signal?: AbortSignal
  ): AsyncGenerator<ChatStreamEvent, void, unknown> {
    // Transform OpenAI-style messages to Gemini format
    const contents = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const systemPrompt =
      request.systemPrompt ||
      request.messages.find(m => m.role === 'system')?.content;

    const body: any = {
      contents,
      generationConfig: {
        maxOutputTokens: request.maxTokens || 8192,
      },
    };

    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }
    if (request.temperature !== undefined) {
      body.generationConfig.temperature = request.temperature;
    }
    if (request.topP !== undefined) {
      body.generationConfig.topP = request.topP;
    }
    if (request.topK !== undefined) {
      body.generationConfig.topK = request.topK;
    }
    if (request.stopSequences?.length) {
      body.generationConfig.stopSequences = request.stopSequences;
    }
    if (request.jsonMode) {
      body.generationConfig.responseMimeType = 'application/json';
    }

    const model = request.model;
    const useStream = request.stream !== false;
    const endpoint = useStream ? 'streamGenerateContent' : 'generateContent';
    const url = `${BASE_URL}/v1beta/models/${model}:${endpoint}?key=${apiKey}${useStream ? '&alt=sse' : ''}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    if (!useStream) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .join('') || '';
      yield {
        type: 'end',
        content: text,
        finishReason: 'stop',
        usage: data.usageMetadata
          ? {
              promptTokens: data.usageMetadata.promptTokenCount || 0,
              completionTokens: data.usageMetadata.candidatesTokenCount || 0,
              totalTokens: data.usageMetadata.totalTokenCount || 0,
            }
          : undefined,
      };
      return;
    }

    // ── Streaming ───────────────────────────────────
    const reader = response.body?.getReader();
    if (!reader) {
      yield { type: 'error', error: 'No response body' };
      return;
    }

    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';
    let lastUsage: any = null;

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
              const text = data.candidates?.[0]?.content?.parts
                ?.map((p: any) => p.text)
                .join('') || '';

              if (text) {
                accumulated += text;
                yield {
                  type: 'chunk',
                  content: text,
                  fullContent: accumulated,
                };
              }

              if (data.usageMetadata) {
                lastUsage = data.usageMetadata;
              }

              // Check for finish
              const finishReason = data.candidates?.[0]?.finishReason;
              if (finishReason === 'STOP' || finishReason === 'MAX_TOKENS') {
                yield {
                  type: 'end',
                  content: accumulated,
                  finishReason: finishReason === 'STOP' ? 'stop' : 'length',
                  usage: lastUsage
                    ? {
                        promptTokens: lastUsage.promptTokenCount || 0,
                        completionTokens: lastUsage.candidatesTokenCount || 0,
                        totalTokens: lastUsage.totalTokenCount || 0,
                      }
                    : undefined,
                };
                return;
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      if (accumulated) {
        yield {
          type: 'end',
          content: accumulated,
          finishReason: 'stop',
          usage: lastUsage
            ? {
                promptTokens: lastUsage.promptTokenCount || 0,
                completionTokens: lastUsage.candidatesTokenCount || 0,
                totalTokens: lastUsage.totalTokenCount || 0,
              }
            : undefined,
        };
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
      jsonMode: true,
      structuredOutput: true,
      reasoning: true,
      systemPrompt: true,
      maxConcurrent: 0,
    };
  },

  getParameterSchema(): ParameterSchema {
    return {
      parameters: [
        { key: 'temperature', label: 'Temperature', description: 'Controls randomness (0=deterministic, 2=creative)', type: 'number', default: 1, min: 0, max: 2, step: 0.05 },
        { key: 'top_p', label: 'Top P', description: 'Nucleus sampling threshold', type: 'number', default: 0.95, min: 0, max: 1, step: 0.05 },
        { key: 'top_k', label: 'Top K', description: 'Sample from top K tokens', type: 'number', default: 40, min: 1, max: 100, step: 1 },
        { key: 'max_tokens', label: 'Max Tokens', description: 'Maximum tokens to generate', type: 'number', default: 8192, min: 1, max: 65536, step: 1 },
        { key: 'stream', label: 'Stream', description: 'Stream the response', type: 'boolean', default: true },
      ],
    };
  },
};
