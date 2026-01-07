/**
 * AnimatedStatus component
 *
 * Displays status messages with rich animations:
 * - Symbol progression (snowflakes, gears, etc.)
 * - Color cycling
 * - Animated dots
 */

import React, { useEffect, useState } from "react";
import { Text } from "ink";

export type StatusType =
  | "thinking"
  | "executing"
  | "iterating"
  | "done"
  | "error"
  | "default";

export interface AnimatedStatusProps {
  message: string;
  statusType?: StatusType;
}

// Animation intervals (in milliseconds)
const SYMBOL_INTERVAL = 300; // 300ms per symbol frame
const COLOR_INTERVAL = 400;  // 400ms per color change
const DOT_INTERVAL = 500;    // 500ms per dot state

// Symbol sets for different status types
const SYMBOL_SETS: Record<StatusType, string[]> = {
  thinking: ['*', '✦', '✧', '❄'],        // Snowflakes (crystallizing thought)
  executing: ['⚙', '⚡', '⚙', '⚡'],       // Gears/lightning (action)
  iterating: ['◐', '◓', '◑', '◒'],       // Moon phases (cycles)
  done: ['✓'],                            // Single checkmark (static)
  error: ['✗'],                           // Single X (static)
  default: ['⋯'],                         // Ellipsis (static)
};

// Color cycles for different status types
const COLOR_CYCLES: Record<StatusType, string[]> = {
  thinking: ['cyan', 'blue', 'magenta', 'cyan'],
  executing: ['yellow', 'green', 'yellow', 'green'],
  iterating: ['magenta', 'cyan', 'blue', 'magenta'],
  done: ['green'],      // Static green
  error: ['red'],       // Static red
  default: ['gray'],    // Static gray
};

// Dot animation frames
const DOT_FRAMES = ['.', '..', '...'];

export const AnimatedStatus: React.FC<AnimatedStatusProps> = ({
  message,
  statusType = "default",
}) => {
  // Animation frame indices
  const [symbolFrame, setSymbolFrame] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const [dotIndex, setDotIndex] = useState(0);

  // Get current arrays based on statusType
  const symbols = SYMBOL_SETS[statusType];
  const colors = COLOR_CYCLES[statusType];
  const isAnimated = symbols.length > 1;

  // Calculate current values
  const currentSymbol = symbols[symbolFrame];
  const currentColor = colors[colorIndex];
  const currentDots = isAnimated ? DOT_FRAMES[dotIndex] : '';

  // Symbol animation
  useEffect(() => {
    if (!isAnimated) return;
    
    const timer = setInterval(() => {
      setSymbolFrame((prev) => (prev + 1) % symbols.length);
    }, SYMBOL_INTERVAL);

    return () => clearInterval(timer);
  }, [symbols, isAnimated]);

  // Color animation
  useEffect(() => {
    if (colors.length === 1) return;

    const timer = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % colors.length);
    }, COLOR_INTERVAL);

    return () => clearInterval(timer);
  }, [colors, statusType]);

  // Dot animation
  useEffect(() => {
    if (!isAnimated) return;

    const timer = setInterval(() => {
      setDotIndex((prev) => (prev + 1) % DOT_FRAMES.length);
    }, DOT_INTERVAL);

    return () => clearInterval(timer);
  }, [isAnimated]);

  // Reset animations when message changes
  useEffect(() => {
    setSymbolFrame(0);
    setColorIndex(0);
    setDotIndex(0);
  }, [message]);

  return (
    <Text color={currentColor} dimColor>
      {currentSymbol} {message}{currentDots}
    </Text>
  );
};
