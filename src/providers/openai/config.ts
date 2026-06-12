// ── OpenAI Provider Config ─────────────────────────────────

import type { OpenAICompatibleConfig } from '../types';

export const openaiConfig: OpenAICompatibleConfig = {
  info: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4.1, o3, and more',
    icon: 'brain',
    docsUrl: 'https://platform.openai.com/docs',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    apiKeyPattern: /^sk-[a-zA-Z0-9_-]{20,}$/,
    apiKeyPlaceholder: 'sk-...',
  },
  baseUrl: 'https://api.openai.com',
  modelFilter: (m: any) => {
    const id = m.id as string;
    // Filter to chat-capable models only
    return (
      (id.startsWith('gpt-') || id.startsWith('o1') || id.startsWith('o3') || id.startsWith('o4') || id.startsWith('chatgpt')) &&
      !id.includes('instruct') &&
      !id.includes('audio') &&
      !id.includes('realtime') &&
      !id.includes('tts') &&
      !id.includes('whisper') &&
      !id.includes('dall-e') &&
      !id.includes('embedding')
    );
  },
  capabilities: {
    streaming: true,
    vision: true,
    toolCalling: true,
    jsonMode: true,
    structuredOutput: true,
    reasoning: true,
    systemPrompt: true,
    maxConcurrent: 0,
  },
};
