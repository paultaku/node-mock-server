/**
 * Mock Generation Domain - Public Interface
 *
 * This domain handles parsing Swagger/OpenAPI specifications
 * and generating mock response files.
 *
 * Bounded Context: Mock Generation
 * Responsibility: Transform API specifications into mock data files
 */

// Main service function
export { generateMockFromSwagger } from './mock-file-generator';

// Types
export type { GenerationResult } from './mock-file-generator';

// DO NOT import internal utilities (swagger-parser, response-builder)
// These are domain-internal implementation details
