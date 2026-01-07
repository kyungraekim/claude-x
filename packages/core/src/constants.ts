/**
 * Core constants and default values
 */

import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import type { Config, Platform } from './types/index.js';

/**
 * Detect current platform
 */
export function detectPlatformFromOS(): Platform {
  const p = platform();
  if (p === 'win32') return 'windows';
  if (p === 'darwin') return 'darwin';
  return 'linux';
}

/**
 * Current platform
 */
export const CURRENT_PLATFORM: Platform = detectPlatformFromOS();

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
 * Uses current working directory for easy access to exported files
 */
export const DEFAULT_OUTPUTS_DIR = join(process.cwd(), 'outputs');

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
 * Timeout values (in milliseconds)
 */
export const TIMEOUTS = {
  shellCommand: 30000,      // 30 seconds
  llmRequest: 120000,       // 2 minutes
  toolExecution: 60000,     // 1 minute
} as const;
