/**
 * Anthropic (Claude) LLM client implementation
 *
 * Implements the LLMClient interface for Anthropic's Claude models.
 */

import Anthropic from '@anthropic-ai/sdk';
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
 * Anthropic client implementation
 */
export class AnthropicClient extends LLMClient {
  private client: Anthropic;

  constructor(apiKey: string, model: string, maxTokens = 4096, temperature = 0.7) {
    super(apiKey, model, maxTokens, temperature);
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Send message to Claude and get response
   */
  async sendMessage(messages: LLMMessage[], tools?: Tool[]): Promise<LLMResponse> {
    try {
      // Separate system messages from conversation
      const systemMessages = messages.filter((m) => m.role === 'system');
      const conversationMessages = messages.filter((m) => m.role !== 'system');

      // Combine system messages into one
      const systemPrompt = systemMessages
        .map((m) => (typeof m.content === 'string' ? m.content : ''))
        .join('\n\n');

      // Convert messages to Anthropic format
      const anthropicMessages = conversationMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: typeof msg.content === 'string' ? msg.content : msg.content,
      }));

      // Prepare request parameters
      const params: Anthropic.MessageCreateParams = {
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: anthropicMessages,
      };

      if (systemPrompt) {
        params.system = systemPrompt;
      }

      if (tools && tools.length > 0) {
        params.tools = this.convertToolsToProviderFormat(tools) as Anthropic.Tool[];
      }

      // Call Anthropic API
      const response = await this.client.messages.create(params);

      // Extract text content
      let textContent = '';
      const toolCalls: ToolCall[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          textContent += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          });
        }
      }

      return {
        content: textContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        stopReason: this.mapStopReason(response.stop_reason),
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Anthropic API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Stream message response from Claude
   *
   * Uses Anthropic's streaming API to yield chunks progressively.
   */
  async *streamMessage(
    messages: LLMMessage[],
    tools?: Tool[]
  ): AsyncGenerator<StreamChunk, void, unknown> {
    try {
      // Separate system messages from conversation
      const systemMessages = messages.filter((m) => m.role === 'system');
      const conversationMessages = messages.filter((m) => m.role !== 'system');

      // Combine system messages into one
      const systemPrompt = systemMessages
        .map((m) => (typeof m.content === 'string' ? m.content : ''))
        .join('\n\n');

      // Convert messages to Anthropic format
      const anthropicMessages = conversationMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: typeof msg.content === 'string' ? msg.content : msg.content,
      }));

      // Prepare request parameters
      const params: Anthropic.MessageStreamParams = {
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: anthropicMessages,
      };

      if (systemPrompt) {
        params.system = systemPrompt;
      }

      if (tools && tools.length > 0) {
        params.tools = this.convertToolsToProviderFormat(tools) as Anthropic.Tool[];
      }

      // Start streaming
      const stream = await this.client.messages.stream(params);

      // Track current content block for tool calls
      let currentToolBlock: { id: string; name: string; input: Record<string, unknown> } | null =
        null;

      // Process stream events
      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          // Text delta
          if (event.delta.type === 'text_delta') {
            yield {
              type: 'text',
              content: event.delta.text,
            };
          } else if (event.delta.type === 'input_json_delta') {
            // Tool input is being streamed (accumulate it)
            // We'll yield the complete tool call when the block stops
          }
        } else if (event.type === 'content_block_start') {
          // Tool use start
          if (event.content_block.type === 'tool_use') {
            currentToolBlock = {
              id: event.content_block.id,
              name: event.content_block.name,
              input: event.content_block.input as Record<string, unknown>,
            };
          }
        } else if (event.type === 'content_block_stop') {
          // If we were tracking a tool block, yield it now
          if (currentToolBlock) {
            yield {
              type: 'tool_use',
              toolCall: currentToolBlock,
            };
            currentToolBlock = null;
          }
        }
      }

      // Get final message for usage tracking and any remaining tool calls
      const finalMessage = await stream.finalMessage();

      // Track usage
      this.lastUsage = {
        inputTokens: finalMessage.usage.input_tokens,
        outputTokens: finalMessage.usage.output_tokens,
      };

      for (const block of finalMessage.content) {
        if (block.type === 'tool_use' && !currentToolBlock) {
          // Yield any tool calls we might have missed
          yield {
            type: 'tool_use',
            toolCall: {
              id: block.id,
              name: block.name,
              input: block.input as Record<string, unknown>,
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
          error: `Anthropic streaming error: ${error.message}`,
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
   * Convert our Tool format to Anthropic's tool format
   */
  protected convertToolsToProviderFormat(tools: Tool[]): ProviderTool[] {
    return tools.map((tool) => {
      // Convert Zod schema to JSON Schema
      const jsonSchema = zodToJsonSchema(tool.inputSchema, {
        $refStrategy: 'none', // Don't use $ref, inline everything
      });

      // Remove the $schema property that Anthropic doesn't need
      const { $schema: _schema, ...inputSchema } = jsonSchema;

      return {
        name: tool.name,
        description: tool.description,
        input_schema: inputSchema,
      };
    });
  }

  /**
   * Map Anthropic's stop reason to our standard format
   */
  private mapStopReason(
    reason: string | null
  ): 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence' | 'error' {
    switch (reason) {
      case 'end_turn':
        return 'end_turn';
      case 'tool_use':
        return 'tool_use';
      case 'max_tokens':
        return 'max_tokens';
      case 'stop_sequence':
        return 'stop_sequence';
      default:
        return 'error';
    }
  }
}
