// ── Together AI Provider Config ───────────────────────────

import type { OpenAICompatibleConfig } from '../types';

export const togetherConfig: OpenAICompatibleConfig = {
  info: {
    id: 'together',
    name: 'Together AI',
    description: 'Open-source models at scale — Llama, Qwen, Mixtral',
    icon: 'users',
    docsUrl: 'https://docs.together.ai',
    apiKeyUrl: 'https://api.together.xyz/settings/api-keys',
    apiKeyPattern: /^[a-f0-9]{64}$/,
    apiKeyPlaceholder: 'Enter Together AI API key',
  },
  baseUrl: 'https://api.together.xyz',
  modelFilter: (m: any) => {
    const type = m.type || m.display_type || '';
    return type === 'chat' || type === 'language' || !type;
  },
  capabilities: {
    streaming: true,
    vision: true,
    toolCalling: true,
    jsonMode: true,
    structuredOutput: false,
    reasoning: false,
    systemPrompt: true,
    maxConcurrent: 0,
  },
};
