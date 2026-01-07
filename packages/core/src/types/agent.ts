/**
 * Agent system type definitions
 *
 * The agent orchestrates the agentic loop: LLM calls, tool execution,
 * and iteration management.
 */

import type { LLMMessage } from './llm.js';
import type { Tool, ToolCall, ToolResult } from './tool.js';
import type { Skill } from './skill.js';

/**
 * Agent state
 */
export interface AgentState {
  /**
   * Conversation history
   */
  messages: LLMMessage[];

  /**
   * Context storage (working directory, metadata, etc.)
   */
  context: Map<string, unknown>;

  /**
   * Currently active skill
   */
  activeSkill?: Skill;

  /**
   * Current iteration count
   */
  iterationCount: number;

  /**
   * Total token usage
   */
  tokenUsage?: {
    input: number;
    output: number;
  };
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  /**
   * Maximum iterations before stopping
   */
  maxIterations: number;

  /**
   * Available tools for the agent
   */
  tools: Tool[];

  /**
   * System prompt
   */
  systemPrompt: string;

  /**
   * Additional options
   */
  options?: {
    verbose?: boolean;
    saveHistory?: boolean;
    historyPath?: string;
  };
}

/**
 * Agent event types
 */
export type AgentEventType =
  | 'llm_start'
  | 'llm_response'
  | 'llm_stream_chunk'
  | 'tool_start'
  | 'tool_result'
  | 'skill_activated'
  | 'iteration'
  | 'done'
  | 'error'
  | 'max_iterations';

/**
 * Agent events (for UI updates)
 */
export type AgentEvent =
  | { type: 'llm_start'; iteration: number }
  | { type: 'llm_response'; content: string; iteration: number }
  | { type: 'llm_stream_chunk'; chunk: string; iteration: number }
  | { type: 'tool_start'; toolCall: ToolCall; iteration: number }
  | { type: 'tool_result'; toolCall: ToolCall; result: ToolResult; iteration: number }
  | { type: 'skill_activated'; skill: Skill }
  | { type: 'iteration'; count: number }
  | { type: 'done'; finalMessage: string }
  | { type: 'error'; error: string }
  | { type: 'max_iterations'; count: number };

/**
 * Agent execution options
 */
export interface AgentExecutionOptions {
  /**
   * Stream responses instead of waiting for completion
   */
  stream?: boolean;

  /**
   * Initial working directory
   */
  workingDir?: string;

  /**
   * Skills to activate
   */
  skills?: Skill[];
}
