# Task: Setup Husky and Git Hooks

## Goal
Install Husky to run automated checks before commits (pre-commit hook) and validate
commit messages (commit-msg hook).

## Prerequisites
- Prettier installed (Task 2.1)
- ESLint installed (Task 2.2)
- Git repository initialized

## Background: What are Git Hooks?
Git hooks are scripts that run automatically at certain points in the git workflow:
- **pre-commit**: Runs before a commit is created (lint, format, test)
- **commit-msg**: Validates the commit message format

## Steps

### 1. Install Husky and lint-staged
```bash
bun add -D husky lint-staged
```

**What is lint-staged?**
It runs commands only on staged files (faster than checking entire codebase).

### 2. Initialize Husky
```bash
bun husky init
```

This creates `.husky/` directory with example hooks.

### 3. Create Pre-Commit Hook
Edit `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Run lint-staged (format and lint staged files)
bun lint-staged || exit 1

# Run type checking
echo "Type checking..."
bun run typecheck || exit 1

echo "✅ Pre-commit checks passed!"
```

### 4. Make Hook Executable
```bash
chmod +x .husky/pre-commit
```

### 5. Configure lint-staged
Add to root `package.json`:

```json
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
```

### 6. Add prepare Script
Add to root `package.json` scripts:

```json
"prepare": "husky"
```

This ensures Husky installs hooks when someone runs `bun install`.

### 7. Test the Hook
Make a small change to test:

```bash
# Make a change
echo "// test" >> packages/core/src/index.ts

# Stage it
git add packages/core/src/index.ts

# Try to commit
git commit -m "test: verify pre-commit hook"
```

**Expected**:
1. See "🔍 Running pre-commit checks..."
2. Prettier and ESLint run on changed file
3. Type checking runs
4. If all pass, commit succeeds

### 8. Test Hook Failure
Make an intentional error:

```typescript
// Add to packages/core/src/index.ts
const unused: any = "test";  // Bad: 'any' type and unused variable
```

Stage and commit:
```bash
git add packages/core/src/index.ts
git commit -m "test: this should fail"
```

**Expected**: Commit should fail with ESLint errors.

Remove the bad code:
```bash
git restore packages/core/src/index.ts
```

### 9. Commit Husky Setup
```bash
git add .husky/ package.json
git commit -m "chore: add Husky for Git hooks"
```

## Verification Checklist
- [ ] Husky installed in `node_modules`
- [ ] `.husky/` directory created
- [ ] `.husky/pre-commit` exists and is executable
- [ ] `lint-staged` configured in package.json
- [ ] `prepare` script added
- [ ] Hook runs on commit
- [ ] Hook catches errors (test with bad code)
- [ ] Changes committed

## Troubleshooting

**Error: .husky/pre-commit: Permission denied**
- Run `chmod +x .husky/pre-commit`

**Hook doesn't run**
- Check `.git/hooks/` directory (should have symlinks)
- Run `bun husky init` again

**Hook runs but takes forever**
- That's why we use `lint-staged` - it only checks changed files
- If still slow, check if type checking is running on entire codebase

**Need to skip hook (emergency)**
- Use `git commit --no-verify -m "message"`
- ⚠️ Only use when absolutely necessary

## Important Notes

### Pre-commit checks should be fast (<10 seconds)
- lint-staged only checks changed files
- Type checking is necessary but can be slow on large changes
- If too slow, consider removing type checking from hook

### Escape hatch exists
Developers can skip hooks with `--no-verify` if needed (emergency deployments, etc.)

## Next Steps
Task 2.4 will add commit message validation (commitlint) to the commit-msg hook.
