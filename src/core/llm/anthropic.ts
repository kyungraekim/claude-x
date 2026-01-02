/**
 * Anthropic (Claude) LLM client implementation
 *
 * Implements the LLMClient interface for Anthropic's Claude models.
 */

import Anthropic from '@anthropic-ai/sdk';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { LLMClient } from './base.js';
import type {
  LLMMessage,
  LLMResponse,
  StreamChunk,
  Tool,
  ProviderTool,
  ToolCall,
  ContentBlock,
} from '../../types/index.js';

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
      const systemPrompt = systemMessages.map((m) =>
        typeof m.content === 'string' ? m.content : ''
      ).join('\n\n');

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
        params.tools = this.convertToolsToProviderFormat(tools);
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
   * TODO: Implement streaming for real-time updates in the terminal UI
   * This requires handling Anthropic's streaming API and yielding chunks progressively.
   *
   * Example flow:
   * 1. Call client.messages.stream()
   * 2. Listen for events: text, tool_use, message_stop
   * 3. Yield StreamChunk objects for each event
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
   * Convert our Tool format to Anthropic's tool format
   */
  protected convertToolsToProviderFormat(tools: Tool[]): ProviderTool[] {
    return tools.map((tool) => {
      // Convert Zod schema to JSON Schema
      const jsonSchema = zodToJsonSchema(tool.inputSchema, {
        $refStrategy: 'none', // Don't use $ref, inline everything
      });

      // Remove the $schema property that Anthropic doesn't need
      const { $schema, ...inputSchema } = jsonSchema;

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
