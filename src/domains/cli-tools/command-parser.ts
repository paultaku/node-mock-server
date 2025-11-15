/**
 * Command Parser
 *
 * Parses and validates CLI arguments using Commander.js.
 * Provides utilities for CLI option handling.
 */

import { Command } from "commander";
import path from "path";

/**
 * Options for the generate command
 */
export interface GenerateCommandOptions {
  swagger: string;
  output: string;
}

/**
 * Create and configure the generate command
 * @returns Configured Command instance
 */
export function createGenerateCommand(): Command {
  const program = new Command();

  program
    .name("node-mock-server")
    .description("Generate mock files from Swagger YAML")
    .version("1.1.0-rc-4")
    .requiredOption("-s, --swagger <path>", "Path to swagger yaml file")
    .requiredOption("-o, --output <path>", "Output mock root directory");

  return program;
}

/**
 * Parse generate command options
 * @param program - Configured Command instance
 * @returns Parsed options with resolved paths
 */
export function parseGenerateOptions(program: Command): {
  swaggerPath: string;
  outputPath: string;
} {
  const options = program.opts<GenerateCommandOptions>();

  return {
    swaggerPath: path.resolve(options.swagger),
    outputPath: path.resolve(options.output),
  };
}
