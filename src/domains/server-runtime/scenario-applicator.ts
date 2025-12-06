/**
 * ScenarioApplicator Implementation
 *
 * Applies scenario configurations to endpoint status.json files.
 * Updates the mock server's active endpoint configurations.
 *
 * @see specs/004-scenario-management/data-model.md
 * @see tests/unit/scenario-applicator.test.ts
 */

import * as fs from "fs-extra";
import * as path from "path";
import {
  Scenario,
  EndpointConfiguration,
  ScenarioApplicationResult,
} from "../../shared/types/scenario-types";

/**
 * Status file structure for endpoints
 * Matches the existing format: { selected: string, delayMillisecond: number }
 */
interface EndpointStatus {
  selected: string;
  delayMillisecond: number;
}

/**
 * Service for applying scenario configurations to endpoints
 *
 * Updates status.json files in endpoint directories:
 * mock/{path}/{METHOD}/status.json
 *
 * Example:
 * - Path: /pet/status, Method: GET
 * - Status file: mock/pet/status/GET/status.json
 */
export class ScenarioApplicator {
  private readonly mockRoot: string;

  /**
   * @param mockRoot Absolute path to mock directory root (default: mock/)
   */
  constructor(mockRoot: string = path.join(process.cwd(), "mock")) {
    this.mockRoot = mockRoot;
  }

  /**
   * Apply all endpoint configurations from a scenario
   *
   * Processes all endpoints in parallel and collects results.
   * Does not throw on individual endpoint failures - check result.failures instead.
   *
   * @param scenario The scenario to apply
   * @returns Result containing successes and failures
   */
  async apply(scenario: Scenario): Promise<ScenarioApplicationResult> {
    const successes: string[] = [];
    const failures: Array<{ endpoint: string; error: string }> = [];

    // Process all endpoint configurations in parallel
    await Promise.all(
      scenario.endpointConfigurations.map(async (config) => {
        try {
          await this.applyEndpoint(config);
          const methodStr =
            typeof config.method === "string"
              ? config.method
              : String(config.method);
          successes.push(`${methodStr} ${config.path}`);
        } catch (error) {
          const methodStr =
            typeof config.method === "string"
              ? config.method
              : String(config.method);
          failures.push({
            endpoint: `${methodStr} ${config.path}`,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })
    );

    return { successes, failures };
  }

  /**
   * Apply a single endpoint configuration
   *
   * Updates the status.json file for the specified endpoint.
   *
   * @param config The endpoint configuration to apply
   * @throws Error if endpoint directory or status file cannot be accessed
   */
  async applyEndpoint(config: EndpointConfiguration): Promise<void> {
    const statusFilePath = this.getStatusFilePath(config);

    // Verify endpoint directory exists
    const endpointDir = path.dirname(statusFilePath);
    if (!(await fs.pathExists(endpointDir))) {
      const methodStr =
        typeof config.method === "string"
          ? config.method
          : String(config.method);
      throw new Error(
        `Endpoint directory not found: ${methodStr} ${config.path}`
      );
    }

    // Create status object
    const status: EndpointStatus = {
      selected: config.selectedMockFile,
      delayMillisecond: config.delayMillisecond,
    };

    // Write status file with formatted JSON
    await fs.writeJson(statusFilePath, status, { spaces: 2 });
  }

  /**
   * Get the file path for an endpoint's status.json
   *
   * Converts endpoint configuration to file system path:
   * /pet/status + GET -> mock/pet/status/GET/status.json
   *
   * @private
   */
  private getStatusFilePath(config: EndpointConfiguration): string {
    // Remove leading slash from path
    const pathWithoutLeadingSlash = config.path.startsWith("/")
      ? config.path.substring(1)
      : config.path;

    // Ensure method is uppercase string (handle enum values)
    const method =
      typeof config.method === "string"
        ? config.method.toUpperCase()
        : String(config.method).toUpperCase();

    // Build path: mock/{path}/{METHOD}/status.json
    return path.join(
      this.mockRoot,
      pathWithoutLeadingSlash,
      method,
      "status.json"
    );
  }
}
