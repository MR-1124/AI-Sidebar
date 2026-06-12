// ── OpenRouter Provider Config ─────────────────────────────

import type { OpenAICompatibleConfig } from '../types';

export const openrouterConfig: OpenAICompatibleConfig = {
  info: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access 200+ models from one API',
    icon: 'router',
    docsUrl: 'https://openrouter.ai/docs',
    apiKeyUrl: 'https://openrouter.ai/keys',
    apiKeyPattern: /^sk-or-v1-[a-f0-9]{64}$/,
    apiKeyPlaceholder: 'sk-or-v1-...',
  },
  baseUrl: 'https://openrouter.ai/api',
  modelsEndpoint: '/v1/models',
  chatEndpoint: '/v1/chat/completions',
  extraHeaders: {
    'HTTP-Referer': 'https://universal-ai-sidebar.dev',
    'X-Title': 'Universal AI Sidebar',
  },
  modelFilter: (m: any) => {
    // OpenRouter returns all models — filter to chat-capable
    return m.id && !m.id.includes('/embed') && !m.id.includes('/image');
  },
  capabilities: {
    streaming: true,
    vision: true,
    toolCalling: true,
    jsonMode: true,
    structuredOutput: false,
    reasoning: true,
    systemPrompt: true,
    maxConcurrent: 0,
  },
};
