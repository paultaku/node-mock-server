import fs from "fs-extra";
import path from "path";

export interface StatusJson {
  selected: string;
  delayMillisecond?: number; // Optional delay field, in milliseconds
}

const DEFAULT_MOCK_FILE = "successful-operation-200.json";

/**
 * Get the path to status.json
 * @param mockRoot mock root directory
 * @param endpointPath like /pet/{petId}
 * @param method HTTP method (GET/POST/...)
 */
export function getStatusJsonPath(mockRoot: string, endpointPath: string, method: string): string {
  return path.join(mockRoot, ...endpointPath.replace(/^\//, "").split("/"), method.toUpperCase(), "status.json");
}

/**
 * Read status.json
 * @param statusPath status.json file path
 * @returns StatusJson object or null
 */
export async function readStatusJson(statusPath: string): Promise<StatusJson | null> {
  try {
    const data = await fs.readJson(statusPath);
    if (typeof data.selected === "string" && data.selected.endsWith(".json")) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Write status.json (atomic write)
 * @param statusPath status.json file path
 * @param selected selected mock filename
 */
export async function writeStatusJson(statusPath: string, selected: string): Promise<void> {
  await fs.writeJson(statusPath, { selected }, { spaces: 2 });
}

/**
 * Initialize selected mock status for all endpoints
 * @param mockRoot mock root directory
 * @param templates all endpoint templates array
 * @returns Map<stateKey, selectedMockFile>
 */
export async function loadAllStatusJson(mockRoot: string, templates: string[][]): Promise<Map<string, string>> {
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
      // fallback
      stateMap.set(`${method.toUpperCase()}:${endpointPath}`, DEFAULT_MOCK_FILE);
    }
  }
  return stateMap;
} 