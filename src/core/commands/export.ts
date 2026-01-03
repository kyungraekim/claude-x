/**
 * Export command implementation
 */

import type { SlashCommand } from '../../types/command.js';
import { ExportService } from '../export/service.js';
import { loadConfig } from '../../utils/config.js';

/**
 * /export command - Export conversation history to markdown file
 */
export const ExportCommand: SlashCommand = {
  name: 'export',
  description: 'Export conversation history to markdown file',
  usage: '/export',

  async execute(_args, context) {
    const { agent, setStatusMessage } = context;

    // Check if conversation has any messages
    const messages = agent.getMessages();
    const userMessages = messages.filter((m) => m.role !== 'system');

    if (userMessages.length === 0) {
      return {
        success: false,
        message: '',
        error: 'No conversation to export. Start chatting first!',
      };
    }

    // Show status
    setStatusMessage('Exporting conversation...');

    try {
      // Get output path from config
      const config = await loadConfig();
      const exportService = new ExportService(config.outputsPath);

      // Perform export
      const result = await exportService.exportConversation(agent);

      if (result.success) {
        return {
          success: true,
          message: `✓ Conversation exported to:\n  ${result.filePath}`,
        };
      } else {
        return {
          success: false,
          message: '',
          error: `Export failed: ${result.error}`,
        };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: '',
        error: `Export failed: ${errorMsg}`,
      };
    }
  },
};
