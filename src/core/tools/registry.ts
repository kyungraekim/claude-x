/**
 * Tool registry
 *
 * Manages tool registration, discovery, and execution.
 */

import type { Tool, ToolCall, ToolResult } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool registry class
 *
 * Stores and manages all available tools for the agent.
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register a tool
   *
   * @param tool - Tool to register
   * @throws Error if tool name already exists
   */
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }

    this.tools.set(tool.name, tool);
    logger.debug(`Registered tool: ${tool.name}`);
  }

  /**
   * Register multiple tools at once
   *
   * @param tools - Tools to register
   */
  registerAll(tools: Tool[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  /**
   * Get a tool by name
   *
   * @param name - Tool name
   * @returns Tool if found, undefined otherwise
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   *
   * @returns Array of all tools
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Check if a tool exists
   *
   * @param name - Tool name
   * @returns True if tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Unregister a tool
   *
   * @param name - Tool name
   * @returns True if tool was removed
   */
  unregister(name: string): boolean {
    const removed = this.tools.delete(name);
    if (removed) {
      logger.debug(`Unregistered tool: ${name}`);
    }
    return removed;
  }

  /**
   * Get tool names
   *
   * @returns Array of tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Execute a tool call
   *
   * This method:
   * 1. Finds the tool by name
   * 2. Validates input with Zod schema
   * 3. Executes the tool
   * 4. Returns result (never throws)
   *
   * @param toolCall - Tool call to execute
   * @returns Tool execution result
   */
  async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    logger.debug(`Executing tool: ${toolCall.name}`, toolCall.input);

    // Check if tool exists
    const tool = this.get(toolCall.name);
    if (!tool) {
      const error = `Tool "${toolCall.name}" not found`;
      logger.error(error);
      return {
        success: false,
        output: '',
        error,
      };
    }

    try {
      // Validate input with Zod schema
      const validated = tool.inputSchema.parse(toolCall.input);

      // Execute tool
      const result = await tool.execute(validated);

      logger.debug(`Tool ${toolCall.name} completed`, {
        success: result.success,
        outputLength: result.output.length,
      });

      return result;
    } catch (error) {
      // Handle validation errors or execution errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Tool ${toolCall.name} failed:`, errorMessage);

      return {
        success: false,
        output: '',
        error: `Tool execution failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Execute multiple tool calls in sequence
   *
   * TODO: Implement parallel execution for independent tools
   *
   * @param toolCalls - Tool calls to execute
   * @returns Array of tool results
   */
  async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      const result = await this.executeTool(toolCall);
      results.push(result);
    }

    return results;
  }

  /**
   * Clear all registered tools
   */
  clear(): void {
    this.tools.clear();
    logger.debug('Cleared all tools');
  }
}
