import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import type { AnsiImage, AnsiPixel, AnsiPixelRow } from '@claude-x/core';

// Animation interval constant
const ANIMATION_INTERVAL = 100; // 100ms per frame

// Type guard to detect if image is animated
function isAnimatedImage(image: AnsiImage | AnsiImage[]): image is AnsiImage[] {
  return (
    Array.isArray(image) &&
    image.length > 0 &&
    Array.isArray(image[0]) &&
    Array.isArray(image[0][0])
  );
}

export const AnsiImageView: React.FC<{
  image: AnsiImage | AnsiImage[];
}> = ({ image }) => {
  // State for animation
  const [currentFrame, setCurrentFrame] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);

  // Detect if animation is needed
  const isAnimated = isAnimatedImage(image);
  const frames = isAnimated ? image : [image];
  const shouldAnimate = isAnimated && frames.length > 1 && !hasPlayed;

  // Animation effect
  useEffect(() => {
    if (!shouldAnimate) return;

    const timer = setInterval(() => {
      setCurrentFrame((prev) => {
        const nextFrame = prev + 1;

        // Stop at last frame (play once)
        if (nextFrame >= frames.length - 1) {
          setHasPlayed(true);
          clearInterval(timer);
          return frames.length - 1;
        }

        return nextFrame;
      });
    }, ANIMATION_INTERVAL);

    return () => clearInterval(timer);
  }, [shouldAnimate, frames.length]);

  // Reset animation when image prop changes
  useEffect(() => {
    setCurrentFrame(0);
    setHasPlayed(false);
  }, [image]);

  // Render current frame (with fallback to first frame for safety)
  const currentImage = frames[currentFrame] ?? frames[0];

  // Safety check: if no frames available, render nothing
  if (!currentImage) {
    return null;
  }

  return (
    <Box flexDirection="column">
      {currentImage.map((row: AnsiPixelRow, y: number) => (
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
