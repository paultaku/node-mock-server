/**
 * Status Tracker
 *
 * Manages the state of mock responses for each endpoint.
 * Handles reading and writing status.json files.
 */

import { readJson, writeJson, fileExists } from "../../shared/file-system";
import path from "path";

export interface StatusJson {
  selected: string;
  delayMillisecond?: number; // Optional delay field, in milliseconds
}

const DEFAULT_MOCK_FILE = "successful-operation-200.json";

/**
 * Get the path to status.json for an endpoint
 * @param mockRoot - Mock root directory
 * @param endpointPath - API path like /pet/{petId}
 * @param method - HTTP method (GET/POST/...)
 * @returns Path to status.json file
 */
export function getStatusJsonPath(
  mockRoot: string,
  endpointPath: string,
  method: string
): string {
  return path.join(
    mockRoot,
    ...endpointPath.replace(/^\//, "").split("/"),
    method.toUpperCase(),
    "status.json"
  );
}

/**
 * Read status.json file
 * @param statusPath - Path to status.json file
 * @returns StatusJson object or null if not found/invalid
 */
export async function readStatusJson(
  statusPath: string
): Promise<StatusJson | null> {
  try {
    const data = await readJson<StatusJson>(statusPath);
    if (typeof data.selected === "string" && data.selected.endsWith(".json")) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Write status.json file (atomic write)
 * @param statusPath - Path to status.json file
 * @param selected - Selected mock filename
 */
export async function writeStatusJson(
  statusPath: string,
  selected: string
): Promise<void> {
  await writeJson(statusPath, { selected }, { spaces: 2 });
}

/**
 * Initialize selected mock status for all endpoints
 * Loads all status.json files and builds a state map
 * @param mockRoot - Mock root directory
 * @param templates - All endpoint templates array
 * @returns Map of stateKey to selectedMockFile
 */
export async function loadAllStatusJson(
  mockRoot: string,
  templates: string[][]
): Promise<Map<string, string>> {
  const stateMap = new Map<string, string>();

  for (const template of templates) {
    const method = template[template.length - 1] || "";
    const endpointPath = "/" + template.slice(0, -1).join("/");

    if (!method) continue; // Skip invalid method

    const statusPath = getStatusJsonPath(mockRoot, endpointPath, method);
    const status = await readStatusJson(statusPath);

    if (status && status.selected) {
      stateMap.set(`${method.toUpperCase()}:${endpointPath}`, status.selected);
    } else {
      // fallback to default
      stateMap.set(
        `${method.toUpperCase()}:${endpointPath}`,
        DEFAULT_MOCK_FILE
      );
    }
  }

  return stateMap;
}

/**
 * Get the mock state key for an endpoint
 * @param path - API path
 * @param method - HTTP method
 * @returns State key string
 */
export function getMockStateKey(path: string, method: string): string {
  return `${method.toUpperCase()}:${path}`;
}
