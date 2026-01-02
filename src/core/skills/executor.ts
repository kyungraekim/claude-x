/**
 * Skill executor
 *
 * Executes skills by replacing variables and preparing content for system prompt.
 */

import type { Skill, SkillContext } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

/**
 * Skill executor class
 *
 * Processes skill content and replaces variables.
 */
export class SkillExecutor {
  /**
   * Execute a skill with context
   *
   * Replaces variables in skill content:
   * - {{WORKING_DIR}} -> context.workingDir
   * - {{ENVIRONMENT}} -> context.environment
   * - {{PLATFORM}} -> context.platform
   * - {{METADATA.key}} -> context.metadata.key
   *
   * @param skill - Skill to execute
   * @param context - Execution context
   * @returns Processed skill content
   */
  async execute(skill: Skill, context: SkillContext): Promise<string> {
    logger.debug(`Executing skill: ${skill.name}`, context);

    let content = skill.content;

    // Replace standard variables
    content = content.replace(/\{\{WORKING_DIR\}\}/g, context.workingDir);
    content = content.replace(/\{\{ENVIRONMENT\}\}/g, context.environment);
    content = content.replace(/\{\{PLATFORM\}\}/g, context.platform);

    // Replace metadata variables
    if (context.metadata) {
      for (const [key, value] of Object.entries(context.metadata)) {
        const pattern = new RegExp(`\\{\\{METADATA\\.${key}\\}\\}`, 'g');
        content = content.replace(pattern, String(value));
      }
    }

    return content;
  }

  /**
   * Get available variables for a context
   *
   * @param context - Execution context
   * @returns Map of variable names to values
   */
  getAvailableVariables(context: SkillContext): Record<string, string> {
    const variables: Record<string, string> = {
      WORKING_DIR: context.workingDir,
      ENVIRONMENT: context.environment,
      PLATFORM: context.platform,
    };

    // Add metadata variables
    if (context.metadata) {
      for (const [key, value] of Object.entries(context.metadata)) {
        variables[`METADATA.${key}`] = String(value);
      }
    }

    return variables;
  }

  /**
   * Validate skill content for required variables
   *
   * Checks if all variable placeholders can be resolved
   *
   * @param skill - Skill to validate
   * @param context - Execution context
   * @returns True if all variables can be resolved
   */
  validateVariables(skill: Skill, context: SkillContext): boolean {
    const availableVars = this.getAvailableVariables(context);
    const requiredVars = this.extractVariables(skill.content);

    for (const varName of requiredVars) {
      if (!(varName in availableVars)) {
        logger.warn(`Skill ${skill.name} requires variable ${varName} which is not available`);
        return false;
      }
    }

    return true;
  }

  /**
   * Extract variable names from skill content
   *
   * @param content - Skill content
   * @returns Array of variable names
   */
  private extractVariables(content: string): string[] {
    const pattern = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = pattern.exec(content)) !== null) {
      if (match[1]) {
        variables.add(match[1]);
      }
    }

    return Array.from(variables);
  }
}
