// ─────────────────────────────────────────────────────────────
// Chat Message Builder — Pure functions to construct API messages
// Extracted from useChat.ts for testability and clarity
// ─────────────────────────────────────────────────────────────

import type { Message } from '../types/chat';
import type { AppSettings } from '../types/settings';

/**
 * Generate a randomized delimiter for page context injection.
 * Using random delimiters prevents prompt injection from malicious page content.
 */
export function generateContextDelimiter(): string {
  const id = crypto.randomUUID().slice(0, 8);
  return `PAGE_CONTEXT_${id}`;
}

/**
 * Escape XML-like characters in page content to prevent prompt injection.
 */
export function escapePageContent(content: string): string {
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Build the system prompt with model-aware agentic strategy.
 */
export function buildSystemPrompt(
  settings: AppSettings,
  selectedModelId: string,
  webSearchEnabled: boolean,
  browserEnabled: boolean
): string {
  // Use active persona prompt or default system prompt
  const activePersona = settings.chat.personas?.find(
    p => p.id === settings.chat.activePersonaId
  );
  let systemPrompt = activePersona?.prompt
    || settings.chat.defaultSystemPrompt
    || 'You are a helpful assistant.';

  // Feature: Thinking vs Non-Thinking Model Strategies
  const THINKING_MODELS = [
    'o1', 'o3', 'o4', 'claude-3-5-sonnet', 'claude-sonnet-4', 'claude-opus-4',
    'gemini-2-thinking', 'gemini-2.5-pro', 'gpt-oss-120b',
    'deepseek-reasoner', 'deepseek-r1',
  ];
  const isThinkingModel = THINKING_MODELS.some(m =>
    selectedModelId.toLowerCase().includes(m)
  );

  if (isThinkingModel) {
    systemPrompt += `\n\n[Agentic Strategy] You are an advanced reasoning model. Think step-by-step before answering. Use internal reasoning to break down the user's intent, identify any needed tools, and verify your proposed solution before responding.`;
  } else {
    systemPrompt += `\n\n[Agentic Strategy] You are a highly capable assistant, but you must manually break complex tasks down. Before providing your final answer or executing tool calls, structure your thoughts internally or explicitly:
1. Identify the core intent.
2. Break the task into subtasks or identify which tools are required.
3. Provide the final solution step-by-step.`;
  }

  if (browserEnabled || webSearchEnabled) {
    systemPrompt += '\n\nIMPORTANT TOOL INSTRUCTIONS: You have access to tools. DO NOT output raw JSON in your normal text response. If you want to use a tool, you MUST use the native tool-calling JSON schema provided by the API. DO NOT invoke `browser_action` for normal conversations unless the user explicitly commands you to click or type on the page.';
  }

  return systemPrompt;
}

/**
 * Build the tools array based on settings and feature flags.
 */
export function buildTools(
  settings: AppSettings,
  webSearchEnabled: boolean
): any[] | undefined {
  const tools: any[] = [];

  if (webSearchEnabled) {
    const isTavilyValid = settings.tools.searchEngine === 'tavily' && !!settings.tools.tavilyApiKey;
    const isDuckDuckGo = settings.tools.searchEngine === 'duckduckgo' || !settings.tools.searchEngine;

    if (isTavilyValid || isDuckDuckGo) {
      tools.push({
        type: 'function',
        function: {
          name: 'web_search',
          description: 'Search the web for current information. ALWAYS use this tool by triggering a function call when the user asks for real-time information, news, or to search the internet. DO NOT output raw JSON in your response text; you MUST use the native tool calling feature.',
          parameters: {
            type: 'object',
            properties: { query: { type: 'string', description: 'The search query.' } },
            required: ['query'],
          },
        },
      });
    }
  }

  if (settings.tools.enableBrowserInteraction) {
    tools.push({
      type: 'function',
      function: {
        name: 'browser_action',
        description: 'Interact with the currently active browser tab. ONLY use this tool if the user EXPLICITLY asks you to interact with the webpage, click something, type something, or read the page. DO NOT use this tool for normal conversation or general questions. DO NOT output raw JSON in your response text; you MUST use the native tool calling feature.',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: [
                'click', 'type', 'scroll', 'evaluate', 'read', 'navigate',
                'draw_boxes', 'clear_boxes', 'extract_dom', 'observe',
                'wait_for_navigation', 'wait_for_selector', 'fill_form',
                'list_tabs', 'switch_tab', 'open_tab', 'close_tab',
              ],
              description: 'The action to perform.',
            },
            selector: { type: 'string', description: 'Legacy CSS selector. Prefer element_id.' },
            element_id: { type: 'number', description: 'The numerical ID of the element to interact with, retrieved from extract_dom or draw_boxes.' },
            value: { type: 'string', description: 'The value to type if action is "type", or "up"/"down" if action is "scroll", or the URL if action is "navigate" or "open_tab", or the CSS selector if action is "wait_for_selector".' },
            press_enter: { type: 'boolean', description: 'Set to true if action is "type" and you want to simulate an Enter keypress to submit a form or search.' },
            tab_id: { type: 'number', description: 'Tab ID for switch_tab or close_tab actions.' },
            timeout: { type: 'number', description: 'Timeout in ms for wait actions (default: 10000).' },
            fields: {
              type: 'array',
              description: 'Array of {selector, value} pairs for fill_form action.',
              items: {
                type: 'object',
                properties: {
                  selector: { type: 'string' },
                  value: { type: 'string' },
                },
              },
            },
          },
          required: ['action'],
        },
      },
    });
  }

  return tools.length > 0 ? tools : undefined;
}

/**
 * Build the API message array from conversation history.
 * Handles page context injection with sanitization, attachments, and tool calls.
 */
export function buildApiMessages(
  messages: Message[],
  conversationId: string,
  assistantMsgId: string
): any[] {
  return messages
    .filter(m => m.conversationId === conversationId)
    .filter(m => m.id !== assistantMsgId) // Exclude the empty assistant placeholder
    .filter(m => m.role !== 'system' && (m.content.trim() || m.toolCalls))
    .map(m => {
      let msgContent: any = m.content;

      if (m.pageContext) {
        const delimiter = generateContextDelimiter();
        const escapedContent = escapePageContent(m.pageContext.content);
        // Limit page context to 30,000 characters to prevent context overflow
        const truncatedContent = escapedContent.length > 30000
          ? escapedContent.substring(0, 30000) + '\n\n...[Content truncated]...'
          : escapedContent;
        msgContent = `<${delimiter}>\nTitle: ${escapePageContent(m.pageContext.title)}\nURL: ${m.pageContext.url}\n\n${truncatedContent}\n</${delimiter}>\n\n${msgContent}`;
      }

      if (m.attachments && m.attachments.length > 0) {
        msgContent = [
          { type: 'text', text: msgContent },
          ...m.attachments.map(att => {
            if (att.type === 'image') {
              return { type: 'image_url', image_url: { url: att.data } };
            } else {
              return { type: 'text', text: `\n\n[Attached File: ${att.name}]\n${att.data}` };
            }
          }),
        ];
      }

      const apiMsg: any = { role: m.role, content: msgContent };
      if (m.toolCalls) apiMsg.tool_calls = m.toolCalls;
      if (m.toolCallId) apiMsg.tool_call_id = m.toolCallId;
      if (m.toolName) apiMsg.name = m.toolName;
      return apiMsg;
    });
}
