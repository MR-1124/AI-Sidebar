import type { OpenAICompatibleConfig } from '../types';

export const ollamaConfig: OpenAICompatibleConfig = {
  info: {
    id: 'ollama',
    name: 'Ollama',
    description: 'Run large language models locally',
    icon: 'cpu',
    docsUrl: 'https://ollama.com/docs',
    apiKeyUrl: '', // Not typically required for local
    apiKeyPlaceholder: 'Optional (leave blank for local instance)',
  },
  baseUrl: 'http://localhost:11434',
  modelsEndpoint: '/v1/models',
  chatEndpoint: '/v1/chat/completions',
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
