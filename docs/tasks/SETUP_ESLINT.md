# Task: Setup ESLint for Code Quality

## Goal
Install and configure ESLint to catch code quality issues and enforce TypeScript best practices.

## Prerequisites
- Task 2.1 (Prettier) completed
- Understanding of monorepo structure

## Steps

### 1. Install ESLint and Plugins
```bash
bun add -D eslint @eslint/js typescript-eslint eslint-config-prettier
```

**Why these packages**:
- `eslint`: Core linter
- `@eslint/js`: JavaScript rules
- `typescript-eslint`: TypeScript support
- `eslint-config-prettier`: Disable rules that conflict with Prettier

### 2. Create ESLint Configuration
Create `eslint.config.js` at root:

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  // Ignore build outputs and dependencies
  {
    ignores: ['dist/', 'node_modules/', 'tmp-plans/', '*.js'],
  },

  // Base recommended configs
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,

  // Core package configuration
  {
    files: ['packages/core/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './packages/core/tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // CLI package configuration (includes .tsx for React)
  {
    files: ['packages/cli/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './packages/cli/tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Custom rules
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'off', // Allow console in CLI tool
      'prefer-const': 'error',
    },
  }
);
```

### 3. Add Scripts to package.json Files

**Root `package.json`**:
```json
"scripts": {
  "lint": "eslint .",
  "lint:fix": "eslint . --fix"
}
```

**Update `packages/core/package.json`** (replace existing "lint"):
```json
"scripts": {
  "lint": "eslint src/"
}
```

**Update `packages/cli/package.json`** (replace existing "lint"):
```json
"scripts": {
  "lint": "eslint src/"
}
```

### 4. Run Linter (First Time)
```bash
bun run lint
```

**Expected**: You'll see many linting errors. This is normal!

### 5. Fix Auto-Fixable Issues
```bash
bun run lint:fix
```

This will automatically fix issues like:
- Missing semicolons
- `var` → `const`/`let`
- Spacing issues

### 6. Review Remaining Errors
After auto-fix, run `bun run lint` again.

**Common errors you'll see**:
- `@typescript-eslint/no-floating-promises`: Missing `await` or `.catch()`
- `@typescript-eslint/no-misused-promises`: Async function in wrong context
- Unused variables

### 7. Handle Remaining Errors

**Option A**: Fix critical errors (recommended)
- Fix any `@typescript-eslint/no-explicit-any` errors
- Fix unused imports
- Fix missing awaits on promises

**Option B**: Document as TODOs
If too many errors, create `LINTING_TODOS.md`:
```markdown
# ESLint Issues to Fix

## Critical (Must Fix)
- [ ] packages/core/src/agent/agent.ts:45 - no-floating-promises
- [ ] packages/cli/src/index.tsx:123 - no-misused-promises

## Low Priority (Can Fix Later)
- [ ] Unused variables in test files
```

### 8. Commit Changes
```bash
git add eslint.config.js package.json packages/*/package.json
git commit -m "chore: add ESLint for code quality checks"
```

If you fixed code:
```bash
git add -A
git commit -m "fix: resolve ESLint errors in core package"
```

## Verification Checklist
- [ ] ESLint installed
- [ ] `eslint.config.js` created
- [ ] Scripts added to all package.json files
- [ ] `bun run lint` executes (may show errors)
- [ ] Auto-fixable issues fixed
- [ ] Critical errors fixed or documented

## Troubleshooting

**Error: Parsing error: Cannot read file '.../tsconfig.json'**
- Ensure paths in `eslint.config.js` are correct
- Check that `tsconfigRootDir` is set

**Too many errors**
- Focus on critical ones first (@typescript-eslint/no-explicit-any)
- Document rest as TODOs
- Don't let perfect be enemy of good

**Error: `import.meta.dirname` not found**
- Ensure you're using ESM (check `"type": "module"` in package.json)

## Next Steps
ESLint will run automatically via git hooks (Task 2.3).
