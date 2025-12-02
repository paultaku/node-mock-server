/**
 * ScenarioManager Implementation
 *
 * High-level service for managing scenario CRUD operations.
 * Coordinates between ScenarioRepository, ActiveScenarioTracker, and ScenarioApplicator.
 *
 * @see specs/004-scenario-management/data-model.md
 * @see tests/unit/scenario-manager.test.ts
 */

import {
  Scenario,
  CreateScenarioRequest,
  UpdateScenarioRequest,
  ListScenariosResponse,
  IScenarioRepository,
  IActiveScenarioTracker,
  DuplicateScenarioError,
  DuplicateEndpointError,
  EmptyScenarioError,
  ScenarioNotFoundError,
  EndpointKey
} from '../../shared/types/scenario-types';
import { ScenarioApplicator } from './scenario-applicator';

/**
 * Service for managing scenario lifecycle
 *
 * Responsibilities:
 * - Create, update, delete, list, and get scenarios
 * - Auto-generate scenario metadata (timestamps, version)
 * - Apply scenarios to endpoint status.json files
 * - Track active scenario
 * - Validate business rules (duplicates, empty scenarios)
 */
export class ScenarioManager {
  constructor(
    private readonly repository: IScenarioRepository,
    private readonly tracker: IActiveScenarioTracker,
    private readonly applicator: ScenarioApplicator
  ) {}

  /**
   * Create a new scenario
   *
   * Steps:
   * 1. Validate request (empty, duplicates)
   * 2. Generate metadata
   * 3. Save to repository
   * 4. Apply to endpoints
   * 5. Set as active
   *
   * @throws DuplicateScenarioError if scenario name already exists
   * @throws EmptyScenarioError if no endpoint configurations
   * @throws DuplicateEndpointError if duplicate endpoints in request
   */
  async create(request: CreateScenarioRequest): Promise<Scenario> {
    // Validate: check for empty scenario
    if (request.endpointConfigurations.length === 0) {
      throw new EmptyScenarioError();
    }

    // Validate: check for duplicate endpoints
    this.validateNoDuplicateEndpoints(request.endpointConfigurations);

    // Generate metadata
    const now = new Date().toISOString();
    const scenario: Scenario = {
      name: request.name,
      endpointConfigurations: request.endpointConfigurations,
      metadata: {
        createdAt: now,
        lastModified: now,
        version: 1
      }
    };

    // Save to repository (throws DuplicateScenarioError if exists)
    await this.repository.save(scenario);

    // Apply scenario to endpoints
    await this.applicator.apply(scenario);

    // Set as active
    await this.tracker.setActive(scenario.name);

    return scenario;
  }

  /**
   * Update an existing scenario
   *
   * Steps:
   * 1. Validate request (empty, duplicates)
   * 2. Load existing scenario
   * 3. Update endpoint configurations and metadata
   * 4. Save to repository
   * 5. Apply to endpoints
   * 6. Set as active
   *
   * @throws ScenarioNotFoundError if scenario doesn't exist
   * @throws EmptyScenarioError if no endpoint configurations
   * @throws DuplicateEndpointError if duplicate endpoints in request
   */
  async update(name: string, request: UpdateScenarioRequest): Promise<Scenario> {
    // Validate: check for empty scenario
    if (request.endpointConfigurations.length === 0) {
      throw new EmptyScenarioError();
    }

    // Validate: check for duplicate endpoints
    this.validateNoDuplicateEndpoints(request.endpointConfigurations);

    // Load existing scenario
    const existing = await this.repository.findByName(name);
    if (!existing) {
      throw new ScenarioNotFoundError(name);
    }

    // Update scenario
    const updated: Scenario = {
      ...existing,
      endpointConfigurations: request.endpointConfigurations,
      metadata: {
        ...existing.metadata,
        lastModified: new Date().toISOString(),
        version: existing.metadata.version + 1
      }
    };

    // Save to repository
    await this.repository.update(updated);

    // Apply updated scenario to endpoints
    await this.applicator.apply(updated);

    // Set as active
    await this.tracker.setActive(updated.name);

    return updated;
  }

  /**
   * Delete a scenario
   *
   * Steps:
   * 1. Check if scenario exists
   * 2. Delete from repository
   * 3. Clear active scenario if it was the deleted one
   *
   * @throws ScenarioNotFoundError if scenario doesn't exist
   */
  async delete(name: string): Promise<void> {
    // Check if scenario exists
    const exists = await this.repository.exists(name);
    if (!exists) {
      throw new ScenarioNotFoundError(name);
    }

    // Check if this scenario is active
    const active = await this.tracker.getActive();
    const wasActive = active === name;

    // Delete from repository
    await this.repository.delete(name);

    // Clear active scenario if it was the deleted one
    if (wasActive) {
      await this.tracker.clearActive();
    }
  }

  /**
   * List all scenarios with active scenario indicator
   *
   * @returns List of all scenarios and the name of the active scenario
   */
  async list(): Promise<ListScenariosResponse> {
    const scenarios = await this.repository.findAll();
    const activeScenario = await this.tracker.getActive();

    return {
      scenarios,
      activeScenario
    };
  }

  /**
   * Get a scenario by name
   *
   * @throws ScenarioNotFoundError if scenario doesn't exist
   */
  async get(name: string): Promise<Scenario> {
    const scenario = await this.repository.findByName(name);
    if (!scenario) {
      throw new ScenarioNotFoundError(name);
    }
    return scenario;
  }

  /**
   * Validate that there are no duplicate endpoints in the configuration array
   *
   * Uses Map-based lookup for O(n) performance.
   *
   * @throws DuplicateEndpointError if duplicates found
   * @private
   */
  private validateNoDuplicateEndpoints(
    configurations: Array<{ path: string; method: string }>
  ): void {
    const endpointKeys = new Map<EndpointKey, { path: string; method: string }>();

    for (const config of configurations) {
      const key: EndpointKey = `${config.path}|${config.method}` as EndpointKey;

      if (endpointKeys.has(key)) {
        throw new DuplicateEndpointError(config.path, config.method as any);
      }

      endpointKeys.set(key, config);
    }
  }
}

