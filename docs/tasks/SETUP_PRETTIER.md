# Task: Setup Prettier for Code Formatting

## Goal
Install and configure Prettier to automatically format code according to project standards.

## Prerequisites
- Phase 1 documentation completed
- `.prettierrc.json` and `.prettierignore` exist at root
- You have `bun` installed

## Steps

### 1. Install Prettier
```bash
bun add -D prettier
```

### 2. Add Scripts to Root package.json
Edit `/Users/kyungrae/workspace/dev/claude-code/claude-x/package.json`:

```json
"scripts": {
  "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
  "format:check": "prettier --check \"**/*.{ts,tsx,json,md}\""
}
```

### 3. Add Scripts to Package Workspaces
Edit `packages/core/package.json`:
```json
"scripts": {
  "format": "prettier --write \"src/**/*.ts\"",
  "format:check": "prettier --check \"src/**/*.ts\""
}
```

Edit `packages/cli/package.json`:
```json
"scripts": {
  "format": "prettier --write \"src/**/*.{ts,tsx}\"",
  "format:check": "prettier --check \"src/**/*.{ts,tsx}\""
}
```

### 4. Test Configuration
```bash
# Check formatting (will show violations but not modify files)
bun run format:check
```

**Expected**: Some files may show formatting violations (100-char line length).

### 5. DO NOT format existing code yet
⚠️ **IMPORTANT**: Do not run `bun run format` yet. The 100-character line length
standard applies to new code only. Existing code will be migrated gradually.

### 6. Test on a Single File
Create a test file `test-format.ts`:
```typescript
const veryLongVariableName = "This is a very long string that definitely exceeds the 100 character line length limit and should be wrapped by Prettier automatically";
```

Run: `bun prettier --write test-format.ts`

**Expected**: Should wrap the line.

### 7. Commit
```bash
git add package.json packages/*/package.json
git commit -m "chore: add Prettier for code formatting"
```

## Verification Checklist
- [ ] Prettier installed in `node_modules`
- [ ] Scripts added to all package.json files
- [ ] `bun run format:check` runs (may show violations)
- [ ] Test file formats correctly
- [ ] Committed changes

## Troubleshooting
- **Error: Cannot find module 'prettier'**: Run `bun install`
- **Config not found**: Ensure `.prettierrc.json` exists at root

## Next Steps
After this task, Husky git hooks will use Prettier to format staged files automatically.
