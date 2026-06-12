// ─────────────────────────────────────────────────────────────
// useToolExecution — Executes tool calls from the AI model
// Extracted from useChat.ts for modularity
// ─────────────────────────────────────────────────────────────

import type { ToolCall } from '../types/chat';
import type { AppSettings } from '../types/settings';
import { performTavilySearch } from '../lib/tavily';
import { performDuckDuckGoSearch } from '../lib/duckduckgo';
import { executeBrowserAction } from '../lib/dom-actor';
import { useChatStore } from '../stores/chat-store';

export interface ToolExecutionResult {
  toolCallId: string;
  toolName: string;
  result: string;
}

/**
 * Execute a single tool call and return the result.
 */
export async function executeToolCall(
  call: ToolCall,
  settings: AppSettings,
  getPermission: (action: string, target: string, value: string) => Promise<boolean>
): Promise<ToolExecutionResult> {
  const { id, function: fn } = call;

  if (fn.name === 'web_search' || fn.name === 'tavily_search' || fn.name === 'duckduckgo_search') {
    try {
      const args = JSON.parse(fn.arguments);
      let result;
      if (settings.tools.searchEngine === 'tavily' && settings.tools.tavilyApiKey) {
        result = await performTavilySearch(args.query, settings.tools.tavilyApiKey);
      } else {
        result = await performDuckDuckGoSearch(args.query);
      }
      return { toolCallId: id, toolName: fn.name, result: JSON.stringify(result.results) };
    } catch (err) {
      return {
        toolCallId: id,
        toolName: fn.name,
        result: `Error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  if (fn.name === 'browser_action') {
    try {
      const args = JSON.parse(fn.arguments);

      // Check permissions
      let allowed = settings.tools.browserInteractionPermission === 'automatic';

      if (!allowed) {
        allowed = await getPermission(
          args.action,
          args.selector || args.element_id?.toString() || 'N/A',
          args.value || 'N/A'
        );
      }

      if (!allowed) {
        return {
          toolCallId: id,
          toolName: fn.name,
          result: JSON.stringify({
            success: false,
            message: 'User denied the browser interaction request.',
          }),
        };
      }

      const result: any = await executeBrowserAction(args);

      if (args.action === 'draw_boxes' || args.action === 'observe') {
        const screenshotRes = await new Promise<any>(resolve => {
          chrome.runtime.sendMessage({ type: 'CAPTURE_SCREENSHOT' }, resolve);
        });
        if (screenshotRes?.success) {
          result.screenshot = `![screenshot](${screenshotRes.dataUrl})`;
          result.message += ` The screenshot has been captured and passed to you below.`;
        }
      }

      return { toolCallId: id, toolName: fn.name, result: JSON.stringify(result) };
    } catch (err) {
      return {
        toolCallId: id,
        toolName: fn.name,
        result: `Error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  // Unknown tool
  return {
    toolCallId: id,
    toolName: fn.name,
    result: `Error: Unknown tool ${fn.name}`,
  };
}

/**
 * Execute all tool calls from a model response and add results to the conversation.
 */
export async function executeAllToolCalls(
  toolCalls: ToolCall[],
  settings: AppSettings,
  getPermission: (action: string, target: string, value: string) => Promise<boolean>
): Promise<void> {
  for (const call of toolCalls) {
    const result = await executeToolCall(call, settings, getPermission);
    await useChatStore.getState().addToolMessage(result.result, {
      toolCallId: result.toolCallId,
      toolName: result.toolName,
    });
  }
}
