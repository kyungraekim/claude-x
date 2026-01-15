/**
 * Reset/clear command implementation
 */

import type { SlashCommand } from '../types/command.js';

const clearConversation = async (_args: string[], context: Parameters<SlashCommand['execute']>[1]) => {
  const { agent, setMessages, setStatusMessage } = context;

  setStatusMessage('Clearing conversation history...');
  agent.reset();
  setMessages(() => []);

  return {
    success: true,
    message: '✓ Conversation history cleared.',
  };
};

/**
 * /reset command - Clear conversation history
 */
export const ResetCommand: SlashCommand = {
  name: 'reset',
  description: 'Clear conversation history and reset the agent',
  usage: '/reset',
  execute: clearConversation,
};

/**
 * /clear command - Alias for /reset
 */
export const ClearCommand: SlashCommand = {
  name: 'clear',
  description: 'Clear conversation history and reset the agent',
  usage: '/clear',
  execute: clearConversation,
};
