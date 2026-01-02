/**
 * Skills system type definitions
 *
 * Skills are markdown-based guides that provide environment-specific
 * instructions and best practices to the LLM agent.
 */

/**
 * Training environment type
 */
export type Environment = 'local' | 'slurm' | 'kubernetes' | 'generic';

/**
 * Platform type
 */
export type Platform = 'windows' | 'darwin' | 'linux';

/**
 * Skill definition
 */
export interface Skill {
  /**
   * Unique skill name (e.g., 'train-local', 'train-slurm')
   */
  name: string;

  /**
   * Human-readable description
   */
  description: string;

  /**
   * Trigger patterns for skill activation
   * When user message matches any trigger, this skill is loaded
   */
  triggers: string[];

  /**
   * Target environment for this skill
   */
  environment: Environment;

  /**
   * Markdown content of the skill
   * This becomes part of the system prompt when activated
   */
  content: string;

  /**
   * Regex patterns for detecting if this skill applies
   */
  detectionPatterns: RegExp[];

  /**
   * File path where skill was loaded from
   */
  filePath?: string;
}

/**
 * Context for skill execution
 */
export interface SkillContext {
  /**
   * Current environment
   */
  environment: Environment;

  /**
   * Current working directory
   */
  workingDir: string;

  /**
   * Current platform (OS)
   */
  platform: Platform;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Skill metadata (parsed from markdown frontmatter)
 */
export interface SkillMetadata {
  name: string;
  triggers: string[];
  environment: Environment;
  description?: string;
}

/**
 * Environment detection result
 */
export interface EnvironmentDetection {
  /**
   * Detected environment
   */
  environment: Environment;

  /**
   * Confidence level (0-1)
   */
  confidence: number;

  /**
   * Detection method used
   */
  method: string;

  /**
   * Additional details about detection
   */
  details?: string;
}
