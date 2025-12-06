/**
 * Scenario Management Type Definitions
 *
 * This file contains TypeScript types, interfaces, enums, and error classes
 * for the scenario management feature.
 *
 * @see specs/004-scenario-management/data-model.md
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * HTTP methods supported by endpoint configurations
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

/**
 * Possible states of a scenario in its lifecycle
 */
export enum ScenarioState {
  /** Scenario is being created but not yet saved */
  DRAFT = 'DRAFT',
  /** Scenario is saved to file but not active */
  SAVED = 'SAVED',
  /** Scenario is currently active (most recently saved) */
  ACTIVE = 'ACTIVE',
  /** Scenario was active but another scenario is now active */
  INACTIVE = 'INACTIVE'
}

// ============================================================================
// Type Aliases
// ============================================================================

/**
 * Composite key for identifying unique endpoints within a scenario
 * Format: "path|method" (e.g., "/pet/status|GET")
 */
export type EndpointKey = `${string}|${HttpMethod}`;

/**
 * Branded type for scenario names (1-50 chars, alphanumeric + hyphens)
 */
export type ScenarioName = string;

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * Represents a single endpoint's mock response configuration within a scenario
 *
 * Value object - identified by the combination of (path, method)
 */
export interface EndpointConfiguration {
  /** Endpoint path (e.g., "/pet/status") */
  path: string;

  /** HTTP method */
  method: HttpMethod;

  /** Name of the mock response file to use (e.g., "success-200.json") */
  selectedMockFile: string;

  /** Response delay in milliseconds (0-60000) */
  delayMillisecond: number;
}

/**
 * Metadata for tracking scenario lifecycle
 *
 * Value object - auto-generated and managed by the system
 */
export interface ScenarioMetadata {
  /** ISO 8601 timestamp of scenario creation (immutable) */
  createdAt: string;

  /** ISO 8601 timestamp of last modification */
  lastModified: string;

  /** Incremental version number (starts at 1) */
  version: number;
}

/**
 * Scenario aggregate root
 *
 * Represents a named collection of endpoint configurations that define
 * a specific testing state. All scenario modifications must go through
 * the ScenarioManager service.
 */
export interface Scenario {
  /** Unique scenario identifier (1-50 chars, alphanumeric + hyphens) */
  name: string;

  /** Array of endpoint configurations (minimum 1 required) */
  endpointConfigurations: EndpointConfiguration[];

  /** Auto-generated tracking metadata */
  metadata: ScenarioMetadata;
}

/**
 * Reference to the currently active scenario
 *
 * Stored in mock/scenario/_active.json
 */
export interface ActiveScenarioReference {
  /** Name of the currently active scenario (null if none) */
  activeScenario: string | null;

  /** ISO 8601 timestamp of when the active scenario was last updated */
  lastUpdated: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Request payload for creating a new scenario
 */
export interface CreateScenarioRequest {
  /** Unique scenario name */
  name: string;

  /** Array of endpoint configurations (minimum 1 required) */
  endpointConfigurations: EndpointConfiguration[];
}

/**
 * Request payload for updating an existing scenario
 */
export interface UpdateScenarioRequest {
  /** Updated array of endpoint configurations (minimum 1 required) */
  endpointConfigurations: EndpointConfiguration[];
}

/**
 * Response payload for scenario creation/update operations
 */
export interface ScenarioResponse {
  /** The created or updated scenario */
  scenario: Scenario;

  /** Success message */
  message: string;
}

/**
 * Response payload for listing all scenarios
 */
export interface ListScenariosResponse {
  /** Array of all saved scenarios */
  scenarios: Scenario[];

  /** Name of currently active scenario (null if none) */
  activeScenario: string | null;
}

/**
 * Response payload for getting the active scenario
 */
export interface ActiveScenarioResponse {
  /** Name of the currently active scenario (null if none) */
  activeScenario: string | null;

  /** ISO 8601 timestamp of when the active scenario was last updated */
  lastUpdated: string;
}

/**
 * Response payload for scenario deletion
 */
export interface DeleteScenarioResponse {
  /** Success message */
  message: string;
}

// ============================================================================
// Domain Errors
// ============================================================================

/**
 * Error thrown when scenario validation fails
 */
export class ScenarioValidationError extends Error {
  public readonly field: string;
  public readonly constraint: string;

  constructor(field: string, constraint: string) {
    super(`Validation failed for ${field}: ${constraint}`);
    this.name = 'ScenarioValidationError';
    this.field = field;
    this.constraint = constraint;
  }
}

/**
 * Error thrown when attempting to create a scenario with a name that already exists
 */
export class DuplicateScenarioError extends Error {
  public readonly scenarioName: string;

  constructor(scenarioName: string) {
    super(`Scenario with name "${scenarioName}" already exists`);
    this.name = 'DuplicateScenarioError';
    this.scenarioName = scenarioName;
  }
}

/**
 * Error thrown when attempting to add duplicate endpoint configurations
 * (same path + method) to a scenario
 */
export class DuplicateEndpointError extends Error {
  public readonly path: string;
  public readonly method: HttpMethod;

  constructor(path: string, method: HttpMethod) {
    super(`Endpoint ${method} ${path} is already configured in this scenario`);
    this.name = 'DuplicateEndpointError';
    this.path = path;
    this.method = method;
  }
}

/**
 * Error thrown when attempting to save a scenario with no endpoint configurations
 */
export class EmptyScenarioError extends Error {
  constructor() {
    super('Scenario must contain at least one endpoint configuration');
    this.name = 'EmptyScenarioError';
  }
}

/**
 * Error thrown when attempting to access a scenario that doesn't exist
 */
export class ScenarioNotFoundError extends Error {
  public readonly scenarioName: string;

  constructor(scenarioName: string) {
    super(`Scenario "${scenarioName}" not found`);
    this.name = 'ScenarioNotFoundError';
    this.scenarioName = scenarioName;
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

/**
 * Repository interface for scenario persistence operations
 */
export interface IScenarioRepository {
  /**
   * Save a scenario to the file system
   * @throws DuplicateScenarioError if scenario with same name exists (for create)
   */
  save(scenario: Scenario): Promise<void>;

  /**
   * Find a scenario by name
   * @returns Scenario if found, null otherwise
   */
  findByName(name: string): Promise<Scenario | null>;

  /**
   * Find all scenarios
   * @returns Array of all scenarios
   */
  findAll(): Promise<Scenario[]>;

  /**
   * Check if a scenario exists
   * @returns true if scenario exists, false otherwise
   */
  exists(name: string): Promise<boolean>;

  /**
   * Update an existing scenario
   * @throws ScenarioNotFoundError if scenario doesn't exist
   */
  update(scenario: Scenario): Promise<void>;

  /**
   * Delete a scenario
   * @throws ScenarioNotFoundError if scenario doesn't exist
   */
  delete(name: string): Promise<void>;
}

/**
 * Tracker interface for managing the active scenario reference
 */
export interface IActiveScenarioTracker {
  /**
   * Get the name of the currently active scenario
   * @returns Scenario name if active, null otherwise
   */
  getActive(): Promise<string | null>;

  /**
   * Set a scenario as active
   * @param scenarioName Name of the scenario to activate
   */
  setActive(scenarioName: string): Promise<void>;

  /**
   * Clear the active scenario (set to null)
   */
  clearActive(): Promise<void>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Result of applying a scenario to endpoints
 */
export interface ScenarioApplicationResult {
  /** Names of successfully updated endpoints */
  successes: string[];

  /** Details of failed endpoint updates */
  failures: Array<{
    endpoint: string;
    error: string;
  }>;
}
