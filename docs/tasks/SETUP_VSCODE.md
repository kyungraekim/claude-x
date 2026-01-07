# Task: Configure VSCode for Automatic Formatting

## Goal
Set up VSCode workspace settings to automatically format code on save and show linting errors.

## Prerequisites
- Prettier installed (Task 2.1)
- ESLint installed (Task 2.2)

## Steps

### 1. Install VSCode Extensions
Install these extensions:
- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier - Code formatter** (esbenp.prettier-vscode)
- **Bun for Visual Studio Code** (oven.bun-vscode)

### 2. Create .vscode Directory
```bash
mkdir -p .vscode
```

### 3. Create VSCode Settings
Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### 4. Create Extensions Recommendations
Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "oven.bun-vscode"
  ]
}
```

This suggests extensions to new contributors when they open the project.

### 5. Test Format on Save
1. Open any TypeScript file (e.g., `packages/core/src/agent/agent.ts`)
2. Make a formatting change (add extra spaces)
3. Save the file (Cmd+S / Ctrl+S)
4. File should auto-format

### 6. Test ESLint Integration
1. Add intentional error: `const x: any = 5;`
2. Should see red squiggly line under `any`
3. Hover to see error message
4. Save file
5. ESLint should auto-fix if possible

### 7. Commit Settings
```bash
git add .vscode/
git commit -m "chore: add VSCode workspace settings"
```

## Verification Checklist
- [ ] VSCode extensions installed
- [ ] `.vscode/settings.json` created
- [ ] `.vscode/extensions.json` created
- [ ] Format on save works (tested)
- [ ] ESLint errors show in editor
- [ ] Auto-fix works on save
- [ ] Changes committed

## Troubleshooting

**Format on save doesn't work**
- Check Prettier extension is installed
- Check it's set as default formatter
- Reload VSCode window

**ESLint errors don't show**
- Check ESLint extension is installed
- Look at Output panel → ESLint for errors
- Ensure `eslint.config.js` exists at root

**Wrong formatter used**
- Check default formatter setting
- Check file-specific formatter settings

## For Non-VSCode Users
These settings only affect VSCode. Other editors should:
- Use `.editorconfig` (most editors support this)
- Run `bun run format` manually
- Rely on git hooks for enforcement
