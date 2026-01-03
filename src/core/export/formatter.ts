/**
 * Export formatters for conversation history
 */

/**
 * Conversation export data structure
 */
export interface ConversationExport {
  /** ISO timestamp of conversation start */
  timestamp: string;
  /** Model name used */
  model: string;
  /** All messages in the conversation */
  messages: ExportMessage[];
  /** Metadata about the conversation */
  metadata: ExportMetadata;
}

/**
 * A single message in the export
 */
export interface ExportMessage {
  /** Message role (user, assistant, system) */
  role: string;
  /** Message content */
  content: string;
}

/**
 * Metadata about the conversation
 */
export interface ExportMetadata {
  /** Total number of messages */
  totalMessages: number;
  /** Token usage statistics */
  totalTokens: {
    input: number;
    output: number;
  };
  /** Number of agent iterations */
  iterations: number;
  /** ISO timestamp of export */
  exportedAt: string;
}

/**
 * Formats conversation history as markdown
 */
export class MarkdownFormatter {
  /**
   * Format conversation data as markdown
   *
   * @param data - Conversation export data
   * @returns Formatted markdown string
   */
  format(data: ConversationExport): string {
    let output = '# Conversation Export\n\n';
    output += `**Date**: ${data.timestamp}\n`;
    output += `**Model**: ${data.model}\n`;
    output += `**Total Messages**: ${data.metadata.totalMessages}\n`;
    output += `**Token Usage**: ${data.metadata.totalTokens.input} input, ${data.metadata.totalTokens.output} output\n\n`;
    output += `---\n\n`;

    for (const msg of data.messages) {
      // Skip system messages (internal prompts)
      if (msg.role === 'system') continue;

      const roleLabel = msg.role === 'user' ? '**You**' : '**Assistant**';
      output += `${roleLabel}:\n\n${msg.content}\n\n---\n\n`;
    }

    return output;
  }
}
