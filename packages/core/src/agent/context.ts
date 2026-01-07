/**
 * Context manager
 *
 * Manages agent state and context across conversation.
 */

import { logger } from '../utils/logger.js';

/**
 * Context manager class
 *
 * Stores and retrieves contextual information for the agent.
 */
export class ContextManager {
  private context: Map<string, unknown>;

  constructor() {
    this.context = new Map();

    // Set default values
    this.context.set('workingDir', process.cwd());
  }

  /**
   * Set a context value
   *
   * @param key - Context key
   * @param value - Value to store
   */
  set(key: string, value: unknown): void {
    this.context.set(key, value);
    logger.debug(`Context updated: ${key}`);
  }

  /**
   * Get a context value
   *
   * @param key - Context key
   * @returns Value or undefined
   */
  get<T = unknown>(key: string): T | undefined {
    return this.context.get(key) as T | undefined;
  }

  /**
   * Check if a key exists
   *
   * @param key - Context key
   * @returns True if key exists
   */
  has(key: string): boolean {
    return this.context.has(key);
  }

  /**
   * Delete a context value
   *
   * @param key - Context key
   * @returns True if key was deleted
   */
  delete(key: string): boolean {
    return this.context.delete(key);
  }

  /**
   * Clear all context
   */
  clear(): void {
    this.context.clear();
    // Restore defaults
    this.context.set('workingDir', process.cwd());
    logger.debug('Context cleared');
  }

  /**
   * Get working directory
   *
   * @returns Current working directory
   */
  getWorkingDir(): string {
    return this.context.get('workingDir') as string || process.cwd();
  }

  /**
   * Set working directory
   *
   * @param dir - Directory path
   */
  setWorkingDir(dir: string): void {
    this.context.set('workingDir', dir);
    logger.info(`Working directory changed to: ${dir}`);
  }

  /**
   * Get all context as object
   *
   * @returns Context object
   */
  toObject(): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    for (const [key, value] of this.context.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  /**
   * Load context from object
   *
   * @param obj - Context object
   */
  fromObject(obj: Record<string, unknown>): void {
    this.context.clear();
    for (const [key, value] of Object.entries(obj)) {
      this.context.set(key, value);
    }
    logger.debug('Context loaded from object');
  }
}
