/**
 * Tests for markdown formatter
 */

import { describe, test, expect } from 'bun:test';
import { MarkdownFormatter } from '../../src/core/export/formatter.js';
import type { ConversationExport } from '../../src/core/export/formatter.js';

describe('MarkdownFormatter', () => {
  test('formats conversation correctly', () => {
    const formatter = new MarkdownFormatter();
    const data: ConversationExport = {
      timestamp: '2026-01-04T12:00:00Z',
      model: 'test-model',
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ],
      metadata: {
        totalMessages: 2,
        totalTokens: { input: 10, output: 5 },
        iterations: 1,
        exportedAt: '2026-01-04T12:00:00Z',
      },
    };

    const output = formatter.format(data);

    expect(output).toContain('# Conversation Export');
    expect(output).toContain('**Date**: 2026-01-04T12:00:00Z');
    expect(output).toContain('**Model**: test-model');
    expect(output).toContain('**Total Messages**: 2');
    expect(output).toContain('**Token Usage**: 10 input, 5 output');
    expect(output).toContain('**You**:');
    expect(output).toContain('Hello');
    expect(output).toContain('**Assistant**:');
    expect(output).toContain('Hi there!');
  });

  test('skips system messages', () => {
    const formatter = new MarkdownFormatter();
    const data: ConversationExport = {
      timestamp: '2026-01-04T12:00:00Z',
      model: 'test-model',
      messages: [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' },
      ],
      metadata: {
        totalMessages: 3,
        totalTokens: { input: 10, output: 5 },
        iterations: 1,
        exportedAt: '2026-01-04T12:00:00Z',
      },
    };

    const output = formatter.format(data);

    expect(output).not.toContain('System prompt');
    expect(output).toContain('Hello');
    expect(output).toContain('Hi');
  });

  test('handles empty conversation', () => {
    const formatter = new MarkdownFormatter();
    const data: ConversationExport = {
      timestamp: '2026-01-04T12:00:00Z',
      model: 'test-model',
      messages: [],
      metadata: {
        totalMessages: 0,
        totalTokens: { input: 0, output: 0 },
        iterations: 0,
        exportedAt: '2026-01-04T12:00:00Z',
      },
    };

    const output = formatter.format(data);

    expect(output).toContain('# Conversation Export');
    expect(output).toContain('**Total Messages**: 0');
  });

  test('formats multi-turn conversation', () => {
    const formatter = new MarkdownFormatter();
    const data: ConversationExport = {
      timestamp: '2026-01-04T12:00:00Z',
      model: 'test-model',
      messages: [
        { role: 'user', content: 'First question' },
        { role: 'assistant', content: 'First answer' },
        { role: 'user', content: 'Second question' },
        { role: 'assistant', content: 'Second answer' },
      ],
      metadata: {
        totalMessages: 4,
        totalTokens: { input: 20, output: 15 },
        iterations: 2,
        exportedAt: '2026-01-04T12:00:00Z',
      },
    };

    const output = formatter.format(data);

    expect(output).toContain('First question');
    expect(output).toContain('First answer');
    expect(output).toContain('Second question');
    expect(output).toContain('Second answer');
  });

  test('includes separators between messages', () => {
    const formatter = new MarkdownFormatter();
    const data: ConversationExport = {
      timestamp: '2026-01-04T12:00:00Z',
      model: 'test-model',
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' },
      ],
      metadata: {
        totalMessages: 2,
        totalTokens: { input: 10, output: 5 },
        iterations: 1,
        exportedAt: '2026-01-04T12:00:00Z',
      },
    };

    const output = formatter.format(data);

    // Check for separator lines
    expect(output).toContain('---');
  });
});
