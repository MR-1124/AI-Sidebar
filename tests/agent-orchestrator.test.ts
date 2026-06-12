// ─────────────────────────────────────────────────────────────
// Unit Tests: Agent Orchestrator
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, vi } from 'vitest';
import { AgentOrchestrator } from '../src/lib/agent-orchestrator';

describe('AgentOrchestrator', () => {
  it('should allow continuation when tool calls are present and under limit', () => {
    const orchestrator = new AgentOrchestrator({ maxIterations: 5 });
    const toolCalls = [{ id: '1', type: 'function' as const, function: { name: 'web_search', arguments: '{}' } }];
    expect(orchestrator.shouldContinueLoop(toolCalls)).toBe(true);
  });

  it('should stop when no tool calls', () => {
    const orchestrator = new AgentOrchestrator({ maxIterations: 5 });
    expect(orchestrator.shouldContinueLoop(undefined)).toBe(false);
    expect(orchestrator.shouldContinueLoop([])).toBe(false);
  });

  it('should stop after reaching max iterations', () => {
    const orchestrator = new AgentOrchestrator({ maxIterations: 2 });
    const toolCalls = [{ id: '1', type: 'function' as const, function: { name: 'test', arguments: '{}' } }];

    orchestrator.recordStep(toolCalls, []);
    orchestrator.recordStep(toolCalls, []);

    expect(orchestrator.shouldContinueLoop(toolCalls)).toBe(false);
  });

  it('should stop when aborted', () => {
    const orchestrator = new AgentOrchestrator({
      maxIterations: 10,
      isAborted: () => true,
    });
    const toolCalls = [{ id: '1', type: 'function' as const, function: { name: 'test', arguments: '{}' } }];
    expect(orchestrator.shouldContinueLoop(toolCalls)).toBe(false);
  });

  it('should track steps correctly', () => {
    const orchestrator = new AgentOrchestrator({ maxIterations: 10 });
    const toolCalls = [{ id: '1', type: 'function' as const, function: { name: 'web_search', arguments: '{}' } }];
    const results = [{ toolCallId: '1', toolName: 'web_search', result: '...' }];

    orchestrator.recordStep(toolCalls, results);
    orchestrator.recordStep(toolCalls, results);

    expect(orchestrator.getCurrentIteration()).toBe(2);
    expect(orchestrator.getSteps()).toHaveLength(2);
  });

  it('should call onProgress callback', () => {
    const onProgress = vi.fn();
    const orchestrator = new AgentOrchestrator({ maxIterations: 5, onProgress });
    const toolCalls = [{ id: '1', type: 'function' as const, function: { name: 'web_search', arguments: '{}' } }];

    orchestrator.recordStep(toolCalls, []);
    expect(onProgress).toHaveBeenCalledWith(1, 5, expect.stringContaining('web_search'));
  });

  it('should reset correctly', () => {
    const orchestrator = new AgentOrchestrator({ maxIterations: 5 });
    const toolCalls = [{ id: '1', type: 'function' as const, function: { name: 'test', arguments: '{}' } }];

    orchestrator.recordStep(toolCalls, []);
    expect(orchestrator.getCurrentIteration()).toBe(1);

    orchestrator.reset();
    expect(orchestrator.getCurrentIteration()).toBe(0);
    expect(orchestrator.getSteps()).toHaveLength(0);
  });
});
