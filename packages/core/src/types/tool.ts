/**
 * Tool system type definitions
 *
 * Tools are executable functions that the LLM can call to perform actions
 * like file operations, shell commands, API calls, etc.
 */

import type { z } from 'zod';

/**
 * Result from tool execution
 */
export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Tool definition
 *
 * All tools must implement this interface. The inputSchema uses Zod for
 * runtime validation and automatic JSON schema generation.
 */
export interface Tool {
  /**
   * Unique tool name (e.g., 'bash', 'read', 'write')
   */
  name: string;

  /**
   * Human-readable description of what the tool does
   * This is shown to the LLM to help it decide when to use the tool
   */
  description: string;

  /**
   * Zod schema for validating tool inputs
   * Will be converted to JSON Schema for LLM tool calling
   */
  inputSchema: z.ZodObject<any>;

  /**
   * Execute the tool with validated parameters
   *
   * @param params - Validated input parameters
   * @returns Tool result (should never throw, always return result)
   */
  execute: (params: any) => Promise<ToolResult>;
}

/**
 * Tool call request (from LLM)
 */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Options for tool execution
 */
export interface ToolExecutionOptions {
  workingDir?: string;
  timeout?: number;
  env?: Record<string, string>;
}
