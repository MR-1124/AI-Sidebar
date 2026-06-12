// ── Nvidia NIM Provider Config ────────────────────────────

import type { OpenAICompatibleConfig } from '../types';

export const nvidiaConfig: OpenAICompatibleConfig = {
  info: {
    id: 'nvidia',
    name: 'Nvidia NIM',
    description: 'Nvidia-hosted models via NIM microservices',
    icon: 'gpu',
    docsUrl: 'https://docs.api.nvidia.com',
    apiKeyUrl: 'https://build.nvidia.com',
    apiKeyPattern: /^nvapi-[a-zA-Z0-9_-]{20,}$/,
    apiKeyPlaceholder: 'nvapi-...',
  },
  baseUrl: 'https://integrate.api.nvidia.com',
  modelFilter: (m: any) => {
    const id = m.id as string;
    return !id.includes('embed') && !id.includes('rerank') && !id.includes('vlm');
  },
  capabilities: {
    streaming: true,
    vision: false,
    toolCalling: true,
    jsonMode: false,
    structuredOutput: false,
    reasoning: false,
    systemPrompt: true,
    maxConcurrent: 0,
  },
};
