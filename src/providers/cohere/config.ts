// ─────────────────────────────────────────────────────────────
// Cohere Provider Config — OpenAI-compatible adapter for Cohere v2
// ─────────────────────────────────────────────────────────────

import type { OpenAICompatibleConfig } from '../types';

export const cohereConfig: OpenAICompatibleConfig = {
  info: {
    id: 'cohere',
    name: 'Cohere',
    description: 'Command R & R+ — enterprise-grade language models',
    icon: 'terminal',
    docsUrl: 'https://docs.cohere.com',
    apiKeyUrl: 'https://dashboard.cohere.com/api-keys',
    apiKeyPattern: /^[a-zA-Z0-9]{40}$/,
    apiKeyPlaceholder: 'Enter your Cohere API key...',
  },
  baseUrl: 'https://api.cohere.com',
  chatEndpoint: '/v2/chat',
  modelsEndpoint: '/v1/models',
  modelsResponseTransform: (response: any) => {
    // Cohere returns { models: [...] }
    return (response.models || []).filter(
      (m: any) => m.endpoints?.includes('chat')
    );
  },
  modelFilter: (model: any) => {
    // Only include chat-capable models
    return true;
  },
  requestTransform: (body: any) => {
    // Cohere v2 API is OpenAI-compatible but uses 'model' directly
    return body;
  },
  capabilities: {
    streaming: true,
    vision: false,
    toolCalling: true,
    jsonMode: true,
    structuredOutput: false,
    reasoning: false,
    systemPrompt: true,
    maxConcurrent: 0,
  },
};
