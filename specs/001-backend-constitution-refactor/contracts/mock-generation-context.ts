/**
 * Mock Generation Context - Public Interface Contract
 *
 * This defines the bounded context interface for the Mock Generation domain.
 * External domains (CLI Tools, etc.) should only depend on these types and interfaces.
 *
 * @module MockGenerationContext
 */

export interface MockGenerationService {
  /**
   * Generate mock response files from a Swagger/OpenAPI specification
   *
   * @param swaggerPath - Absolute or relative path to swagger.yaml or swagger.json
   * @param outputDir - Directory where mock files will be generated
   * @returns Generation result with statistics and any errors encountered
   */
  generateFromSwagger(swaggerPath: string, outputDir: string): Promise<GenerationResult>;
}

export interface GenerationResult {
  /** Number of mock files successfully created */
  filesCreated: number;

  /** List of routes extracted from the specification */
  routes: RouteDefinition[];

  /** Any errors or warnings encountered during generation */
  errors: GenerationError[];

  /** Time taken to generate mocks (milliseconds) */
  duration: number;
}

export interface RouteDefinition {
  /** HTTP path (e.g., "/pets/{petId}") */
  path: string;

  /** HTTP method */
  method: HttpMethod;

  /** Available response status codes */
  statuses: HttpStatus[];

  /** Parameter definitions (path, query, header) */
  parameters: ParameterDefinition[];
}

export interface ParameterDefinition {
  name: string;
  in: 'path' | 'query' | 'header' | 'body';
  required: boolean;
  type: string;
}

export interface GenerationError {
  /** Error severity */
  level: 'error' | 'warning';

  /** Human-readable error message */
  message: string;

  /** Location in Swagger spec where error occurred */
  location?: string;
}

/**
 * Factory function to create a MockGenerationService instance
 * This is the primary entry point for this domain
 */
export type CreateMockGenerationService = () => MockGenerationService;

/**
 * Shared types re-exported for convenience
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
export type HttpStatus = number; // 200, 201, 400, 404, 500, etc.
