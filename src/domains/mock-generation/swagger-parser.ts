/**
 * Swagger Parser
 *
 * Parses and validates Swagger/OpenAPI specification files.
 * Handles YAML parsing and schema validation.
 */

import * as yaml from "yaml";
import { SwaggerDocSchema, SwaggerDoc } from "../../shared/types/swagger-types";
import { readFile } from "../../shared/file-system";

/**
 * Parse a Swagger/OpenAPI specification file
 * @param swaggerPath - Path to the Swagger YAML file
 * @returns Parsed and validated Swagger document
 */
export async function parseSwaggerSpec(swaggerPath: string): Promise<SwaggerDoc> {
  const raw = await readFile(swaggerPath);
  const doc = yaml.parse(raw);

  // Type validation using Zod schema
  const swagger: SwaggerDoc = SwaggerDocSchema.parse(doc);
  return swagger;
}

/**
 * Get all paths from a Swagger document
 * @param swagger - Parsed Swagger document
 * @returns Array of API paths
 */
export function getSwaggerPaths(swagger: SwaggerDoc): string[] {
  return Object.keys(swagger.paths);
}

/**
 * Get methods for a specific path
 * @param swagger - Parsed Swagger document
 * @param apiPath - API path to query
 * @returns Object containing method definitions
 */
export function getPathMethods(swagger: SwaggerDoc, apiPath: string): Record<string, any> {
  return swagger.paths[apiPath] as Record<string, any>;
}

/**
 * Get components (schemas, responses, etc.) from Swagger document
 * @param swagger - Parsed Swagger document
 * @returns Components object
 */
export function getComponents(swagger: SwaggerDoc): any {
  return swagger.components || {};
}
