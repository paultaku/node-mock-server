/**
 * Generate Command
 *
 * CLI command for generating mock files from Swagger/OpenAPI specifications.
 * Orchestrates the mock generation workflow.
 */

import { generateMockFromSwagger } from "../mock-generation";
import {
  createGenerateCommand,
  parseGenerateOptions,
} from "./command-parser";

/**
 * Execute the generate command
 * Parses CLI arguments and triggers mock generation
 */
export async function executeGenerateCommand(): Promise<void> {
  const program = createGenerateCommand();
  program.parse(process.argv);

  const { swaggerPath, outputPath } = parseGenerateOptions(program);

  try {
    await generateMockFromSwagger(swaggerPath, outputPath);
    console.log("✅ Mock files generated successfully!");
  } catch (error) {
    console.error("❌ Failed to generate mock files:", error);
    process.exit(1);
  }
}
