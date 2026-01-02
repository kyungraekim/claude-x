/**
 * File system utilities
 *
 * Cross-platform file operations with proper error handling.
 */

import { readFile as fsReadFile, writeFile as fsWriteFile, access, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname } from 'node:path';
import { normalizePathForPlatform } from './platform.js';

/**
 * Read a file's contents
 *
 * @param path - Path to file
 * @param encoding - File encoding (default: 'utf-8')
 * @returns File contents
 * @throws Error if file doesn't exist or can't be read
 */
export async function readFile(path: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
  const normalizedPath = normalizePathForPlatform(path);

  try {
    const content = await fsReadFile(normalizedPath, encoding);
    return content;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read file ${path}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Write content to a file
 *
 * Creates parent directories if they don't exist.
 *
 * @param path - Path to file
 * @param content - Content to write
 * @param encoding - File encoding (default: 'utf-8')
 * @throws Error if file can't be written
 */
export async function writeFile(
  path: string,
  content: string,
  encoding: BufferEncoding = 'utf-8'
): Promise<void> {
  const normalizedPath = normalizePathForPlatform(path);

  try {
    // Ensure parent directory exists
    const dir = dirname(normalizedPath);
    await ensureDir(dir);

    await fsWriteFile(normalizedPath, content, encoding);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to write file ${path}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Check if a file exists
 *
 * @param path - Path to check
 * @returns True if file exists and is accessible
 */
export async function fileExists(path: string): Promise<boolean> {
  const normalizedPath = normalizePathForPlatform(path);

  try {
    await access(normalizedPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a file is readable
 *
 * @param path - Path to check
 * @returns True if file is readable
 */
export async function isReadable(path: string): Promise<boolean> {
  const normalizedPath = normalizePathForPlatform(path);

  try {
    await access(normalizedPath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a file is writable
 *
 * @param path - Path to check
 * @returns True if file is writable
 */
export async function isWritable(path: string): Promise<boolean> {
  const normalizedPath = normalizePathForPlatform(path);

  try {
    await access(normalizedPath, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure a directory exists, creating it if necessary
 *
 * @param path - Directory path
 * @throws Error if directory can't be created
 */
export async function ensureDir(path: string): Promise<void> {
  const normalizedPath = normalizePathForPlatform(path);

  try {
    await mkdir(normalizedPath, { recursive: true });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create directory ${path}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Read a JSON file and parse it
 *
 * @param path - Path to JSON file
 * @returns Parsed JSON object
 * @throws Error if file doesn't exist, can't be read, or isn't valid JSON
 */
export async function readJSON<T = unknown>(path: string): Promise<T> {
  const content = await readFile(path);

  try {
    return JSON.parse(content) as T;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse JSON from ${path}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Write an object to a JSON file
 *
 * @param path - Path to JSON file
 * @param data - Data to write
 * @param pretty - Pretty-print JSON (default: true)
 * @throws Error if file can't be written
 */
export async function writeJSON(path: string, data: unknown, pretty = true): Promise<void> {
  const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  await writeFile(path, content);
}

/**
 * Append content to a file
 *
 * Creates the file if it doesn't exist.
 *
 * @param path - Path to file
 * @param content - Content to append
 * @param encoding - File encoding (default: 'utf-8')
 * @throws Error if file can't be written
 */
export async function appendFile(
  path: string,
  content: string,
  encoding: BufferEncoding = 'utf-8'
): Promise<void> {
  const normalizedPath = normalizePathForPlatform(path);

  try {
    // Read existing content if file exists
    let existing = '';
    if (await fileExists(normalizedPath)) {
      existing = await readFile(normalizedPath, encoding);
    }

    // Write combined content
    await writeFile(normalizedPath, existing + content, encoding);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to append to file ${path}: ${error.message}`);
    }
    throw error;
  }
}
