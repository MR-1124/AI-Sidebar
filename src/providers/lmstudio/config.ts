import type { OpenAICompatibleConfig } from '../types';

export const lmstudioConfig: OpenAICompatibleConfig = {
  info: {
    id: 'lmstudio',
    name: 'LM Studio',
    description: 'Run large language models locally using LM Studio',
    icon: 'cpu',
    docsUrl: 'https://lmstudio.ai/docs',
    apiKeyUrl: '', // Not typically required for local
    apiKeyPlaceholder: 'Optional (leave blank for local instance)',
  },
  baseUrl: 'http://localhost:1234/v1',
  modelsEndpoint: '/models',
  chatEndpoint: '/chat/completions',
  capabilities: {
    streaming: true,
    vision: true,
    toolCalling: true,
    jsonMode: true,
    structuredOutput: true,
    reasoning: false,
    systemPrompt: true,
    maxConcurrent: 1, // Usually local instances shouldn't be spammed
  },
};
