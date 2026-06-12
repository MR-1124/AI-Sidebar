// ─────────────────────────────────────────────────────────────
// Typed Messaging — Type-safe chrome.runtime message passing
// ─────────────────────────────────────────────────────────────

import type {
  ServiceWorkerRequest,
  ValidateKeyRequest,
  ListModelsRequest,
  EncryptKeyRequest,
  GenerateTitleRequest,
  StopGenerationRequest,
  CaptureScreenshotRequest,
} from '../types/messages';

/**
 * Maps request types to their payload types and expected response types.
 */
interface MessagePayloadMap {
  VALIDATE_KEY: {
    payload: ValidateKeyRequest['payload'];
    response: { type: string; payload: { providerId: string; valid: boolean; error?: string; metadata?: Record<string, unknown>; models?: any[] } };
  };
  LIST_MODELS: {
    payload: ListModelsRequest['payload'];
    response: { type: string; payload: { providerId: string; models: any[]; error?: string } };
  };
  ENCRYPT_KEY: {
    payload: EncryptKeyRequest['payload'];
    response: { type: string; payload: { providerId: string; encryptedApiKey: string; iv: string; salt: string } };
  };
  GENERATE_TITLE: {
    payload: GenerateTitleRequest['payload'];
    response: { type: string; payload: { title?: string; error?: string } };
  };
  STOP_GENERATION: {
    payload: StopGenerationRequest['payload'];
    response: { success: boolean };
  };
  CAPTURE_SCREENSHOT: {
    payload: undefined;
    response: { success: boolean; dataUrl?: string; error?: string };
  };
}

type MessageType = keyof MessagePayloadMap;

/**
 * Send a typed message to the service worker.
 * Enforces correct payload type at compile time and returns the expected response type.
 */
export function typedSendMessage<T extends MessageType>(
  type: T,
  payload: MessagePayloadMap[T]['payload']
): Promise<MessagePayloadMap[T]['response']> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type, payload } as ServiceWorkerRequest,
      (response: MessagePayloadMap[T]['response']) => {
        resolve(response);
      }
    );
  });
}
