/**
 * Bash tool
 *
 * Executes shell commands with cross-platform support.
 * Uses PowerShell on Windows, bash on Unix.
 */

import { z } from 'zod';
import type { Tool } from '../../types/index.js';
import { executeCommand } from '../../utils/shell.js';
import { logger } from '../../utils/logger.js';

/**
 * Input schema for bash tool
 */
const BashInputSchema = z.object({
  /**
   * Command to execute
   */
  command: z.string().describe('Shell command to execute'),

  /**
   * Working directory (optional)
   */
  workingDir: z.string().optional().describe('Working directory for command execution'),

  /**
   * Timeout in milliseconds (optional)
   */
  timeout: z.number().optional().describe('Timeout in milliseconds'),
});

/**
 * Bash tool implementation
 *
 * Executes shell commands safely with:
 * - Cross-platform support (Windows PowerShell, Unix bash)
 * - Timeout protection
 * - Error handling
 *
 * TODO: Add sandboxing/security restrictions:
 * - Command allow/deny lists
 * - Path restrictions
 * - Resource limits
 */
export const BashTool: Tool = {
  name: 'bash',
  description: 'Execute a shell command. On Windows uses PowerShell, on Unix uses bash. Returns stdout, stderr, and exit code.',

  inputSchema: BashInputSchema,

  async execute(params) {
    const { command, workingDir, timeout } = params;

    logger.info(`Executing command: ${command}`, { workingDir, timeout });

    try {
      const result = await executeCommand(command, {
        cwd: workingDir,
        timeout,
      });

      // Format output
      let output = '';

      if (result.stdout) {
        output += result.stdout;
      }

      if (result.stderr) {
        output += result.stderr ? `\n\nSTDERR:\n${result.stderr}` : '';
      }

      output += `\n\nExit code: ${result.exitCode}`;

      return {
        success: result.success,
        output,
        error: result.success ? undefined : `Command exited with code ${result.exitCode}`,
        metadata: {
          exitCode: result.exitCode,
          hasStdout: !!result.stdout,
          hasStderr: !!result.stderr,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Bash tool error:', errorMessage);

      return {
        success: false,
        output: '',
        error: `Failed to execute command: ${errorMessage}`,
      };
    }
  },
};
