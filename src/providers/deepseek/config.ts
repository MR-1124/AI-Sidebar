// ── DeepSeek Provider Config ──────────────────────────────

import type { OpenAICompatibleConfig } from '../types';

export const deepseekConfig: OpenAICompatibleConfig = {
  info: {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek-V3, DeepSeek-R1 reasoning',
    icon: 'search',
    docsUrl: 'https://platform.deepseek.com/docs',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    apiKeyPattern: /^sk-[a-f0-9]{32,}$/,
    apiKeyPlaceholder: 'sk-...',
  },
  baseUrl: 'https://api.deepseek.com',
  modelFilter: (m: any) => {
    const id = m.id as string;
    return id.startsWith('deepseek-');
  },
  capabilities: {
    streaming: true,
    vision: false,
    toolCalling: true,
    jsonMode: true,
    structuredOutput: false,
    reasoning: true,
    systemPrompt: true,
    maxConcurrent: 0,
  },
};
