// ─────────────────────────────────────────────────────────────
// Message Handler — Routes messages from side panel
// ─────────────────────────────────────────────────────────────

import type { ServiceWorkerRequest } from '../types/messages';
import type { ProviderId } from '../types/provider';
import { getProvider } from '../providers/registry';
import { encryptApiKey, decryptApiKey } from './crypto';
import { STORAGE_KEYS } from '../lib/constants';

/**
 * Handle one-shot messages from the side panel.
 */
export async function handleMessage(
  message: ServiceWorkerRequest,
  sender: chrome.runtime.MessageSender
): Promise<any> {
  switch (message.type) {
    case 'VALIDATE_KEY':
      return handleValidateKey(message.payload.providerId, message.payload.apiKey, message.payload.customBaseUrl);

    case 'LIST_MODELS':
      return handleListModels(message.payload.providerId);

    case 'ENCRYPT_KEY':
      return handleEncryptKey(message.payload.providerId, message.payload.apiKey);

    case 'GENERATE_TITLE':
      return handleGenerateTitle(
        message.payload.providerId,
        message.payload.modelId,
        message.payload.messageContent
      );

    case 'STOP_GENERATION':
      // Handled via port, but can also be sent as one-shot
      const { cancelStream } = await import('./stream-manager');
      cancelStream(message.payload.requestId);
      return { success: true };

    case 'CAPTURE_SCREENSHOT':
      return handleCaptureScreenshot(sender.tab?.windowId);

    default:
      console.warn('Unknown message type:', (message as any).type);
      return { error: 'Unknown message type' };
  }
}

async function handleValidateKey(providerId: ProviderId, apiKey: string, customBaseUrl?: string) {
  const provider = getProvider(providerId);
  if (!provider) {
    return {
      type: 'VALIDATE_KEY_RESPONSE',
      payload: { providerId, valid: false, error: `Unknown provider: ${providerId}` },
    };
  }

  const result = await provider.validateApiKey(apiKey, customBaseUrl);

  // If valid, encrypt and store the key, then discover models
  if (result.valid) {
    const encrypted = await encryptApiKey(apiKey);

    // Store encrypted key
    const stored = await chrome.storage.local.get(STORAGE_KEYS.PROVIDERS);
    const providers: Record<string, any> = stored[STORAGE_KEYS.PROVIDERS] || {};
    providers[providerId as string] = {
      ...providers[providerId as string],
      providerId,
      encryptedApiKey: encrypted.ciphertext,
      iv: encrypted.iv,
      salt: encrypted.salt,
      isEnabled: true,
      status: 'valid',
      lastValidated: Date.now(),
      customBaseUrl,
    };
    await chrome.storage.local.set({ [STORAGE_KEYS.PROVIDERS]: providers });

    // Discover models
    const models = await provider.listModels(apiKey, customBaseUrl);

    return {
      type: 'VALIDATE_KEY_RESPONSE',
      payload: { providerId, valid: true, metadata: result.metadata, models },
    };
  }

  return {
    type: 'VALIDATE_KEY_RESPONSE',
    payload: { providerId, valid: false, error: result.error },
  };
}

async function handleListModels(providerId: ProviderId) {
  const provider = getProvider(providerId);
  if (!provider) {
    return {
      type: 'LIST_MODELS_RESPONSE',
      payload: { providerId, models: [], error: `Unknown provider: ${providerId}` },
    };
  }

  // Decrypt key
  const stored = await chrome.storage.local.get(STORAGE_KEYS.PROVIDERS);
  const providers = (stored[STORAGE_KEYS.PROVIDERS] || {}) as Record<string, any>;
  const config = providers[providerId as string];
  if (!config?.encryptedApiKey) {
    return {
      type: 'LIST_MODELS_RESPONSE',
      payload: { providerId, models: [], error: 'No API key configured' },
    };
  }

  const apiKey = await decryptApiKey({
    ciphertext: config.encryptedApiKey,
    iv: config.iv,
    salt: config.salt,
  });

  const models = await provider.listModels(apiKey, config.customBaseUrl);

  return {
    type: 'LIST_MODELS_RESPONSE',
    payload: { providerId, models },
  };
}

async function handleEncryptKey(providerId: ProviderId, apiKey: string) {
  const encrypted = await encryptApiKey(apiKey);
  return {
    type: 'ENCRYPT_KEY_RESPONSE',
    payload: {
      providerId,
      encryptedApiKey: encrypted.ciphertext,
      iv: encrypted.iv,
      salt: encrypted.salt,
    },
  };
}

async function handleGenerateTitle(providerId: ProviderId, modelId: string, messageContent: string) {
  const provider = getProvider(providerId);
  if (!provider) {
    return { type: 'GENERATE_TITLE_RESPONSE', payload: { error: 'Unknown provider' } };
  }

  // Decrypt key
  const stored = await chrome.storage.local.get(STORAGE_KEYS.PROVIDERS);
  const providers = (stored[STORAGE_KEYS.PROVIDERS] || {}) as Record<string, any>;
  const config = providers[providerId as string];
  if (!config?.encryptedApiKey) {
    return { type: 'GENERATE_TITLE_RESPONSE', payload: { error: 'No API key configured' } };
  }

  const apiKey = await decryptApiKey({
    ciphertext: config.encryptedApiKey,
    iv: config.iv,
    salt: config.salt,
  });

  try {
    const stream = provider.createChatCompletion(apiKey, {
      providerId,
      model: modelId,
      stream: true,
      messages: [
        { role: 'system', content: 'You are a highly efficient assistant. Your ONLY job is to write a concise, 3-5 word title summarizing the topic of the user message. Do NOT use quotes. Do NOT add periods or extra punctuation.' },
        { role: 'user', content: messageContent }
      ],
      temperature: 0.3,
      maxTokens: 20,
    });

    // Consume the stream
    let fullText = '';
    for await (const chunk of stream) {
      if (chunk.type === 'chunk' && chunk.content) {
        fullText += chunk.content;
      }
    }

    const title = fullText.trim().replace(/^["']|["']$/g, '');
    return {
      type: 'GENERATE_TITLE_RESPONSE',
      payload: { title }
    };
  } catch (error: any) {
    console.error('Failed to generate title:', error);
    return {
      type: 'GENERATE_TITLE_RESPONSE',
      payload: { error: error.message || 'Generation failed' }
    };
  }
}

async function handleCaptureScreenshot(windowId?: number) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(windowId as number, { format: 'jpeg', quality: 60 });
    return { success: true, dataUrl };
  } catch (error: any) {
    console.error('Failed to capture screenshot:', error);
    return { success: false, error: error.message };
  }
}
