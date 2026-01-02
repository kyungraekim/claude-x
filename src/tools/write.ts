/**
 * Write file tool
 *
 * Writes content to a file, creating parent directories if needed.
 */

import { z } from 'zod';
import type { Tool } from '../types/index.js';
import { writeFile } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

/**
 * Input schema for write tool
 */
const WriteInputSchema = z.object({
  /**
   * Path to file to write
   */
  path: z.string().describe('Absolute or relative path to file'),

  /**
   * Content to write
   */
  content: z.string().describe('Content to write to file'),

  /**
   * File encoding (optional, default: utf-8)
   */
  encoding: z.enum(['utf-8', 'ascii', 'base64', 'latin1']).optional().describe('File encoding'),
});

/**
 * Write file tool implementation
 *
 * Features:
 * - Creates parent directories automatically
 * - Overwrites existing files
 * - Cross-platform path handling
 *
 * TODO: Add security features:
 * - Path validation (prevent writing outside allowed directories)
 * - File size limits
 * - Backup before overwriting
 */
export const WriteTool: Tool = {
  name: 'write',
  description: 'Write content to a file. Creates parent directories if they don\'t exist. Overwrites existing files.',

  inputSchema: WriteInputSchema,

  async execute(params) {
    const { path, content, encoding = 'utf-8' } = params;

    logger.info(`Writing file: ${path} (${content.length} chars)`);

    try {
      await writeFile(path, content, encoding as BufferEncoding);

      const sizeBytes = Buffer.byteLength(content, 'utf-8');

      return {
        success: true,
        output: `Successfully wrote ${sizeBytes} bytes to ${path}`,
        metadata: {
          path,
          sizeBytes,
          encoding,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Write tool error:', errorMessage);

      return {
        success: false,
        output: '',
        error: `Failed to write file: ${errorMessage}`,
      };
    }
  },
};
