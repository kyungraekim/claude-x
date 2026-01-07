/**
 * Export service for conversation history
 */

import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import type { Agent } from '../agent/agent.js';
import type { ContentBlock } from '../types/llm.js';
import { MarkdownFormatter, type ConversationExport } from './formatter.js';

/**
 * Service for exporting conversation history to files
 */
export class ExportService {
  private outputsPath: string;

  /**
   * Create an export service
   *
   * @param outputsPath - Directory to save exported files
   */
  constructor(outputsPath: string) {
    this.outputsPath = outputsPath;
  }

  /**
   * Export conversation from agent to markdown file
   *
   * @param agent - Agent with conversation history
   * @returns Result with file path or error
   */
  async exportConversation(agent: Agent): Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }> {
    try {
      // Gather conversation data
      const messages = agent.getMessages();
      const tokenUsage = agent.getTokenUsage();
      const state = agent.getState();

      // Build export data
      const exportData: ConversationExport = {
        timestamp: new Date().toISOString(),
        model: 'claude-sonnet-4-20250514', // TODO: Get from config
        messages: messages.map((msg) => ({
          role: msg.role,
          content:
            typeof msg.content === 'string'
              ? msg.content
              : this.formatContentBlocks(msg.content),
        })),
        metadata: {
          totalMessages: messages.length,
          totalTokens: tokenUsage,
          iterations: state.iterationCount,
          exportedAt: new Date().toISOString(),
        },
      };

      // Format as markdown
      const formatter = new MarkdownFormatter();
      const formattedContent = formatter.format(exportData);

      // Generate filename with timestamp
      const filename = this.generateFilename();
      const filePath = join(this.outputsPath, filename);

      // Ensure output directory exists
      await mkdir(this.outputsPath, { recursive: true });

      // Write file
      await writeFile(filePath, formattedContent, 'utf-8');

      return { success: true, filePath };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Generate filename with timestamp
   *
   * @returns Filename string
   */
  private generateFilename(): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-') // Replace colons for Windows compatibility
      .slice(0, -5); // Remove milliseconds
    return `conversation-${timestamp}.md`;
  }

  /**
   * Format content blocks to string
   *
   * @param blocks - Array of content blocks
   * @returns Formatted string
   */
  private formatContentBlocks(blocks: ContentBlock[]): string {
    return blocks
      .map((block) => {
        if (block.type === 'text') return block.text;
        if (block.type === 'tool_use') return `[Tool: ${block.name}]`;
        if (block.type === 'tool_result') return `[Tool Result]`;
        return '';
      })
      .join('\n');
  }
}
