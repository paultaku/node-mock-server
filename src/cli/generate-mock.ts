#!/usr/bin/env node

/**
 * CLI Entry Point
 *
 * Minimal entry point that delegates to the CLI Tools domain.
 * This file is kept as the executable entry point for the npm package.
 */

import { executeGenerateCommand } from "../domains/cli-tools";

// Execute the generate command
executeGenerateCommand();
