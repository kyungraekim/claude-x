# Code Style Guide

> **Note**: This project already follows most of these conventions. This document formalizes them for consistency and onboarding new contributors.

This document outlines the coding standards and style guidelines for the claude-x TypeScript project.

## Table of Contents

- [General Principles](#general-principles)
- [Naming Conventions](#naming-conventions)
- [TypeScript Specifics](#typescript-specifics)
- [File Organization](#file-organization)
- [Formatting](#formatting)
- [Comments and Documentation](#comments-and-documentation)
- [Best Practices](#best-practices)
- [Testing](#testing)
- [Cross-Platform Considerations](#cross-platform-considerations)
- [React-Specific Guidelines](#react-specific-guidelines)

## General Principles

1. **Clarity over cleverness** - Write code that is easy to understand
2. **Consistency** - Follow established patterns in the codebase
3. **Explicit over implicit** - Make intentions clear
4. **DRY (Don't Repeat Yourself)** - Extract common patterns
5. **YAGNI (You Aren't Gonna Need It)** - Don't add speculative features

## Naming Conventions

### Files and Directories

```
✅ Good
tools/
  bash-tool.ts
  bash-tool.test.ts
utils/
  shell.ts
  platform.ts

❌ Bad
tools/
  BashTool.ts          // PascalCase for files
  bash_tool.ts         // snake_case
  bashTool.test.ts     // camelCase
```

**Rules:**
- Use `kebab-case` for file and directory names
- Use descriptive, meaningful names
- Include file type suffix: `.test.ts`, `.types.ts`
- Group related files in directories

### Variables and Functions

```typescript
// ✅ Good - camelCase
const userName = 'John';
const isLoggedIn = true;
const itemCount = 42;

function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

const fetchUserData = async (userId: string) => {
  // ...
};

// ❌ Bad
const UserName = 'John';           // PascalCase
const is_logged_in = true;         // snake_case
const ITEM_COUNT = 42;             // SCREAMING_CASE (unless constant)

function CalculateTotal() {}       // PascalCase
function calculate_total() {}      // snake_case
```

### Constants

```typescript
// ✅ Good - SCREAMING_SNAKE_CASE for true constants
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_TIMEOUT_MS = 5000;

// ✅ Also acceptable - camelCase for configuration objects
const apiConfig = {
  baseUrl: 'https://api.example.com',
  timeout: 5000,
} as const;

// ❌ Bad - inconsistent naming
const maxRetryAttempts = 3;        // Should be SCREAMING_CASE
const api_base_url = '...';        // snake_case
```

### Classes and Interfaces

```typescript
// ✅ Good - PascalCase, no "I" prefix for interfaces
class UserManager {
  private currentUser: User | null = null;

  constructor(private userService: UserService) {}
}

interface UserConfig {
  name: string;
  email: string;
}

type RequestOptions = {
  timeout?: number;
  retry?: boolean;
};

// ❌ Bad
class userManager {}               // camelCase
class user_manager {}              // snake_case

interface IUserConfig {}           // "I" prefix (old convention)
interface iUserConfig {}           // lowercase "i" prefix
```

### Enums

```typescript
// ✅ Good - PascalCase for enum name and values
enum UserRole {
  Admin = 'ADMIN',
  User = 'USER',
  Guest = 'GUEST',
}

enum HttpStatusCode {
  Ok = 200,
  NotFound = 404,
  InternalServerError = 500,
}

// ✅ Better - Use const enums for performance
const enum Direction {
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT',
}

// ❌ Bad
enum userRole {}                   // camelCase
enum USER_ROLE {}                  // SCREAMING_CASE
enum UserRole {
  admin = 'ADMIN',                 // lowercase value
}
```

### Type Parameters (Generics)

```typescript
// ✅ Good - Single uppercase letter or descriptive PascalCase
function identity<T>(arg: T): T {
  return arg;
}

function merge<T extends object, U extends object>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}

// ✅ Good - Descriptive names for clarity
interface Repository<TEntity, TId> {
  findById(id: TId): Promise<TEntity | null>;
  save(entity: TEntity): Promise<void>;
}

// ❌ Bad
function identity<t>(arg: t): t {} // lowercase
function merge<Type1, Type2>() {}  // unclear convention mix
```

### Boolean Variables

```typescript
// ✅ Good - Use is/has/can prefixes
const isLoading = true;
const hasError = false;
const canEdit = true;
const shouldRetry = false;
const wasSuccessful = true;

// ❌ Bad - Ambiguous names
const loading = true;              // Verb or boolean?
const error = false;               // Error object or boolean?
const edit = true;                 // Action or permission?
```

## TypeScript Specifics

### Type Annotations

```typescript
// ✅ Good - Explicit types for function parameters and return values
function calculateArea(width: number, height: number): number {
  return width * height;
}

// ✅ Good - Let TypeScript infer obvious types
const count = 42;                  // Inferred as number
const items = [1, 2, 3];          // Inferred as number[]

// ✅ Good - Explicit for complex types
const config: UserConfig = {
  name: 'John',
  email: 'john@example.com',
};

// ❌ Bad - Unnecessary type annotations
const count: number = 42;          // Obvious inference
const name: string = 'John';       // Obvious inference

// ❌ Bad - Missing necessary annotations
function process(data) {           // Implicit any
  return data;
}
```

### Interface vs Type

```typescript
// ✅ Good - Use interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Good - Use types for unions, intersections, and primitives
type Status = 'pending' | 'success' | 'error';
type Nullable<T> = T | null;
type UserWithTimestamps = User & {
  createdAt: Date;
  updatedAt: Date;
};

// ✅ Good - Interfaces can be extended
interface Employee extends User {
  department: string;
  salary: number;
}

// ✅ Good - Declaration merging with interfaces
interface Window {
  customProperty: string;
}
```

### Avoid `any`

```typescript
// ✅ Good - Use specific types
function processData(data: string[]): void {
  // ...
}

// ✅ Good - Use unknown for truly unknown types
function parseJSON(json: string): unknown {
  return JSON.parse(json);
}

// ✅ Good - Use generics for flexibility with type safety
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// ❌ Bad - Using any loses type safety
function processData(data: any): any {
  return data.map((item: any) => item.value);
}
```

### Null and Undefined

```typescript
// ✅ Good - Use optional chaining
const email = user?.profile?.email;

// ✅ Good - Use nullish coalescing
const displayName = user.name ?? 'Anonymous';

// ✅ Good - Be explicit about nullable types
function findUser(id: string): User | null {
  // ...
}

// ❌ Bad - Implicit undefined
function findUser(id: string): User {
  // Might return undefined, but type says User
}

// ❌ Bad - Using || for defaults (catches empty strings, 0, etc.)
const port = process.env.PORT || 3000;  // Use ?? instead
```

### Array Types

```typescript
// ✅ Good - Consistent array syntax
const numbers: number[] = [1, 2, 3];
const users: User[] = [];

// ✅ Also acceptable - Generic syntax for complex types
const matrix: Array<number[]> = [[1, 2], [3, 4]];
const callbacks: Array<() => void> = [];

// ❌ Bad - Inconsistent usage
const numbers: Array<number> = [1, 2, 3];  // Mix with numbers[]
const users: User[] = [];
```

## File Organization

### Import Order

```typescript
// 1. Node.js built-in modules (with node: prefix)
import { spawn } from 'node:child_process';
import path from 'node:path';

// 2. External packages
import { z } from 'zod';
import chalk from 'chalk';
import { Command } from 'commander';

// 3. Internal absolute imports (monorepo packages)
import { ToolRegistry } from '@claude-x/core';
import type { LLMMessage } from '@claude-x/core/types';

// 4. Relative imports (parent directories first, then same directory)
import { UserService } from '../../services/user-service.js';
import { formatDate } from '../utils/date-helpers.js';
import { Header } from './header.js';

// 5. Type-only imports (grouped separately)
import type { User } from '@/types/user.js';
import type { Config } from './types.js';
```

**Important**: Always include `.js` extension in relative imports (ESM requirement).

### File Structure

```typescript
// 1. Imports
import { z } from 'zod';
import type { Tool, ToolResult } from '../types/index.js';

// 2. Types and interfaces
interface ExecuteParams {
  command: string;
  timeout?: number;
}

// 3. Constants
const MAX_TIMEOUT = 30000;
const DEFAULT_SHELL = '/bin/bash';

// 4. Helper functions (if not extracted to separate file)
function sanitizeCommand(cmd: string): string {
  // ...
}

// 5. Main export (Tool, Class, or Function)
export const BashTool: Tool = {
  name: 'bash',
  description: 'Execute bash commands',
  inputSchema: z.object({ /* ... */ }),
  async execute(params) {
    // Implementation
  },
};
```

## Formatting

Formatting is automatically handled by Prettier with these settings:

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

### Line Length

- **Maximum 100 characters per line**
- Break long lines at logical points
- Use proper indentation for continuation

```typescript
// ✅ Good - Natural formatting with 100 chars
const user = await fetchUser({
  id: userId,
  includeProfile: true,
  includePermissions: true,
});

// ✅ Also good - Fits within 100 chars
const result = await processData({ userId, options: { cache: true, retry: 3 } });

// ❌ Bad - Exceeds 100 characters significantly
const user = await fetchUser({ id: userId, includeProfile: true, includePermissions: true, includeSettings: true, includeHistory: true });
```

### Indentation

- Use 2 spaces (never tabs)
- Consistent indentation throughout

### Semicolons

- Always use semicolons
- Never rely on ASI (Automatic Semicolon Insertion)

### Quotes

- Use single quotes for strings
- Use backticks for template literals
- Use double quotes in JSX attributes (React convention)

```typescript
// ✅ Good
const name = 'John';
const greeting = `Hello, ${name}!`;
const element = <Button label="Click me" />;

// ❌ Bad
const name = "John";               // Use single quotes
const greeting = 'Hello, ' + name; // Use template literal
```

### Trailing Commas

- Use trailing commas in multi-line arrays, objects, and function parameters
- Improves git diffs and makes reordering easier

```typescript
// ✅ Good
const colors = [
  'red',
  'green',
  'blue',
];

const config = {
  timeout: 5000,
  retry: true,
};

// ❌ Bad - Missing trailing comma
const colors = [
  'red',
  'green',
  'blue'
];
```

### Spacing

```typescript
// ✅ Good - Spaces around operators
const sum = a + b;
const isValid = x > 0 && y < 10;

// ✅ Good - Space after keywords
if (condition) {
  // ...
}

for (const item of items) {
  // ...
}

// ✅ Good - No space before function parentheses (except keywords)
function myFunction() {}
const myFunc = () => {};

// ❌ Bad
const sum=a+b;                     // No spaces
if(condition){}                    // No spaces
function myFunction () {}          // Extra space
```

## Comments and Documentation

### JSDoc Comments

```typescript
/**
 * Executes a shell command with timeout and error handling.
 *
 * @param command - The shell command to execute
 * @param options - Execution options
 * @returns The command output and exit code
 * @throws {Error} If command execution fails or times out
 *
 * @example
 * ```ts
 * const result = await executeCommand('ls -la', { timeout: 5000 });
 * console.log(result.output);
 * ```
 */
async function executeCommand(
  command: string,
  options: ExecuteOptions
): Promise<CommandResult> {
  // Implementation
}
```

### Inline Comments

```typescript
// ✅ Good - Explain why, not what
// Retry failed requests to handle transient network errors
const maxRetries = 3;

// Using a Map here for O(1) lookup performance
const userCache = new Map<string, User>();

// ❌ Bad - Stating the obvious
// Set maxRetries to 3
const maxRetries = 3;

// Create a new Map
const userCache = new Map<string, User>();
```

### TODO Comments

```typescript
// TODO: Add input validation
// TODO(username): Refactor this to use the new API
// FIXME: This breaks when input is null
// HACK: Temporary workaround until library is fixed
```

## Best Practices

### Functions

```typescript
// ✅ Good - Small, focused functions
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeInput(input: string): string {
  return input.trim().toLowerCase();
}

// ✅ Good - Early returns for clarity
function processUser(user: User | null): string {
  if (!user) {
    return 'No user provided';
  }

  if (!user.email) {
    return 'User email is missing';
  }

  return `Processing ${user.email}`;
}

// ❌ Bad - Deep nesting
function processUser(user: User | null): string {
  if (user) {
    if (user.email) {
      return `Processing ${user.email}`;
    } else {
      return 'User email is missing';
    }
  } else {
    return 'No user provided';
  }
}
```

### Error Handling

```typescript
// ✅ Good - Specific error types
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

async function createUser(data: unknown): Promise<User> {
  try {
    const validated = userSchema.parse(data);
    return await saveUser(validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid user data');
    }
    throw error; // Re-throw unexpected errors
  }
}

// ❌ Bad - Swallowing errors
async function createUser(data: unknown): Promise<User | null> {
  try {
    return await saveUser(data);
  } catch (error) {
    console.log(error);
    return null; // Caller doesn't know what went wrong
  }
}
```

### Async/Await

```typescript
// ✅ Good - Clean async/await usage
async function fetchUserData(userId: string): Promise<User> {
  const user = await fetchUser(userId);
  const profile = await fetchProfile(user.profileId);
  return { ...user, profile };
}

// ✅ Good - Parallel requests when possible
async function fetchUserData(userId: string): Promise<User> {
  const [user, settings] = await Promise.all([
    fetchUser(userId),
    fetchSettings(userId),
  ]);
  return { ...user, settings };
}

// ❌ Bad - Mixing promises and async/await
async function fetchUserData(userId: string): Promise<User> {
  return fetchUser(userId).then((user) => {
    return fetchProfile(user.profileId).then((profile) => {
      return { ...user, profile };
    });
  });
}
```

### Object and Array Destructuring

```typescript
// ✅ Good - Destructure for clarity
function greetUser({ name, email }: User): string {
  return `Hello, ${name} (${email})`;
}

const [first, second, ...rest] = numbers;
const { id, ...userWithoutId } = user;

// ❌ Bad - Unnecessary property access
function greetUser(user: User): string {
  return `Hello, ${user.name} (${user.email})`;
}
```

### Immutability

```typescript
// ✅ Good - Immutable updates
const updatedUser = { ...user, name: 'New Name' };
const newItems = [...items, newItem];

// ✅ Good - Immutable array operations
const filtered = users.filter((u) => u.active);
const mapped = users.map((u) => u.name);

// ❌ Bad - Mutation
user.name = 'New Name';
items.push(newItem);
```

## Testing

### Test Framework

This project uses **Bun's built-in test framework** (not Vitest, not Jest).

```typescript
// ✅ Good - Bun test imports
import { describe, test, expect, beforeEach } from 'bun:test';

describe('BashTool', () => {
  test('should execute simple command', async () => {
    const result = await BashTool.execute({ command: 'echo "hello"' });
    expect(result.success).toBe(true);
    expect(result.output).toContain('hello');
  });

  test('should handle command errors', async () => {
    const result = await BashTool.execute({ command: 'invalid-command' });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// ❌ Bad - Wrong test framework imports
import { describe, it, expect } from 'vitest';  // Wrong!
import { describe, it, expect } from 'jest';    // Wrong!
```

### Test Structure

- Use **Arrange-Act-Assert** pattern
- Descriptive test names starting with "should"
- Group related tests with `describe`

```typescript
describe('formatDate', () => {
  test('should format date in ISO format', () => {
    // Arrange
    const date = new Date('2024-01-15');

    // Act
    const formatted = formatDate(date, 'iso');

    // Assert
    expect(formatted).toBe('2024-01-15');
  });
});
```

## Cross-Platform Considerations

This CLI tool must work on **Windows (PowerShell)**, **macOS (bash/zsh)**, and **Linux (bash)**.

### Platform Detection

```typescript
// ✅ Good - Use utility functions
import { detectPlatform, isWindows } from '@/utils/platform.js';

if (isWindows()) {
  // Windows-specific logic
} else {
  // Unix logic
}
```

### Shell Commands

```typescript
// ✅ Good - Use cross-platform utilities
import { executeCommand } from '@/utils/shell.js';

const result = await executeCommand('list files', { timeout: 5000 });

// ❌ Bad - Hardcoded shell commands
const result = await exec('ls -la');  // Doesn't work on Windows!
```

### Path Handling

```typescript
// ✅ Good - Normalize paths for user input
import { normalizePathForPlatform } from '@/utils/platform.js';

const userPath = normalizePathForPlatform('~/workspace');

// ✅ Good - Use path module for construction
import path from 'node:path';
const fullPath = path.join(baseDir, 'subdir', 'file.txt');

// ❌ Bad - Hardcoded separators
const fullPath = baseDir + '/' + 'file.txt';  // Breaks on Windows!
```

### Line Endings

```typescript
// ✅ Good - Platform-aware line endings
import { getLineEnding } from '@/utils/platform.js';

const content = lines.join(getLineEnding());  // \r\n on Windows, \n on Unix

// ❌ Bad - Hardcoded line endings
const content = lines.join('\n');  // May break on Windows
```

### Testing Cross-Platform Code

- Test on Windows PowerShell if possible
- Use `packages/core/src/utils/shell.ts` utilities
- Be aware of command differences (e.g., `ls` vs `dir`)

## React-Specific Guidelines

This project uses **ink** (React for terminal UIs) in the CLI package.

### Component Structure

```typescript
// ✅ Good - ink component
import React from 'react';
import { Box, Text } from 'ink';

interface StatusMessageProps {
  message: string;
  type: 'info' | 'success' | 'error';
}

export const StatusMessage: React.FC<StatusMessageProps> = ({
  message,
  type,
}) => {
  const color = type === 'error' ? 'red' : type === 'success' ? 'green' : 'blue';

  return (
    <Box>
      <Text color={color}>{message}</Text>
    </Box>
  );
};
```

### Hooks

```typescript
// ✅ Good - Hooks at top level
function MyComponent() {
  const [count, setCount] = useState(0);
  const theme = useTheme();

  // Never put hooks in conditionals or loops
  if (count > 0) {
    // Don't call useEffect here
  }

  return <Box>{count}</Box>;
}

// ✅ Good - Custom hooks start with "use"
function useAgentState() {
  const [messages, setMessages] = useState<LLMMessage[]>([]);

  return { messages, setMessages };
}
```

---

This style guide is enforced through ESLint and Prettier. Run `bun run lint` and `bun run format` to check compliance.

For complete development workflow, see [CONTRIBUTING.md](./CONTRIBUTING.md).
