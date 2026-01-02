/**
 * Base LLM client interface
 *
 * Provides a provider-agnostic interface for working with different LLM providers.
 */

import type {
  LLMMessage,
  LLMResponse,
  StreamChunk,
  Tool,
  ProviderTool,
} from '../../types/index.js';

/**
 * Abstract LLM client class
 *
 * All LLM providers (Anthropic, OpenAI) must extend this class
 * and implement the abstract methods.
 */
export abstract class LLMClient {
  protected apiKey: string;
  protected model: string;
  protected maxTokens: number;
  protected temperature: number;

  constructor(apiKey: string, model: string, maxTokens = 4096, temperature = 0.7) {
    this.apiKey = apiKey;
    this.model = model;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
  }

  /**
   * Send a message and wait for complete response
   *
   * @param messages - Conversation history
   * @param tools - Available tools for the LLM to call
   * @returns LLM response with content and optional tool calls
   */
  abstract sendMessage(messages: LLMMessage[], tools?: Tool[]): Promise<LLMResponse>;

  /**
   * Send a message and stream the response
   *
   * @param messages - Conversation history
   * @param tools - Available tools for the LLM to call
   * @returns Async generator of response chunks
   *
   * TODO: Implement streaming for real-time response display
   */
  abstract streamMessage(
    messages: LLMMessage[],
    tools?: Tool[]
  ): AsyncGenerator<StreamChunk, void, unknown>;

  /**
   * Convert our Tool format to provider-specific format
   *
   * Each provider has different schemas for tools:
   * - Anthropic uses { name, description, input_schema }
   * - OpenAI uses { name, description, parameters }
   *
   * @param tools - Tools to convert
   * @returns Provider-specific tool definitions
   */
  protected abstract convertToolsToProviderFormat(tools: Tool[]): ProviderTool[];

  /**
   * Get model info
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Update model
   */
  setModel(model: string): void {
    this.model = model;
  }

  /**
   * Get max tokens
   */
  getMaxTokens(): number {
    return this.maxTokens;
  }

  /**
   * Update max tokens
   */
  setMaxTokens(maxTokens: number): void {
    this.maxTokens = maxTokens;
  }

  /**
   * Get temperature
   */
  getTemperature(): number {
    return this.temperature;
  }

  /**
   * Update temperature
   */
  setTemperature(temperature: number): void {
    this.temperature = temperature;
  }
}
