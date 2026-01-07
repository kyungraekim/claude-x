/**
 * Cross-platform shell execution utilities
 *
 * Handles differences between Windows PowerShell and Unix bash/zsh shells.
 */

import { spawn } from 'node:child_process';
import { detectPlatform } from './platform.js';
import { SHELL_COMMANDS, TIMEOUTS } from '../constants.js';

/**
 * Result from shell command execution
 */
export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

/**
 * Options for shell command execution
 */
export interface ShellOptions {
  /**
   * Working directory for command execution
   */
  cwd?: string;

  /**
   * Environment variables
   */
  env?: Record<string, string>;

  /**
   * Timeout in milliseconds
   */
  timeout?: number;

  /**
   * Input to pipe to stdin
   */
  input?: string;
}

/**
 * Execute a shell command with cross-platform support
 *
 * On Windows: Uses PowerShell
 * On Unix: Uses bash or user's default shell
 *
 * @param command - Command to execute
 * @param options - Execution options
 * @returns Shell execution result
 *
 * @example
 * ```ts
 * // Execute a simple command
 * const result = await executeCommand('ls -la');
 *
 * // Execute with options
 * const result = await executeCommand('python train.py', {
 *   cwd: '/path/to/project',
 *   env: { CUDA_VISIBLE_DEVICES: '0' },
 *   timeout: 60000
 * });
 * ```
 */
export async function executeCommand(
  command: string,
  options: ShellOptions = {}
): Promise<ShellResult> {
  const platform = detectPlatform();
  const shellConfig = SHELL_COMMANDS[platform];
  const timeout = options.timeout || TIMEOUTS.shellCommand;

  // Merge environment variables
  const env = {
    ...process.env,
    ...options.env,
  };

  // Create the command array
  const args = [...shellConfig.args, command];

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let didTimeout = false;

    // Spawn the process
    const child = spawn(shellConfig.shell, args, {
      cwd: options.cwd,
      env,
      shell: false, // We're already using a shell
    });

    // Set up timeout
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      child.kill('SIGTERM');

      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 5000);
    }, timeout);

    // Collect stdout
    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    }

    // Collect stderr
    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    // Write input if provided
    if (options.input && child.stdin) {
      child.stdin.write(options.input);
      child.stdin.end();
    }

    // Handle process exit
    child.on('close', (code) => {
      clearTimeout(timeoutId);

      if (didTimeout) {
        resolve({
          stdout,
          stderr: stderr + '\nCommand timed out',
          exitCode: -1,
          success: false,
        });
      } else {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
          success: code === 0,
        });
      }
    });

    // Handle errors
    child.on('error', (error) => {
      clearTimeout(timeoutId);
      resolve({
        stdout,
        stderr: stderr + '\n' + error.message,
        exitCode: -1,
        success: false,
      });
    });
  });
}

/**
 * Execute a command and return only stdout (throw on error)
 *
 * @param command - Command to execute
 * @param options - Execution options
 * @returns Command stdout
 * @throws Error if command fails
 */
export async function exec(command: string, options: ShellOptions = {}): Promise<string> {
  const result = await executeCommand(command, options);

  if (!result.success) {
    throw new Error(
      `Command failed with exit code ${result.exitCode}:\n${result.stderr || result.stdout}`
    );
  }

  return result.stdout;
}

/**
 * Check if a command exists on the system
 *
 * @param command - Command name to check
 * @returns True if command exists
 */
export async function commandExists(command: string): Promise<boolean> {
  const platform = detectPlatform();

  try {
    if (platform === 'windows') {
      // Use 'where' on Windows
      const result = await executeCommand(`where ${command}`, { timeout: 5000 });
      return result.success;
    } else {
      // Use 'which' on Unix
      const result = await executeCommand(`which ${command}`, { timeout: 5000 });
      return result.success;
    }
  } catch {
    return false;
  }
}

/**
 * Escape shell argument for safe command execution
 *
 * Properly quotes arguments to prevent injection attacks
 *
 * @param arg - Argument to escape
 * @returns Escaped argument
 */
export function escapeShellArg(arg: string): string {
  const platform = detectPlatform();

  if (platform === 'windows') {
    // PowerShell escaping
    // Wrap in single quotes and escape existing single quotes
    return `'${arg.replace(/'/g, "''")}'`;
  } else {
    // Bash escaping
    // Wrap in single quotes and escape existing single quotes
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }
}

/**
 * Build a safe shell command with escaped arguments
 *
 * @param command - Base command
 * @param args - Arguments to escape and append
 * @returns Safe command string
 */
export function buildCommand(command: string, args: string[]): string {
  const escapedArgs = args.map(escapeShellArg);
  return `${command} ${escapedArgs.join(' ')}`;
}
