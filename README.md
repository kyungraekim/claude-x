# claude-code-ts

A TypeScript-based AI coding agent CLI tool built with Bun, designed for ML training environments. Features a skills-based system for different computing environments (local, Slurm, Kubernetes) and supports multiple LLM providers.

## Features

- **Multi-Provider LLM Support**: Works with Anthropic (Claude) and OpenAI (GPT) APIs
- **Skills-Based System**: Environment-specific guides for ML training workflows
- **Cross-Platform**: Windows (PowerShell), macOS, and Linux (bash/zsh)
- **Tool Calling**: Built-in tools for file operations, shell execution, and code search
- **Terminal UI**: Interactive chat interface using React/ink
- **Extensible**: Easy to add custom tools and skills

## Architecture

```
┌─────────────────┐
│   Terminal UI   │  (React/ink)
│   (Chat/CLI)    │
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Agent   │  (Agentic Loop)
    └────┬─────┘
         │
    ┌────▼──────────────────────┐
    │                           │
┌───▼────┐  ┌────▼─────┐  ┌────▼─────┐
│  LLM   │  │  Tools   │  │  Skills  │
│ Client │  │ Registry │  │  System  │
└────────┘  └──────────┘  └──────────┘
```

### Core Components

1. **LLM Client Abstraction**: Provider-agnostic interface for Anthropic and OpenAI
2. **Tool System**: Registry pattern with Zod validation for bash, file ops, search
3. **Skills System**: Markdown-based guides with environment detection
4. **Agentic Loop**: Tool calling with iteration limits and event streaming
5. **Cross-Platform Support**: Windows PowerShell and Unix shell execution

## Installation

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- API key from Anthropic or OpenAI

### Install from source

```bash
# Clone the repository
git clone <your-repo-url>
cd claude-code-ts

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Build
bun run build

# Link globally (optional)
bun link

# Run
claude-code-ts chat
```

### Install globally (when published)

```bash
bun install -g claude-code-ts
```

## Quick Start

### Interactive Chat

```bash
claude-code-ts chat
```

Starts an interactive chat session with the AI agent. The agent has access to tools for file operations, shell commands, and more.

### One-Shot Task

```bash
claude-code-ts run "create a Python training script for MNIST"
```

Execute a single task and exit.

### Training Mode

```bash
claude-code-ts train "train a ResNet model on ImageNet with 4 GPUs"
```

Activates training-specific skills and guides based on your environment (local, Slurm, Kubernetes).

### Initialize Configuration

```bash
claude-code-ts init
```

Sets up configuration files and default skills in `~/.claude-code-ts/`.

## Configuration

Configuration is loaded from multiple sources (in order of priority):

1. Environment variables
2. `.env` file in project root
3. `~/.claude-code-ts/config.json`
4. Default values

### Key Configuration Options

- `DEFAULT_LLM_PROVIDER`: Choose between "anthropic" or "openai"
- `DEFAULT_MODEL`: Specific model to use
- `SKILLS_DIR`: Location of skill markdown files
- `WORKSPACE_DIR`: Scratch space for agent operations
- `MAX_ITERATIONS`: Limit for agentic loop iterations

## Skills System

Skills are markdown files that provide environment-specific guidance to the agent.

### Built-in Skills

- **train-local**: Local GPU training with Python
- **train-slurm**: Training on Slurm clusters (sbatch, squeue)
- **train-kubernetes**: Training with Kubernetes Jobs
- **debug**: Debugging workflows and log analysis

### Skill Format

```markdown
<!-- name: train-local -->
<!-- triggers: /train, train model, start training -->
<!-- environment: local -->

# Local Model Training Guide

You are helping with local ML training.

## Steps:
1. Check GPU availability (nvidia-smi)
2. Set up virtual environment
3. Install dependencies
4. Run training script

## Variables:
- Working directory: {{WORKING_DIR}}
- Platform: {{PLATFORM}}
```

### Creating Custom Skills

1. Create a markdown file in `~/.claude-code-ts/skills/`
2. Add metadata using HTML comments
3. Use `{{VARIABLE}}` syntax for dynamic content

## Tool System

Built-in tools available to the agent:

### bash
Execute shell commands (cross-platform).

```typescript
{
  command: "nvidia-smi",
  workingDir: "/path/to/dir" // optional
}
```

### read
Read file contents.

```typescript
{
  path: "/path/to/file.txt"
}
```

### write
Write content to a file.

```typescript
{
  path: "/path/to/file.txt",
  content: "file contents"
}
```

### grep
Search files for patterns.

```typescript
{
  pattern: "import.*torch",
  path: "src/",
  glob: "**/*.py" // optional
}
```

## Development

### Project Structure

```
claude-code-ts/
├── src/
│   ├── cli.tsx              # CLI entry point
│   ├── constants.ts         # Default values
│   ├── types/               # TypeScript interfaces
│   ├── utils/               # Cross-platform helpers
│   ├── core/
│   │   ├── llm/            # LLM client abstraction
│   │   ├── tools/          # Tool registry
│   │   ├── skills/         # Skills system
│   │   └── agent/          # Agentic loop
│   ├── tools/              # Built-in tools
│   └── ui/                 # Terminal UI (ink)
├── skills/                 # Default skills
├── examples/               # Usage examples
└── tests/                  # Test files
```

### Adding a Custom Tool

```typescript
import { z } from 'zod';
import type { Tool } from '@/types/tool';

export const MyTool: Tool = {
  name: 'my_tool',
  description: 'Does something useful',
  inputSchema: z.object({
    param: z.string(),
  }),
  async execute(params) {
    // Your implementation
    return {
      success: true,
      output: 'Result',
    };
  },
};
```

### Running Tests

```bash
bun test
```

### Type Checking

```bash
bun run typecheck
```

## Cross-Platform Notes

### Windows
- Uses PowerShell for shell commands
- Paths use backslashes but are normalized internally
- Some commands may differ (e.g., `dir` vs `ls`)

### macOS/Linux
- Uses bash or zsh for shell commands
- Standard Unix paths and commands

The agent automatically detects the platform and adjusts tool behavior accordingly.

## TODO / Future Enhancements

The following features are marked as TODOs in the codebase:

- [ ] Rate limiting and retry logic for LLM API calls
- [ ] Conversation history pruning and token management
- [ ] Tool sandboxing and security restrictions
- [ ] Streaming LLM responses in terminal UI
- [ ] Parallel tool execution
- [ ] Advanced error recovery
- [ ] Skill hot-reloading
- [ ] Conversation persistence (save/load)
- [ ] Plugin system for third-party tools
- [ ] Interactive config management UI

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Maintain cross-platform compatibility
2. Add tests for new features
3. Use TypeScript strict mode
4. Follow the existing code structure

## License

MIT

## Support

For issues and questions:
- File an issue on GitHub
- Check existing issues for solutions

---

Built with ❤️ using Bun and TypeScript
