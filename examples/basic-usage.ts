/**
 * Basic usage example
 *
 * Demonstrates programmatic usage of claude-code-ts without the CLI.
 */

import { Agent } from '../src/core/agent/agent.js';
import { ToolRegistry } from '../src/core/tools/registry.js';
import { createAnthropicClient } from '../src/core/llm/factory.js';
import { getDefaultTools } from '../src/tools/index.js';

/**
 * Main example function
 */
async function main() {
  // 1. Create LLM client
  const llm = createAnthropicClient(
    process.env.ANTHROPIC_API_KEY!,
    'claude-sonnet-4-20250514',
    4096,
    0.7
  );

  console.log('Created LLM client');

  // 2. Create tool registry and register tools
  const toolRegistry = new ToolRegistry();
  toolRegistry.registerAll(getDefaultTools());

  console.log(`Registered ${toolRegistry.getAll().length} tools`);

  // 3. Create agent
  const agent = new Agent(llm, toolRegistry, {
    maxIterations: 10,
    tools: toolRegistry.getAll(),
    systemPrompt: 'You are a helpful AI assistant with access to file and shell tools.',
  });

  console.log('Created agent\n');

  // 4. Run agent with a task
  console.log('Running task: "List files in current directory"\n');

  for await (const event of agent.run('List files in the current directory')) {
    switch (event.type) {
      case 'llm_response':
        console.log('Assistant:', event.content);
        break;

      case 'tool_start':
        console.log(`\nExecuting tool: ${event.toolCall.name}`);
        console.log('Parameters:', JSON.stringify(event.toolCall.input, null, 2));
        break;

      case 'tool_result':
        console.log(`Tool result (${event.result.success ? 'success' : 'failed'}):`);
        console.log(event.result.output);
        break;

      case 'done':
        console.log('\n✓ Task completed');
        break;

      case 'error':
        console.error('\n✗ Error:', event.error);
        break;
    }
  }

  // 5. Show token usage
  const usage = agent.getTokenUsage();
  console.log(`\nToken usage: ${usage.input} input, ${usage.output} output`);
}

// Run example
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
