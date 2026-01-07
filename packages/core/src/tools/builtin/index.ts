/**
 * Barrel export for built-in tools
 */

import type { Tool } from '../../types/index.js';
import { BashTool } from './bash.js';
import { ReadTool } from './read.js';
import { WriteTool } from './write.js';
import { GrepTool } from './grep.js';

/**
 * Export individual tools
 */
export { BashTool } from './bash.js';
export { ReadTool } from './read.js';
export { WriteTool } from './write.js';
export { GrepTool } from './grep.js';

/**
 * Get all default tools
 *
 * @returns Array of default tools
 */
export function getDefaultTools(): Tool[] {
  return [
    BashTool,
    ReadTool,
    WriteTool,
    GrepTool,
  ];
}
