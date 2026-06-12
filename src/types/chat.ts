// ─────────────────────────────────────────────────────────────
// Chat Types — Conversations, messages, and streaming events
// ─────────────────────────────────────────────────────────────

import type { ProviderId } from './provider';

/**
 * A single chat conversation.
 */
export interface Conversation {
  id: string;
  title: string;
  folderId?: string;
  providerId: ProviderId;
  modelId: string;
  systemPrompt?: string;

  // ── Organization ──────────────────────────────────
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  tags: string[];

  // ── Stats ─────────────────────────────────────────
  messageCount: number;
  totalTokens: number;
  estimatedCost: number;

  // ── Timestamps ────────────────────────────────────
  createdAt: number;
  updatedAt: number;
  lastMessageAt: number;
}

/**
 * Role for a chat message.
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * A native Tool Call payload (OpenAI format).
 */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

/**
 * Reason why the model stopped generating.
 */
export type FinishReason = 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error' | null;

/**
 * A single message in a conversation.
 */
export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;

  // ── Model info ────────────────────────────────────
  providerId?: ProviderId;
  modelId?: string;
  reasoningContent?: string;

  // ── Token usage ───────────────────────────────────
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;

  // ── Performance ───────────────────────────────────
  latencyMs?: number;
  firstTokenMs?: number;
  finishReason?: FinishReason;

  // ── Versioning (for edits) ────────────────────────
  parentMessageId?: string;
  version: number;

  // ── State ─────────────────────────────────────────
  isStreaming?: boolean;
  isError?: boolean;
  errorMessage?: string;

  // ── Timestamps ────────────────────────────────────
  createdAt: number;

  // ── Attached Context ──────────────────────────────
  pageContext?: {
    title: string;
    url: string;
    content: string;
  };

  // ── Tool Calling ──────────────────────────────────
  toolCalls?: ToolCall[];
  toolCallId?: string;
  toolName?: string;

  // ── Attachments ───────────────────────────────────
  attachments?: {
    type: 'image' | 'file';
    data: string;
    name: string;
    mimeType: string;
  }[];
}

/**
 * Chat completion request — provider-agnostic format.
 * Each provider adapter transforms this into its native format.
 */
export interface ChatRequest {
  messages: ChatMessage[];
  model: string;
  providerId: ProviderId;

  // ── Parameters ────────────────────────────────────
  stream: boolean;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
  seed?: number;
  stopSequences?: string[];
  jsonMode?: boolean;
  systemPrompt?: string;

  // ── Future hooks ──────────────────────────────────
  tools?: unknown[];
}

/**
 * Simplified message format for API requests.
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string; // Sometimes required for tool messages
  attachments?: {
    type: 'image' | 'file';
    data: string;
    name: string;
    mimeType: string;
  }[];
}

// ─────────────────────────────────────────────────────────────
// Streaming Events — Emitted by provider adapters
// ─────────────────────────────────────────────────────────────

export type ChatStreamEvent =
  | ChatStreamChunk
  | ChatStreamEnd
  | ChatStreamError;

export interface ChatStreamChunk {
  type: 'chunk';
  content: string;
  /** Accumulated content so far (optional, for providers that send full text). */
  fullContent?: string;
  /** Streaming reasoning tokens (e.g. DeepSeek R1) */
  reasoningContent?: string;
  /** Accumulated reasoning content so far */
  fullReasoningContent?: string;
}

export interface ChatStreamEnd {
  type: 'end';
  content: string;        // Final full content
  finishReason: FinishReason;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatStreamError {
  type: 'error';
  error: string;
  code?: string | number;
}

/**
 * A folder for organizing conversations.
 */
export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  color?: string;
  sortOrder: number;
  createdAt: number;
}

/**
 * Chat export format options.
 */
export type ExportFormat = 'markdown' | 'json' | 'txt' | 'html' | 'pdf';
