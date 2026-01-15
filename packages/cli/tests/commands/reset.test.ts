/**
 * Tests for reset/clear command
 */

import { describe, expect, test } from 'bun:test';
import { ClearCommand, ResetCommand } from '../../src/commands/index.js';

const createContext = () => {
  let messages = [
    { role: 'user', content: 'hello' },
    { role: 'assistant', content: 'hi' },
  ];
  let statusMessage = '';
  let resetCalls = 0;

  return {
    context: {
      agent: {
        reset: () => {
          resetCalls += 1;
        },
      },
      setMessages: (updater: (prev: typeof messages) => typeof messages) => {
        messages = updater(messages);
      },
      setStatusMessage: (msg: string) => {
        statusMessage = msg;
      },
    },
    getState: () => ({ messages, statusMessage, resetCalls }),
  };
};

describe('reset/clear commands', () => {
  test('reset clears messages and resets agent', async () => {
    const { context, getState } = createContext();

    const result = await ResetCommand.execute([], context);

    expect(result.success).toBe(true);
    expect(result.message).toBe('✓ Conversation history cleared.');
    expect(getState().messages).toEqual([]);
    expect(getState().statusMessage).toBe('Clearing conversation history...');
    expect(getState().resetCalls).toBe(1);
  });

  test('clear is an alias for reset', async () => {
    const { context, getState } = createContext();

    const result = await ClearCommand.execute([], context);

    expect(result.success).toBe(true);
    expect(result.message).toBe('✓ Conversation history cleared.');
    expect(getState().messages).toEqual([]);
    expect(getState().statusMessage).toBe('Clearing conversation history...');
    expect(getState().resetCalls).toBe(1);
  });
});
