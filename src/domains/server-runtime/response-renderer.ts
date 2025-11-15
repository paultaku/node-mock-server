/**
 * Response Renderer
 *
 * Renders mock responses from JSON files.
 * Handles status codes, headers, delays, and body content.
 */

import { readJson, fileExists } from "../../shared/file-system";
import path from "path";

/**
 * Mock response structure from JSON files
 */
export interface MockResponse {
  header?: Array<{ key: string; value: string }>;
  body: unknown;
}

/**
 * Read a mock response file
 * @param filePath - Path to mock JSON file
 * @returns Parsed mock response
 */
export async function readMockResponse(
  filePath: string
): Promise<MockResponse> {
  return await readJson<MockResponse>(filePath);
}

/**
 * Extract HTTP status code from mock filename
 * Filenames follow pattern: description-{statusCode}.json
 * @param mockFileName - Mock file name
 * @returns HTTP status code or null if not found
 */
export function extractStatusCode(mockFileName: string): number | null {
  const statusMatch = mockFileName.match(/-(\d+)\.json$/);
  if (statusMatch && statusMatch[1]) {
    return parseInt(statusMatch[1]);
  }
  return null;
}

/**
 * Check if a mock file exists
 * @param mockFilePath - Full path to mock file
 * @returns True if file exists
 */
export async function mockFileExists(mockFilePath: string): Promise<boolean> {
  return await fileExists(mockFilePath);
}
