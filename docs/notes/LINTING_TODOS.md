# ESLint Issues to Fix

## Critical (Must Fix)

- [ ] packages/cli/src/index.tsx - unsafe `any` member access/assignment; add typings for config inputs.
- [ ] packages/cli/src/ui/components/Chat.tsx - no-floating-promises and misused-promises in event handlers.
- [ ] packages/core/src/llm/ollama.ts - `any` usage and unsafe access; tighten response/request types.
- [ ] packages/core/src/tools/builtin/\*.ts - unsafe `any` flows in tool result parsing.
- [ ] tests/\*_/_.ts - unsafe `error` typed usage; add explicit error types or guards.

## Low Priority (Can Fix Later)

- [ ] packages/core/src/llm/anthropic.ts - unused `$schema`.
- [ ] packages/core/src/llm/openai.ts - unused `$schema`.
- [ ] packages/core/src/llm/factory.ts - restrict-template-expressions on `never`.
- [ ] packages/core/src/utils/config.ts - unused `error` binding.
- [ ] packages/core/src/utils/logger.ts - redundant union type with `unknown`.
