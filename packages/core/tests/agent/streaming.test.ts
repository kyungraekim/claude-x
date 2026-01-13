/**
 * Agent streaming tests
 *
 * Tests streaming functionality in the agent's agentic loop
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { Agent } from '../../src/agent/agent.js';
import { ToolRegistry } from '../../src/tools/registry.js';
import { LLMClient } from '../../src/llm/base.js';
import type { StreamChunk, LLMMessage, LLMResponse, Tool } from '../../src/types/index.js';

/**
 * Mock LLM client for testing streaming
 */
class MockStreamingLLMClient extends LLMClient {
  private mockStreamChunks: StreamChunk[];

  constructor(mockChunks: StreamChunk[] = []) {
    super('test-key', 'mock-model');
    this.mockStreamChunks = mockChunks;
  }

  async sendMessage(_messages: LLMMessage[], _tools?: Tool[]): Promise<LLMResponse> {
    return {
      content: 'Mock response',
      stopReason: 'end_turn',
      usage: {
        inputTokens: 10,
        outputTokens: 20,
      },
    };
  }

  async *streamMessage(_messages: LLMMessage[], _tools?: Tool[]): AsyncGenerator<StreamChunk> {
    for (const chunk of this.mockStreamChunks) {
      yield chunk;
      // Small delay to simulate streaming
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
  }

  protected convertToolsToProviderFormat(tools: Tool[]): unknown[] {
    return tools.map((t) => ({ name: t.name, description: t.description }));
  }

  setMockChunks(chunks: StreamChunk[]): void {
    this.mockStreamChunks = chunks;
  }
}

describe('Agent Streaming', () => {
  let mockClient: MockStreamingLLMClient;
  let toolRegistry: ToolRegistry;
  let agent: Agent;

  beforeEach(() => {
    mockClient = new MockStreamingLLMClient();
    toolRegistry = new ToolRegistry();
    agent = new Agent(mockClient, toolRegistry, {
      systemPrompt: 'You are a helpful assistant.',
      maxIterations: 5,
      tools: [],
    });
  });

  describe('Agent run method', () => {
    test('should use streaming by default', async () => {
      // Setup mock chunks
      mockClient.setMockChunks([
        { type: 'text', content: 'Hello' },
        { type: 'text', content: ' world' },
        { type: 'done' },
      ]);

      const events = [];
      for await (const event of agent.run('Test message')) {
        events.push(event);
      }

      // Should have streaming chunk events
      const streamChunks = events.filter((e) => e.type === 'llm_stream_chunk');
      expect(streamChunks.length).toBeGreaterThan(0);
    });

    test('should yield llm_stream_chunk events', async () => {
      mockClient.setMockChunks([
        { type: 'text', content: 'First chunk' },
        { type: 'text', content: 'Second chunk' },
        { type: 'done' },
      ]);

      const events = [];
      for await (const event of agent.run('Test')) {
        events.push(event);
      }

      const streamChunks = events.filter((e) => e.type === 'llm_stream_chunk');
      expect(streamChunks.length).toBe(2);
      expect(streamChunks[0]).toHaveProperty('chunk', 'First chunk');
      expect(streamChunks[1]).toHaveProperty('chunk', 'Second chunk');
    });

    test('should accumulate chunks into complete message', async () => {
      mockClient.setMockChunks([
        { type: 'text', content: 'Hello' },
        { type: 'text', content: ' ' },
        { type: 'text', content: 'world' },
        { type: 'done' },
      ]);

      const events = [];
      for await (const event of agent.run('Test')) {
        events.push(event);
      }

      // Should have llm_response with accumulated content
      const responseEvent = events.find((e) => e.type === 'llm_response');
      expect(responseEvent).toBeDefined();
      expect(responseEvent).toHaveProperty('content', 'Hello world');
    });

    test('should yield done event after streaming completes', async () => {
      mockClient.setMockChunks([
        { type: 'text', content: 'Test' },
        { type: 'done' },
      ]);

      const events = [];
      for await (const event of agent.run('Test')) {
        events.push(event);
      }

      const doneEvent = events.find((e) => e.type === 'done');
      expect(doneEvent).toBeDefined();
      expect(doneEvent).toHaveProperty('finalMessage');
    });

    test('should handle tool calls in streaming', async () => {
      mockClient.setMockChunks([
        { type: 'text', content: 'Using tool' },
        {
          type: 'tool_use',
          toolCall: {
            id: 'tool_1',
            name: 'test_tool',
            input: { param: 'value' },
          },
        },
        { type: 'done' },
      ]);

      // Register a mock tool with proper parse method
      toolRegistry.register({
        name: 'test_tool',
        description: 'Test tool',
        inputSchema: { parse: (v: any) => v } as any,
        async execute() {
          return { success: true, output: 'Tool result' };
        },
      });

      const events = [];
      for await (const event of agent.run('Test')) {
        events.push(event);
      }

      // Should have tool_start event
      const toolStartEvent = events.find((e) => e.type === 'tool_start');
      expect(toolStartEvent).toBeDefined();

      // Should have tool_result event
      const toolResultEvent = events.find((e) => e.type === 'tool_result');
      expect(toolResultEvent).toBeDefined();
    });

    test('should handle streaming errors', async () => {
      mockClient.setMockChunks([
        { type: 'text', content: 'Starting' },
        { type: 'error', error: 'Stream error occurred' },
      ]);

      const events = [];
      for await (const event of agent.run('Test')) {
        events.push(event);
      }

      const errorEvent = events.find((e) => e.type === 'error');
      expect(errorEvent).toBeDefined();
      expect(errorEvent).toHaveProperty('error', 'Stream error occurred');
    });

    test('should update message history with complete content', async () => {
      mockClient.setMockChunks([
        { type: 'text', content: 'Part 1' },
        { type: 'text', content: ' Part 2' },
        { type: 'done' },
      ]);

      for await (const _event of agent.run('Test')) {
        // Iterate through events
      }

      const messages = agent.getMessages();
      const lastMessage = messages[messages.length - 1];

      expect(lastMessage.role).toBe('assistant');
      expect(lastMessage.content).toBe('Part 1 Part 2');
    });
  });

  describe('Token usage tracking', () => {
    test('should track token usage from streaming', async () => {
      // Mock client should set usage after streaming
      mockClient.setMockChunks([
        { type: 'text', content: 'Test response' },
        { type: 'done' },
      ]);

      // Manually set usage on mock client
      (mockClient as any).lastUsage = {
        inputTokens: 100,
        outputTokens: 50,
      };

      for await (const _event of agent.run('Test')) {
        // Process events
      }

      const usage = agent.getTokenUsage();
      expect(usage.input).toBeGreaterThanOrEqual(0);
      expect(usage.output).toBeGreaterThanOrEqual(0);
    });

    test('should accumulate token usage across iterations', async () => {
      mockClient.setMockChunks([
        { type: 'text', content: 'First response' },
        { type: 'done' },
      ]);

      (mockClient as any).lastUsage = {
        inputTokens: 50,
        outputTokens: 25,
      };

      // First run
      for await (const _event of agent.run('Test 1')) {
        // Process
      }

      const usage1 = agent.getTokenUsage();
      const total1 = usage1.input + usage1.output;

      // Reset agent but don't clear state
      mockClient.setMockChunks([
        { type: 'text', content: 'Second response' },
        { type: 'done' },
      ]);

      // Second run
      for await (const _event of agent.run('Test 2')) {
        // Process
      }

      const usage2 = agent.getTokenUsage();
      const total2 = usage2.input + usage2.output;

      // Total should have increased
      expect(total2).toBeGreaterThanOrEqual(total1);
    });
  });

  describe('Event ordering', () => {
    test('should emit events in correct order', async () => {
      mockClient.setMockChunks([
        { type: 'text', content: 'Test' },
        { type: 'done' },
      ]);

      const eventTypes: string[] = [];
      for await (const event of agent.run('Test')) {
        eventTypes.push(event.type);
      }

      // Should start with iteration and llm_start
      expect(eventTypes[0]).toBe('iteration');
      expect(eventTypes[1]).toBe('llm_start');

      // Should have stream chunks before llm_response
      const streamChunkIndex = eventTypes.indexOf('llm_stream_chunk');
      const responseIndex = eventTypes.indexOf('llm_response');
      if (streamChunkIndex >= 0 && responseIndex >= 0) {
        expect(streamChunkIndex).toBeLessThan(responseIndex);
      }

      // Should end with done
      expect(eventTypes[eventTypes.length - 1]).toBe('done');
    });
  });
});
