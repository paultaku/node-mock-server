/**
 * Route Matcher
 *
 * Matches incoming HTTP requests to mock file directories.
 * Handles path parameter templates (e.g., /user/{userId}).
 */

import { readDirectory, isDirectory } from "../../shared/file-system";
import path from "path";

/**
 * Only allow letters, numbers, -, _, {}, not : * ? ( ) [ ] etc.
 * Path parameters like {userId} are valid.
 */
function isValidMockPart(part: string): boolean {
  return /^[a-zA-Z0-9_\-{}]+$/.test(part);
}

/**
 * Get all mock endpoint templates
 * Recursively walks the mock directory to find all endpoints
 * @param mockRoot - Mock root directory
 * @returns Array of template arrays (e.g., [['user', '{userId}', 'GET']])
 */
export async function getAllMockTemplates(
  mockRoot: string
): Promise<string[][]> {
  async function walk(dir: string, parts: string[] = []): Promise<string[][]> {
    const entries = await readDirectory(dir);
    let results: string[][] = [];

    for (const entry of entries) {
      if (!isValidMockPart(entry)) continue; // Skip invalid names

      const fullPath = path.join(dir, entry);
      const isDir = await isDirectory(fullPath);

      if (isDir) {
        // Check if there are json files under this directory (i.e. method directory)
        const files = await readDirectory(fullPath);
        const jsonFiles = files.filter(
          (f) => f.endsWith(".json") && f !== "status.json"
        );

        if (jsonFiles.length > 0) {
          // This is a method directory, push parts+method
          results.push([...parts, entry]);
        }

        // Continue recursion
        results = results.concat(await walk(fullPath, [...parts, entry]));
      }
    }

    return results;
  }

  return walk(mockRoot);
}

/**
 * Match result containing the matched template and extracted path parameters
 */
export interface MatchResult {
  template: string[];
  params: Record<string, string>;
}

/**
 * Match a request path to an endpoint template
 * Handles path parameters like /user/{userId} matching /user/123
 * @param requestParts - Request path parts (e.g., ['user', '123'])
 * @param templates - All available endpoint templates
 * @param method - HTTP method
 * @returns Match result with template and params, or null if no match
 */
export function matchTemplate(
  requestParts: string[],
  templates: string[][],
  method: string
): MatchResult | null {
  let bestMatch: MatchResult | null = null;

  for (const tpl of templates) {
    if (tpl.length !== requestParts.length + 1) continue; // +1 for method

    const lastElement = tpl[tpl.length - 1];
    if (!lastElement || lastElement.toUpperCase() !== method) continue;

    let params: Record<string, string> = {};
    let matched = true;

    for (let i = 0; i < requestParts.length; i++) {
      const tplElement = tpl[i];
      if (!tplElement) continue;

      if (tplElement.startsWith("{") && tplElement.endsWith("}")) {
        // Path parameter: extract value
        params[tplElement.slice(1, -1)] = requestParts[i] || "";
      } else if (tplElement !== requestParts[i]) {
        // Literal path part must match exactly
        matched = false;
        break;
      }
    }

    if (matched) {
      bestMatch = { template: tpl, params };
      break;
    }
  }

  return bestMatch;
}

/**
 * Get all available mock files for an endpoint directory
 * @param endpointDir - Directory containing mock response files
 * @returns Array of mock filenames
 */
export async function getAvailableMockFiles(
  endpointDir: string
): Promise<string[]> {
  try {
    const files = await readDirectory(endpointDir);
    return files.filter(
      (file): file is string => file.endsWith(".json") && file !== "status.json"
    );
  } catch (error) {
    return [];
  }
}
