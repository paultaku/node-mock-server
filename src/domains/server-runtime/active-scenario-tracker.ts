/**
 * ActiveScenarioTracker Implementation
 *
 * Manages the active scenario reference stored in _active.json.
 * Implements the IActiveScenarioTracker interface.
 *
 * @see specs/004-scenario-management/data-model.md
 * @see tests/unit/active-scenario-tracker.test.ts
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  ActiveScenarioReference,
  IActiveScenarioTracker
} from '../../shared/types/scenario-types';

/**
 * Tracker for managing the currently active scenario
 *
 * Stores active scenario reference in _active.json:
 * {
 *   "activeScenario": "scenario-name" | null,
 *   "lastUpdated": "2025-11-30T10:00:00.000Z"
 * }
 */
export class ActiveScenarioTracker implements IActiveScenarioTracker {
  private readonly activeFilePath: string;
  private readonly scenarioDir: string;

  /**
   * @param scenarioDir Absolute path to scenario storage directory (default: mock/scenario)
   */
  constructor(scenarioDir: string = path.join(process.cwd(), 'mock', 'scenario')) {
    this.scenarioDir = scenarioDir;
    this.activeFilePath = path.join(scenarioDir, '_active.json');
  }

  /**
   * Get the name of the currently active scenario
   *
   * @returns Scenario name if active, null otherwise
   */
  async getActive(): Promise<string | null> {
    // Return null if _active.json doesn't exist
    if (!(await fs.pathExists(this.activeFilePath))) {
      return null;
    }

    try {
      const reference = await fs.readJson(this.activeFilePath);
      return (reference as ActiveScenarioReference).activeScenario;
    } catch (error) {
      // Return null on read/parse errors
      return null;
    }
  }

  /**
   * Set a scenario as active
   *
   * Updates _active.json with the scenario name and current timestamp.
   * Creates the file and directory if they don't exist.
   *
   * @param scenarioName Name of the scenario to activate
   */
  async setActive(scenarioName: string): Promise<void> {
    // Ensure directory exists
    await fs.ensureDir(this.scenarioDir);

    const reference: ActiveScenarioReference = {
      activeScenario: scenarioName,
      lastUpdated: new Date().toISOString()
    };

    await fs.writeJson(this.activeFilePath, reference, { spaces: 2 });
  }

  /**
   * Clear the active scenario (set to null)
   *
   * Updates _active.json to indicate no scenario is active.
   */
  async clearActive(): Promise<void> {
    // Ensure directory exists
    await fs.ensureDir(this.scenarioDir);

    const reference: ActiveScenarioReference = {
      activeScenario: null,
      lastUpdated: new Date().toISOString()
    };

    await fs.writeJson(this.activeFilePath, reference, { spaces: 2 });
  }

  /**
   * Get the full active scenario reference with metadata
   *
   * Useful for API responses that need both active scenario and timestamp.
   *
   * @returns Active scenario reference, or default if file doesn't exist
   */
  async getActiveReference(): Promise<ActiveScenarioReference> {
    if (!(await fs.pathExists(this.activeFilePath))) {
      return {
        activeScenario: null,
        lastUpdated: new Date().toISOString()
      };
    }

    try {
      const reference = await fs.readJson(this.activeFilePath);
      return reference as ActiveScenarioReference;
    } catch (error) {
      // Return default on errors
      return {
        activeScenario: null,
        lastUpdated: new Date().toISOString()
      };
    }
  }
}
