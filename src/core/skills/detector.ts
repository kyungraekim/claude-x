/**
 * Skill detector
 *
 * Determines which skill (if any) should be activated based on user input.
 */

import type { Skill, Environment, EnvironmentDetection } from '../../types/index.js';
import { commandExists } from '../../utils/shell.js';
import { logger } from '../../utils/logger.js';

/**
 * Skill detector class
 *
 * Matches user messages to skills and detects environments.
 */
export class SkillDetector {
  private skills: Skill[];

  constructor(skills: Skill[]) {
    this.skills = skills;
  }

  /**
   * Detect which skill matches a user message
   *
   * @param userMessage - Message from user
   * @returns Matching skill or null
   */
  detect(userMessage: string): Skill | null {
    for (const skill of this.skills) {
      // Check each detection pattern
      for (const pattern of skill.detectionPatterns) {
        if (pattern.test(userMessage)) {
          logger.debug(`Detected skill: ${skill.name} for message: ${userMessage}`);
          return skill;
        }
      }
    }

    logger.debug(`No skill detected for message: ${userMessage}`);
    return null;
  }

  /**
   * Find skills for a specific environment
   *
   * @param environment - Target environment
   * @returns Array of matching skills
   */
  findSkillsForEnvironment(environment: Environment): Skill[] {
    return this.skills.filter((skill) => skill.environment === environment);
  }

  /**
   * Get all skills
   *
   * @returns Array of all skills
   */
  getAllSkills(): Skill[] {
    return this.skills;
  }

  /**
   * Detect current training environment
   *
   * Checks for:
   * - Slurm: sbatch, squeue commands
   * - Kubernetes: kubectl command
   * - Local: fallback
   *
   * @returns Environment detection result
   */
  async detectEnvironment(): Promise<EnvironmentDetection> {
    // Check for Slurm
    const hasSbatch = await commandExists('sbatch');
    const hasSqueue = await commandExists('squeue');

    if (hasSbatch && hasSqueue) {
      return {
        environment: 'slurm',
        confidence: 0.9,
        method: 'command_detection',
        details: 'Detected sbatch and squeue commands',
      };
    }

    // Check for Kubernetes
    const hasKubectl = await commandExists('kubectl');

    if (hasKubectl) {
      return {
        environment: 'kubernetes',
        confidence: 0.8,
        method: 'command_detection',
        details: 'Detected kubectl command',
      };
    }

    // Check for Python (local training)
    const hasPython = await commandExists('python3') || await commandExists('python');

    if (hasPython) {
      return {
        environment: 'local',
        confidence: 0.7,
        method: 'command_detection',
        details: 'Detected Python, assuming local environment',
      };
    }

    // Fallback to generic
    return {
      environment: 'generic',
      confidence: 0.5,
      method: 'fallback',
      details: 'No specific environment detected',
    };
  }

  /**
   * Get recommended skill for current environment
   *
   * @returns Recommended skill or null
   */
  async getRecommendedSkill(): Promise<Skill | null> {
    const detection = await this.detectEnvironment();
    const skills = this.findSkillsForEnvironment(detection.environment);

    if (skills.length > 0) {
      logger.info(`Recommended skill for ${detection.environment}: ${skills[0]!.name}`);
      return skills[0]!;
    }

    return null;
  }
}
