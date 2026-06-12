// ── Groq Provider Config ──────────────────────────────────

import type { OpenAICompatibleConfig } from '../types';

export const groqConfig: OpenAICompatibleConfig = {
  info: {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast LPU inference — Llama, Gemma, Mistral',
    icon: 'zap',
    docsUrl: 'https://console.groq.com/docs',
    apiKeyUrl: 'https://console.groq.com/keys',
    apiKeyPattern: /^gsk_[a-zA-Z0-9]{20,}$/,
    apiKeyPlaceholder: 'gsk_...',
  },
  baseUrl: 'https://api.groq.com/openai',
  modelFilter: (m: any) => {
    const id = m.id as string;
    return !id.includes('whisper') && !id.includes('tts') && !id.includes('guard');
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
