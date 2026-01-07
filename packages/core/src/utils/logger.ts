/**
 * Logging utility
 *
 * Provides structured logging with levels and optional color output.
 */

import chalk from 'chalk';
import type { LogLevel } from '../types/index.js';

/**
 * Log level priority
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Logger class
 */
export class Logger {
  private level: LogLevel;
  private useColors: boolean;

  constructor(level: LogLevel = 'info', useColors = true) {
    this.level = level;
    this.useColors = useColors;
  }

  /**
   * Set log level
   *
   * @param level - New log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Check if a log level should be logged
   *
   * @param level - Level to check
   * @returns True if level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  /**
   * Format log message with timestamp and level
   *
   * @param level - Log level
   * @param message - Message to log
   * @returns Formatted message
   */
  private format(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);

    if (!this.useColors) {
      return `[${timestamp}] ${levelStr} ${message}`;
    }

    // Colorize based on level
    let coloredLevel: string;
    switch (level) {
      case 'debug':
        coloredLevel = chalk.gray(levelStr);
        break;
      case 'info':
        coloredLevel = chalk.blue(levelStr);
        break;
      case 'warn':
        coloredLevel = chalk.yellow(levelStr);
        break;
      case 'error':
        coloredLevel = chalk.red(levelStr);
        break;
    }

    return `${chalk.gray(`[${timestamp}]`)} ${coloredLevel} ${message}`;
  }

  /**
   * Log a debug message
   *
   * @param message - Message to log
   * @param data - Optional data to log
   */
  debug(message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      console.debug(this.format('debug', message));
      if (data !== undefined) {
        console.debug(data);
      }
    }
  }

  /**
   * Log an info message
   *
   * @param message - Message to log
   * @param data - Optional data to log
   */
  info(message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      console.log(this.format('info', message));
      if (data !== undefined) {
        console.log(data);
      }
    }
  }

  /**
   * Log a warning message
   *
   * @param message - Message to log
   * @param data - Optional data to log
   */
  warn(message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message));
      if (data !== undefined) {
        console.warn(data);
      }
    }
  }

  /**
   * Log an error message
   *
   * @param message - Message to log
   * @param error - Optional error object
   */
  error(message: string, error?: Error | unknown): void {
    if (this.shouldLog('error')) {
      console.error(this.format('error', message));

      if (error instanceof Error) {
        console.error(error.stack || error.message);
      } else if (error !== undefined) {
        console.error(error);
      }
    }
  }

  /**
   * Create a child logger with a prefix
   *
   * @param prefix - Prefix for all messages
   * @returns New logger instance
   */
  child(prefix: string): Logger {
    const childLogger = new Logger(this.level, this.useColors);

    // Override methods to add prefix
    const originalDebug = childLogger.debug.bind(childLogger);
    const originalInfo = childLogger.info.bind(childLogger);
    const originalWarn = childLogger.warn.bind(childLogger);
    const originalError = childLogger.error.bind(childLogger);

    childLogger.debug = (msg, data) => originalDebug(`[${prefix}] ${msg}`, data);
    childLogger.info = (msg, data) => originalInfo(`[${prefix}] ${msg}`, data);
    childLogger.warn = (msg, data) => originalWarn(`[${prefix}] ${msg}`, data);
    childLogger.error = (msg, err) => originalError(`[${prefix}] ${msg}`, err);

    return childLogger;
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a new logger instance
 *
 * @param level - Log level
 * @param useColors - Use colors in output
 * @returns Logger instance
 */
export function createLogger(level: LogLevel = 'info', useColors = true): Logger {
  return new Logger(level, useColors);
}
