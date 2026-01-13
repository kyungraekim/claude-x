/**
 * OpenAI (GPT) LLM client implementation
 *
 * Implements the LLMClient interface for OpenAI's GPT models.
 */

import OpenAI from 'openai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { LLMClient } from './base.js';
import type {
  LLMMessage,
  LLMResponse,
  StreamChunk,
  Tool,
  ProviderTool,
  ToolCall,
} from '../types/index.js';

/**
 * OpenAI client implementation
 */
export class OpenAIClient extends LLMClient {
  private client: OpenAI;

  constructor(apiKey: string, model: string, maxTokens = 4096, temperature = 0.7) {
    super(apiKey, model, maxTokens, temperature);
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Send message to GPT and get response
   */
  async sendMessage(messages: LLMMessage[], tools?: Tool[]): Promise<LLMResponse> {
    try {
      // Convert messages to OpenAI format
      const openaiMessages = messages.map((msg) => {
        // OpenAI expects simple string content for most messages
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);

        return {
          role: msg.role as 'system' | 'user' | 'assistant',
          content,
        };
      });

      // Prepare request parameters
      const params: OpenAI.Chat.ChatCompletionCreateParams = {
        model: this.model,
        messages: openaiMessages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      };

      if (tools && tools.length > 0) {
        params.tools = this.convertToolsToProviderFormat(tools).map((tool) => ({
          type: 'function' as const,
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        }));
      }

      // Call OpenAI API
      const response = await this.client.chat.completions.create(params);

      const choice = response.choices[0];
      if (!choice) {
        throw new Error('No response from OpenAI');
      }

      // Extract content and tool calls
      const content = choice.message.content || '';
      const toolCalls: ToolCall[] = [];

      if (choice.message.tool_calls) {
        for (const toolCall of choice.message.tool_calls) {
          if (toolCall.type === 'function') {
            const input = this.parseToolInput(toolCall.function.arguments);

            toolCalls.push({
              id: toolCall.id,
              name: toolCall.function.name,
              input,
            });
          }
        }
      }

      return {
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        stopReason: this.mapFinishReason(choice.finish_reason),
        usage: response.usage
          ? {
              inputTokens: response.usage.prompt_tokens,
              outputTokens: response.usage.completion_tokens,
            }
          : undefined,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Stream message response from GPT
   *
   * Uses OpenAI's streaming API to yield chunks progressively.
   */
  async *streamMessage(
    messages: LLMMessage[],
    tools?: Tool[]
  ): AsyncGenerator<StreamChunk, void, unknown> {
    try {
      // Convert messages to OpenAI format
      const openaiMessages = messages.map((msg) => {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        return {
          role: msg.role as 'system' | 'user' | 'assistant',
          content,
        };
      });

      // Prepare request parameters
      const params: OpenAI.Chat.ChatCompletionCreateParams = {
        model: this.model,
        messages: openaiMessages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: true, // Enable streaming
      };

      if (tools && tools.length > 0) {
        params.tools = this.convertToolsToProviderFormat(tools).map((tool) => ({
          type: 'function' as const,
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        }));
      }

      // Start streaming
      const stream = await this.client.chat.completions.create(params);

      // Accumulate tool calls (OpenAI streams them as deltas)
      const toolCallsMap = new Map<
        number,
        { id: string; name: string; arguments: string }
      >();

      // Process stream chunks
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        if (!delta) {
          // Check for usage in the chunk (comes in last chunk)
          if (chunk.usage) {
            this.lastUsage = {
              inputTokens: chunk.usage.prompt_tokens || 0,
              outputTokens: chunk.usage.completion_tokens || 0,
            };
          }
          continue;
        }

        // Handle text content
        if (delta.content) {
          yield {
            type: 'text',
            content: delta.content,
          };
        }

        // Handle tool call deltas
        if (delta.tool_calls) {
          for (const toolCallDelta of delta.tool_calls) {
            const index = toolCallDelta.index;
            const existing = toolCallsMap.get(index);

            if (!existing) {
              // First chunk for this tool call
              toolCallsMap.set(index, {
                id: toolCallDelta.id || '',
                name: toolCallDelta.function?.name || '',
                arguments: toolCallDelta.function?.arguments || '',
              });
            } else {
              // Accumulate arguments
              if (toolCallDelta.function?.arguments) {
                existing.arguments += toolCallDelta.function.arguments;
              }
            }
          }
        }

        // Check for usage in the chunk (comes in last chunk)
        if (chunk.usage) {
          this.lastUsage = {
            inputTokens: chunk.usage.prompt_tokens || 0,
            outputTokens: chunk.usage.completion_tokens || 0,
          };
        }
      }

      // After stream completes, yield accumulated tool calls
      for (const toolCall of toolCallsMap.values()) {
        if (toolCall.id && toolCall.name) {
          yield {
            type: 'tool_use',
            toolCall: {
              id: toolCall.id,
              name: toolCall.name,
              input: this.parseToolInput(toolCall.arguments),
            },
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
          error: `OpenAI streaming error: ${error.message}`,
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
   * Convert our Tool format to OpenAI's function calling format
   */
  protected convertToolsToProviderFormat(tools: Tool[]): ProviderTool[] {
    return tools.map((tool) => {
      // Convert Zod schema to JSON Schema
      const jsonSchema = zodToJsonSchema(tool.inputSchema, {
        $refStrategy: 'none', // Don't use $ref, inline everything
      });

      // Remove the $schema property
      const { $schema: _schema, ...parameters } = jsonSchema;

      return {
        name: tool.name,
        description: tool.description,
        parameters,
      };
    });
  }

  /**
   * Map OpenAI's finish reason to our standard format
   */
  private mapFinishReason(
    reason: string | null | undefined
  ): 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence' | 'error' {
    switch (reason) {
      case 'stop':
        return 'end_turn';
      case 'tool_calls':
      case 'function_call':
        return 'tool_use';
      case 'length':
        return 'max_tokens';
      case 'content_filter':
        return 'stop_sequence';
      default:
        return 'error';
    }
  }

  private parseToolInput(raw: string): Record<string, unknown> {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
    return {};
  }
}
