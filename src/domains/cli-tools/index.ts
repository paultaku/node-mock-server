/**
 * CLI Tools Domain - Public Interface
 *
 * This domain handles command-line interface operations.
 * Provides CLI commands for mock generation and server management.
 *
 * Bounded Context: CLI Tools
 * Responsibility: Parse CLI arguments and execute commands
 */

// Main command executor
export { executeGenerateCommand } from './generate-command';

// Command parsing utilities
export { createGenerateCommand, parseGenerateOptions } from './command-parser';

// Types
export type { GenerateCommandOptions } from './command-parser';

// DO NOT import internal implementation details
// This domain orchestrates Mock Generation and Server Runtime domains
