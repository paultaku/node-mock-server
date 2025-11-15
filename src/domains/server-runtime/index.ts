/**
 * Server Runtime Domain - Public Interface
 *
 * This domain handles serving mock responses at runtime.
 * Manages Express server, route matching, and response rendering.
 *
 * Bounded Context: Server Runtime
 * Responsibility: Serve mock responses for HTTP requests
 */

// Main server functions
export { startMockServer } from './mock-server';

// Server management
export {
  MockServerManager,
  MultiServerManager,
  createMockServer,
  createMultiServerManager,
} from './server-manager';

// Types
export type { MockServerConfig } from './server-manager';

// DO NOT import internal utilities (route-matcher, status-tracker, response-renderer)
// These are domain-internal implementation details
