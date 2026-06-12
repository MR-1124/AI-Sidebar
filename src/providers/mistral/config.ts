// ── Mistral Provider Config ───────────────────────────────

import type { OpenAICompatibleConfig } from '../types';

export const mistralConfig: OpenAICompatibleConfig = {
  info: {
    id: 'mistral',
    name: 'Mistral',
    description: 'Mistral Large, Small, Codestral',
    icon: 'wind',
    docsUrl: 'https://docs.mistral.ai',
    apiKeyUrl: 'https://console.mistral.ai/api-keys',
    apiKeyPattern: /^[a-zA-Z0-9]{32}$/,
    apiKeyPlaceholder: 'Enter Mistral API key',
  },
  baseUrl: 'https://api.mistral.ai',
  modelFilter: (m: any) => {
    const id = m.id as string;
    return !id.includes('embed') && !id.includes('moderation');
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
