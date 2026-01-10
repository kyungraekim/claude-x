/**
 * Header component
 *
 * Displays app information with logo, version, model, and working directory.
 */

import { Box, Text } from 'ink';
import React from 'react';
import { LOGO_IMAGE } from '../assets/images/logo.image.js';
import { AnsiImageView } from './AnsiImageView.js';

export interface HeaderProps {
  name: string;
  version: string;
  model: string;
  workingDir: string;
}

/**
 * Header component
 *
 * Shows app metadata in a styled info box.
 */
export const Header: React.FC<HeaderProps> = ({ name, version, model, workingDir }) => {
  const maxDirLength = 25;
  const displayDir =
    workingDir.length > maxDirLength ? `...${workingDir.slice(-maxDirLength)}` : workingDir;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" marginBottom={1}>
      <Box flexDirection="row">
        <Box marginRight={1}>
          <AnsiImageView image={LOGO_IMAGE} />
        </Box>
        <Box flexDirection="column" paddingX={1} paddingY={1}>
          <Box marginBottom={1}>
            <Text bold>
              {name} ({version})
            </Text>
          </Box>
          <Text color="gray">
            Model: <Text color="white">{model}</Text>
          </Text>
          <Text color="gray">
            Workdir: <Text color="white">{displayDir}</Text>
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
