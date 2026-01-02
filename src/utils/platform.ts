/**
 * Cross-platform utilities
 *
 * Handles platform detection and path normalization for Windows, macOS, and Linux.
 */

import { homedir, platform as osPlatform } from 'node:os';
import { join, normalize, sep } from 'node:path';
import type { Platform } from '../types/index.js';

/**
 * Detect current platform
 *
 * @returns Platform type ('windows' | 'darwin' | 'linux')
 */
export function detectPlatform(): Platform {
  const p = osPlatform();
  if (p === 'win32') return 'windows';
  if (p === 'darwin') return 'darwin';
  return 'linux';
}

/**
 * Check if current platform is Windows
 */
export function isWindows(): boolean {
  return detectPlatform() === 'windows';
}

/**
 * Check if current platform is macOS
 */
export function isMacOS(): boolean {
  return detectPlatform() === 'darwin';
}

/**
 * Check if current platform is Linux
 */
export function isLinux(): boolean {
  return detectPlatform() === 'linux';
}

/**
 * Detect shell for current platform
 *
 * @returns Shell command ('powershell' | 'bash' | 'zsh')
 */
export function getShell(): string {
  const platform = detectPlatform();

  if (platform === 'windows') {
    return 'powershell.exe';
  }

  // On Unix, check for zsh first (default on modern macOS)
  // Fall back to bash
  const shell = process.env.SHELL || '/bin/bash';
  return shell;
}

/**
 * Get home directory path
 *
 * @returns Absolute path to home directory
 */
export function getHomeDir(): string {
  return homedir();
}

/**
 * Normalize path for current platform
 *
 * Handles:
 * - ~ expansion to home directory
 * - Backslash/forward slash conversion
 * - Path separator normalization
 *
 * @param path - Path to normalize
 * @returns Normalized absolute path
 */
export function normalizePathForPlatform(path: string): string {
  // Expand ~ to home directory
  if (path.startsWith('~')) {
    path = join(getHomeDir(), path.slice(1));
  }

  // Normalize separators
  return normalize(path);
}

/**
 * Convert Unix-style path to Windows-style if needed
 *
 * @param path - Unix-style path
 * @returns Platform-appropriate path
 */
export function toPlatformPath(path: string): string {
  if (isWindows()) {
    // Replace forward slashes with backslashes on Windows
    return path.replace(/\//g, '\\');
  }
  return path;
}

/**
 * Convert path to Unix-style (forward slashes)
 * Useful for cross-platform path handling
 *
 * @param path - Platform-specific path
 * @returns Unix-style path
 */
export function toUnixPath(path: string): string {
  return path.replace(/\\/g, '/');
}

/**
 * Get path separator for current platform
 *
 * @returns Path separator ('\\' for Windows, '/' for Unix)
 */
export function getPathSeparator(): string {
  return sep;
}

/**
 * Check if a path is absolute
 *
 * Works cross-platform:
 * - Windows: Checks for drive letter (C:\) or UNC path (\\server\)
 * - Unix: Checks for leading slash
 *
 * @param path - Path to check
 * @returns True if path is absolute
 */
export function isAbsolutePath(path: string): boolean {
  if (isWindows()) {
    // Windows absolute paths: C:\... or \\server\share\...
    return /^[a-zA-Z]:\\/.test(path) || /^\\\\/.test(path);
  }
  // Unix absolute paths: /...
  return path.startsWith('/');
}

/**
 * Join paths using platform-appropriate separator
 *
 * @param paths - Path segments to join
 * @returns Joined path
 */
export function joinPaths(...paths: string[]): string {
  return join(...paths);
}

/**
 * Get platform-specific line ending
 *
 * @returns '\r\n' for Windows, '\n' for Unix
 */
export function getLineEnding(): string {
  return isWindows() ? '\r\n' : '\n';
}

/**
 * Get environment variable with platform-specific handling
 *
 * Windows environment variables are case-insensitive
 * Unix environment variables are case-sensitive
 *
 * @param name - Environment variable name
 * @param defaultValue - Default value if not found
 * @returns Environment variable value or default
 */
export function getEnv(name: string, defaultValue?: string): string | undefined {
  // Try exact match first
  if (process.env[name] !== undefined) {
    return process.env[name];
  }

  // On Windows, try case-insensitive match
  if (isWindows()) {
    const upperName = name.toUpperCase();
    for (const key in process.env) {
      if (key.toUpperCase() === upperName) {
        return process.env[key];
      }
    }
  }

  return defaultValue;
}
