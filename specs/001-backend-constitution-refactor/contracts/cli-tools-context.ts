/**
 * CLI Tools Context - Public Interface Contract
 *
 * This defines the bounded context interface for the CLI Tools domain.
 * This domain primarily CONSUMES other domains and has minimal public interface.
 *
 * @module CliToolsContext
 */

export interface CliCommand {
  /**
   * Execute the CLI command with given arguments
   *
   * @param args - Command-line arguments (from process.argv.slice(2))
   * @returns Exit code (0 = success, 1 = error)
   */
  execute(args: string[]): Promise<ExitCode>;
}

export type ExitCode = 0 | 1;

/**
 * Parsed command options for mock generation
 */
export interface GenerateCommandOptions {
  /** Path to Swagger/OpenAPI file */
  swaggerPath: string;

  /** Output directory for generated mocks */
  outputDir: string;

  /** Verbose output */
  verbose?: boolean;

  /** Force overwrite existing files */
  force?: boolean;
}

/**
 * Result of CLI command execution (for programmatic use)
 */
export interface CliResult {
  /** Exit code */
  exitCode: ExitCode;

  /** Output messages */
  output: string[];

  /** Error messages */
  errors: string[];
}

/**
 * Factory function to create CLI command instance
 */
export type CreateCliCommand = (commandName: string) => CliCommand;
