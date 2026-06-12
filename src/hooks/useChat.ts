// ─────────────────────────────────────────────────────────────
// useChat Hook — Orchestrates chat interactions with the service worker
// REFACTORED: Decomposed into focused modules:
//   - chat-message-builder.ts (API message construction)
//   - useToolExecution.ts (tool call dispatch)
//   - streaming-buffer.ts (batched streaming updates)
//   - agent-orchestrator.ts (multi-step tool loops)
//   - context-manager.ts (sliding window context trimming)
// ─────────────────────────────────────────────────────────────

import { useCallback, useRef, useState, useEffect } from 'react';
import { useChatStore } from '../stores/chat-store';
import { useModelStore } from '../stores/model-store';
import { useSettingsStore } from '../stores/settings-store';
import { useUIStore } from '../stores/ui-store';
import { useUsageStore } from '../stores/usage-store';
import { STREAM_PORT_NAME } from '../lib/constants';
import { calculateCost, generateId } from '../lib/utils';
import { getCurrentPageContext } from '../lib/page-extractor';
import { buildSystemPrompt, buildTools, buildApiMessages } from '../lib/chat-message-builder';
import { executeAllToolCalls } from './useToolExecution';
import { StreamingBuffer } from '../lib/streaming-buffer';
import { AgentOrchestrator } from '../lib/agent-orchestrator';
import { trimMessagesToFit } from '../lib/context-manager';
import type { StreamMessage } from '../types/messages';

export function useChat() {
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const abortRef = useRef(false);
  const startTimeRef = useRef(0);
  const firstTokenTimeRef = useRef(0);
  const assistantMessageIdRef = useRef<string | null>(null);
  const streamingBufferRef = useRef<StreamingBuffer | null>(null);

  // Permission modal state
  const [pendingPermission, setPendingPermission] = useState<{
    action: string; target: string; value: string;
    resolve: (allowed: boolean) => void;
  } | null>(null);
  const [allowAllConversation, setAllowAllConversation] = useState<string | null>(null);

  const addUserMessage = useChatStore(s => s.addUserMessage);
  const addAssistantMessage = useChatStore(s => s.addAssistantMessage);
  const updateMessage = useChatStore(s => s.updateMessage);
  const batchUpdateMessage = useChatStore(s => s.batchUpdateMessage);
  const activeConversationId = useChatStore(s => s.activeConversationId);
  const createConversation = useChatStore(s => s.createConversation);

  const selectedProviderId = useModelStore(s => s.selectedProviderId);
  const selectedModelId = useModelStore(s => s.selectedModelId);
  const getSelectedModel = useModelStore(s => s.getSelectedModel);

  const settings = useSettingsStore(s => s.settings);
  const { setGenerating, isGenerating } = useUIStore();

  const recordUsage = useUsageStore(s => s.recordUsage);

  /**
   * Permission handler for browser actions.
   * Returns a promise that resolves when the user responds via the PermissionModal.
   */
  const getPermission = useCallback(async (action: string, target: string, value: string): Promise<boolean> => {
    // If user already chose "Allow All" for this conversation, auto-approve
    const currentConvId = useChatStore.getState().activeConversationId;
    if (allowAllConversation && allowAllConversation === currentConvId) {
      return true;
    }

    return new Promise<boolean>((resolve) => {
      setPendingPermission({ action, target, value, resolve });
    });
  }, [allowAllConversation]);

  const handlePermissionAllow = useCallback(() => {
    pendingPermission?.resolve(true);
    setPendingPermission(null);
  }, [pendingPermission]);

  const handlePermissionAllowAll = useCallback(() => {
    pendingPermission?.resolve(true);
    setPendingPermission(null);
    const currentConvId = useChatStore.getState().activeConversationId;
    if (currentConvId) setAllowAllConversation(currentConvId);
  }, [pendingPermission]);

  const handlePermissionDeny = useCallback(() => {
    pendingPermission?.resolve(false);
    setPendingPermission(null);
  }, [pendingPermission]);

  /**
   * Generate a title for a conversation.
   */
  const generateTitle = useCallback((convId: string, providerId: string, modelId: string, firstUserMsgContent: string) => {
    chrome.runtime.sendMessage(
      {
        type: 'GENERATE_TITLE',
        payload: { providerId, modelId, messageContent: firstUserMsgContent },
      },
      (response) => {
        if (response?.payload?.title) {
          useChatStore.getState().renameConversation(convId, response.payload.title);
        }
      }
    );
  }, []);

  /**
   * Main send message function.
   */
  const sendMessage = useCallback(async (
    content: string,
    attachments?: Array<{ type: 'image'|'file', data: string, name: string, mimeType: string }>
  ) => {
    if ((!content.trim() && (!attachments || attachments.length === 0)) || isGenerating) return;
    if (!selectedProviderId || !selectedModelId) return;

    // If no active conversation, create one
    let convId = activeConversationId;
    if (!convId) {
      const conv = await createConversation(selectedProviderId, selectedModelId, settings.chat.defaultSystemPrompt || undefined);
      convId = conv.id;
    }

    // Check for page context
    let pageContextObj = undefined;
    const { includePageContext, setIncludePageContext } = useUIStore.getState();
    if (includePageContext) {
      const pageCtx = await getCurrentPageContext();
      if (!pageCtx.error && pageCtx.content) {
        pageContextObj = { title: pageCtx.title, url: pageCtx.url, content: pageCtx.content };
        setIncludePageContext(false);
      } else if (pageCtx.error) {
        setIncludePageContext(false);
        await addUserMessage(content);
        await addAssistantMessage('', {
          providerId: selectedProviderId, modelId: selectedModelId,
          isStreaming: false, isError: true,
          errorMessage: `Failed to read page context: ${pageCtx.error}. Please ensure you have reloaded the extension to grant permissions, or try another page.`,
        });
        return;
      }
    }

    // Add user message
    await addUserMessage(content, { pageContext: pageContextObj, attachments });

    // Create placeholder assistant message
    const assistantMsg = await addAssistantMessage('', {
      providerId: selectedProviderId,
      modelId: selectedModelId,
      isStreaming: true,
    });

    if (!assistantMsg) return;
    assistantMessageIdRef.current = assistantMsg.id;

    const requestId = generateId();
    abortRef.current = false;
    startTimeRef.current = Date.now();
    firstTokenTimeRef.current = 0;
    setGenerating(true, requestId);

    // Create streaming buffer that flushes to the store every 50ms
    const buffer = new StreamingBuffer((msgId, bufContent, bufReasoning) => {
      batchUpdateMessage(msgId, bufContent, bufReasoning);
    }, 50);
    streamingBufferRef.current = buffer;

    // Agent orchestrator for multi-step tool calling
    const orchestrator = new AgentOrchestrator({ maxIterations: 10, isAborted: () => abortRef.current });

    const sendApiRequest = async (convIdInner: string, assistantMsgId: string, reqId: string) => {
      const currentSettings = useSettingsStore.getState().settings;
      const currentState = useChatStore.getState();

      // Build messages using the extracted pure function (with sanitization)
      const chatMessages = buildApiMessages(currentState.messages, convIdInner, assistantMsgId);

      // Build system prompt with model-aware agentic strategy
      const webSearchEnabled = useUIStore.getState().webSearchEnabled;
      const systemPrompt = buildSystemPrompt(
        currentSettings, selectedModelId,
        webSearchEnabled, currentSettings.tools.enableBrowserInteraction
      );

      const apiMessages = [{ role: 'system', content: systemPrompt }, ...chatMessages];

      // Context window management: trim if approaching limit
      const model = getSelectedModel();
      const contextWindow = model?.contextWindow || 128000;
      const trimmedMessages = trimMessagesToFit(apiMessages, contextWindow);

      // Build tools array
      const toolsToPass = buildTools(currentSettings, webSearchEnabled);

      try {
        const port = chrome.runtime.connect({ name: STREAM_PORT_NAME });
        portRef.current = port;

        port.postMessage({
          type: 'CHAT_REQUEST',
          payload: {
            requestId: reqId,
            messages: trimmedMessages.filter(m => m.role !== 'system'),
            model: selectedModelId,
            providerId: selectedProviderId,
            stream: currentSettings.chat.streamResponses,
            temperature: currentSettings.model.defaultTemperature,
            maxTokens: currentSettings.model.defaultMaxTokens,
            topP: currentSettings.model.defaultTopP,
            systemPrompt,
            tools: toolsToPass,
          },
        });

        port.onMessage.addListener(async (message: StreamMessage) => {
          if (abortRef.current) return;

          switch (message.type) {
            case 'CHAT_STREAM_CHUNK':
              if (!firstTokenTimeRef.current) {
                firstTokenTimeRef.current = Date.now();
              }
              // Use streaming buffer instead of per-token store updates
              if (message.payload.content) {
                buffer.append(assistantMsgId, message.payload.content);
              }
              if (message.payload.reasoningContent) {
                buffer.appendReasoning(assistantMsgId, message.payload.reasoningContent);
              }
              break;

            case 'CHAT_STREAM_END': {
              // Flush any remaining buffered content
              buffer.flush();

              const endTime = Date.now();
              const latencyMs = endTime - startTimeRef.current;
              const firstTokenMs = firstTokenTimeRef.current
                ? firstTokenTimeRef.current - startTimeRef.current
                : latencyMs;

              const modelInfo = getSelectedModel();
              const cost = message.payload.usage
                ? calculateCost(
                    message.payload.usage.promptTokens,
                    message.payload.usage.completionTokens,
                    modelInfo?.inputPricePerMToken || 0,
                    modelInfo?.outputPricePerMToken || 0
                  )
                : 0;

              // Multi-step agent loop: if tool calls, execute and continue
              if (message.payload.finishReason === 'tool_calls' && message.payload.toolCalls) {
                const currentContent = buffer.getContent(assistantMsgId)
                  || useChatStore.getState().messages.find(m => m.id === assistantMsgId)?.content
                  || '';

                updateMessage(assistantMsgId, {
                  content: currentContent,
                  isStreaming: false,
                  finishReason: 'tool_calls',
                  toolCalls: message.payload.toolCalls,
                  promptTokens: message.payload.usage?.promptTokens,
                  completionTokens: message.payload.usage?.completionTokens,
                  totalTokens: message.payload.usage?.totalTokens,
                  estimatedCost: cost,
                  latencyMs,
                  firstTokenMs,
                });

                // Record step in orchestrator
                orchestrator.recordStep(message.payload.toolCalls, []);

                // Check if we should continue the agentic loop
                if (orchestrator.shouldContinueLoop(message.payload.toolCalls)) {
                  // Execute all tool calls using the extracted module
                  await executeAllToolCalls(
                    message.payload.toolCalls,
                    currentSettings,
                    getPermission
                  );

                  // Create new assistant message for next iteration
                  const newAssistantMsg = await useChatStore.getState().addAssistantMessage('', {
                    providerId: selectedProviderId,
                    modelId: selectedModelId,
                    isStreaming: true,
                  });
                  if (newAssistantMsg) {
                    assistantMessageIdRef.current = newAssistantMsg.id;
                    buffer.clear(assistantMsgId);
                    const newReqId = generateId();
                    abortRef.current = false;
                    startTimeRef.current = Date.now();
                    firstTokenTimeRef.current = 0;
                    setGenerating(true, newReqId);
                    sendApiRequest(convIdInner, newAssistantMsg.id, newReqId);
                  }
                } else {
                  setGenerating(false);
                  port.disconnect();
                }
                return;
              }

              // Final text response
              const finalContent = message.payload.content
                || buffer.getContent(assistantMsgId)
                || useChatStore.getState().messages.find(m => m.id === assistantMsgId)?.content
                || '';

              updateMessage(assistantMsgId, {
                content: finalContent,
                isStreaming: false,
                finishReason: message.payload.finishReason,
                promptTokens: message.payload.usage?.promptTokens,
                completionTokens: message.payload.usage?.completionTokens,
                totalTokens: message.payload.usage?.totalTokens,
                estimatedCost: cost,
                latencyMs,
                firstTokenMs,
              });

              // Record usage analytics
              if (message.payload.usage) {
                const tokensPerSec = message.payload.usage.completionTokens / (latencyMs / 1000);
                recordUsage({
                  messageId: assistantMsgId,
                  conversationId: convIdInner,
                  providerId: selectedProviderId,
                  modelId: selectedModelId,
                  promptTokens: message.payload.usage.promptTokens,
                  completionTokens: message.payload.usage.completionTokens,
                  totalTokens: message.payload.usage.totalTokens,
                  estimatedCost: cost,
                  latencyMs,
                  firstTokenLatencyMs: firstTokenMs,
                  tokensPerSecond: tokensPerSec,
                  success: true,
                });
              }

              // Auto title generation
              const currentConv = useChatStore.getState().conversations.find(c => c.id === convIdInner);
              if (
                currentConv &&
                currentSettings.chat.autoGenerateTitle &&
                currentConv.messageCount <= 2 &&
                currentConv.title === 'New Chat'
              ) {
                const firstUserMsg = useChatStore.getState().messages.find(
                  m => m.conversationId === convIdInner && m.role === 'user'
                );
                if (firstUserMsg) {
                  generateTitle(convIdInner, selectedProviderId, selectedModelId, firstUserMsg.content);
                }
              }

              buffer.clear(assistantMsgId);
              setGenerating(false);
              port.disconnect();
              break;
            }

            case 'CHAT_STREAM_ERROR':
              buffer.flush();
              updateMessage(assistantMsgId, {
                isStreaming: false,
                isError: true,
                errorMessage: message.payload.error,
                content: buffer.getContent(assistantMsgId)
                  || useChatStore.getState().messages.find(m => m.id === assistantMsgId)?.content
                  || '',
              });
              buffer.clear(assistantMsgId);
              setGenerating(false);
              port.disconnect();
              break;
          }
        });

        port.onDisconnect.addListener(() => {
          portRef.current = null;
          if (useUIStore.getState().isGenerating) {
            // Abrupt disconnect (e.g. extension reload or worker crash)
            buffer.flush();
            updateMessage(assistantMsgId, {
              isStreaming: false,
              isError: true,
              errorMessage: 'Connection to background service worker lost.',
              content: buffer.getContent(assistantMsgId)
                || useChatStore.getState().messages.find(m => m.id === assistantMsgId)?.content
                || '',
            });
            buffer.clear(assistantMsgId);
            setGenerating(false);
          }
        });
      } catch (error) {
        updateMessage(assistantMsgId, {
          isStreaming: false,
          isError: true,
          errorMessage: error instanceof Error ? error.message : 'Connection error',
        });
        setGenerating(false);
      }
    };

    sendApiRequest(convId, assistantMsg.id, requestId);
  }, [activeConversationId, selectedProviderId, selectedModelId, isGenerating, settings, getPermission, generateTitle]);

  const stopGeneration = useCallback(() => {
    abortRef.current = true;

    // Flush and clean up streaming buffer
    if (streamingBufferRef.current) {
      streamingBufferRef.current.flush();
      streamingBufferRef.current.destroy();
      streamingBufferRef.current = null;
    }

    if (portRef.current) {
      portRef.current.postMessage({
        type: 'STOP_GENERATION',
        payload: { requestId: useUIStore.getState().activeRequestId },
      });
      portRef.current.disconnect();
      portRef.current = null;
    }

    if (assistantMessageIdRef.current) {
      updateMessage(assistantMessageIdRef.current, {
        isStreaming: false,
        finishReason: 'stop',
      });
    }

    setGenerating(false);
  }, []);

  /**
   * Regenerate the last assistant message.
   * Creates a new version branch instead of deleting the old response.
   */
  const regenerateLastMessage = useCallback(async () => {
    const currentMessages = useChatStore.getState().messages;
    if (currentMessages.length < 2) return;

    const lastUserMessage = [...currentMessages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return;

    // Find the last assistant message — mark it as a previous version instead of deleting
    const lastAssistantMessage = [...currentMessages].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMessage) {
      // Keep the old message but mark it with parentMessageId for branching
      updateMessage(lastAssistantMessage.id, {
        parentMessageId: lastAssistantMessage.parentMessageId || lastAssistantMessage.id,
        version: (lastAssistantMessage.version || 1),
      });
    }

    // Re-send triggers a new assistant message (which becomes the new branch)
    await sendMessage(lastUserMessage.content);
  }, [sendMessage]);

  // Listen for global stop generation events (e.g. from Escape key shortcuts)
  useEffect(() => {
    const handleStopEvent = () => stopGeneration();
    window.addEventListener('aiside-stop-generation', handleStopEvent);
    return () => window.removeEventListener('aiside-stop-generation', handleStopEvent);
  }, [stopGeneration]);

  return {
    sendMessage,
    stopGeneration,
    regenerateLastMessage,
    isGenerating,
    // Permission modal state & handlers
    pendingPermission,
    handlePermissionAllow,
    handlePermissionAllowAll,
    handlePermissionDeny,
  };
}
