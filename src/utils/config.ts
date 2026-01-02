/**
 * Configuration management
 *
 * Loads configuration from multiple sources with precedence:
 * 1. Environment variables (highest priority)
 * 2. .env file in current directory
 * 3. Config file in ~/.claude-code-ts/config.json
 * 4. Default values (lowest priority)
 */

import { config as loadDotenv } from 'dotenv';
import { join } from 'node:path';
import type { Config, PartialConfig, LLMProvider } from '../types/index.js';
import { DEFAULT_CONFIG, CONFIG_DIR } from '../constants.js';
import { fileExists, readJSON, writeJSON, ensureDir } from './fs.js';
import { getEnv } from './platform.js';

/**
 * Path to config file
 */
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/**
 * Load configuration from all sources
 *
 * @returns Complete configuration object
 * @throws Error if no API key is found
 */
export async function loadConfig(): Promise<Config> {
  // Load .env file if it exists
  loadDotenv();

  // Start with defaults
  const config: Config = { ...DEFAULT_CONFIG } as Config;

  // Load from config file if it exists
  if (await fileExists(CONFIG_FILE)) {
    try {
      const fileConfig = await readJSON<PartialConfig>(CONFIG_FILE);
      Object.assign(config, fileConfig);
    } catch (error) {
      console.warn(`Warning: Failed to load config file: ${CONFIG_FILE}`);
    }
  }

  // Override with environment variables
  const provider = getEnv('DEFAULT_LLM_PROVIDER') as LLMProvider | undefined;
  if (provider) {
    config.llmProvider = provider;
  }

  const model = getEnv('DEFAULT_MODEL');
  if (model) {
    config.model = model;
  }

  // Get API key based on provider
  if (config.llmProvider === 'anthropic') {
    const apiKey = getEnv('ANTHROPIC_API_KEY');
    if (apiKey) {
      config.apiKey = apiKey;
    }
  } else if (config.llmProvider === 'openai') {
    const apiKey = getEnv('OPENAI_API_KEY');
    if (apiKey) {
      config.apiKey = apiKey;
    }
  }

  // Parse numeric values
  const maxTokens = getEnv('MAX_TOKENS');
  if (maxTokens) {
    config.maxTokens = parseInt(maxTokens, 10);
  }

  const temperature = getEnv('TEMPERATURE');
  if (temperature) {
    config.temperature = parseFloat(temperature);
  }

  const maxIterations = getEnv('MAX_ITERATIONS');
  if (maxIterations) {
    config.maxIterations = parseInt(maxIterations, 10);
  }

  // Path overrides
  const workspaceDir = getEnv('WORKSPACE_DIR');
  if (workspaceDir) {
    config.workspacePath = workspaceDir;
  }

  const skillsDir = getEnv('SKILLS_DIR');
  if (skillsDir) {
    config.skillsPath = skillsDir;
  }

  const outputsDir = getEnv('OUTPUTS_DIR');
  if (outputsDir) {
    config.outputsPath = outputsDir;
  }

  const logLevel = getEnv('LOG_LEVEL');
  if (logLevel && ['debug', 'info', 'warn', 'error'].includes(logLevel)) {
    config.logLevel = logLevel as Config['logLevel'];
  }

  // Validate API key
  if (!config.apiKey) {
    throw new Error(
      `No API key found for provider "${config.llmProvider}". ` +
      `Please set ${config.llmProvider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY'} ` +
      `environment variable or add it to ${CONFIG_FILE}`
    );
  }

  return config;
}

/**
 * Save configuration to config file
 *
 * @param config - Configuration to save (can be partial)
 * @throws Error if config can't be saved
 */
export async function saveConfig(config: PartialConfig): Promise<void> {
  // Ensure config directory exists
  await ensureDir(CONFIG_DIR);

  // Load existing config if it exists
  let existing: PartialConfig = {};
  if (await fileExists(CONFIG_FILE)) {
    try {
      existing = await readJSON<PartialConfig>(CONFIG_FILE);
    } catch {
      // Ignore errors reading existing config
    }
  }

  // Merge with existing config
  const merged = {
    ...existing,
    ...config,
  };

  // Remove sensitive data (don't store API keys in file)
  delete merged.apiKey;

  // Write to file
  await writeJSON(CONFIG_FILE, merged);
}

/**
 * Initialize config directory and files
 *
 * Creates:
 * - ~/.claude-code-ts/ directory
 * - ~/.claude-code-ts/workspace/ directory
 * - ~/.claude-code-ts/skills/ directory
 * - ~/.claude-code-ts/outputs/ directory
 * - ~/.claude-code-ts/config.json (if doesn't exist)
 *
 * @throws Error if directories can't be created
 */
export async function initializeConfig(): Promise<void> {
  // Create main config directory
  await ensureDir(CONFIG_DIR);

  // Create subdirectories
  await ensureDir(DEFAULT_CONFIG.workspacePath);
  await ensureDir(DEFAULT_CONFIG.skillsPath);
  await ensureDir(DEFAULT_CONFIG.outputsPath);

  // Create default config file if it doesn't exist
  if (!(await fileExists(CONFIG_FILE))) {
    await saveConfig({
      llmProvider: DEFAULT_CONFIG.llmProvider,
      model: DEFAULT_CONFIG.model,
      maxTokens: DEFAULT_CONFIG.maxTokens,
      temperature: DEFAULT_CONFIG.temperature,
      maxIterations: DEFAULT_CONFIG.maxIterations,
    });
  }
}

/**
 * Get config file path
 *
 * @returns Absolute path to config file
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}

/**
 * Check if config is initialized
 *
 * @returns True if config directory and file exist
 */
export async function isConfigInitialized(): Promise<boolean> {
  return await fileExists(CONFIG_FILE);
}
