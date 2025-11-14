/**
 * File Reader Utility
 *
 * Wrapper around fs-extra for file read operations.
 * Provides a consistent interface for file reading across all domains.
 */

import * as fs from 'fs-extra';

/**
 * Read file content as a string
 */
export async function readFile(
  filePath: string,
  options?: { encoding?: BufferEncoding }
): Promise<string> {
  return await fs.readFile(filePath, options?.encoding || 'utf8');
}

/**
 * Read and parse JSON file
 */
export async function readJson<T = unknown>(filePath: string): Promise<T> {
  return await fs.readJson(filePath);
}

/**
 * Check if a path is a directory
 */
export async function isDirectory(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a path is a file
 */
export async function isFile(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * List files in a directory
 */
export async function readDirectory(dirPath: string): Promise<string[]> {
  return await fs.readdir(dirPath);
}
