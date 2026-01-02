/**
 * Read file tool
 *
 * Reads the contents of a file.
 */

import { z } from 'zod';
import type { Tool } from '../types/index.js';
import { readFile } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

/**
 * Input schema for read tool
 */
const ReadInputSchema = z.object({
  /**
   * Path to file to read
   */
  path: z.string().describe('Absolute or relative path to file'),

  /**
   * File encoding (optional, default: utf-8)
   */
  encoding: z.enum(['utf-8', 'ascii', 'base64', 'latin1']).optional().describe('File encoding'),
});

/**
 * Read file tool implementation
 *
 * TODO: Add security features:
 * - Path validation (prevent reading outside allowed directories)
 * - File size limits
 * - Binary file detection
 */
export const ReadTool: Tool = {
  name: 'read',
  description: 'Read the contents of a file. Returns the file contents as a string.',

  inputSchema: ReadInputSchema,

  async execute(params) {
    const { path, encoding = 'utf-8' } = params;

    logger.info(`Reading file: ${path}`);

    try {
      const content = await readFile(path, encoding as BufferEncoding);

      // Check file size for warning
      const sizeKB = Buffer.byteLength(content, 'utf-8') / 1024;
      if (sizeKB > 100) {
        logger.warn(`Large file read: ${path} (${sizeKB.toFixed(2)} KB)`);
      }

      return {
        success: true,
        output: content,
        metadata: {
          path,
          sizeBytes: Buffer.byteLength(content, 'utf-8'),
          encoding,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Read tool error:', errorMessage);

      return {
        success: false,
        output: '',
        error: `Failed to read file: ${errorMessage}`,
      };
    }
  },
};
