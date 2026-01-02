/**
 * App component
 *
 * Root component for the terminal UI.
 */

import React from 'react';
import { Box } from 'ink';
import { Chat } from './components/Chat.js';
import type { Agent } from '../core/agent/agent.js';

export interface AppProps {
  agent: Agent;
  initialMessage?: string;
}

/**
 * App component
 */
export const App: React.FC<AppProps> = ({ agent, initialMessage }) => {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Chat agent={agent} initialMessage={initialMessage} />
    </Box>
  );
};
