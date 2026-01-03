/**
 * Tests for command parser
 */

import { describe, test, expect } from 'bun:test';
import { parseSlashCommand } from '../../src/utils/command-parser.js';

describe('parseSlashCommand', () => {
  test('detects slash command', () => {
    const result = parseSlashCommand('/export');
    expect(result.isCommand).toBe(true);
    expect(result.command).toBe('export');
    expect(result.args).toEqual([]);
  });

  test('parses command with arguments', () => {
    const result = parseSlashCommand('/export markdown');
    expect(result.isCommand).toBe(true);
    expect(result.command).toBe('export');
    expect(result.args).toEqual(['markdown']);
  });

  test('parses command with multiple arguments', () => {
    const result = parseSlashCommand('/command arg1 arg2 arg3');
    expect(result.isCommand).toBe(true);
    expect(result.command).toBe('command');
    expect(result.args).toEqual(['arg1', 'arg2', 'arg3']);
  });

  test('ignores normal messages', () => {
    const result = parseSlashCommand('regular message');
    expect(result.isCommand).toBe(false);
    expect(result.command).toBeUndefined();
  });

  test('handles whitespace correctly', () => {
    const result = parseSlashCommand('  /export  ');
    expect(result.isCommand).toBe(true);
    expect(result.command).toBe('export');
  });

  test('handles empty input', () => {
    const result = parseSlashCommand('');
    expect(result.isCommand).toBe(false);
  });

  test('handles just a slash', () => {
    const result = parseSlashCommand('/');
    expect(result.isCommand).toBe(true);
    expect(result.command).toBe('');
    expect(result.args).toEqual([]);
  });

  test('preserves raw input', () => {
    const input = '/export markdown';
    const result = parseSlashCommand(input);
    expect(result.rawInput).toBe(input);
  });

  test('normalizes command to lowercase', () => {
    const result = parseSlashCommand('/EXPORT');
    expect(result.command).toBe('export');
  });
});
