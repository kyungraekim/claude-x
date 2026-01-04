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

export const AnimatedStatus: React.FC<AnimatedStatusProps> = ({
  message,
  statusType = "default",
}) => {
  return (
    <Text dimColor italic>
      {message}
    </Text>
  );
};
