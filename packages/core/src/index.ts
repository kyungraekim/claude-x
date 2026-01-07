/**
 * @claude-x/core
 *
 * Core agent logic for claude-x - LLM clients, tools, and utilities.
 * This package has no UI dependencies and can be used programmatically.
 */

// Agent system
export { Agent, ContextManager } from './agent/index.js';

// LLM clients
export {
  LLMClient,
  AnthropicClient,
  OpenAIClient,
  OllamaClient,
  createLLMClient,
  createAnthropicClient,
  createOpenAIClient,
  createOllamaClient,
} from './llm/index.js';

// Tools system
export {
  ToolRegistry,
  BashTool,
  ReadTool,
  WriteTool,
  GrepTool,
  getDefaultTools,
} from './tools/index.js';

// Skills system
export {
  SkillLoader,
  SkillDetector,
  SkillExecutor,
} from './skills/index.js';

// Export functionality
export {
  ExportService,
  MarkdownFormatter,
} from './export/index.js';
export type { ConversationExport, ExportMessage, ExportMetadata } from './export/index.js';

// Types (re-export all)
export type {
  // LLM types
  ContentBlock,
  MessageRole,
  LLMMessage,
  LLMToolCall,
  StopReason,
  LLMResponse,
  StreamChunkType,
  StreamChunk,
  LLMConfig,
  ProviderTool,
  // Tool types
  ToolResult,
  Tool,
  ToolCall,
  ToolExecutionOptions,
  // Skill types
  Environment,
  Platform,
  Skill,
  SkillContext,
  SkillMetadata,
  EnvironmentDetection,
  // Config types
  LLMProvider,
  LogLevel,
  Config,
  PartialConfig,
  EnvVars,
  // Agent types
  AgentState,
  AgentConfig,
  AgentEventType,
  AgentEvent,
  AgentExecutionOptions,
  // ANSI types
  AnsiPixel,
  AnsiPixelRow,
  AnsiImage,
} from './types/index.js';

// Utilities (re-export commonly used ones)
export * from './utils/index.js';
