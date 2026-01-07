/**
 * Types for slash command system
 */

import type { Agent } from '@claude-x/core';
import type React from 'react';

/**
 * A slash command that can be executed from the chat interface
 */
export interface SlashCommand {
  /** Command name (e.g., 'export', 'help') */
  name: string;
  /** Human-readable description */
  description: string;
  /** Usage string (e.g., '/export [format]') */
  usage: string;
  /** Execute the command */
  execute: (args: string[], context: CommandContext) => Promise<CommandResult>;
}

/**
 * Context provided to commands when executing
 */
export interface CommandContext {
  /** The agent instance with conversation history */
  agent: Agent;
  /** UI state setter for messages */
  setMessages: React.Dispatch<React.SetStateAction<DisplayMessage[]>>;
  /** UI state setter for status message */
  setStatusMessage: (msg: string) => void;
}

/**
 * Display message used in UI
 */
export interface DisplayMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Result of command execution
 */
export interface CommandResult {
  /** Whether the command succeeded */
  success: boolean;
  /** Success message to display */
  message: string;
  /** Error message (if failed) */
  error?: string;
}
