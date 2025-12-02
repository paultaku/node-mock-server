/**
 * ScenarioRepository Implementation
 *
 * File-based persistence layer for scenarios using fs-extra.
 * Implements the IScenarioRepository interface for CRUD operations.
 *
 * @see specs/004-scenario-management/data-model.md
 * @see tests/unit/scenario-repository.test.ts
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  Scenario,
  IScenarioRepository,
  DuplicateScenarioError,
  ScenarioNotFoundError
} from '../../shared/types/scenario-types';

/**
 * File-based repository for scenario persistence
 *
 * Stores scenarios as individual JSON files in the configured directory.
 * Each scenario is saved as {scenarioName}.json with 2-space indentation.
 *
 * Directory structure:
 * mock/scenario/
 *   ├── scenario-1.json
 *   ├── scenario-2.json
 *   └── _active.json (managed by ActiveScenarioTracker)
 */
export class ScenarioRepository implements IScenarioRepository {
  private readonly scenarioDir: string;

  /**
   * @param scenarioDir Absolute path to scenario storage directory (default: mock/scenario)
   */
  constructor(scenarioDir: string = path.join(process.cwd(), 'mock', 'scenario')) {
    this.scenarioDir = scenarioDir;
  }

  /**
   * Save a new scenario to the file system
   *
   * @throws DuplicateScenarioError if scenario with same name already exists
   */
  async save(scenario: Scenario): Promise<void> {
    // Ensure directory exists
    await fs.ensureDir(this.scenarioDir);

    const filePath = this.getFilePath(scenario.name);

    // Check for duplicate
    if (await fs.pathExists(filePath)) {
      throw new DuplicateScenarioError(scenario.name);
    }

    // Write scenario to file with formatted JSON
    await fs.writeJson(filePath, scenario, { spaces: 2 });
  }

  /**
   * Find a scenario by name
   *
   * @returns Scenario if found, null otherwise
   */
  async findByName(name: string): Promise<Scenario | null> {
    const filePath = this.getFilePath(name);

    if (!(await fs.pathExists(filePath))) {
      return null;
    }

    try {
      const scenario = await fs.readJson(filePath);
      return scenario as Scenario;
    } catch (error) {
      // Re-throw JSON parse errors
      throw error;
    }
  }

  /**
   * Find all scenarios in the directory
   *
   * Ignores files that:
   * - Don't have .json extension
   * - Start with underscore (e.g., _active.json)
   * - Are not valid scenario files
   *
   * @returns Array of all scenarios (empty if directory doesn't exist)
   */
  async findAll(): Promise<Scenario[]> {
    // Return empty array if directory doesn't exist
    if (!(await fs.pathExists(this.scenarioDir))) {
      return [];
    }

    try {
      const files = await fs.readdir(this.scenarioDir);

      // Filter to only scenario JSON files (exclude _active.json, README.md, etc.)
      const scenarioFiles = files.filter(
        (file) => file.endsWith('.json') && !file.startsWith('_')
      );

      // Read all scenario files in parallel
      const scenarios = await Promise.all(
        scenarioFiles.map(async (file) => {
          const filePath = path.join(this.scenarioDir, file);
          return (await fs.readJson(filePath)) as Scenario;
        })
      );

      return scenarios;
    } catch (error) {
      // Return empty array on read errors
      return [];
    }
  }

  /**
   * Check if a scenario exists by name
   *
   * @returns true if scenario file exists, false otherwise
   */
  async exists(name: string): Promise<boolean> {
    const filePath = this.getFilePath(name);
    return await fs.pathExists(filePath);
  }

  /**
   * Update an existing scenario
   *
   * @throws ScenarioNotFoundError if scenario doesn't exist
   */
  async update(scenario: Scenario): Promise<void> {
    const filePath = this.getFilePath(scenario.name);

    // Verify scenario exists
    if (!(await fs.pathExists(filePath))) {
      throw new ScenarioNotFoundError(scenario.name);
    }

    // Overwrite existing scenario file
    await fs.writeJson(filePath, scenario, { spaces: 2 });
  }

  /**
   * Delete a scenario by name
   *
   * @throws ScenarioNotFoundError if scenario doesn't exist
   */
  async delete(name: string): Promise<void> {
    const filePath = this.getFilePath(name);

    // Verify scenario exists
    if (!(await fs.pathExists(filePath))) {
      throw new ScenarioNotFoundError(name);
    }

    // Delete the file
    await fs.remove(filePath);
  }

  /**
   * Get the file path for a scenario name
   * @private
   */
  private getFilePath(name: string): string {
    return path.join(this.scenarioDir, `${name}.json`);
  }
}
