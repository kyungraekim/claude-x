/**
 * LLM-related type definitions
 *
 * These types provide a provider-agnostic interface for working with
 * different LLM providers (Anthropic, OpenAI, etc.)
 */

/**
 * Content block types for multi-modal messages
 */
export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string };

/**
 * Message role in conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * LLM message structure
 */
export interface LLMMessage {
  role: MessageRole;
  content: string | ContentBlock[];
}

/**
 * Tool call information from LLM
 */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Reason why LLM stopped generating
 */
export type StopReason =
  | 'end_turn'      // Natural end of response
  | 'tool_use'      // Requested tool use
  | 'max_tokens'    // Hit token limit
  | 'stop_sequence' // Hit stop sequence
  | 'error';        // Error occurred

/**
 * Response from LLM
 */
export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  stopReason: StopReason;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Streaming chunk types
 */
export type StreamChunkType = 'text' | 'tool_use' | 'done' | 'error';

/**
 * Streaming response chunk
 */
export interface StreamChunk {
  type: StreamChunkType;
  content?: string;
  toolCall?: ToolCall;
  error?: string;
}

/**
 * LLM provider configuration
 */
export interface LLMConfig {
  provider: 'anthropic' | 'openai';
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

/**
 * Provider-specific tool format
 * Each provider has different tool/function calling schemas
 */
export interface ProviderTool {
  name: string;
  description: string;
  input_schema?: Record<string, unknown>; // Anthropic format
  parameters?: Record<string, unknown>;   // OpenAI format
}
