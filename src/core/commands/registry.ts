/**
 * Command registry for managing slash commands
 */

import type { SlashCommand, CommandContext, CommandResult } from '../../types/command.js';

/**
 * Registry for slash commands
 *
 * Manages registration and execution of slash commands.
 * Follows the same pattern as ToolRegistry for consistency.
 */
export class CommandRegistry {
  private commands: Map<string, SlashCommand> = new Map();

  /**
   * Register a slash command
   *
   * @param command - The command to register
   */
  register(command: SlashCommand): void {
    this.commands.set(command.name, command);
  }

  /**
   * Execute a command by name
   *
   * @param commandName - Name of the command to execute
   * @param args - Arguments to pass to the command
   * @param context - Execution context (agent, UI state setters)
   * @returns Command result
   */
  async execute(
    commandName: string,
    args: string[],
    context: CommandContext,
  ): Promise<CommandResult> {
    const command = this.commands.get(commandName);

    if (!command) {
      return {
        success: false,
        message: '',
        error: `Unknown command: /${commandName}`,
      };
    }

    return await command.execute(args, context);
  }

  /**
   * Get all registered commands
   *
   * @returns Array of registered commands
   */
  getAll(): SlashCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Check if a command is registered
   *
   * @param commandName - Name of the command
   * @returns True if registered
   */
  has(commandName: string): boolean {
    return this.commands.has(commandName);
  }
}
