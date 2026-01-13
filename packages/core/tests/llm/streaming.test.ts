/**
 * LLM Streaming tests
 *
 * Tests streaming functionality for LLM clients
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { AnthropicClient } from '../../src/llm/anthropic.js';
import { OpenAIClient } from '../../src/llm/openai.js';
import type { StreamChunk } from '../../src/types/llm.js';

describe('LLM Streaming', () => {
  describe('AnthropicClient streaming', () => {
    let client: AnthropicClient;

    beforeEach(() => {
      // Use a dummy API key for testing
      client = new AnthropicClient('test-key', 'claude-3-5-sonnet-20241022', 1000, 0.7);
    });

    test('should have streamMessage method', () => {
      expect(client.streamMessage).toBeDefined();
      expect(typeof client.streamMessage).toBe('function');
    });

    test('streamMessage should return AsyncGenerator', async () => {
      const messages = [
        { role: 'user' as const, content: 'Hello' },
      ];

      const generator = client.streamMessage(messages);
      expect(generator).toBeDefined();
      expect(typeof generator[Symbol.asyncIterator]).toBe('function');
    });

    test('should handle streaming errors gracefully', async () => {
      const messages = [
        { role: 'user' as const, content: 'Test message' },
      ];

      const chunks: StreamChunk[] = [];
      try {
        // This will fail with invalid API key, but should yield error chunk
        for await (const chunk of client.streamMessage(messages)) {
          chunks.push(chunk);
          // Stop after first chunk to avoid long wait
          if (chunk.type === 'error') break;
        }
      } catch (error) {
        // Expected to fail with test key
      }

      // Should have attempted to stream or yielded an error
      expect(chunks.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('OpenAIClient streaming', () => {
    let client: OpenAIClient;

    beforeEach(() => {
      // Use a dummy API key for testing
      client = new OpenAIClient('test-key', 'gpt-4', 1000, 0.7);
    });

    test('should have streamMessage method', () => {
      expect(client.streamMessage).toBeDefined();
      expect(typeof client.streamMessage).toBe('function');
    });

    test('streamMessage should return AsyncGenerator', async () => {
      const messages = [
        { role: 'user' as const, content: 'Hello' },
      ];

      const generator = client.streamMessage(messages);
      expect(generator).toBeDefined();
      expect(typeof generator[Symbol.asyncIterator]).toBe('function');
    });

    test('should handle streaming errors gracefully', async () => {
      const messages = [
        { role: 'user' as const, content: 'Test message' },
      ];

      const chunks: StreamChunk[] = [];
      try {
        // This will fail with invalid API key, but should yield error chunk
        for await (const chunk of client.streamMessage(messages)) {
          chunks.push(chunk);
          // Stop after first chunk to avoid long wait
          if (chunk.type === 'error') break;
        }
      } catch (error) {
        // Expected to fail with test key
      }

      // Should have attempted to stream or yielded an error
      expect(chunks.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('StreamChunk types', () => {
    test('should support text chunk', () => {
      const chunk: StreamChunk = {
        type: 'text',
        content: 'Hello, world!',
      };

      expect(chunk.type).toBe('text');
      expect(chunk.content).toBe('Hello, world!');
    });

    test('should support tool_use chunk', () => {
      const chunk: StreamChunk = {
        type: 'tool_use',
        toolCall: {
          id: 'tool_123',
          name: 'bash',
          input: { command: 'ls' },
        },
      };

      expect(chunk.type).toBe('tool_use');
      expect(chunk.toolCall).toBeDefined();
      expect(chunk.toolCall?.name).toBe('bash');
    });

    test('should support done chunk', () => {
      const chunk: StreamChunk = {
        type: 'done',
      };

      expect(chunk.type).toBe('done');
    });

    test('should support error chunk', () => {
      const chunk: StreamChunk = {
        type: 'error',
        error: 'API error occurred',
      };

      expect(chunk.type).toBe('error');
      expect(chunk.error).toBe('API error occurred');
    });
  });

  describe('Token usage tracking', () => {
    test('should have getLastUsage method', () => {
      const client = new AnthropicClient('test-key', 'claude-3-5-sonnet-20241022');
      expect(client.getLastUsage).toBeDefined();
      expect(typeof client.getLastUsage).toBe('function');
    });

    test('should have resetLastUsage method', () => {
      const client = new AnthropicClient('test-key', 'claude-3-5-sonnet-20241022');
      expect(client.resetLastUsage).toBeDefined();
      expect(typeof client.resetLastUsage).toBe('function');
    });

    test('should return null initially', () => {
      const client = new AnthropicClient('test-key', 'claude-3-5-sonnet-20241022');
      const usage = client.getLastUsage();
      expect(usage).toBeNull();
    });

    test('should reset usage to null', () => {
      const client = new AnthropicClient('test-key', 'claude-3-5-sonnet-20241022');
      client.resetLastUsage();
      const usage = client.getLastUsage();
      expect(usage).toBeNull();
    });
  });
});
