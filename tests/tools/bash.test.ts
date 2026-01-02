/**
 * Bash tool tests
 */

import { describe, test, expect } from 'bun:test';
import { BashTool } from '../../src/tools/bash';

describe('BashTool', () => {
  test('should have correct name', () => {
    expect(BashTool.name).toBe('bash');
  });

  test('should have description', () => {
    expect(BashTool.description).toBeTruthy();
    expect(typeof BashTool.description).toBe('string');
  });

  test('should execute simple command', async () => {
    const result = await BashTool.execute({
      command: 'echo "Hello, World!"',
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain('Hello, World!');
  });

  test('should handle command with exit code 0', async () => {
    const result = await BashTool.execute({
      command: 'exit 0',
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain('Exit code: 0');
  });

  test('should handle command with non-zero exit code', async () => {
    const result = await BashTool.execute({
      command: 'exit 1',
    });

    expect(result.success).toBe(false);
    expect(result.output).toContain('Exit code: 1');
  });

  test('should capture stdout', async () => {
    const result = await BashTool.execute({
      command: 'echo "stdout test"',
    });

    expect(result.output).toContain('stdout test');
  });

  test('should support working directory', async () => {
    const result = await BashTool.execute({
      command: 'pwd',
      workingDir: '/tmp',
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain('/tmp');
  });

  test('should validate input schema', () => {
    // Valid input
    expect(() => {
      BashTool.inputSchema.parse({
        command: 'ls',
      });
    }).not.toThrow();

    // Invalid input - missing command
    expect(() => {
      BashTool.inputSchema.parse({});
    }).toThrow();

    // Invalid input - wrong type
    expect(() => {
      BashTool.inputSchema.parse({
        command: 123,
      });
    }).toThrow();
  });
});
