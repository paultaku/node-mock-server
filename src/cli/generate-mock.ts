#!/usr/bin/env node

import { Command } from "commander";
import { generateMockFromSwagger } from "../domains/mock-generation";
import path from "path";

const program = new Command();

program
  .name("node-mock-server")
  .description("Generate mock files from Swagger YAML")
  .version("1.1.0-rc-4")
  .requiredOption("-s, --swagger <path>", "Path to swagger yaml file")
  .requiredOption("-o, --output <path>", "Output mock root directory")
  .parse(process.argv);

const options = program.opts();

(async () => {
  try {
    const swaggerPath = path.resolve(options.swagger);
    const outputPath = path.resolve(options.output);
    await generateMockFromSwagger(swaggerPath, outputPath);
    console.log("✅ Mock files generated successfully!");
  } catch (error) {
    console.error("❌ Failed to generate mock files:", error);
    process.exit(1);
  }
})();
