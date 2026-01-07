# Task: Setup commitlint for Commit Message Validation

## Goal
Install commitlint to enforce conventional commit message format, ensuring consistent
and semantic commit history.

## Prerequisites
- Husky installed (Task 2.3)
- Understanding of conventional commits (see docs/COMMIT_CONVENTION.md)

## Background: Conventional Commits
Format: `<type>(<scope>): <subject>`

Examples:
- `feat(agent): add retry logic for failed tool calls`
- `fix(cli): resolve crash on empty input`
- `docs: update README with installation steps`

See `docs/COMMIT_CONVENTION.md` for complete guide.

## Steps

### 1. Install commitlint
```bash
bun add -D @commitlint/cli @commitlint/config-conventional
```

### 2. Create commitlint Configuration
Create `commitlint.config.js` at root:

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allowed types
    'type-enum': [2, 'always', [
      'feat',     // New feature
      'fix',      // Bug fix
      'docs',     // Documentation
      'style',    // Formatting, missing semicolons, etc.
      'refactor', // Code restructuring
      'perf',     // Performance improvement
      'test',     // Adding tests
      'build',    // Build system changes
      'ci',       // CI configuration
      'chore',    // Maintenance tasks
      'revert',   // Revert previous commit
    ]],
    // Subject should not start with uppercase (except proper nouns)
    'subject-case': [2, 'never', ['upper-case', 'pascal-case']],
    // Max length for entire header
    'header-max-length': [2, 'always', 100],
  },
};
```

### 3. Create commit-msg Hook
Create `.husky/commit-msg`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validate commit message
bun commitlint --edit $1
```

### 4. Make Hook Executable
```bash
chmod +x .husky/commit-msg
```

### 5. Test with Invalid Commit
Try to commit with a bad message:

```bash
git commit --allow-empty -m "Added new feature"
```

**Expected**: Should fail with error like:
```
⧗   input: Added new feature
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
```

### 6. Test with Valid Commit
```bash
git commit --allow-empty -m "test: verify commitlint works"
```

**Expected**: Should succeed with ✅

### 7. Test Different Types
Try these to understand the validation:

**Valid**:
```bash
git commit --allow-empty -m "feat: add new feature"
git commit --allow-empty -m "fix(core): resolve memory leak"
git commit --allow-empty -m "docs: update contributing guide"
```

**Invalid**:
```bash
git commit --allow-empty -m "added feature"           # No type
git commit --allow-empty -m "feat: Added feature"     # Uppercase subject
git commit --allow-empty -m "feature: add thing"      # Wrong type
```

### 8. Commit Setup
```bash
git add commitlint.config.js .husky/commit-msg
git commit -m "chore: add commitlint for commit message validation"
```

## Verification Checklist
- [ ] commitlint packages installed
- [ ] `commitlint.config.js` created
- [ ] `.husky/commit-msg` created and executable
- [ ] Invalid commits rejected (tested)
- [ ] Valid commits accepted (tested)
- [ ] Changes committed with proper format

## Troubleshooting

**Error: Cannot find module '@commitlint/config-conventional'**
- Run `bun install`

**Hook doesn't run**
- Check `.husky/commit-msg` is executable: `chmod +x .husky/commit-msg`
- Ensure Husky is initialized

**Need to skip validation (emergency)**
- Use `git commit --no-verify -m "message"`
- ⚠️ Only use when absolutely necessary

## Common Mistakes

### ❌ "feat: Added new feature"
**Problem**: Subject starts with uppercase
**Fix**: `feat: add new feature`

### ❌ "feature: add new feature"
**Problem**: Wrong type (should be "feat" not "feature")
**Fix**: `feat: add new feature`

### ❌ "feat add new feature"
**Problem**: Missing colon
**Fix**: `feat: add new feature`

### ❌ "feat: Add new feature implementation with lots of details that makes this message way too long"
**Problem**: Over 100 characters
**Fix**: Shorten or move details to commit body

## Reference
See `docs/COMMIT_CONVENTION.md` for:
- Complete list of types
- When to use each type
- Scopes
- Multi-line commits with body and footer
- Breaking changes format

## Next Steps
Congratulations! The tooling setup is complete. All commits will now:
1. Auto-format code (Prettier)
2. Check code quality (ESLint)
3. Validate types (TypeScript)
4. Validate commit messages (commitlint)
