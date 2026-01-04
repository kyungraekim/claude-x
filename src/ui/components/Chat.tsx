/**
 * Chat component
 *
 * Main interactive chat interface.
 */

import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import React, { useEffect, useState } from 'react';
import type { Agent } from '../../core/agent/agent.js';
import { CommandRegistry, ExportCommand } from '../../core/commands/index.js';
import type { CommandContext } from '../../types/command.js';
import type { AgentEvent, ToolCall, ToolResult } from '../../types/index.js';
import { parseSlashCommand } from '../../utils/command-parser.js';
import { LOGO_IMAGE } from '../assets/images/logo.image.js';
import { AnsiImageView } from './AnsiImageView.js';
import { Message } from './Message.js';
import { ToolExecution } from './ToolExecution.js';

export interface ChatProps {
  agent: Agent;
  initialMessage?: string;
}

interface DisplayMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ToolExec {
  toolCall: ToolCall;
  result?: ToolResult;
  isExecuting: boolean;
}

/**
 * Chat component
 *
 * Interactive chat interface with agent.
 */
export const Chat: React.FC<ChatProps> = ({ agent, initialMessage }) => {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTools, setCurrentTools] = useState<ToolExec[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [commandRegistry] = useState(() => {
    const registry = new CommandRegistry();
    registry.register(ExportCommand);
    return registry;
  });

  // Process agent events
  const processMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isProcessing) return;

    setInput('');
    setIsProcessing(true);
    setCurrentTools([]);

    // Parse for slash commands
    const parsed = parseSlashCommand(userMessage);

    if (parsed.isCommand && parsed.command) {
      // Handle slash command
      try {
        const commandContext: CommandContext = {
          agent,
          setMessages,
          setStatusMessage,
        };

        const result = await commandRegistry.execute(
          parsed.command,
          parsed.args,
          commandContext,
        );

        if (result.success) {
          setStatusMessage(result.message);
          setMessages((prev) => [
            ...prev,
            {
              role: 'system',
              content: result.message,
            },
          ]);
          // Clear status after 3 seconds
          setTimeout(() => setStatusMessage(''), 3000);
        } else {
          setStatusMessage(`Error: ${result.error}`);
          setMessages((prev) => [
            ...prev,
            {
              role: 'system',
              content: `Error: ${result.error}`,
            },
          ]);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        setStatusMessage(`Command error: ${errorMsg}`);
      } finally {
        setIsProcessing(false);
        setCurrentTools([]);
      }
      return;
    }

    // Not a command - proceed with normal agent processing
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Run agent
      for await (const event of agent.run(userMessage)) {
        await handleEvent(event);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setStatusMessage(`Error: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
      setCurrentTools([]);
      setStatusMessage('');
    }
  };

  // Handle agent events
  const handleEvent = async (event: AgentEvent) => {
    switch (event.type) {
      case 'llm_start':
        setStatusMessage('Thinking...');
        break;

      case 'llm_response':
        if (event.content) {
          setMessages((prev) => [...prev, { role: 'assistant', content: event.content }]);
        }
        break;

      case 'tool_start':
        setStatusMessage(`Executing tool: ${event.toolCall.name}`);
        setCurrentTools((prev) => [
          ...prev,
          { toolCall: event.toolCall, isExecuting: true },
        ]);
        break;

      case 'tool_result':
        setCurrentTools((prev) =>
          prev.map((tool) =>
            tool.toolCall.id === event.toolCall.id
              ? { ...tool, result: event.result, isExecuting: false }
              : tool
          )
        );
        break;

      case 'iteration':
        setStatusMessage(`Iteration ${event.count}`);
        break;

      case 'done':
        setStatusMessage('Done');
        break;

      case 'error':
        setStatusMessage(`Error: ${event.error}`);
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: `Error: ${event.error}` },
        ]);
        break;

      case 'max_iterations':
        setStatusMessage('Maximum iterations reached');
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: 'Maximum iterations reached' },
        ]);
        break;
    }
  };

  // Handle initial message
  useEffect(() => {
    if (initialMessage) {
      processMessage(initialMessage);
    }
  }, []);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1} borderStyle="round" borderColor="cyan" padding={1}>
        <AnsiImageView image={LOGO_IMAGE} />
        <Text bold color="cyan">
          Claude X
        </Text>
      </Box>

      {/* Messages */}
      <Box flexDirection="column" marginBottom={1}>
        {messages.map((msg, i) => (
          <Message key={i} role={msg.role} content={msg.content} />
        ))}
      </Box>

      {/* Current tools */}
      {currentTools.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          {currentTools.map((tool, i) => (
            <ToolExecution
              key={i}
              toolCall={tool.toolCall}
              result={tool.result}
              isExecuting={tool.isExecuting}
            />
          ))}
        </Box>
      )}

      {/* Status */}
      {statusMessage && (
        <Box marginBottom={1}>
          <Text dimColor italic>
            {statusMessage}
          </Text>
        </Box>
      )}

      {/* Input */}
      {!isProcessing && (
        <Box>
          <Text color="cyan">You: </Text>
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={processMessage}
          />
        </Box>
      )}

      {isProcessing && (
        <Box>
          <Text dimColor>Processing...</Text>
        </Box>
      )}
    </Box>
  );
};
