/**
 * Server Entry Point
 *
 * Minimal facade that delegates to the Server Runtime domain.
 * This file is kept for backward compatibility and as the main entry point.
 */

import { startMockServer } from "./domains/server-runtime";

// Re-export the main function
export { startMockServer };

// If this file is run directly, start the server
if (require.main === module) {
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  const MOCK_ROOT = process.env.MOCK_ROOT;
  startMockServer(PORT, MOCK_ROOT).catch((error) => {
    console.error("Failed to start mock server:", error);
    process.exit(1);
  });
}
