/**
 * Message component
 *
 * Displays a single chat message (user or assistant).
 */

import React from 'react';
import { Box, Text } from 'ink';

export interface MessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Message component
 */
export const Message: React.FC<MessageProps> = ({ role, content }) => {
  // Choose color based on role
  const color = role === 'user' ? 'cyan' : role === 'assistant' ? 'green' : 'gray';
  const prefix = role === 'user' ? 'You' : role === 'assistant' ? 'Assistant' : 'System';

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={color} bold>
        {prefix}:
      </Text>
      <Box marginLeft={2}>
        <Text>{content}</Text>
      </Box>
    </Box>
  );
};
