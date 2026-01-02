/**
 * Agent class
 *
 * Orchestrates the agentic loop: LLM calls, tool execution, and iteration management.
 */

import type {
  AgentState,
  AgentConfig,
  AgentEvent,
  AgentExecutionOptions,
  LLMMessage,
  ToolCall,
} from '../../types/index.js';
import type { LLMClient } from '../llm/base.js';
import type { ToolRegistry } from '../tools/registry.js';
import { ContextManager } from './context.js';
import { logger } from '../../utils/logger.js';

/**
 * Agent class
 *
 * Main orchestrator for the agentic loop.
 */
export class Agent {
  private llm: LLMClient;
  private tools: ToolRegistry;
  private config: AgentConfig;
  private state: AgentState;
  private contextManager: ContextManager;

  constructor(
    llm: LLMClient,
    tools: ToolRegistry,
    config: AgentConfig
  ) {
    this.llm = llm;
    this.tools = tools;
    this.config = config;
    this.contextManager = new ContextManager();

    // Initialize state
    this.state = {
      messages: [
        {
          role: 'system',
          content: config.systemPrompt,
        },
      ],
      context: new Map(),
      iterationCount: 0,
      tokenUsage: {
        input: 0,
        output: 0,
      },
    };
  }

  /**
   * Run the agent with a user message
   *
   * This is the main agentic loop:
   * 1. Add user message to conversation
   * 2. Loop until max iterations:
   *    a. Call LLM with messages + tools
   *    b. Yield llm_response event
   *    c. If tool calls:
   *       - Execute each tool
   *       - Yield tool events
   *       - Add tool results to messages
   *       - Continue loop
   *    d. If no tool calls: done
   * 3. Return final response
   *
   * @param userMessage - User's message
   * @param options - Execution options
   * @returns Async generator of agent events
   *
   * @example
   * ```ts
   * for await (const event of agent.run('Create a Python training script')) {
   *   if (event.type === 'llm_response') {
   *     console.log('Assistant:', event.content);
   *   }
   * }
   * ```
   */
  async *run(
    userMessage: string,
    options: AgentExecutionOptions = {}
  ): AsyncGenerator<AgentEvent, void, unknown> {
    // Update working directory if provided
    if (options.workingDir) {
      this.contextManager.setWorkingDir(options.workingDir);
    }

    // Activate skills if provided
    if (options.skills && options.skills.length > 0) {
      for (const skill of options.skills) {
        yield {
          type: 'skill_activated',
          skill,
        };

        // Add skill content to system prompt
        this.state.activeSkill = skill;
        // TODO: Inject skill content into system prompt or as a separate message
      }
    }

    // Add user message
    this.state.messages.push({
      role: 'user',
      content: userMessage,
    });

    logger.info(`Starting agent run: "${userMessage}"`);

    // Main agentic loop
    while (this.state.iterationCount < this.config.maxIterations) {
      this.state.iterationCount++;

      yield {
        type: 'iteration',
        count: this.state.iterationCount,
      };

      logger.debug(`Iteration ${this.state.iterationCount}`);

      // Call LLM
      yield {
        type: 'llm_start',
        iteration: this.state.iterationCount,
      };

      try {
        const response = await this.llm.sendMessage(
          this.state.messages,
          this.config.tools
        );

        // Update token usage
        if (response.usage) {
          this.state.tokenUsage!.input += response.usage.inputTokens;
          this.state.tokenUsage!.output += response.usage.outputTokens;
        }

        // Add assistant message to history
        this.state.messages.push({
          role: 'assistant',
          content: response.content,
        });

        // Yield response
        if (response.content) {
          yield {
            type: 'llm_response',
            content: response.content,
            iteration: this.state.iterationCount,
          };
        }

        // Check for tool calls
        if (response.toolCalls && response.toolCalls.length > 0) {
          // Execute each tool
          for (const toolCall of response.toolCalls) {
            yield {
              type: 'tool_start',
              toolCall,
              iteration: this.state.iterationCount,
            };

            // Execute tool
            const result = await this.tools.executeTool(toolCall);

            // Yield tool result
            yield {
              type: 'tool_result',
              toolCall,
              result,
              iteration: this.state.iterationCount,
            };

            // Add tool result to conversation
            // Format: Tool {name} result: {output}
            const resultMessage = `Tool "${toolCall.name}" result:\n${result.output}`;
            if (result.error) {
              resultMessage.concat(`\nError: ${result.error}`);
            }

            this.state.messages.push({
              role: 'user',
              content: resultMessage,
            });
          }

          // Continue loop to let LLM process tool results
          continue;
        }

        // No tool calls - check stop reason
        if (response.stopReason === 'end_turn' || response.stopReason === 'stop_sequence') {
          // Natural end of conversation
          yield {
            type: 'done',
            finalMessage: response.content,
          };
          break;
        }

        if (response.stopReason === 'max_tokens') {
          logger.warn('LLM hit max tokens limit');
          // Continue to next iteration
          continue;
        }

        // If we get here with no tool calls and no end_turn, something's wrong
        if (response.stopReason === 'error') {
          yield {
            type: 'error',
            error: 'LLM returned error stop reason',
          };
          break;
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Agent error:', errorMessage);

        yield {
          type: 'error',
          error: errorMessage,
        };
        break;
      }
    }

    // Hit max iterations
    if (this.state.iterationCount >= this.config.maxIterations) {
      logger.warn(`Hit max iterations: ${this.config.maxIterations}`);
      yield {
        type: 'max_iterations',
        count: this.state.iterationCount,
      };
    }

    logger.info('Agent run completed', {
      iterations: this.state.iterationCount,
      tokenUsage: this.state.tokenUsage,
    });
  }

  /**
   * Run with streaming (TODO)
   *
   * TODO: Implement streaming LLM responses
   * This requires using llm.streamMessage() and yielding chunks progressively
   *
   * @param userMessage - User's message
   * @param options - Execution options
   * @returns Async generator of agent events
   */
  async *runStreaming(
    userMessage: string,
    options: AgentExecutionOptions = {}
  ): AsyncGenerator<AgentEvent, void, unknown> {
    // TODO: Implement streaming version
    // For now, fall back to non-streaming
    yield* this.run(userMessage, options);
  }

  /**
   * Get current state
   *
   * @returns Agent state
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Get conversation history
   *
   * @returns Array of messages
   */
  getMessages(): LLMMessage[] {
    return [...this.state.messages];
  }

  /**
   * Get context manager
   *
   * @returns Context manager
   */
  getContext(): ContextManager {
    return this.contextManager;
  }

  /**
   * Reset agent state
   *
   * Clears conversation history and resets iteration count.
   * Keeps system prompt.
   */
  reset(): void {
    this.state = {
      messages: [
        {
          role: 'system',
          content: this.config.systemPrompt,
        },
      ],
      context: new Map(),
      iterationCount: 0,
      tokenUsage: {
        input: 0,
        output: 0,
      },
    };
    this.contextManager.clear();
    logger.info('Agent reset');
  }

  /**
   * Update system prompt
   *
   * @param prompt - New system prompt
   */
  setSystemPrompt(prompt: string): void {
    this.config.systemPrompt = prompt;
    this.state.messages[0] = {
      role: 'system',
      content: prompt,
    };
    logger.debug('System prompt updated');
  }

  /**
   * Add skill content to system prompt
   *
   * @param skillContent - Skill markdown content
   */
  addSkillToPrompt(skillContent: string): void {
    const currentPrompt = this.config.systemPrompt;
    const newPrompt = `${currentPrompt}\n\n## Active Skill\n\n${skillContent}`;
    this.setSystemPrompt(newPrompt);
  }

  /**
   * Get token usage
   *
   * @returns Token usage stats
   */
  getTokenUsage(): { input: number; output: number } {
    return { ...this.state.tokenUsage! };
  }
}
