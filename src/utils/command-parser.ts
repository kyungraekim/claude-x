/**
 * Command parser for slash commands
 */

/**
 * Parsed command result
 */
export interface ParsedCommand {
  /** Whether the input is a slash command */
  isCommand: boolean;
  /** Command name (without the /) */
  command?: string;
  /** Command arguments */
  args: string[];
  /** Original input */
  rawInput: string;
}

/**
 * Parse user input to detect and extract slash commands
 *
 * @param input - User input string
 * @returns Parsed command information
 *
 * @example
 * parseSlashCommand('/export')
 * // => { isCommand: true, command: 'export', args: [], rawInput: '/export' }
 *
 * parseSlashCommand('/export markdown')
 * // => { isCommand: true, command: 'export', args: ['markdown'], rawInput: '/export markdown' }
 *
 * parseSlashCommand('regular message')
 * // => { isCommand: false, args: [], rawInput: 'regular message' }
 */
export function parseSlashCommand(input: string): ParsedCommand {
  const trimmed = input.trim();

  // Check if starts with /
  if (!trimmed.startsWith('/')) {
    return { isCommand: false, args: [], rawInput: input };
  }

  // Parse: "/export markdown" -> command="export", args=["markdown"]
  const parts = trimmed.slice(1).split(/\s+/);
  const command = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  return {
    isCommand: true,
    command,
    args,
    rawInput: input,
  };
}
