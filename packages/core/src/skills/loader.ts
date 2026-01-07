/**
 * Skill loader
 *
 * Loads skills from markdown files and parses metadata.
 */

import { glob } from 'glob';
import type { Skill, SkillMetadata, Environment } from '../types/index.js';
import { readFile } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

/**
 * Skill loader class
 *
 * Loads markdown-based skills from a directory.
 */
export class SkillLoader {
  private skillsPath: string;

  constructor(skillsPath: string) {
    this.skillsPath = skillsPath;
  }

  /**
   * Load all skills from the skills directory
   *
   * @returns Array of loaded skills
   */
  async loadAll(): Promise<Skill[]> {
    try {
      // Find all markdown files
      const pattern = `${this.skillsPath}/**/*.md`;
      const files = await glob(pattern);

      logger.debug(`Found ${files.length} skill files in ${this.skillsPath}`);

      const skills: Skill[] = [];

      for (const file of files) {
        try {
          const skill = await this.loadSkillFile(file);
          if (skill) {
            skills.push(skill);
            logger.debug(`Loaded skill: ${skill.name} from ${file}`);
          }
        } catch (error) {
          logger.warn(`Failed to load skill from ${file}:`, error);
        }
      }

      return skills;
    } catch (error) {
      logger.error('Failed to load skills:', error);
      return [];
    }
  }

  /**
   * Load a single skill file
   *
   * @param filePath - Path to skill markdown file
   * @returns Parsed skill or null if invalid
   */
  async loadSkillFile(filePath: string): Promise<Skill | null> {
    try {
      const content = await readFile(filePath);

      // Parse metadata from HTML comments
      const metadata = this.parseMetadata(content);

      if (!metadata || !metadata.name) {
        logger.warn(`Skill file ${filePath} missing required metadata (name)`);
        return null;
      }

      // Create detection patterns from triggers
      const detectionPatterns = metadata.triggers.map((trigger) => {
        // Escape special regex characters except wildcards
        const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(escaped, 'i'); // Case-insensitive
      });

      return {
        name: metadata.name,
        description: metadata.description || `Skill: ${metadata.name}`,
        triggers: metadata.triggers,
        environment: metadata.environment,
        content,
        detectionPatterns,
        filePath,
      };
    } catch (error) {
      logger.error(`Error loading skill from ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Parse metadata from markdown HTML comments
   *
   * Expected format:
   * <!-- name: skill-name -->
   * <!-- triggers: trigger1, trigger2, trigger3 -->
   * <!-- environment: local -->
   * <!-- description: Optional description -->
   *
   * @param content - Markdown content
   * @returns Parsed metadata or null
   */
  private parseMetadata(content: string): SkillMetadata | null {
    const metadata: Partial<SkillMetadata> = {};

    // Extract name
    const nameMatch = content.match(/<!--\s*name:\s*(.+?)\s*-->/);
    if (nameMatch) {
      metadata.name = nameMatch[1]!.trim();
    }

    // Extract triggers
    const triggersMatch = content.match(/<!--\s*triggers:\s*(.+?)\s*-->/);
    if (triggersMatch) {
      metadata.triggers = triggersMatch[1]!
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    } else {
      metadata.triggers = [];
    }

    // Extract environment
    const envMatch = content.match(/<!--\s*environment:\s*(.+?)\s*-->/);
    if (envMatch) {
      const env = envMatch[1]!.trim() as Environment;
      metadata.environment = env;
    } else {
      metadata.environment = 'generic';
    }

    // Extract description (optional)
    const descMatch = content.match(/<!--\s*description:\s*(.+?)\s*-->/);
    if (descMatch) {
      metadata.description = descMatch[1]!.trim();
    }

    // Validate required fields
    if (!metadata.name) {
      return null;
    }

    return metadata as SkillMetadata;
  }

  /**
   * Reload all skills
   *
   * TODO: Implement hot-reloading with file watching
   *
   * @returns Newly loaded skills
   */
  async reload(): Promise<Skill[]> {
    logger.info('Reloading skills...');
    return await this.loadAll();
  }
}
