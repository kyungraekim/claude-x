/**
 * Grep tool
 *
 * Searches for patterns in files using glob patterns.
 */

import { z } from 'zod';
import { glob } from 'glob';
import type { Tool } from '../../types/index.js';
import { readFile } from '../../utils/fs.js';
import { logger } from '../../utils/logger.js';

/**
 * Input schema for grep tool
 */
const GrepInputSchema = z.object({
  /**
   * Pattern to search for (regex)
   */
  pattern: z.string().describe('Regular expression pattern to search for'),

  /**
   * Path to search (file or directory)
   */
  path: z.string().default('.').describe('File or directory to search in'),

  /**
   * Glob pattern for file matching (optional)
   */
  globPattern: z.string().optional().describe('Glob pattern to filter files (e.g., "**/*.ts")'),

  /**
   * Case insensitive search
   */
  ignoreCase: z.boolean().optional().default(false).describe('Perform case-insensitive search'),

  /**
   * Maximum results to return
   */
  maxResults: z.number().optional().default(100).describe('Maximum number of results to return'),
});

/**
 * Grep tool implementation
 *
 * Searches for text patterns in files:
 * - Supports regex patterns
 * - Glob file filtering
 * - Line number reporting
 *
 * TODO: Performance optimizations:
 * - Stream large files instead of loading into memory
 * - Parallel file processing
 * - Result caching
 */
export const GrepTool: Tool = {
  name: 'grep',
  description: 'Search for patterns in files. Supports regex patterns and glob file filtering. Returns matching lines with file paths and line numbers.',

  inputSchema: GrepInputSchema,

  async execute(params) {
    const { pattern, path, globPattern, ignoreCase, maxResults } = params;

    logger.info(`Searching for pattern: ${pattern} in ${path}`);

    try {
      // Build glob pattern
      const searchPattern = globPattern || '**/*';
      const fullPattern = path.endsWith('/') || path === '.'
        ? `${path}/${searchPattern}`
        : path;

      // Find matching files
      const files = await glob(fullPattern, {
        nodir: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      });

      if (files.length === 0) {
        return {
          success: true,
          output: 'No files found matching the pattern',
        };
      }

      // Compile regex
      const flags = ignoreCase ? 'gi' : 'g';
      const regex = new RegExp(pattern, flags);

      // Search in files
      const matches: string[] = [];
      let totalMatches = 0;

      for (const file of files) {
        try {
          const content = await readFile(file);
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            if (regex.test(lines[i]!)) {
              matches.push(`${file}:${i + 1}: ${lines[i]?.trim()}`);
              totalMatches++;

              if (totalMatches >= maxResults) {
                break;
              }
            }
          }

          if (totalMatches >= maxResults) {
            break;
          }
        } catch (error) {
          // Skip files that can't be read (binary, permission issues, etc.)
          logger.debug(`Skipping file ${file}: ${error}`);
          continue;
        }
      }

      if (matches.length === 0) {
        return {
          success: true,
          output: `No matches found for pattern: ${pattern}`,
        };
      }

      const output = matches.join('\n');
      const truncated = totalMatches >= maxResults;

      return {
        success: true,
        output: truncated
          ? `${output}\n\n(Results truncated at ${maxResults} matches)`
          : output,
        metadata: {
          matchCount: matches.length,
          filesSearched: files.length,
          truncated,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Grep tool error:', errorMessage);

      return {
        success: false,
        output: '',
        error: `Failed to search files: ${errorMessage}`,
      };
    }
  },
};
