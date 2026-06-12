// ─────────────────────────────────────────────────────────────
// Agent Orchestrator — Multi-step agentic tool calling loop
// Replaces the recursive single-step approach with an iterative
// plan→act→observe→repeat cycle with configurable limits.
// ─────────────────────────────────────────────────────────────

import type { ToolCall } from '../types/chat';

export interface AgentStep {
  iteration: number;
  toolCalls: ToolCall[];
  toolResults: Array<{ toolCallId: string; toolName: string; result: string }>;
}

export interface AgentConfig {
  /** Maximum number of tool-calling iterations before forcing a text response (default: 10) */
  maxIterations: number;
  /** Callback for progress reporting */
  onProgress?: (step: number, maxSteps: number, description: string) => void;
  /** Callback to check if the loop should be aborted */
  isAborted?: () => boolean;
}

const DEFAULT_CONFIG: AgentConfig = {
  maxIterations: 10,
};

/**
 * AgentOrchestrator manages the iterative tool-calling loop.
 *
 * Instead of the model calling tools once and responding, this
 * allows the model to call tools, observe results, call more tools,
 * and repeat until it produces a final text response or hits the limit.
 *
 * Usage:
 * ```
 * const orchestrator = new AgentOrchestrator(config);
 * const shouldContinue = orchestrator.shouldContinueLoop(toolCalls, iteration);
 * ```
 */
export class AgentOrchestrator {
  private config: AgentConfig;
  private steps: AgentStep[] = [];
  private currentIteration = 0;

  constructor(config?: Partial<AgentConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Determine if the agentic loop should continue after receiving tool calls.
   */
  shouldContinueLoop(toolCalls: ToolCall[] | undefined): boolean {
    if (!toolCalls || toolCalls.length === 0) {
      return false; // Model produced a final text response
    }

    if (this.config.isAborted?.()) {
      return false;
    }

    if (this.currentIteration >= this.config.maxIterations) {
      this.config.onProgress?.(
        this.currentIteration,
        this.config.maxIterations,
        `Reached maximum iterations (${this.config.maxIterations}). Generating final response...`
      );
      return false;
    }

    return true;
  }

  /**
   * Record a completed step and advance the iteration counter.
   */
  recordStep(
    toolCalls: ToolCall[],
    toolResults: Array<{ toolCallId: string; toolName: string; result: string }>
  ): void {
    this.steps.push({
      iteration: this.currentIteration,
      toolCalls,
      toolResults,
    });
    this.currentIteration++;

    // Report progress
    const toolNames = toolCalls.map(tc => tc.function.name).join(', ');
    this.config.onProgress?.(
      this.currentIteration,
      this.config.maxIterations,
      `Step ${this.currentIteration}: Executed ${toolNames}`
    );
  }

  /**
   * Get the current iteration number.
   */
  getCurrentIteration(): number {
    return this.currentIteration;
  }

  /**
   * Get all recorded steps.
   */
  getSteps(): AgentStep[] {
    return [...this.steps];
  }

  /**
   * Reset the orchestrator for a new agentic session.
   */
  reset(): void {
    this.steps = [];
    this.currentIteration = 0;
  }
}
