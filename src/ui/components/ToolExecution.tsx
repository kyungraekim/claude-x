/**
 * Tool execution component
 *
 * Displays tool execution with spinner and results.
 */

import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type { ToolCall, ToolResult } from '../../types/index.js';

export interface ToolExecutionProps {
  toolCall: ToolCall;
  result?: ToolResult;
  isExecuting?: boolean;
}

/**
 * Tool execution component
 */
export const ToolExecution: React.FC<ToolExecutionProps> = ({
  toolCall,
  result,
  isExecuting = false,
}) => {
  return (
    <Box flexDirection="column" marginLeft={2} marginY={1}>
      {/* Tool call header */}
      <Box>
        {isExecuting && (
          <Box marginRight={1}>
            <Text color="yellow">
              <Spinner type="dots" />
            </Text>
          </Box>
        )}
        {!isExecuting && result && (
          <Text color={result.success ? 'green' : 'red'}>
            {result.success ? '✓' : '✗'}
          </Text>
        )}
        <Text color="yellow" bold marginLeft={1}>
          Tool: {toolCall.name}
        </Text>
      </Box>

      {/* Tool parameters */}
      <Box marginLeft={2}>
        <Text dimColor>
          {JSON.stringify(toolCall.input)}
        </Text>
      </Box>

      {/* Tool result */}
      {result && (
        <Box flexDirection="column" marginLeft={2} marginTop={1}>
          <Text color={result.success ? 'green' : 'red'}>
            {result.success ? 'Success' : 'Failed'}
          </Text>
          {result.output && (
            <Box marginTop={1}>
              <Text>{result.output}</Text>
            </Box>
          )}
          {result.error && (
            <Box marginTop={1}>
              <Text color="red">Error: {result.error}</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
