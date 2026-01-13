/**
 * Ollama LLM client implementation
 *
 * Implements the LLMClient interface for Ollama's local models.
 */

import type {
  ChatRequest,
  ChatResponse,
  Message,
  Tool as OllamaTool,
  ToolCall as OllamaToolCall,
} from 'ollama';
import { Ollama } from 'ollama';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type {
  LLMMessage,
  LLMResponse,
  ProviderTool,
  StreamChunk,
  Tool,
  ToolCall,
} from '../types/index.js';
import { LLMClient } from './base.js';

/**
 * Ollama client implementation
 */
export class OllamaClient extends LLMClient {
  private client: Ollama;
  private baseUrl: string;

  constructor(
    apiKey: string, // Not used by Ollama but kept for interface compatibility
    model: string,
    maxTokens = 4096,
    temperature = 0.7,
    baseUrl = 'http://localhost:11434'
  ) {
    super(apiKey, model, maxTokens, temperature);
    this.baseUrl = baseUrl;
    this.client = new Ollama({ host: baseUrl });
  }

  /**
   * Send message to Ollama and get response
   */
  async sendMessage(messages: LLMMessage[], tools?: Tool[]): Promise<LLMResponse> {
    try {
      // Convert messages to Ollama format
      const ollamaMessages: Message[] = messages.map((msg) => {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);

        return {
          role: msg.role as 'system' | 'user' | 'assistant',
          content,
        };
      });

      // Prepare request parameters
      const params: ChatRequest & { stream: false } = {
        model: this.model,
        messages: ollamaMessages,
        stream: false,
        options: {
          temperature: this.temperature,
          num_predict: this.maxTokens,
        },
      };

      // Add tools if provided
      if (tools && tools.length > 0) {
        params.tools = this.convertToolsToProviderFormat(tools).map((tool) =>
          this.toOllamaTool(tool)
        );
      }

      // Call Ollama API
      const response: ChatResponse = await this.client.chat(params);

      // Extract content and tool calls
      const content = response.message?.content || '';
      const toolCalls: ToolCall[] = [];

      // Check if there are tool calls in the response
      if (response.message?.tool_calls && response.message.tool_calls.length > 0) {
        for (const toolCall of response.message.tool_calls) {
          const input = this.getToolInput(toolCall);

          toolCalls.push({
            id: toolCall.function?.name || `tool_${Date.now()}`,
            name: toolCall.function?.name || '',
            input,
          });
        }
      }

      return {
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        stopReason: this.mapDoneReason(response.done_reason),
        usage: response.eval_count
          ? {
              inputTokens: response.prompt_eval_count || 0,
              outputTokens: response.eval_count || 0,
            }
          : undefined,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Ollama API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Stream message response from Ollama
   *
   * Uses Ollama's streaming API to yield chunks progressively.
   */
  async *streamMessage(
    messages: LLMMessage[],
    tools?: Tool[]
  ): AsyncGenerator<StreamChunk, void, unknown> {
    try {
      // Convert messages to Ollama format
      const ollamaMessages: Message[] = messages.map((msg) => {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        return {
          role: msg.role as 'system' | 'user' | 'assistant',
          content,
        };
      });

      // Prepare request parameters
      const params: ChatRequest & { stream: true } = {
        model: this.model,
        messages: ollamaMessages,
        stream: true, // Enable streaming
        options: {
          temperature: this.temperature,
          num_predict: this.maxTokens,
        },
      };

      // Add tools if provided
      if (tools && tools.length > 0) {
        params.tools = this.convertToolsToProviderFormat(tools).map((tool) =>
          this.toOllamaTool(tool)
        );
      }

      // Start streaming
      const stream = await this.client.chat(params);

      // Track tool calls
      const toolCalls: ToolCall[] = [];

      // Process stream chunks
      for await (const chunk of stream) {
        // Handle text content
        if (chunk.message?.content) {
          yield {
            type: 'text',
            content: chunk.message.content,
          };
        }

        // Handle tool calls
        if (chunk.message?.tool_calls && chunk.message.tool_calls.length > 0) {
          for (const toolCall of chunk.message.tool_calls) {
            const input = this.getToolInput(toolCall);
            toolCalls.push({
              id: toolCall.function?.name || `tool_${Date.now()}`,
              name: toolCall.function?.name || '',
              input,
            });
          }
        }
      }

      // Yield accumulated tool calls
      for (const toolCall of toolCalls) {
        if (toolCall.name) {
          yield {
            type: 'tool_use',
            toolCall,
          };
        }
      }

      // Stream completed successfully
      yield {
        type: 'done',
      };
    } catch (error) {
      if (error instanceof Error) {
        yield {
          type: 'error',
          error: `Ollama streaming error: ${error.message}`,
        };
      } else {
        yield {
          type: 'error',
          error: 'Unknown streaming error',
        };
      }
    }
  }

  /**
   * Convert our Tool format to Ollama's tool format
   */
  protected convertToolsToProviderFormat(tools: Tool[]): ProviderTool[] {
    return tools.map((tool) => {
      // Convert Zod schema to JSON Schema
      const jsonSchema = zodToJsonSchema(tool.inputSchema, {
        $refStrategy: 'none', // Don't use $ref, inline everything
      });

      // Remove the $schema property
      const { $schema: _schema, ...parameters } = jsonSchema;

      // Ollama uses OpenAI-compatible function calling format
      return {
        name: tool.name,
        description: tool.description,
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters,
        },
      };
    });
  }

  /**
   * Map Ollama's done reason to our standard format
   */
  private mapDoneReason(
    reason: string | null | undefined
  ): 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence' | 'error' {
    switch (reason) {
      case 'stop':
        return 'end_turn';
      case 'tool_calls':
        return 'tool_use';
      case 'length':
        return 'max_tokens';
      default:
        return 'end_turn'; // Default to end_turn for Ollama
    }
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Update base URL
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
    this.client = new Ollama({ host: baseUrl });
  }

  private toOllamaTool(tool: ProviderTool): OllamaTool {
    return {
      type: tool.type ?? 'function',
      function: tool.function ?? {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters ?? {},
      },
    };
  }

  private getToolInput(toolCall: OllamaToolCall): Record<string, unknown> {
    const rawInput = toolCall.function?.arguments as unknown;
    if (typeof rawInput === 'object' && rawInput !== null) {
      return rawInput as Record<string, unknown>;
    }
    return {};
  }
}
