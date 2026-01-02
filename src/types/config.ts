/**
 * Configuration type definitions
 *
 * Configuration is loaded from environment variables, config files,
 * and defaults (in that order of priority).
 */

/**
 * LLM provider type
 */
export type LLMProvider = 'anthropic' | 'openai' | 'ollama';

/**
 * Log level
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Application configuration
 */
export interface Config {
  /**
   * LLM provider to use
   */
  llmProvider: LLMProvider;

  /**
   * Model name/ID
   * Examples: 'claude-sonnet-4-20250514', 'gpt-4-turbo'
   */
  model: string;

  /**
   * API key for the LLM provider
   */
  apiKey: string;

  /**
   * Maximum tokens for LLM responses
   */
  maxTokens: number;

  /**
   * Temperature for LLM sampling (0-1)
   */
  temperature: number;

  /**
   * Maximum iterations for agentic loop
   */
  maxIterations: number;

  /**
   * Path to skills directory
   */
  skillsPath: string;

  /**
   * Path to workspace directory (scratch space)
   */
  workspacePath: string;

  /**
   * Path to outputs directory (final deliverables)
   */
  outputsPath: string;

  /**
   * Log level
   */
  logLevel: LogLevel;

  /**
   * Additional provider-specific options
   */
  providerOptions?: Record<string, unknown>;
}

/**
 * Partial config for updates
 */
export type PartialConfig = Partial<Config>;

/**
 * Environment variables mapping
 */
export interface EnvVars {
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  OLLAMA_BASE_URL?: string;
  DEFAULT_LLM_PROVIDER?: string;
  DEFAULT_MODEL?: string;
  MAX_TOKENS?: string;
  TEMPERATURE?: string;
  MAX_ITERATIONS?: string;
  WORKSPACE_DIR?: string;
  SKILLS_DIR?: string;
  OUTPUTS_DIR?: string;
  LOG_LEVEL?: string;
}
