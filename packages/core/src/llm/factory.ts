/**
 * LLM client factory
 *
 * Creates the appropriate LLM client based on configuration.
 */

import { LLMClient } from './base.js';
import { AnthropicClient } from './anthropic.js';
import { OpenAIClient } from './openai.js';
import { OllamaClient } from './ollama.js';
import type { Config } from '../types/index.js';

/**
 * Create an LLM client based on configuration
 *
 * @param config - Application configuration
 * @returns LLM client instance
 * @throws Error if provider is unknown
 */
export function createLLMClient(config: Config): LLMClient {
  switch (config.llmProvider) {
    case 'anthropic':
      return new AnthropicClient(
        config.apiKey,
        config.model,
        config.maxTokens,
        config.temperature
      );

    case 'openai':
      return new OpenAIClient(
        config.apiKey,
        config.model,
        config.maxTokens,
        config.temperature
      );

    case 'ollama':
      return new OllamaClient(
        '', // Ollama doesn't require an API key
        config.model,
        config.maxTokens,
        config.temperature,
        config.providerOptions?.baseUrl as string | undefined
      );

    default:
      throw new Error(
        `Unknown LLM provider: ${config.llmProvider}. ` +
        `Supported providers: anthropic, openai, ollama`
      );
  }
}

/**
 * Create an Anthropic client directly
 *
 * @param apiKey - Anthropic API key
 * @param model - Model name
 * @param maxTokens - Max tokens
 * @param temperature - Temperature
 * @returns Anthropic client
 */
export function createAnthropicClient(
  apiKey: string,
  model = 'claude-sonnet-4-20250514',
  maxTokens = 4096,
  temperature = 0.7
): AnthropicClient {
  return new AnthropicClient(apiKey, model, maxTokens, temperature);
}

/**
 * Create an OpenAI client directly
 *
 * @param apiKey - OpenAI API key
 * @param model - Model name
 * @param maxTokens - Max tokens
 * @param temperature - Temperature
 * @returns OpenAI client
 */
export function createOpenAIClient(
  apiKey: string,
  model = 'gpt-4-turbo',
  maxTokens = 4096,
  temperature = 0.7
): OpenAIClient {
  return new OpenAIClient(apiKey, model, maxTokens, temperature);
}

/**
 * Create an Ollama client directly
 *
 * @param model - Model name
 * @param maxTokens - Max tokens
 * @param temperature - Temperature
 * @param baseUrl - Ollama base URL
 * @returns Ollama client
 */
export function createOllamaClient(
  model = 'llama3.2',
  maxTokens = 4096,
  temperature = 0.7,
  baseUrl = 'http://localhost:11434'
): OllamaClient {
  return new OllamaClient('', model, maxTokens, temperature, baseUrl);
}
