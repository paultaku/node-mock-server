#!/usr/bin/env ts-node
const { Command } = require("commander");
const { generateMockFromSwagger } = require("../mock-generator");
const path = require("path");

const program = new Command();

program
  .requiredOption("-s, --swagger <path>", "Path to swagger yaml file")
  .requiredOption("-o, --output <path>", "Output mock root directory")
  .parse(process.argv);

const options = program.opts();

(async () => {
  const swaggerPath = path.resolve(options.swagger);
  const outputPath = path.resolve(options.output);
  await generateMockFromSwagger(swaggerPath, outputPath);
  console.log("Mock files generated successfully!");
})();
