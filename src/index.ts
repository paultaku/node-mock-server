// Main exports for the npm package

// Server functionality
export { startMockServer } from "./server";

// Server management
export {
  MockServerManager,
  MultiServerManager,
  createMockServer,
  createMultiServerManager,
} from "./mock-server-manager";

// Mock generation
export { generateMockFromSwagger } from "./mock-generator";

// Types
export type { MockServerConfig } from "./mock-server-manager";
export type { SwaggerDoc } from "./shared/types/swagger-types";
