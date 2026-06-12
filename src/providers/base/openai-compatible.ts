// ─────────────────────────────────────────────────────────────
// OpenAI-Compatible Adapter — Shared implementation for 7 providers
// (OpenAI, OpenRouter, DeepSeek, Groq, Nvidia, Together, Mistral)
// ─────────────────────────────────────────────────────────────

import type { LLMProvider, OpenAICompatibleConfig } from '../types';
import type { ValidationResult } from '../../types/provider';
import type { ChatRequest, ChatStreamEvent } from '../../types/chat';
import type { ModelInfo } from '../../types/model';
import type { ProviderCapabilities, ParameterSchema } from '../../types/provider';
import { getModelPricing } from '../../lib/pricing';
import { MODEL_CACHE_TTL_MS } from '../../lib/constants';

/** Common OpenAI chat parameters. */
const COMMON_PARAMETERS: ParameterSchema = {
  parameters: [
    { key: 'temperature', label: 'Temperature', description: 'Controls randomness (0=deterministic, 2=creative)', type: 'number', default: 1, min: 0, max: 2, step: 0.05 },
    { key: 'top_p', label: 'Top P', description: 'Nucleus sampling threshold', type: 'number', default: 1, min: 0, max: 1, step: 0.05 },
    { key: 'max_tokens', label: 'Max Tokens', description: 'Maximum tokens to generate', type: 'number', default: 4096, min: 1, max: 128000, step: 1 },
    { key: 'presence_penalty', label: 'Presence Penalty', description: 'Penalize tokens that appear in the input', type: 'number', default: 0, min: -2, max: 2, step: 0.1 },
    { key: 'frequency_penalty', label: 'Frequency Penalty', description: 'Penalize repeated tokens', type: 'number', default: 0, min: -2, max: 2, step: 0.1 },
    { key: 'stream', label: 'Stream', description: 'Stream the response', type: 'boolean', default: true },
  ],
};

/**
 * Create an LLMProvider from an OpenAI-compatible config.
 * This single factory function powers 7 of our 10 providers.
 */
export function createOpenAICompatibleProvider(config: OpenAICompatibleConfig): LLMProvider {
  const {
    info,
    baseUrl,
    authHeaderPrefix = 'Bearer',
    authHeaderName = 'Authorization',
    modelsEndpoint = '/v1/models',
    chatEndpoint = '/v1/chat/completions',
    modelFilter,
    modelsResponseTransform,
    requestTransform,
    capabilities,
    extraHeaders = {},
    extraParameters,
  } = config;

  function buildHeaders(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      [authHeaderName]: `${authHeaderPrefix} ${apiKey}`.trim(),
      ...extraHeaders,
    };
  }

  return {
    info,

    async validateApiKey(apiKey: string, customBaseUrl?: string): Promise<ValidationResult> {
      try {
        const effectiveBaseUrl = customBaseUrl || baseUrl;
        const response = await fetch(`${effectiveBaseUrl}${modelsEndpoint}`, {
          method: 'GET',
          headers: buildHeaders(apiKey),
        });

        if (response.ok) {
          return { valid: true };
        }

        const errorData = await response.json().catch(() => ({}));
        let errorMessage =
          errorData?.error?.message ||
          errorData?.message ||
          `HTTP ${response.status}: ${response.statusText}`;

        if (response.status === 403 && (effectiveBaseUrl.includes('localhost') || effectiveBaseUrl.includes('127.0.0.1'))) {
          errorMessage = `HTTP 403 Forbidden: CORS Issue.\n\nTo use local models, you must allow the extension to connect.\n\nFor Ollama on Windows: Open Command Prompt, run \`setx OLLAMA_ORIGINS "*"\`, then completely close and restart Ollama.\nFor LM Studio: Enable "CORS" in the server settings.`;
        }

        return { valid: false, error: errorMessage };
      } catch (error) {
        return {
          valid: false,
          error: error instanceof Error ? error.message : 'Network error',
        };
      }
    },

    async listModels(apiKey: string, customBaseUrl?: string): Promise<ModelInfo[]> {
      try {
        const effectiveBaseUrl = customBaseUrl || baseUrl;
        const response = await fetch(`${effectiveBaseUrl}${modelsEndpoint}`, {
          method: 'GET',
          headers: buildHeaders(apiKey),
        });

        if (!response.ok) {
          throw new Error(`Failed to list models: ${response.statusText}`);
        }

        const data = await response.json();
        let models = modelsResponseTransform
          ? modelsResponseTransform(data)
          : data.data || [];

        if (modelFilter) {
          models = models.filter(modelFilter);
        }

        const now = Date.now();
        return models.map((m: any) => {
          const modelId = m.id || m.name;
          const pricing = getModelPricing(info.id, modelId);

          return {
            id: `${info.id}:${modelId}`,
            modelId,
            providerId: info.id,
            displayName: m.name || m.id || modelId,
            description: m.description || '',
            contextWindow: m.context_length || m.context_window || pricing.contextWindow,
            maxOutputTokens: m.max_output_tokens || m.top_provider?.max_completion_tokens || pricing.maxOutputTokens,
            supportsVision: m.capabilities?.vision || false,
            supportsTools: m.capabilities?.tool_calling || m.capabilities?.tools || false,
            supportsReasoning: m.capabilities?.reasoning || false,
            supportsStreaming: true,
            supportsJsonMode: m.capabilities?.json_mode || false,
            supportsStructuredOutput: m.capabilities?.structured_output || false,
            inputPricePerMToken: m.pricing?.prompt
              ? parseFloat(m.pricing.prompt) * 1_000_000
              : pricing.inputPricePerMToken,
            outputPricePerMToken: m.pricing?.completion
              ? parseFloat(m.pricing.completion) * 1_000_000
              : pricing.outputPricePerMToken,
            tags: [],
            deprecated: false,
            cachedAt: now,
            expiresAt: now + MODEL_CACHE_TTL_MS,
          } satisfies ModelInfo;
        });
      } catch (error) {
        console.error(`[${info.id}] Failed to list models:`, error);
        return [];
      }
    },

    async *createChatCompletion(
      apiKey: string,
      request: ChatRequest,
      customBaseUrl?: string,
      signal?: AbortSignal
    ): AsyncGenerator<ChatStreamEvent, void, unknown> {
      const messages = request.systemPrompt
        ? [{ role: 'system' as const, content: request.systemPrompt }, ...request.messages]
        : request.messages;

      let body: any = {
        model: request.model,
        messages,
        stream: request.stream !== false,
        temperature: request.temperature,
        top_p: request.topP,
        max_tokens: request.maxTokens,
        presence_penalty: request.presencePenalty,
        frequency_penalty: request.frequencyPenalty,
        seed: request.seed,
        stop: request.stopSequences,
        tools: request.tools,
      };

      // Remove undefined values
      body = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined));

      if (request.jsonMode) {
        body.response_format = { type: 'json_object' };
      }

      if (requestTransform) {
        body = requestTransform(body);
      }

      const effectiveBaseUrl = customBaseUrl || baseUrl;
      const response = await fetch(`${effectiveBaseUrl}${chatEndpoint}`, {
        method: 'POST',
        headers: buildHeaders(apiKey),
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errorData: any = {};
        try {
          if (errorText) errorData = JSON.parse(errorText);
        } catch (e) {}

        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        if (response.status === 403 && (effectiveBaseUrl.includes('localhost') || effectiveBaseUrl.includes('127.0.0.1'))) {
          errorMessage = `HTTP 403 Forbidden: CORS Issue.\n\nTo use local models, you must allow the extension to connect.\n\nFor Ollama on Windows: Open Command Prompt, run \`setx OLLAMA_ORIGINS "*"\`, then completely close and restart Ollama.\nFor LM Studio: Enable "CORS" in the server settings.`;
        } else if (errorData?.error) {
          errorMessage = typeof errorData.error === 'object'
            ? JSON.stringify(errorData.error, null, 2)
            : String(errorData.error);
        } else if (errorText) {
          errorMessage = errorText.slice(0, 1000); // cap length just in case
        }

        yield {
          type: 'error',
          error: errorMessage,
          code: response.status,
        };
        return;
      }

      // ── Non-streaming ───────────────────────────────
      if (!body.stream) {
        const data = await response.json();
        const choice = data.choices?.[0];
        yield {
          type: 'end',
          content: choice?.message?.content || '',
          finishReason: choice?.finish_reason || 'stop',
          toolCalls: choice?.message?.tool_calls,
          usage: data.usage
            ? {
                promptTokens: data.usage.prompt_tokens || 0,
                completionTokens: data.usage.completion_tokens || 0,
                totalTokens: data.usage.total_tokens || 0,
              }
            : undefined,
        };
        return;
      }

      // ── Streaming (SSE) ─────────────────────────────
      const reader = response.body?.getReader();
      if (!reader) {
        yield { type: 'error', error: 'No response body' };
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = '';
      let reasoningAccumulated = '';
      let buffer = '';
      let accumulatedToolCalls: any[] = [];

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

            if (trimmed === 'data: [DONE]') {
              yield {
                type: 'end',
                content: accumulated,
                finishReason: 'stop',
                toolCalls: accumulatedToolCalls.length > 0 ? accumulatedToolCalls : undefined,
              };
              return;
            }

            if (trimmed.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmed.slice(6));

                if (data.error) {
                  let errorMessage = typeof data.error === 'object'
                    ? JSON.stringify(data.error, null, 2)
                    : String(data.error);
                  yield { type: 'error', error: errorMessage };
                  return;
                }

                const delta = data.choices?.[0]?.delta;
                const finishReason = data.choices?.[0]?.finish_reason;

                if (delta?.content || delta?.reasoning_content) {
                  if (delta.content) accumulated += delta.content;
                  if (delta.reasoning_content) reasoningAccumulated += delta.reasoning_content;

                  yield {
                    type: 'chunk',
                    content: delta.content || '',
                    fullContent: accumulated,
                    reasoningContent: delta.reasoning_content,
                    fullReasoningContent: reasoningAccumulated,
                  };
                }

                if (delta?.tool_calls) {
                  for (const call of delta.tool_calls) {
                    const idx = call.index;
                    if (!accumulatedToolCalls[idx]) {
                      accumulatedToolCalls[idx] = {
                        id: call.id || '',
                        type: 'function',
                        function: { name: call.function?.name || '', arguments: '' },
                      };
                    }
                    if (call.function?.arguments) {
                      accumulatedToolCalls[idx].function.arguments += call.function.arguments;
                    }
                  }
                }

                if (finishReason) {
                  yield {
                    type: 'end',
                    content: accumulated,
                    finishReason,
                    toolCalls: accumulatedToolCalls.length > 0 ? accumulatedToolCalls.filter(Boolean) : undefined,
                    usage: data.usage
                      ? {
                          promptTokens: data.usage.prompt_tokens || 0,
                          completionTokens: data.usage.completion_tokens || 0,
                          totalTokens: data.usage.total_tokens || 0,
                        }
                      : undefined,
                  };
                  return;
                }
              } catch {
                // Skip malformed JSON lines
              }
            }
          }
        }

        // If stream ended without [DONE] marker
        if (accumulated || accumulatedToolCalls.length > 0) {
          yield {
            type: 'end',
            content: accumulated,
            finishReason: 'stop',
            toolCalls: accumulatedToolCalls.length > 0 ? accumulatedToolCalls.filter(Boolean) : undefined,
          };
        }
      } finally {
        reader.releaseLock();
      }
    },

    getCapabilities(): ProviderCapabilities {
      return capabilities;
    },

    getParameterSchema(): ParameterSchema {
      if (extraParameters) {
        return {
          parameters: [...COMMON_PARAMETERS.parameters, ...extraParameters.parameters],
        };
      }
      return COMMON_PARAMETERS;
    },
  };
}
