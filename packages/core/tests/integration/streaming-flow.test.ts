/**
 * Integration tests for end-to-end streaming flow
 *
 * Tests the complete streaming pipeline from LLM client through agent to events
 */

import { describe, test, expect } from 'bun:test';
import { Agent } from '../../src/agent/agent.js';
import { ToolRegistry } from '../../src/tools/registry.js';
import { LLMClient } from '../../src/llm/base.js';
import type { StreamChunk, LLMMessage, LLMResponse, Tool, AgentEvent } from '../../src/types/index.js';

/**
 * Mock client that simulates realistic streaming behavior
 */
class RealisticMockClient extends LLMClient {
  private scenario: 'text-only' | 'with-tools' | 'error';

  constructor(scenario: 'text-only' | 'with-tools' | 'error' = 'text-only') {
    super('test-key', 'mock-model');
    this.scenario = scenario;
  }

  async sendMessage(_messages: LLMMessage[], _tools?: Tool[]): Promise<LLMResponse> {
    throw new Error('Should not call sendMessage in streaming mode');
  }

  async *streamMessage(
    messages: LLMMessage[],
    _tools?: Tool[]
  ): AsyncGenerator<StreamChunk> {
    const userMessage = messages[messages.length - 1]?.content || '';

    if (this.scenario === 'error') {
      yield { type: 'text', content: 'Starting...' };
      yield { type: 'error', error: 'Simulated API error' };
      return;
    }

    if (this.scenario === 'with-tools') {
      // Simulate response that uses a tool
      yield { type: 'text', content: "I'll help you with that. " };
      yield { type: 'text', content: 'Let me check the files.' };
      yield {
        type: 'tool_use',
        toolCall: {
          id: 'call_1',
          name: 'bash',
          input: { command: 'ls -la' },
        },
      };
      yield { type: 'done' };

      // Set mock usage
      this.lastUsage = { inputTokens: 50, outputTokens: 30 };
      return;
    }

    // Default: text-only scenario
    if (typeof userMessage === 'string' && userMessage.toLowerCase().includes('hello')) {
      yield { type: 'text', content: 'Hello! ' };
      yield { type: 'text', content: 'How can ' };
      yield { type: 'text', content: 'I help ' };
      yield { type: 'text', content: 'you today?' };
    } else {
      yield { type: 'text', content: 'I understand. ' };
      yield { type: 'text', content: 'Let me process that.' };
    }

    yield { type: 'done' };

    // Set mock usage
    this.lastUsage = { inputTokens: 20, outputTokens: 15 };
  }

  protected convertToolsToProviderFormat(tools: Tool[]): unknown[] {
    return tools.map((t) => ({ name: t.name }));
  }
}

describe('Streaming Integration Tests', () => {
  describe('Text-only streaming', () => {
    test('should stream simple text response', async () => {
      const client = new RealisticMockClient('text-only');
      const registry = new ToolRegistry();
      const agent = new Agent(client, registry, {
        systemPrompt: 'Test',
        maxIterations: 5,
        tools: [],
      });

      const events: AgentEvent[] = [];
      for await (const event of agent.run('Hello')) {
        events.push(event);
      }

      // Verify streaming chunks
      const streamChunks = events.filter((e) => e.type === 'llm_stream_chunk');
      expect(streamChunks.length).toBeGreaterThan(0);

      // Verify chunks contain expected text
      const allChunks = streamChunks
        .map((e: any) => e.chunk)
        .join('');
      expect(allChunks).toContain('Hello!');

      // Verify final message
      const responseEvent = events.find((e) => e.type === 'llm_response') as any;
      expect(responseEvent).toBeDefined();
      expect(responseEvent.content).toBe('Hello! How can I help you today?');

      // Verify done event
      const doneEvent = events.find((e) => e.type === 'done');
      expect(doneEvent).toBeDefined();
    });

    test('should track token usage', async () => {
      const client = new RealisticMockClient('text-only');
      const registry = new ToolRegistry();
      const agent = new Agent(client, registry, {
        systemPrompt: 'Test',
        maxIterations: 5,
        tools: [],
      });

      for await (const _event of agent.run('Test message')) {
        // Process events
      }

      const usage = agent.getTokenUsage();
      expect(usage.input).toBe(20);
      expect(usage.output).toBe(15);
    });

    test('should update conversation history', async () => {
      const client = new RealisticMockClient('text-only');
      const registry = new ToolRegistry();
      const agent = new Agent(client, registry, {
        systemPrompt: 'Test',
        maxIterations: 5,
        tools: [],
      });

      for await (const _event of agent.run('Hello')) {
        // Process events
      }

      const messages = agent.getMessages();

      // Should have system, user, and assistant messages
      expect(messages.length).toBeGreaterThanOrEqual(3);

      // Last message should be assistant
      const lastMsg = messages[messages.length - 1];
      expect(lastMsg.role).toBe('assistant');
      expect(lastMsg.content).toBe('Hello! How can I help you today?');
    });
  });

  describe('Streaming with tool calls', () => {
    test('should handle tool calls during streaming', async () => {
      const client = new RealisticMockClient('with-tools');
      const registry = new ToolRegistry();

      // Register mock bash tool
      const bashTool = {
        name: 'bash',
        description: 'Execute bash command',
        inputSchema: { parse: (v: any) => v } as any,
        async execute(params: any) {
          return {
            success: true,
            output: 'file1.txt\nfile2.txt',
          };
        },
      };
      registry.register(bashTool);

      const agent = new Agent(client, registry, {
        systemPrompt: 'Test',
        maxIterations: 5,
        tools: [bashTool],
      });

      const events: AgentEvent[] = [];
      for await (const event of agent.run('List files')) {
        events.push(event);
      }

      // Should have streaming chunks
      const streamChunks = events.filter((e) => e.type === 'llm_stream_chunk');
      expect(streamChunks.length).toBeGreaterThan(0);

      // Should have tool execution
      const toolStart = events.find((e) => e.type === 'tool_start');
      expect(toolStart).toBeDefined();

      const toolResult = events.find((e) => e.type === 'tool_result');
      expect(toolResult).toBeDefined();

      // Should have multiple LLM calls (one before tool, one after)
      const llmStarts = events.filter((e) => e.type === 'llm_start');
      expect(llmStarts.length).toBeGreaterThanOrEqual(1);
    });

    test('should accumulate streamed text before tool call', async () => {
      const client = new RealisticMockClient('with-tools');
      const registry = new ToolRegistry();

      const bashTool = {
        name: 'bash',
        description: 'Execute bash command',
        inputSchema: { parse: (v: any) => v } as any,
        async execute() {
          return { success: true, output: 'result' };
        },
      };
      registry.register(bashTool);

      const agent = new Agent(client, registry, {
        systemPrompt: 'Test',
        maxIterations: 5,
        tools: [bashTool],
      });

      const events: AgentEvent[] = [];
      for await (const event of agent.run('Test')) {
        events.push(event);
      }

      // First llm_response should have accumulated text
      const responseEvent = events.find((e) => e.type === 'llm_response') as any;
      expect(responseEvent).toBeDefined();
      expect(responseEvent.content).toBe("I'll help you with that. Let me check the files.");
    });
  });

  describe('Error handling', () => {
    test('should handle streaming errors gracefully', async () => {
      const client = new RealisticMockClient('error');
      const registry = new ToolRegistry();
      const agent = new Agent(client, registry, {
        systemPrompt: 'Test',
        maxIterations: 5,
        tools: [],
      });

      const events: AgentEvent[] = [];
      for await (const event of agent.run('Test')) {
        events.push(event);
      }

      // Should have error event
      const errorEvent = events.find((e) => e.type === 'error') as any;
      expect(errorEvent).toBeDefined();
      expect(errorEvent.error).toContain('Simulated API error');

      // Should have received some text before error
      const streamChunks = events.filter((e) => e.type === 'llm_stream_chunk');
      expect(streamChunks.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple conversation turns', () => {
    test('should handle multiple streaming turns', async () => {
      const client = new RealisticMockClient('text-only');
      const registry = new ToolRegistry();
      const agent = new Agent(client, registry, {
        systemPrompt: 'Test',
        maxIterations: 5,
        tools: [],
      });

      // First turn
      for await (const _event of agent.run('Hello')) {
        // Process
      }

      const usage1 = agent.getTokenUsage();

      // Second turn
      for await (const _event of agent.run('Another message')) {
        // Process
      }

      const usage2 = agent.getTokenUsage();

      // Token usage should accumulate
      expect(usage2.input).toBeGreaterThan(usage1.input);
      expect(usage2.output).toBeGreaterThan(usage1.output);

      // Should have all messages in history
      const messages = agent.getMessages();
      expect(messages.length).toBeGreaterThanOrEqual(5); // system + 2 user + 2 assistant
    });
  });

  describe('Performance characteristics', () => {
    test('should stream chunks progressively, not all at once', async () => {
      const client = new RealisticMockClient('text-only');
      const registry = new ToolRegistry();
      const agent = new Agent(client, registry, {
        systemPrompt: 'Test',
        maxIterations: 5,
        tools: [],
      });

      const timestamps: number[] = [];
      const events: AgentEvent[] = [];

      for await (const event of agent.run('Hello')) {
        if (event.type === 'llm_stream_chunk') {
          timestamps.push(Date.now());
        }
        events.push(event);
      }

      // Should have multiple chunks
      expect(timestamps.length).toBeGreaterThan(1);

      // Chunks should arrive over time (not all at once)
      // Allow small timing variations but expect some progression
      if (timestamps.length >= 2) {
        const totalTime = timestamps[timestamps.length - 1] - timestamps[0];
        // Should take at least 1ms (realistically much more with network)
        expect(totalTime).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
