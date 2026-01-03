/**
 * Application constants and default values
 */

import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import type { Config, Platform } from './types/index.js';

/**
 * Detect current platform
 */
export function detectPlatform(): Platform {
  const p = platform();
  if (p === 'win32') return 'windows';
  if (p === 'darwin') return 'darwin';
  return 'linux';
}

/**
 * Current platform
 */
export const CURRENT_PLATFORM: Platform = detectPlatform();

/**
 * Default configuration directory
 */
export const CONFIG_DIR = join(homedir(), '.claude-x');

/**
 * Default workspace directory
 */
export const DEFAULT_WORKSPACE_DIR = join(CONFIG_DIR, 'workspace');

/**
 * Default skills directory
 */
export const DEFAULT_SKILLS_DIR = join(CONFIG_DIR, 'skills');

/**
 * Default outputs directory
 */
export const DEFAULT_OUTPUTS_DIR = join(CONFIG_DIR, 'outputs');

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: Omit<Config, 'apiKey'> = {
  llmProvider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 0.7,
  maxIterations: 50,
  skillsPath: DEFAULT_SKILLS_DIR,
  workspacePath: DEFAULT_WORKSPACE_DIR,
  outputsPath: DEFAULT_OUTPUTS_DIR,
  logLevel: 'info',
  apiKey: '', // Must be provided by user
};

/**
 * Shell commands by platform
 */
export const SHELL_COMMANDS = {
  windows: {
    shell: 'powershell.exe',
    args: ['-NoProfile', '-NonInteractive', '-Command'],
  },
  darwin: {
    shell: '/bin/bash',
    args: ['-c'],
  },
  linux: {
    shell: '/bin/bash',
    args: ['-c'],
  },
} as const;

/**
 * File extensions to include in code search
 */
export const CODE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx',
  '.py', '.pyi',
  '.rs',
  '.go',
  '.java',
  '.cpp', '.cc', '.cxx', '.c', '.h', '.hpp',
  '.rb',
  '.php',
  '.swift',
  '.kt', '.kts',
  '.cs',
  '.sh', '.bash', '.zsh',
  '.yaml', '.yml',
  '.json',
  '.toml',
  '.md',
] as const;

/**
 * Environment detection commands
 */
export const ENV_DETECTION_COMMANDS = {
  slurm: ['sbatch', 'sinfo', 'squeue'],
  kubernetes: ['kubectl'],
  local: ['python3', 'python'],
} as const;

/**
 * System prompts
 */
export const SYSTEM_PROMPTS = {
  default: `You are a helpful AI coding assistant with access to tools for file operations, shell commands, and code analysis.

When a user asks you to perform a task:
1. Break it down into steps
2. Use the available tools to accomplish each step
3. Provide clear explanations of what you're doing
4. Handle errors gracefully and suggest solutions

Available tool categories:
- File operations: read, write files
- Shell execution: run bash/PowerShell commands
- Code search: grep for patterns in files

Always be helpful, accurate, and thorough.`,

  training: `You are an AI assistant specialized in ML/AI training workflows.

You have access to tools and skills for:
- Local GPU training
- Slurm cluster job submission
- Kubernetes job deployment
- Training monitoring and debugging

When helping with training tasks:
1. Detect the user's environment (local, Slurm, K8s)
2. Load the appropriate skill guide
3. Help set up the training pipeline
4. Monitor execution and debug issues

Focus on best practices like checkpointing, resource management, and error recovery.`,
} as const;

/**
 * Model names by provider
 */
export const MODELS = {
  anthropic: [
    'claude-sonnet-4-20250514',
    'claude-opus-4-20250514',
    'claude-haiku-4-20250514',
  ],
  openai: [
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
  ],
} as const;

/**
 * Token limits by model
 */
export const TOKEN_LIMITS: Record<string, number> = {
  'claude-sonnet-4-20250514': 200000,
  'claude-opus-4-20250514': 200000,
  'claude-haiku-4-20250514': 200000,
  'gpt-4-turbo': 128000,
  'gpt-4': 8192,
  'gpt-3.5-turbo': 16384,
};

/**
 * Timeout values (in milliseconds)
 */
export const TIMEOUTS = {
  shellCommand: 30000,      // 30 seconds
  llmRequest: 120000,       // 2 minutes
  toolExecution: 60000,     // 1 minute
} as const;
