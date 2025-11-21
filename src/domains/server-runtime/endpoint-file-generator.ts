/**
 * Endpoint File Generator
 *
 * Generates file structure and JSON templates for mock endpoints.
 * Creates folder structure mirroring API paths with default response files.
 */

import * as path from "path";
import { writeJson, ensureDirectory } from "../../shared/file-system";

export interface EndpointFileConfig {
  mockRoot: string;
  path: string;
  method: string;
}

export interface EndpointFileResult {
  filesCreated: string[];
  mockDirectory: string;
}

/**
 * Generate file structure and templates for a mock endpoint
 *
 * @param config - Configuration for endpoint file generation
 * @returns Result containing list of created files and directory path
 *
 * @example
 * ```ts
 * const result = await generateEndpointFiles({
 *   mockRoot: '/mock',
 *   path: '/pet/status/{id}',
 *   method: 'GET'
 * });
 * // Creates: /mock/pet/status/{id}/GET/
 * //   - success-200.json
 * //   - unexpected-error-default.json
 * //   - status.json
 * ```
 */
export async function generateEndpointFiles(
  config: EndpointFileConfig
): Promise<EndpointFileResult> {
  const { mockRoot, path: apiPath, method } = config;

  // Parse path into segments (remove leading /, split on /)
  const pathSegments = apiPath.substring(1).split("/");

  // Build directory path: <mockRoot>/{segments}/{METHOD}
  const endpointDir = path.join(mockRoot, ...pathSegments, method.toUpperCase());

  // Ensure directory exists
  await ensureDirectory(endpointDir);

  // Define file paths
  const successFile = path.join(endpointDir, "success-200.json");
  const errorFile = path.join(endpointDir, "unexpected-error-default.json");
  const statusFile = path.join(endpointDir, "status.json");

  // Write JSON templates
  await Promise.all([
    writeJson(
      successFile,
      {
        header: [],
        body: {
          status: "success",
          message: "Mock response",
        },
      },
      { spaces: 2 }
    ),
    writeJson(
      errorFile,
      {
        header: [],
        body: {
          status: "error",
          message: "Unexpected error",
        },
      },
      { spaces: 2 }
    ),
    writeJson(
      statusFile,
      {
        selected: "success-200.json",
        delayMillisecond: 0,
      },
      { spaces: 2 }
    ),
  ]);

  return {
    filesCreated: ["success-200.json", "unexpected-error-default.json", "status.json"],
    mockDirectory: endpointDir,
  };
}
