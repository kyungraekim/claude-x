# CLAUDE.md - Development Guide for claude-x

This document provides context for AI assistants (like Claude) and developers working on this codebase.

## Project Overview

**claude-x** is a TypeScript-based AI coding agent CLI tool built with Bun, designed specifically for ML training environments. It features:

- Multi-provider LLM support (Anthropic Claude, OpenAI GPT)
- Cross-platform compatibility (Windows PowerShell, macOS/Linux bash)
- Skills-based system with environment-specific guides (local, Slurm, Kubernetes)
- Tool calling with built-in tools (bash, file operations, grep)
- Event-driven agentic loop with terminal UI (React/ink)

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   CLI Entry Point                    │
│                   (src/cli.tsx)                      │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼────┐   ┌───▼────┐   ┌───▼─────┐
    │   UI    │   │ Agent  │   │ Skills  │
    │ (ink)   │   │  Loop  │   │ System  │
    └─────────┘   └───┬────┘   └─────────┘
                      │
              ┌───────┼───────┐
              │       │       │
         ┌────▼──┐ ┌─▼────┐ ┌▼─────┐
         │  LLM  │ │Tools │ │Config│
         │Client │ │ Reg. │ │      │
         └───────┘ └──────┘ └──────┘
```

## The "Big 5" Critical Files

These five files form the backbone of the system. Understanding them is key to understanding the entire architecture:

### 1. `src/types/tool.ts` - Tool Interface

**Purpose**: Defines the contract for all tools in the system.

**Key Concepts**:
- Tools must implement the `Tool` interface
- Input validation uses Zod schemas (runtime validation + auto JSON Schema generation)
- Tools never throw - they always return `ToolResult` with success/error
- Metadata field for additional context

**Pattern**:
```typescript
const MyTool: Tool = {
  name: 'my_tool',
  description: 'What this tool does',
  inputSchema: z.object({ /* params */ }),
  async execute(params) {
    // Validate, execute, return result
    return { success: true, output: '...' };
  }
};
```

### 2. `src/core/llm/base.ts` - LLM Client Abstraction

**Purpose**: Provider-agnostic interface for LLM interactions.

**Key Concepts**:
- Abstract base class that Anthropic/OpenAI clients extend
- `sendMessage()` - non-streaming request/response
- `streamMessage()` - streaming (TODO: implement properly)
- `convertToolsToProviderFormat()` - Zod schema → provider-specific JSON Schema

**Why it matters**: Adding a new LLM provider means extending this class and implementing the abstract methods. The rest of the system doesn't need to know about provider differences.

### 3. `src/core/agent/agent.ts` - Agentic Loop

**Purpose**: The "brain" - orchestrates LLM calls, tool execution, and iteration.

**The Agentic Loop**:
```
1. Add user message
2. Loop (until max iterations):
   a. Call LLM with history + tools
   b. If response has tool calls:
      - Execute each tool
      - Add results to history
      - Continue loop (LLM processes results)
   c. If no tool calls:
      - Done
3. Return final response
```

**Event Streaming**: Uses AsyncGenerator to yield events (`llm_response`, `tool_start`, `tool_result`, `done`) for real-time UI updates.

**Why it matters**: This is where the magic happens. The agent decides when to use tools, when to stop, and manages the entire conversation flow.

### 4. `src/utils/shell.ts` - Cross-Platform Execution

**Purpose**: Handles Windows vs Unix shell differences.

**Key Concepts**:
- Windows: `powershell.exe -NoProfile -Command "..."`
- Unix: `/bin/bash -c "..."`
- Command escaping (different for PowerShell vs bash)
- Timeout handling, error capture

**Why it matters**: The bash tool is one of the most powerful capabilities. Getting cross-platform shell execution right is critical for the entire system to work on all platforms.

### 5. `src/cli.tsx` - Entry Point

**Purpose**: Wires everything together and provides CLI commands.

**Key Concepts**:
- Commander for CLI parsing
- Creates LLM client, tool registry, skills, agent
- Renders ink UI
- Commands: `init`, `chat`, `run`, `train`

**Why it matters**: This is where all components connect. Understanding this file shows how to initialize and use the system programmatically.

## Key Design Patterns

### 1. Provider Pattern (LLM Clients)

**Problem**: Different LLM providers (Anthropic, OpenAI) have different APIs.

**Solution**: Abstract `LLMClient` base class with provider-specific implementations.

**Benefits**:
- Easy to add new providers (extend base class)
- Agent doesn't care which provider is used
- Normalized response format

### 2. Registry Pattern (Tools)

**Problem**: Need dynamic tool discovery and execution.

**Solution**: `ToolRegistry` stores tools in a Map and provides lookup/execution.

**Benefits**:
- Tools can be added/removed at runtime
- Centralized validation (Zod schema parsing)
- Error handling in one place

### 3. Skills as Context Injection

**Problem**: Need environment-specific guidance without hardcoding.

**Solution**: Markdown files with metadata that get injected into system prompts.

**Pattern**:
```markdown
<!-- name: skill-name -->
<!-- triggers: /train, train model -->
<!-- environment: local -->

# Skill Content
{{WORKING_DIR}} - variable substitution
```

**Benefits**:
- Non-code configuration (easy to edit)
- Auto-detection via triggers
- Variable substitution for dynamic content

### 4. Event-Driven UI

**Problem**: Terminal UI needs real-time updates during agent execution.

**Solution**: Agent uses AsyncGenerator to yield events, UI consumes and updates state.

**Pattern**:
```typescript
for await (const event of agent.run(userMessage)) {
  if (event.type === 'llm_response') {
    updateUI(event.content);
  }
}
```

**Benefits**:
- Decoupled agent logic from UI
- Real-time feedback (spinners, progress)
- Easy to add new event types

### 5. Fail-Safe Tool Execution

**Problem**: Tool errors shouldn't crash the agent.

**Solution**: Tools return `ToolResult` (never throw), registry catches validation errors.

**Benefits**:
- Agent can continue after tool failures
- Clear error messages to LLM
- Graceful degradation

### 6. Slash Command System (UI Commands)

**Problem**: Need UI-level commands that execute instantly without LLM processing.

**Solution**: Command registry intercepts slash commands in Chat component before agent execution.

**Pattern**:
```typescript
// In Chat.tsx
const parsed = parseSlashCommand(userMessage);
if (parsed.isCommand) {
  const result = await commandRegistry.execute(
    parsed.command,
    parsed.args,
    { agent, setMessages, setStatusMessage }
  );
  // Display result immediately
}
```

**Implementation**:
1. **Command Parser** (`src/utils/command-parser.ts`): Detects `/command` patterns
2. **Command Registry** (`src/core/commands/registry.ts`): Manages command registration and execution
3. **Commands** (`src/core/commands/*.ts`): Implement `SlashCommand` interface
4. **Chat Integration** (`src/ui/components/Chat.tsx`): Intercepts before agent

**Benefits**:
- No token usage (free, instant)
- Direct UI manipulation (clear messages, export files, etc.)
- Extensible (easy to add new commands)
- Follows existing registry pattern
- Clear separation: UI commands vs Agent tools

**Current Commands**:
- `/export` - Export conversation history to markdown file

**Adding New Commands**:
```typescript
// 1. Create command file
export const MyCommand: SlashCommand = {
  name: 'mycommand',
  description: 'Does something useful',
  usage: '/mycommand [args]',
  async execute(args, context) {
    // Implementation
    return { success: true, message: 'Done!' };
  }
};

// 2. Register in Chat.tsx
registry.register(MyCommand);
```

## Code Conventions

### TypeScript

- **Strict mode enabled**: All type errors must be resolved
- **No implicit any**: Explicit types required
- **ESM modules**: Use `import/export`, not `require`
- **Path aliases**: Use `@/types`, `@/utils`, etc. (configured in tsconfig.json)

### Error Handling

- **Tools**: Return `{ success: false, error: '...' }` instead of throwing
- **Utilities**: Throw descriptive errors with context
- **CLI**: Catch errors and exit with non-zero code

### Cross-Platform

- **Paths**: Use `normalizePathForPlatform()` for user-provided paths
- **Shell**: Use `executeCommand()` from utils, not direct spawn
- **Line endings**: Be aware of CRLF (Windows) vs LF (Unix)

### Naming

- **Files**: kebab-case (e.g., `my-tool.ts`)
- **Classes**: PascalCase (e.g., `ToolRegistry`)
- **Functions**: camelCase (e.g., `executeCommand`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_CONFIG`)

### Comments

- **TODOs**: Mark unimplemented features with `// TODO:` and explanation
- **Complex logic**: Add comments explaining "why", not "what"
- **Public APIs**: JSDoc for functions/classes that will be used externally

## Development Workflow

### Adding a New Tool

1. Create file in `src/tools/` (e.g., `my-tool.ts`)
2. Define Zod schema for inputs
3. Implement `Tool` interface with `execute()` method
4. Export from `src/tools/index.ts` and add to `getDefaultTools()`
5. Test manually or add to `tests/tools/`

**Example**:
```typescript
import { z } from 'zod';
import type { Tool } from '../types/index.js';

export const MyTool: Tool = {
  name: 'my_tool',
  description: 'Does something useful',
  inputSchema: z.object({
    param: z.string(),
  }),
  async execute(params) {
    try {
      // Your logic here
      return { success: true, output: 'result' };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error.message,
      };
    }
  },
};
```

### Adding a New Skill

1. Create markdown file in `skills/` (e.g., `my-skill.md`)
2. Add metadata in HTML comments:
   ```markdown
   <!-- name: my-skill -->
   <!-- triggers: /myskill, my trigger phrase -->
   <!-- environment: generic -->

   # Skill content here
   Use {{WORKING_DIR}} for variables
   ```
3. Skills are auto-loaded by `SkillLoader`

### Adding a New LLM Provider

1. Create file in `src/core/llm/` (e.g., `my-provider.ts`)
2. Extend `LLMClient` base class
3. Implement abstract methods:
   - `sendMessage()`
   - `streamMessage()`
   - `convertToolsToProviderFormat()`
4. Add to factory in `src/core/llm/factory.ts`
5. Update `LLMProvider` type in `src/types/config.ts`

### Testing

**Run tests**:
```bash
bun test
```

**Run specific test**:
```bash
bun test tests/tools/bash.test.ts
```

**Type checking**:
```bash
bun run typecheck
```

## Known TODOs and Future Work

### High Priority

1. **Streaming LLM Responses** (`src/core/llm/anthropic.ts`, `openai.ts`)
   - Currently falls back to non-streaming
   - Need to properly implement AsyncGenerator streaming
   - Update UI to handle streaming chunks

2. **Conversation History Pruning** (`src/core/agent/agent.ts`)
   - Agent state grows unbounded
   - Need token counting and sliding window/summarization
   - Important for long conversations

3. **Tool Sandboxing** (`src/tools/bash.ts`)
   - Bash tool can execute arbitrary commands
   - Add command allow/deny lists
   - Path restrictions
   - Resource limits

### Medium Priority

4. **Rate Limiting and Retries** (`src/core/llm/base.ts`)
   - Handle API rate limits
   - Exponential backoff on errors
   - Retry logic for transient failures

5. **Parallel Tool Execution** (`src/core/tools/registry.ts`)
   - Currently executes tools sequentially
   - Some tools could run in parallel
   - Need dependency analysis

6. **Skill Hot-Reloading** (`src/core/skills/loader.ts`)
   - Watch skills directory for changes
   - Reload on file modification
   - Useful for development

### Low Priority

7. **Conversation Persistence** (`src/core/agent/agent.ts`)
   - Save/load conversation history
   - Resume previous sessions

8. **Plugin System**
   - Third-party tools and skills
   - Plugin discovery and loading

9. **Interactive Config Management**
   - CLI wizard for setup
   - Validate API keys

## Common Tasks and Recipes

### How to Debug a Tool

1. Add logging in `execute()`:
   ```typescript
   logger.debug('Tool input:', params);
   ```

2. Check tool result in agent events:
   ```typescript
   if (event.type === 'tool_result') {
     console.log('Tool output:', event.result);
   }
   ```

3. Test tool directly:
   ```typescript
   const result = await MyTool.execute({ param: 'test' });
   console.log(result);
   ```

### How to Add a CLI Command

1. Add command in `src/cli.tsx`:
   ```typescript
   program
     .command('mycommand')
     .description('Does something')
     .action(async () => {
       // Your logic
     });
   ```

2. Follows same pattern as existing commands

### How to Test Cross-Platform Behavior

1. Use `detectPlatform()` to check platform:
   ```typescript
   if (isWindows()) {
     // Windows-specific logic
   } else {
     // Unix logic
   }
   ```

2. Test shell commands:
   ```bash
   # Should work on all platforms
   bun run src/cli.tsx run "list files"
   ```

### How to Add Environment Variables

1. Add to `.env.example`
2. Add to `EnvVars` type in `src/types/config.ts`
3. Parse in `loadConfig()` in `src/utils/config.ts`
4. Update README.md

## Architecture Decisions

### Why Bun?

- Native TypeScript support (no transpilation needed)
- Fast startup time (important for CLI)
- Built-in test runner
- ESM-first

### Why ink for UI?

- React components for terminal
- Declarative UI updates
- Good integration with AsyncGenerator

### Why Zod for Schemas?

- Runtime validation + type inference
- Easy conversion to JSON Schema (for tool calling)
- Better error messages than plain TypeScript

### Why Skills as Markdown?

- Non-developers can edit
- Version control friendly
- Easy to read and maintain
- Supports rich formatting

### Why AsyncGenerator for Events?

- Natural streaming model
- Backpressure handling
- Works well with React state updates
- Easy to add new event types

## File Organization

```
src/
├── cli.tsx              # Entry point, CLI commands
├── constants.ts         # App-wide constants
├── types/               # TypeScript type definitions
├── utils/               # Cross-platform utilities
├── core/
│   ├── llm/            # LLM client implementations
│   ├── tools/          # Tool registry
│   ├── skills/         # Skills system
│   └── agent/          # Agentic loop
├── tools/              # Built-in tool implementations
└── ui/                 # Terminal UI components
```

**Rationale**:
- `core/` - Core abstractions (registry, base classes)
- `tools/` - Concrete tool implementations
- `utils/` - Shared utilities
- `types/` - Type-only files (imported everywhere)

## Testing Strategy

### What to Test

1. **Tools**: Input validation, execution, error handling
2. **Utilities**: Cross-platform behavior, edge cases
3. **LLM Clients**: Mock API responses, tool conversion
4. **Agent**: Event generation, iteration limits

### What Not to Test

- UI components (complex with ink, low value)
- Integration with real LLM APIs (too expensive/slow)
- Skills content (just markdown)

### Testing Tools

- **Bun test**: Fast, built-in
- **Mocking**: Use Bun's `mock()` for dependencies
- **Fixtures**: Create test data in `tests/fixtures/`

## Common Pitfalls

1. **Forgetting to normalize paths** - Always use `normalizePathForPlatform()` for user input
2. **Platform-specific shell commands** - Use cross-platform alternatives or detect platform
3. **Not handling tool errors** - Tools must return ToolResult, never throw
4. **Hardcoding line endings** - Use `getLineEnding()` for platform-specific
5. **Assuming bash exists on Windows** - Use `executeCommand()` which handles PowerShell

## Performance Considerations

1. **Token Usage**: LLM calls are expensive - minimize unnecessary calls
2. **File I/O**: Skills are loaded once at startup (could cache)
3. **Shell Execution**: Spawning processes has overhead - batch when possible
4. **Memory**: Conversation history grows - implement pruning for long sessions

## Security Considerations

1. **Arbitrary Code Execution**: Bash tool can run any command - needs sandboxing
2. **Path Traversal**: File tools should validate paths
3. **API Keys**: Never commit to version control, use .env
4. **Command Injection**: Escape shell arguments properly

## Contributing Guidelines

1. **Follow TypeScript strict mode** - No `any`, explicit types
2. **Add tests for new tools** - At least basic happy path
3. **Update CLAUDE.md** - Document new patterns or decisions
4. **Cross-platform** - Test on Windows if possible
5. **Commit messages** - Follow conventional commits (feat:, fix:, docs:)
6. **TODOs** - Mark incomplete work clearly

## Resources

- [Bun Documentation](https://bun.sh/docs)
- [ink Documentation](https://github.com/vadimdemedes/ink)
- [Anthropic API](https://docs.anthropic.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [Zod Documentation](https://zod.dev/)

## Questions?

When working on this codebase, ask yourself:

1. **Does this work cross-platform?** (Windows, macOS, Linux)
2. **Does this handle errors gracefully?** (No crashes)
3. **Is this testable?** (Can I write a test for this?)
4. **Does this follow the existing patterns?** (Registry, events, etc.)
5. **Is this documented?** (Comments, types, CLAUDE.md)

---

Last updated: 2026-01-02
Version: 1.0.0 (Initial release)
