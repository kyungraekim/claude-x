/**
 * Ollama LLM client implementation
 *
 * Implements the LLMClient interface for Ollama's local models.
 */

import { Ollama } from 'ollama';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { LLMClient } from './base.js';
import type {
  LLMMessage,
  LLMResponse,
  StreamChunk,
  Tool,
  ProviderTool,
  ToolCall,
} from '../../types/index.js';

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
      const ollamaMessages = messages.map((msg) => {
        const content = typeof msg.content === 'string'
          ? msg.content
          : JSON.stringify(msg.content);

        return {
          role: msg.role as 'system' | 'user' | 'assistant',
          content,
        };
      });

      // Prepare request parameters
      const params: any = {
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
        params.tools = this.convertToolsToProviderFormat(tools);
      }

      // Call Ollama API
      const response: any = await this.client.chat(params);

      // Extract content and tool calls
      let content = response.message?.content || '';
      const toolCalls: ToolCall[] = [];

      // Check if there are tool calls in the response
      if (response.message?.tool_calls && response.message.tool_calls.length > 0) {
        for (const toolCall of response.message.tool_calls) {
          toolCalls.push({
            id: toolCall.function?.name || `tool_${Date.now()}`,
            name: toolCall.function?.name || '',
            input: toolCall.function?.arguments || {},
          });
        }
      }

      return {
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        stopReason: this.mapDoneReason(response.done_reason),
        usage: response.eval_count ? {
          inputTokens: response.prompt_eval_count || 0,
          outputTokens: response.eval_count || 0,
        } : undefined,
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
   * TODO: Implement streaming for real-time updates in the terminal UI
   * This requires handling Ollama's streaming API and yielding chunks progressively.
   *
   * Example flow:
   * 1. Call client.chat({ stream: true })
   * 2. Listen for response chunks
   * 3. Yield StreamChunk objects for each chunk
   */
  async *streamMessage(
    messages: LLMMessage[],
    tools?: Tool[]
  ): AsyncGenerator<StreamChunk, void, unknown> {
    // TODO: Implement streaming
    // For now, fall back to non-streaming and yield the final result
    const response = await this.sendMessage(messages, tools);

    if (response.content) {
      yield {
        type: 'text',
        content: response.content,
      };
    }

    if (response.toolCalls) {
      for (const toolCall of response.toolCalls) {
        yield {
          type: 'tool_use',
          toolCall,
        };
      }
    }

    yield {
      type: 'done',
    };
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
      const { $schema, ...parameters } = jsonSchema;

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
}
