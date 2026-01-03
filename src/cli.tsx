#!/usr/bin/env bun
/**
 * CLI entry point
 *
 * Main command-line interface for claude-x.
 */

import React from 'react';
import { render } from 'ink';
import { program } from 'commander';
import chalk from 'chalk';

// Core imports
import { Agent } from './core/agent/agent.js';
import { ToolRegistry } from './core/tools/registry.js';
import { createLLMClient } from './core/llm/factory.js';
import { SkillLoader, SkillDetector, SkillExecutor } from './core/skills/index.js';

// Tools
import { getDefaultTools } from './tools/index.js';

// Utils
import { loadConfig, initializeConfig, isConfigInitialized } from './utils/config.js';
import { logger, createLogger } from './utils/logger.js';
import { detectPlatform } from './utils/platform.js';

// UI
import { App } from './ui/App.js';

// Constants
import { SYSTEM_PROMPTS } from './constants.js';

/**
 * Main CLI program
 */
async function main() {
  program
    .name('claude-x')
    .description('TypeScript-based AI coding agent CLI tool for ML training environments')
    .version('1.0.0');

  /**
   * Init command
   */
  program
    .command('init')
    .description('Initialize configuration and skills directories')
    .action(async () => {
      console.log(chalk.cyan('Initializing claude-x...'));

      try {
        await initializeConfig();
        console.log(chalk.green('✓ Configuration initialized'));
        console.log(chalk.gray('  Config directory: ~/.claude-x/'));
        console.log(chalk.gray('  Workspace: ~/.claude-x/workspace/'));
        console.log(chalk.gray('  Skills: ~/.claude-x/skills/'));
        console.log(chalk.gray('  Outputs: ~/.claude-x/outputs/'));
        console.log();
        console.log(chalk.yellow('Next steps:'));
        console.log(chalk.gray('  1. Set your API key in environment or .env file'));
        console.log(chalk.gray('  2. Run: claude-x chat'));
      } catch (error) {
        console.error(chalk.red('Failed to initialize:'), error);
        process.exit(1);
      }
    });

  /**
   * Chat command
   */
  program
    .command('chat')
    .description('Start interactive chat session')
    .option('-m, --model <model>', 'LLM model to use')
    .option('-p, --provider <provider>', 'LLM provider (anthropic|openai)')
    .option('--verbose', 'Enable verbose logging')
    .action(async (options) => {
      try {
        // Load configuration
        const config = await loadConfig();

        // Override with CLI options
        if (options.model) {
          config.model = options.model;
        }
        if (options.provider) {
          config.llmProvider = options.provider;
        }
        if (options.verbose) {
          config.logLevel = 'debug';
          logger.setLevel('debug');
        }

        // Create LLM client
        const llm = createLLMClient(config);

        // Create tool registry and register tools
        const toolRegistry = new ToolRegistry();
        toolRegistry.registerAll(getDefaultTools());

        // Load skills
        const skillLoader = new SkillLoader(config.skillsPath);
        const skills = await skillLoader.loadAll();
        logger.info(`Loaded ${skills.length} skills`);

        // Create agent
        const agent = new Agent(llm, toolRegistry, {
          maxIterations: config.maxIterations,
          tools: toolRegistry.getAll(),
          systemPrompt: SYSTEM_PROMPTS.default,
        });

        // Render UI
        render(<App agent={agent} />);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  /**
   * Run command
   */
  program
    .command('run <task>')
    .description('Execute a one-shot task')
    .option('-m, --model <model>', 'LLM model to use')
    .option('-p, --provider <provider>', 'LLM provider (anthropic|openai)')
    .option('--verbose', 'Enable verbose logging')
    .action(async (task, options) => {
      try {
        // Load configuration
        const config = await loadConfig();

        // Override with CLI options
        if (options.model) {
          config.model = options.model;
        }
        if (options.provider) {
          config.llmProvider = options.provider;
        }
        if (options.verbose) {
          config.logLevel = 'debug';
          logger.setLevel('debug');
        }

        // Create LLM client
        const llm = createLLMClient(config);

        // Create tool registry
        const toolRegistry = new ToolRegistry();
        toolRegistry.registerAll(getDefaultTools());

        // Create agent
        const agent = new Agent(llm, toolRegistry, {
          maxIterations: config.maxIterations,
          tools: toolRegistry.getAll(),
          systemPrompt: SYSTEM_PROMPTS.default,
        });

        // Render UI with initial message
        render(<App agent={agent} initialMessage={task} />);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  /**
   * Train command
   */
  program
    .command('train <description>')
    .description('Training-specific mode with environment detection')
    .option('-m, --model <model>', 'LLM model to use')
    .option('-p, --provider <provider>', 'LLM provider (anthropic|openai)')
    .option('-e, --environment <env>', 'Force environment (local|slurm|kubernetes)')
    .option('--verbose', 'Enable verbose logging')
    .action(async (description, options) => {
      try {
        // Load configuration
        const config = await loadConfig();

        // Override with CLI options
        if (options.model) {
          config.model = options.model;
        }
        if (options.provider) {
          config.llmProvider = options.provider;
        }
        if (options.verbose) {
          config.logLevel = 'debug';
          logger.setLevel('debug');
        }

        // Create LLM client
        const llm = createLLMClient(config);

        // Create tool registry
        const toolRegistry = new ToolRegistry();
        toolRegistry.registerAll(getDefaultTools());

        // Load skills
        const skillLoader = new SkillLoader(config.skillsPath);
        const skills = await skillLoader.loadAll();
        const skillDetector = new SkillDetector(skills);

        // Detect environment or use forced environment
        let environment;
        if (options.environment) {
          environment = { environment: options.environment };
          logger.info(`Using forced environment: ${options.environment}`);
        } else {
          environment = await skillDetector.detectEnvironment();
          logger.info(`Detected environment: ${environment.environment} (confidence: ${environment.confidence})`);
        }

        // Find appropriate skill
        const envSkills = skillDetector.findSkillsForEnvironment(environment.environment);
        const selectedSkill = envSkills[0];

        // Create agent with training prompt
        const agent = new Agent(llm, toolRegistry, {
          maxIterations: config.maxIterations,
          tools: toolRegistry.getAll(),
          systemPrompt: SYSTEM_PROMPTS.training,
        });

        // Add skill to prompt if found
        if (selectedSkill) {
          const skillExecutor = new SkillExecutor();
          const processedSkill = await skillExecutor.execute(selectedSkill, {
            environment: environment.environment,
            platform: detectPlatform(),
            workingDir: process.cwd(),
          });
          agent.addSkillToPrompt(processedSkill);
          logger.info(`Activated skill: ${selectedSkill.name}`);
        }

        // Render UI
        render(<App agent={agent} initialMessage={description} />);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  /**
   * Parse arguments
   */
  program.parse();
}

// Run main function
main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
