import React from 'react';
import { Box, Text } from 'ink';
import type { AnsiImage, AnsiPixel, AnsiPixelRow } from '@claude-x/core';

export const AnsiImageView: React.FC<{ image: AnsiImage }> = ({ image }) => {
  return (
    <Box flexDirection="column">
      {image.map((row: AnsiPixelRow, y: number) => (
        <Box key={y}>
          {row.map((px: AnsiPixel, x: number) => (
            <Text
              key={x}
              backgroundColor={`rgb(${px.bg?.join(',') ?? '0,0,0'})`}
              color={`rgb(${px.fg.join(',')})`}
            >
              {'▄'}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  );
};
