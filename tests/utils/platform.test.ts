/**
 * Platform utilities tests
 */

import { describe, test, expect } from 'bun:test';
import {
  detectPlatform,
  isWindows,
  isMacOS,
  isLinux,
  getShell,
  getHomeDir,
  normalizePathForPlatform,
  toUnixPath,
  getPathSeparator,
  isAbsolutePath,
  joinPaths,
} from '../../src/utils/platform';

describe('Platform Detection', () => {
  test('detectPlatform should return valid platform', () => {
    const platform = detectPlatform();
    expect(['windows', 'darwin', 'linux']).toContain(platform);
  });

  test('exactly one platform check should be true', () => {
    const checks = [isWindows(), isMacOS(), isLinux()];
    const trueCount = checks.filter(Boolean).length;
    expect(trueCount).toBe(1);
  });

  test('getShell should return shell path', () => {
    const shell = getShell();
    expect(shell).toBeTruthy();
    expect(typeof shell).toBe('string');
  });
});

describe('Path Operations', () => {
  test('getHomeDir should return home directory', () => {
    const home = getHomeDir();
    expect(home).toBeTruthy();
    expect(typeof home).toBe('string');
    expect(home.length).toBeGreaterThan(0);
  });

  test('normalizePathForPlatform should handle tilde', () => {
    const normalized = normalizePathForPlatform('~/test');
    expect(normalized).not.toContain('~');
    expect(normalized).toContain('test');
  });

  test('toUnixPath should convert backslashes', () => {
    const unixPath = toUnixPath('C:\\Users\\test');
    expect(unixPath).toBe('C:/Users/test');
  });

  test('getPathSeparator should return separator', () => {
    const sep = getPathSeparator();
    expect(['/', '\\']).toContain(sep);
  });

  test('joinPaths should join paths', () => {
    const joined = joinPaths('foo', 'bar', 'baz');
    expect(joined).toContain('foo');
    expect(joined).toContain('bar');
    expect(joined).toContain('baz');
  });
});

describe('Path Validation', () => {
  test('isAbsolutePath should detect Unix absolute paths', () => {
    expect(isAbsolutePath('/usr/bin')).toBe(true);
    expect(isAbsolutePath('relative/path')).toBe(false);
  });

  test('isAbsolutePath should detect Windows absolute paths on Windows', () => {
    if (isWindows()) {
      expect(isAbsolutePath('C:\\Users')).toBe(true);
      expect(isAbsolutePath('D:\\Program Files')).toBe(true);
    }
  });

  test('isAbsolutePath should handle relative paths', () => {
    expect(isAbsolutePath('./relative')).toBe(false);
    expect(isAbsolutePath('../parent')).toBe(false);
    expect(isAbsolutePath('relative')).toBe(false);
  });
});
