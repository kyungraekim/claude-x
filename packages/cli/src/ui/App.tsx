/**
 * App component
 *
 * Root component for the terminal UI.
 */

import type { Agent } from '@claude-x/core';
import { Box } from 'ink';
import React from 'react';
import { Chat } from './components/Chat.js';

export interface AppProps {
  agent: Agent;
  name: string;
  version: string;
  model: string;
  workingDir: string;
  initialMessage?: string;
}

/**
 * App component
 */
export const App: React.FC<AppProps> = ({
  agent,
  name,
  version,
  model,
  workingDir,
  initialMessage,
}) => {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Chat
        agent={agent}
        name={name}
        version={version}
        model={model}
        workingDir={workingDir}
        initialMessage={initialMessage}
      />
    </Box>
  );
};
