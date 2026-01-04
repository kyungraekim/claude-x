import { Box, Text } from 'ink';
import type { AnsiImage } from '../../types';

export const AnsiImageView: React.FC<{ image: AnsiImage }> = ({ image }) => {
  return (
    <Box flexDirection="column">
      {image.map((row, y) => (
        <Box key={y}>
          {row.map((px, x) => (
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
