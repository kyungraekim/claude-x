# Contributing to claude-x

Thank you for your interest in contributing to claude-x! This document provides guidelines for contributing to this project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

### Prerequisites

- **Bun 1.0+** (required) - https://bun.sh

Bun replaces Node.js and npm/pnpm in this project. Install it from [bun.sh](https://bun.sh).

### Initial Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/[username]/claude-x.git
   cd claude-x
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root:

   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Set up Git hooks** (if tooling is configured)

   ```bash
   bun run prepare
   ```

   This installs Husky hooks that run linting and tests before commits.

5. **Create a feature branch**

   ```bash
   git checkout -b feat/your-feature-name
   ```

## Monorepo Structure

This project uses Bun workspaces:

```
claude-x/
├── packages/
│   ├── core/         # Agent logic, LLM clients, tools (@claude-x/core)
│   └── cli/          # Terminal UI with ink/React (@claude-x/cli)
├── skills/           # Shared markdown skill files
└── docs/             # Documentation
```

### Where to Add Features

| Feature Type | Location |
|--------------|----------|
| New LLM provider (e.g., Claude, GPT, Ollama) | `packages/core/src/llm/` |
| New tool (e.g., bash, file operations) | `packages/core/src/tools/builtin/` |
| New skill (training guides, etc.) | `skills/` |
| UI component | `packages/cli/src/ui/components/` |
| Slash command | `packages/cli/src/commands/` |
| Utility function | `packages/core/src/utils/` |

### Package Dependencies

- **`@claude-x/core`**: No UI dependencies, pure logic
- **`@claude-x/cli`**: Depends on `@claude-x/core`, includes ink/React

## Development Workflow

### Running the CLI

```bash
# Run in development mode
bun run dev

# Or run directly with Bun
bun run packages/cli/src/index.tsx
```

### Building the Project

```bash
# Build all packages
bun run build

# Build specific package
bun run --cwd packages/core build
```

### Running Tests

This project uses **Bun's built-in test framework** (not Vitest or Jest).

```bash
# Run all tests
bun test

# Run tests for specific package
bun test packages/core

# Run specific test file
bun test packages/core/src/tools/bash.test.ts

# Run tests with coverage (if configured)
bun test --coverage
```

### Type Checking

```bash
# Type check all packages
bun run typecheck

# Type check specific package
bun run --cwd packages/core typecheck
```

### Linting and Formatting

Code is automatically linted and formatted on commit via pre-commit hooks (once set up). You can also run these commands manually:

```bash
# Lint all files
bun run lint

# Fix auto-fixable linting issues
bun run lint:fix

# Format all files
bun run format

# Check formatting without making changes
bun run format:check
```

## Making Changes

### Before You Start

1. **Check existing issues and pull requests** to avoid duplicate work
2. **Open an issue** to discuss significant changes before implementation
3. **Keep changes focused** - one feature or fix per pull request

### Code Requirements

All contributions must meet these requirements:

1. **Follow the style guide** - See [CODE_STYLE.md](./CODE_STYLE.md)
2. **Write tests** - All new features and bug fixes must include tests
3. **Update documentation** - Document new features and API changes
4. **Pass all checks** - Type checking, linting, formatting, and tests must pass
5. **Follow commit conventions** - See [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md)
6. **Cross-platform compatibility** - Code must work on Windows, macOS, and Linux

### Writing Tests

This project uses **Bun test** (not Vitest, not Jest).

#### Test Structure

- Place test files next to the code: `bash-tool.ts` → `bash-tool.test.ts`
- Or place in `tests/` directory mirroring source structure
- Use descriptive test names starting with "should"
- Follow the Arrange-Act-Assert pattern

#### Example Test

```typescript
import { describe, test, expect, beforeEach } from 'bun:test';
import { BashTool } from './bash-tool.js';

describe('BashTool', () => {
  describe('execute', () => {
    test('should execute simple command successfully', async () => {
      // Arrange
      const params = { command: 'echo "hello"' };

      // Act
      const result = await BashTool.execute(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.output).toContain('hello');
    });

    test('should handle command errors', async () => {
      // Arrange
      const params = { command: 'invalid-command-xyz' };

      // Act
      const result = await BashTool.execute(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

#### Bun Test Imports

Always import from `bun:test`, not `vitest` or `jest`:

```typescript
// ✅ Correct
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';

// ❌ Wrong
import { describe, it, expect } from 'vitest';
import { describe, it, expect } from 'jest';
```

### Cross-Platform Testing

This CLI tool must work on **Windows (PowerShell)**, **macOS (bash/zsh)**, and **Linux (bash)**.

#### Testing Guidelines

- **Use cross-platform utilities** from `packages/core/src/utils/shell.ts`
- **Test on Windows PowerShell** if possible
- **Be aware of differences**:
  - Path separators: `/` (Unix) vs `\` (Windows)
  - Line endings: `\n` (Unix) vs `\r\n` (Windows)
  - Shell commands: `ls` (Unix) vs `dir` (Windows)
  - Environment variables: `$HOME` (Unix) vs `%USERPROFILE%` (Windows)

#### Example: Cross-Platform Path Handling

```typescript
// ✅ Good - Uses utility functions
import { normalizePathForPlatform } from '@/utils/platform.js';

const userPath = normalizePathForPlatform('~/workspace');

// ❌ Bad - Hardcoded Unix paths
const userPath = '/home/user/workspace';  // Breaks on Windows!
```

### Adding Dependencies

Before adding a new dependency:

1. Check if existing dependencies can solve the problem
2. Verify the package is actively maintained
3. Check compatibility with Bun
4. Consider bundle size impact
5. Discuss in an issue if it's a significant addition

Add dependencies using Bun:

```bash
# Production dependency
bun add package-name

# Development dependency
bun add -D package-name

# Add to specific workspace package
cd packages/core
bun add package-name
```

## Submitting Changes

### Pull Request Process

1. **Update your branch** with the latest changes from main

   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Ensure all checks pass locally**

   ```bash
   bun run typecheck && bun run lint && bun test && bun run build
   ```

3. **Push your changes**

   ```bash
   git push origin feat/your-feature-name
   ```

4. **Open a pull request** on GitHub

### Pull Request Guidelines

Your pull request should:

- Have a clear, descriptive title following commit conventions
  - Example: `feat(agent): add retry logic for failed tool calls`
- Reference related issues (e.g., "Closes #123")
- Include a description of what changed and why
- Include screenshots for UI changes (terminal screenshots for CLI changes)
- Be ready for review (all checks passing)

### Pull Request Template

When opening a PR, include:

```markdown
## Description
Brief description of what this PR does

## Related Issues
Closes #123

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tested on macOS
- [ ] Tested on Linux
- [ ] Tested on Windows PowerShell

Describe the tests you added or how you tested this change

## Checklist
- [ ] My code follows the style guidelines ([CODE_STYLE.md](./CODE_STYLE.md))
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have tested on multiple platforms (or noted which platforms I tested)
```

## Code Review Process

### As a Contributor

- Respond to review feedback promptly
- Be open to suggestions and willing to make changes
- Ask questions if feedback is unclear
- Mark conversations as resolved once addressed
- Update the PR description if the scope changes

### As a Reviewer

- Be respectful and constructive
- Focus on the code, not the person
- Explain **why** changes are needed
- Suggest specific improvements when possible
- Approve PRs that meet quality standards

## Architecture Decisions

When making significant changes:

1. **Read [CLAUDE.md](../CLAUDE.md)** - Understand existing patterns
2. **Follow established conventions** - Registry pattern, event-driven design, etc.
3. **Maintain cross-platform support** - Test on all platforms
4. **Document new patterns** - Update CLAUDE.md if introducing new concepts

## Getting Help

- **Questions?** Open a discussion in GitHub Discussions or create an issue
- **Bugs?** Open an issue with reproduction steps
- **Feature ideas?** Open an issue to discuss before implementing

## Recognition

Contributors are recognized in:
- The project's README
- Release notes for significant contributions
- Git commit history

Thank you for contributing to claude-x!
