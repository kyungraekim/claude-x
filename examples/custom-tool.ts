/**
 * Custom tool example
 *
 * Demonstrates how to create and use a custom tool.
 */

import { z } from 'zod';
import type { Tool } from '../src/types/index.js';
import { Agent } from '../src/core/agent/agent.js';
import { ToolRegistry } from '../src/core/tools/registry.js';
import { createAnthropicClient } from '../src/core/llm/factory.js';

/**
 * Example: Git status tool
 *
 * A simple tool that runs git status in a repository.
 */
const GitStatusTool: Tool = {
  name: 'git_status',
  description: 'Get the current git status of a repository. Shows modified files, staged files, and branch information.',

  inputSchema: z.object({
    path: z.string().optional().describe('Path to git repository (default: current directory)'),
  }),

  async execute(params) {
    const { path = '.' } = params;

    try {
      // Import exec function
      const { exec } = await import('../src/utils/shell.js');

      // Run git status
      const output = await exec('git status --short --branch', {
        cwd: path,
      });

      return {
        success: true,
        output,
        metadata: {
          path,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        output: '',
        error: `Failed to get git status: ${errorMessage}`,
      };
    }
  },
};

/**
 * Example: Calculator tool
 *
 * A simple calculator that evaluates mathematical expressions.
 */
const CalculatorTool: Tool = {
  name: 'calculator',
  description: 'Evaluate a mathematical expression. Supports +, -, *, /, %, and parentheses.',

  inputSchema: z.object({
    expression: z.string().describe('Mathematical expression to evaluate (e.g., "2 + 2", "10 * (5 + 3)")'),
  }),

  async execute(params) {
    const { expression } = params;

    try {
      // Security: Only allow safe characters
      if (!/^[0-9+\-*/().\s%]+$/.test(expression)) {
        return {
          success: false,
          output: '',
          error: 'Expression contains invalid characters. Only numbers and operators (+, -, *, /, %, parentheses) are allowed.',
        };
      }

      // Evaluate expression (use Function constructor for safety)
      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${expression})`)();

      return {
        success: true,
        output: `${expression} = ${result}`,
        metadata: {
          expression,
          result,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        output: '',
        error: `Failed to evaluate expression: ${errorMessage}`,
      };
    }
  },
};

/**
 * Main example function
 */
async function main() {
  // Create LLM client
  const llm = createAnthropicClient(
    process.env.ANTHROPIC_API_KEY!,
    'claude-sonnet-4-20250514'
  );

  // Create tool registry
  const toolRegistry = new ToolRegistry();

  // Register custom tools
  toolRegistry.register(GitStatusTool);
  toolRegistry.register(CalculatorTool);

  console.log('Registered custom tools:', toolRegistry.getToolNames());

  // Create agent
  const agent = new Agent(llm, toolRegistry, {
    maxIterations: 10,
    tools: toolRegistry.getAll(),
    systemPrompt: 'You are a helpful assistant with access to git and calculator tools.',
  });

  // Run agent with a task
  console.log('\nRunning task: "What is 15 * 24?"\n');

  for await (const event of agent.run('What is 15 * 24?')) {
    if (event.type === 'llm_response') {
      console.log('Assistant:', event.content);
    } else if (event.type === 'tool_start') {
      console.log(`\nUsing tool: ${event.toolCall.name}`);
    } else if (event.type === 'tool_result') {
      console.log('Result:', event.result.output);
    }
  }

  console.log('\n---\n');

  // Reset agent for next task
  agent.reset();

  // Try git tool
  console.log('Running task: "Check git status"\n');

  for await (const event of agent.run('Check the git status of this repository')) {
    if (event.type === 'llm_response') {
      console.log('Assistant:', event.content);
    } else if (event.type === 'tool_start') {
      console.log(`\nUsing tool: ${event.toolCall.name}`);
    } else if (event.type === 'tool_result') {
      console.log('Result:', event.result.output);
    }
  }
}

// Run example
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
