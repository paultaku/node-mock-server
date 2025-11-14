/**
 * Mock File Generator
 *
 * Generates mock response files from parsed Swagger specifications.
 * Handles file organization and directory structure creation.
 */

import * as path from "path";
import { writeJson, ensureDirectory } from "../../shared/file-system";
import { parseSwaggerSpec, getSwaggerPaths, getPathMethods, getComponents } from "./swagger-parser";
import { buildMockResponseBody, generateDefaultResponses } from "./response-builder";

/**
 * Safe filename generation
 * Sanitizes strings to be used as filenames
 */
function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-") // Convert spaces to -
    .replace(/[^a-z0-9\-_]/g, "-") // Convert all illegal characters to -
    .replace(/-+/g, "-") // Merge consecutive -
    .replace(/^-|-$/g, "") // Remove leading and trailing -
    .substring(0, 100); // Limit length
}

/**
 * HTTP methods supported by the mock server
 */
const SUPPORTED_HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
];

/**
 * Generation result with statistics and metadata
 */
export interface GenerationResult {
  filesCreated: number;
  pathsProcessed: number;
  outputDirectory: string;
}

/**
 * Generate mock files from a Swagger/OpenAPI specification
 * @param swaggerPath - Path to the Swagger YAML file
 * @param outputPath - Directory where mock files will be created
 * @returns Generation result with statistics
 */
export async function generateMockFromSwagger(
  swaggerPath: string,
  outputPath: string
): Promise<GenerationResult> {
  try {
    console.log(`Reading Swagger file: ${swaggerPath}`);

    // Parse Swagger specification
    const swagger = await parseSwaggerSpec(swaggerPath);
    const components = getComponents(swagger);

    const paths = getSwaggerPaths(swagger);
    console.log(`Processing ${paths.length} paths...`);

    let filesCreated = 0;
    let pathsProcessed = 0;

    // Iterate over paths
    for (const apiPath of paths) {
      const methods = getPathMethods(swagger, apiPath);

      for (const [method, operation] of Object.entries<any>(methods)) {
        const methodUpper = method.toUpperCase();

        // Skip non-HTTP methods
        if (!SUPPORTED_HTTP_METHODS.includes(methodUpper)) {
          continue;
        }

        // Build directory path
        const pathParts = apiPath.replace(/^\//, "").split("/");
        const safePathParts = pathParts.map((part) => {
          // Keep path parameter format {paramName}
          if (part.startsWith("{") && part.endsWith("}")) {
            return part;
          }
          // Sanitize other parts
          return sanitizeFileName(part);
        });

        const endpointDir = path.join(
          outputPath,
          ...safePathParts,
          methodUpper
        );
        await ensureDirectory(endpointDir);

        console.log(`Generated directory: ${endpointDir}`);

        // Handle responses
        const responses = operation.responses || generateDefaultResponses();

        for (const [status, resp] of Object.entries<any>(responses)) {
          const desc = resp.description
            ? sanitizeFileName(resp.description)
            : "response";

          const fileName = `${desc}-${status}.json`;
          const filePath = path.join(endpointDir, fileName);

          // Generate mock data
          const mockBody = buildMockResponseBody(resp, status, components);

          const mock = {
            header: [],
            body: mockBody,
          };

          await writeJson(filePath, mock, { spaces: 2 });
          console.log(`Generated mock file: ${filePath}`);
          filesCreated++;
        }

        pathsProcessed++;
      }
    }

    console.log("Mock generation completed successfully!");

    return {
      filesCreated,
      pathsProcessed,
      outputDirectory: outputPath,
    };
  } catch (error) {
    console.error("Error generating mock files:", error);
    throw error;
  }
}
