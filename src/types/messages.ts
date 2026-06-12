// ─────────────────────────────────────────────────────────────
// Chrome Extension Message Types — Typed message passing
// between Side Panel ↔ Service Worker
// ─────────────────────────────────────────────────────────────

import type { ChatRequest, ChatStreamEvent, FinishReason } from './chat';
import type { ProviderId, ProviderStatus, ValidationResult } from './provider';
import type { ModelInfo } from './model';

// ─────────────────────────────────────────────────────────────
// Request Messages (Side Panel → Service Worker)
// ─────────────────────────────────────────────────────────────

export interface ValidateKeyRequest {
  type: 'VALIDATE_KEY';
  payload: {
    providerId: ProviderId;
    apiKey: string;
    customBaseUrl?: string;
  };
}

export interface ListModelsRequest {
  type: 'LIST_MODELS';
  payload: {
    providerId: ProviderId;
  };
}

export interface ChatRequestMessage {
  type: 'CHAT_REQUEST';
  payload: ChatRequest;
}

export interface StopGenerationRequest {
  type: 'STOP_GENERATION';
  payload: {
    requestId: string;
  };
}

export interface EncryptKeyRequest {
  type: 'ENCRYPT_KEY';
  payload: {
    providerId: ProviderId;
    apiKey: string;
  };
}

export interface DecryptKeyRequest {
  type: 'DECRYPT_KEY';
  payload: {
    providerId: ProviderId;
  };
}

export interface GenerateTitleRequest {
  type: 'GENERATE_TITLE';
  payload: {
    providerId: ProviderId;
    modelId: string;
    messageContent: string;
  };
}

export interface CaptureScreenshotRequest {
  type: 'CAPTURE_SCREENSHOT';
  payload?: never;
}

export type ServiceWorkerRequest =
  | ValidateKeyRequest
  | ListModelsRequest
  | ChatRequestMessage
  | StopGenerationRequest
  | EncryptKeyRequest
  | DecryptKeyRequest
  | GenerateTitleRequest
  | CaptureScreenshotRequest;

// ─────────────────────────────────────────────────────────────
// Response Messages (Service Worker → Side Panel)
// ─────────────────────────────────────────────────────────────

export interface ValidateKeyResponse {
  type: 'VALIDATE_KEY_RESPONSE';
  payload: ValidationResult & {
    providerId: ProviderId;
  };
}

export interface ListModelsResponse {
  type: 'LIST_MODELS_RESPONSE';
  payload: {
    providerId: ProviderId;
    models: ModelInfo[];
    error?: string;
  };
}

export interface EncryptKeyResponse {
  type: 'ENCRYPT_KEY_RESPONSE';
  payload: {
    providerId: ProviderId;
    encryptedApiKey: string;
    iv: string;
    salt: string;
  };
}

export interface GenerateTitleResponse {
  type: 'GENERATE_TITLE_RESPONSE';
  payload: {
    title?: string;
    error?: string;
  };
}

// ─────────────────────────────────────────────────────────────
// Streaming Messages (via chrome.runtime.Port)
// ─────────────────────────────────────────────────────────────

export interface ChatStreamChunkMessage {
  type: 'CHAT_STREAM_CHUNK';
  payload: {
    requestId: string;
    content: string;
    reasoningContent?: string;
    fullReasoningContent?: string;
  };
}

export interface ChatStreamEndMessage {
  type: 'CHAT_STREAM_END';
  payload: {
    requestId: string;
    content: string;
    finishReason: FinishReason;
    toolCalls?: import('./chat').ToolCall[];
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

export interface ChatStreamErrorMessage {
  type: 'CHAT_STREAM_ERROR';
  payload: {
    requestId: string;
    error: string;
    code?: string | number;
  };
}

export type StreamMessage =
  | ChatStreamChunkMessage
  | ChatStreamEndMessage
  | ChatStreamErrorMessage;

export type ServiceWorkerResponse =
  | ValidateKeyResponse
  | ListModelsResponse
  | EncryptKeyResponse
  | GenerateTitleResponse
  | StreamMessage;
