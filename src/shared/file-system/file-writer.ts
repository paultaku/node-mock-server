/**
 * File Writer Utility
 *
 * Wrapper around fs-extra for file write operations.
 * Provides a consistent interface for file writing across all domains.
 */

import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Write content to a file, creating parent directories if needed
 */
export async function writeFile(
  filePath: string,
  content: string,
  options?: { encoding?: BufferEncoding }
): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.ensureDir(dir);
  await fs.writeFile(filePath, content, options?.encoding || 'utf8');
}

/**
 * Write JSON content to a file
 */
export async function writeJson(
  filePath: string,
  data: unknown,
  options?: { spaces?: number }
): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.ensureDir(dir);
  await fs.writeJson(filePath, data, { spaces: options?.spaces || 2 });
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
