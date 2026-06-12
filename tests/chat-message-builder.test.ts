// ─────────────────────────────────────────────────────────────
// Unit Tests: Chat Message Builder
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
  generateContextDelimiter,
  escapePageContent,
  buildSystemPrompt,
  buildTools,
} from '../src/lib/chat-message-builder';

describe('generateContextDelimiter', () => {
  it('should return a string starting with PAGE_CONTEXT_', () => {
    const delimiter = generateContextDelimiter();
    expect(delimiter).toMatch(/^PAGE_CONTEXT_[a-f0-9]{8}$/);
  });

  it('should generate unique delimiters', () => {
    const d1 = generateContextDelimiter();
    const d2 = generateContextDelimiter();
    expect(d1).not.toBe(d2);
  });
});

describe('escapePageContent', () => {
  it('should escape < and > characters', () => {
    const input = '<script>alert("xss")</script>';
    const escaped = escapePageContent(input);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });

  it('should handle empty string', () => {
    expect(escapePageContent('')).toBe('');
  });

  it('should preserve normal text', () => {
    const input = 'Hello world';
    expect(escapePageContent(input)).toBe('Hello world');
  });
});

describe('buildSystemPrompt', () => {
  const baseSettings: any = {
    chat: {
      defaultSystemPrompt: 'You are a helpful assistant.',
      personas: [],
      activePersonaId: null,
    },
    tools: {},
  };

  it('should include agentic strategy for thinking models', () => {
    const prompt = buildSystemPrompt(baseSettings, 'o3-mini', false, false);
    expect(prompt).toContain('advanced reasoning model');
  });

  it('should include agentic strategy for non-thinking models', () => {
    const prompt = buildSystemPrompt(baseSettings, 'gpt-4o', false, false);
    expect(prompt).toContain('Break the task into subtasks');
  });

  it('should include tool instructions when web search or browser enabled', () => {
    const prompt = buildSystemPrompt(baseSettings, 'gpt-4o', true, false);
    expect(prompt).toContain('TOOL INSTRUCTIONS');
  });

  it('should use active persona prompt', () => {
    const settingsWithPersona: any = {
      ...baseSettings,
      chat: {
        ...baseSettings.chat,
        personas: [{ id: 'test', prompt: 'Custom persona prompt' }],
        activePersonaId: 'test',
      },
    };
    const prompt = buildSystemPrompt(settingsWithPersona, 'gpt-4o', false, false);
    expect(prompt).toContain('Custom persona prompt');
  });
});

describe('buildTools', () => {
  it('should return undefined when no tools enabled', () => {
    const settings: any = {
      tools: {
        searchEngine: 'duckduckgo',
        enableBrowserInteraction: false,
      },
    };
    const tools = buildTools(settings, false);
    expect(tools).toBeUndefined();
  });

  it('should include web_search when web search is enabled', () => {
    const settings: any = {
      tools: {
        searchEngine: 'duckduckgo',
        enableBrowserInteraction: false,
      },
    };
    const tools = buildTools(settings, true);
    expect(tools).toBeDefined();
    expect(tools!.some((t: any) => t.function.name === 'web_search')).toBe(true);
  });

  it('should include browser_action when browser interaction is enabled', () => {
    const settings: any = {
      tools: {
        searchEngine: 'duckduckgo',
        enableBrowserInteraction: true,
      },
    };
    const tools = buildTools(settings, false);
    expect(tools).toBeDefined();
    expect(tools!.some((t: any) => t.function.name === 'browser_action')).toBe(true);
  });

  it('should include enhanced actions in browser_action tool', () => {
    const settings: any = {
      tools: { enableBrowserInteraction: true },
    };
    const tools = buildTools(settings, false);
    const browserTool = tools!.find((t: any) => t.function.name === 'browser_action');
    const actionEnum = browserTool.function.parameters.properties.action.enum;
    // Check that new enhanced actions are present
    expect(actionEnum).toContain('observe');
    expect(actionEnum).toContain('wait_for_selector');
    expect(actionEnum).toContain('fill_form');
    expect(actionEnum).toContain('list_tabs');
    expect(actionEnum).toContain('switch_tab');
  });
});
