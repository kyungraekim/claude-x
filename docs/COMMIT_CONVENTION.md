# Commit Message Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification, based on the [Angular commit convention](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit).

## Why Follow This Convention?

- **Automated changelog generation** - Tools can parse commits to generate release notes
- **Semantic versioning** - Commit types determine version bumps automatically
- **Clear history** - Consistent format makes browsing history easier
- **Better collaboration** - Team members understand changes at a glance
- **Tooling integration** - Works with release automation

## Commit Message Format

Each commit message consists of a **header**, optional **body**, and optional **footer**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Header

The header is **mandatory** and must conform to this format:

```
<type>(<scope>): <subject>
```

#### Type

The type must be one of the following:

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | A new feature | MINOR |
| `fix` | A bug fix | PATCH |
| `docs` | Documentation only changes | - |
| `style` | Changes that don't affect code meaning (whitespace, formatting, etc.) | - |
| `refactor` | Code change that neither fixes a bug nor adds a feature | - |
| `perf` | Code change that improves performance | PATCH |
| `test` | Adding missing tests or correcting existing tests | - |
| `build` | Changes that affect the build system or external dependencies | - |
| `ci` | Changes to CI configuration files and scripts | - |
| `chore` | Other changes that don't modify src or test files | - |
| `revert` | Reverts a previous commit | - |

**Notes:**
- `feat` and `fix` trigger version bumps in semantic versioning
- `perf` improvements are treated as patches
- Breaking changes can be any type with `BREAKING CHANGE:` in footer

#### Scope

The scope is **optional** and specifies what part of the codebase is affected:

**Common scopes for claude-x:**
- `agent` - Agent loop and orchestration
- `llm` - LLM client implementations (Anthropic, OpenAI, Ollama)
- `tools` - Tool registry or specific tools
- `skills` - Skills system and skill files
- `cli` - CLI interface and commands
- `ui` - Terminal UI components (ink/React)
- `core` - Core package (@claude-x/core)
- `config` - Configuration handling
- Specific tool names: `bash`, `grep`, `read`, `write`
- Specific components: `chat`, `spinner`, `message-list`

**Examples:**
```
feat(agent): add retry logic for failed tool calls
fix(llm): resolve streaming response timeout
docs(skills): update training guide for Slurm
refactor(tools): extract common validation logic
```

**For multiple scopes**, use comma separation:
```
feat(agent,tools): add parallel tool execution support
```

**If no specific scope**, omit the parentheses:
```
docs: update contributing guidelines
chore: bump dependencies
```

#### Subject

The subject contains a succinct description of the change:

- Use **imperative, present tense**: "change" not "changed" nor "changes"
- **Don't capitalize** the first letter
- **No period (.)** at the end
- **Maximum 72 characters** (ideally 50)

**✅ Good examples:**
```
fix: resolve memory leak in event listeners
feat: add dark mode support
docs: clarify API usage examples
```

**❌ Bad examples:**
```
fix: Fixed the bug                    // Past tense
feat: Added support for dark mode     // Past tense
docs: Update documentation.           // Capitalized + period
fix: This commit fixes a memory leak that was causing problems  // Too long
```

### Body

The body is **optional** and should include:

- Motivation for the change
- Contrast with previous behavior
- Implementation details (if complex)

**Rules:**
- Use imperative, present tense
- Wrap at 72 characters
- Separate from header with a blank line

**Example:**
```
feat(agent): implement automatic retry for transient failures

The agent now retries tool executions that fail due to network
timeouts or rate limits. This improves reliability when working
with unreliable LLM APIs or external tools.

Retry behavior:
- Exponential backoff starting at 1 second
- Maximum 3 retries per tool call
- Only retries transient errors (timeouts, 429, 503)
```

### Footer

The footer is **optional** and should contain:

- **Breaking changes** - Start with `BREAKING CHANGE:` followed by description
- **Issue references** - Reference fixed issues with `Closes`, `Fixes`, or `Resolves`
- **Pull request references** - Reference PRs if applicable

**Rules:**
- Separate from body with a blank line
- Can have multiple footers

**Examples:**

```
fix(llm): change tool response format for better type safety

BREAKING CHANGE: Tool responses now use a structured format with
`success` and `error` fields. Update tool implementations to return
the new format.

Closes #123
```

```
feat(ui): add keyboard shortcuts for message navigation

Implements arrow key navigation for the message list.

Closes #456
Closes #789
Refs #321
```

## Complete Examples

### Simple Feature

```
feat(tools): add grep tool for searching file contents
```

### Bug Fix with Details

```
fix(agent): prevent infinite loop on tool execution timeout

When a tool execution timed out, the agent would retry
indefinitely. This adds a maximum retry limit of 3 attempts
and surfaces the timeout error to the user.

Fixes #234
```

### Breaking Change

```
feat(llm): redesign LLM client interface

BREAKING CHANGE: The `sendMessage` method now returns a Promise
instead of an AsyncGenerator. Use `streamMessage` for streaming
responses.

Migration guide:
- Replace `sendMessage()` with `streamMessage()` for streaming
- Update error handling to catch promise rejections
- Remove manual iteration logic (no longer needed)

Closes #567
```

### Documentation Update

```
docs: add examples for creating custom tools
```

### Performance Improvement

```
perf(agent): improve message history pruning

Optimizes the pruning algorithm to run in O(n) instead of O(n²)
by using a sliding window approach.

Benchmark results show 60% improvement for conversations with
over 100 messages.
```

### Refactoring

```
refactor(tools): extract common shell execution logic

Moves repeated error handling and timeout logic into a shared
utility to reduce duplication across bash, git, and npm tools.
```

### Reverting a Commit

```
revert: feat(ui): add real-time streaming display

This reverts commit a1b2c3d4.

Reason: The streaming display causes flickering in some terminals.
Reverting until we can implement a proper buffering system.
```

## Type-Specific Guidelines

### feat (Features)

- Describe **what** the feature does, not **how** it works
- Focus on **user value** in the subject
- Include implementation details in the body if needed

```
✅ feat(skills): add Kubernetes training guide
✅ feat(llm): support Ollama local models
❌ feat: add new function to parser class          // Too technical
❌ feat: update code                               // Too vague
```

### fix (Bug Fixes)

- Describe **what was broken** and **how it's fixed**
- Reference the issue number when available
- Include reproduction steps in body for complex bugs

```
✅ fix(tools): prevent bash tool from hanging on long outputs
✅ fix(agent): handle null responses from LLM gracefully
❌ fix: bug fix                                    // Too vague
❌ fix: update validation                          // Use "fix(validation): correct email validation"
```

### docs (Documentation)

- Be specific about **what** was documented
- No need to mention "documentation" in the subject

```
✅ docs: add cross-platform testing guide
✅ docs(readme): update installation steps for Windows
❌ docs: update docs                               // Too vague
❌ docs: add documentation for new feature         // Be more specific
```

### style (Formatting)

- Only for formatting changes (whitespace, indentation, etc.)
- **Not** for UI styling changes (use `feat` or `fix` instead)

```
✅ style: format files with prettier
✅ style: remove trailing whitespace
❌ style(ui): change button color                  // Use feat or fix
```

### refactor (Code Refactoring)

- Describe **what** was refactored
- Emphasize that behavior hasn't changed
- Include performance impact if significant

```
✅ refactor(agent): simplify event generation logic
✅ refactor: extract user validation into separate service
❌ refactor: improve code                          // Too vague
```

### test (Tests)

- Describe **what** is being tested
- Mention coverage improvement if significant

```
✅ test(tools): add tests for cross-platform path handling
✅ test: increase coverage for edge cases
❌ test: add tests                                 // Too vague
```

### build & ci

- For changes to build configuration, dependencies, or CI pipelines
- Be specific about what changed

```
✅ build: upgrade bun to 1.1.0
✅ build(deps): bump typescript from 5.0 to 5.1
❌ build: update                                   // Too vague
```

### chore (Maintenance)

- For routine tasks that don't fit other categories
- Use sparingly—most changes fit another type

```
✅ chore: update copyright year
✅ chore: remove deprecated config files
✅ chore(deps): update development dependencies
```

## Multi-Line Commit Messages

When composing with `git commit` (no `-m` flag), structure your message like this:

```
feat(agent): add context window management

Implements automatic pruning of message history when approaching
the model's context limit. This prevents token limit errors and
improves performance for long conversations.

Technical details:
- Uses token counting to estimate context usage
- Prunes oldest messages first, preserving system prompt
- Adds warning when context is >80% full

Closes #123
```

## Commit Message Hooks

This project uses [commitlint](https://commitlint.js.org/) to enforce these conventions. When you commit:

1. **Husky** runs the pre-commit hook
2. **commitlint** validates your message
3. **If invalid**, the commit is rejected with an explanation

**Example validation error:**
```
⧗   input: bad: this is a bad commit message
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]

✖   found 2 problems, 0 warnings
```

## Tips for Writing Good Commits

### Do

- ✅ Make atomic commits (one logical change per commit)
- ✅ Write in present tense imperative mood
- ✅ Reference issues and PRs
- ✅ Include context in the body for complex changes
- ✅ Use breaking change footer when changing public APIs

### Don't

- ❌ Mix unrelated changes in one commit
- ❌ Write "WIP" or "tmp" commits (squash them before pushing)
- ❌ Use vague subjects like "fix bug" or "update code"
- ❌ Include implementation details in the subject
- ❌ Forget to update tests and docs in the same commit

## Amending Commits

If you need to fix your last commit message:

```bash
git commit --amend
```

If you've already pushed:

```bash
git commit --amend
git push --force-with-lease
```

**⚠️ Warning:** Only force-push to branches you own. Never force-push to shared branches like `main`.

## Interactive Rebase

To fix older commits or combine multiple commits:

```bash
# Rebase last 3 commits
git rebase -i HEAD~3

# In the editor:
# - Change 'pick' to 'reword' to change message
# - Change 'pick' to 'squash' to combine commits
# - Change 'pick' to 'edit' to modify commit
```

## Checking Commit Messages

To validate your message before committing:

```bash
echo "feat(agent): add retry logic" | bun commitlint --verbose
```

To check all commits in a branch:

```bash
bun commitlint --from=main --to=HEAD --verbose
```

## Tools and Automation

This project uses these tools to enforce conventions:

- **[Husky](https://typicode.github.io/husky/)** - Git hooks manager
- **[commitlint](https://commitlint.js.org/)** - Validates commit messages
- **[@commitlint/config-conventional](https://github.com/conventional-changelog/commitlint)** - Conventional Commits rules

## Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [Semantic Versioning](https://semver.org/)
- [commitlint Documentation](https://commitlint.js.org/)

---

**Remember:** Good commit messages are part of good documentation. They help your future self and your teammates understand the evolution of the codebase.
