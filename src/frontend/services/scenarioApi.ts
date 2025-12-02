/**
 * Scenario API Client
 *
 * Frontend service for interacting with scenario management endpoints.
 * Feature: 004-scenario-management
 *
 * @see specs/004-scenario-management/contracts/scenario-api.yaml
 */

import {
  Scenario,
  CreateScenarioRequest,
  UpdateScenarioRequest,
} from "../../shared/types/scenario-types";

const MOCK_API_BASE = "/_mock";

export interface ListScenariosResponse {
  scenarios: Scenario[];
  activeScenario: string | null;
}

export interface ScenarioResponse {
  scenario: Scenario;
  message: string;
}

export interface ActiveScenarioResponse {
  activeScenario: string | null;
  lastUpdated: string;
}

export interface DeleteScenarioResponse {
  success: boolean;
  message: string;
}

export const scenarioApi = {
  /**
   * Fetch all scenarios with active indicator
   * @returns List of scenarios and currently active scenario name
   */
  async fetchScenarios(): Promise<ListScenariosResponse> {
    const response = await fetch(`${MOCK_API_BASE}/scenarios`);
    if (!response.ok) {
      throw new Error(`Failed to fetch scenarios: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Create a new scenario
   * @param request - Scenario creation request
   * @returns Created scenario with metadata
   */
  async createScenario(
    request: CreateScenarioRequest
  ): Promise<ScenarioResponse> {
    const response = await fetch(`${MOCK_API_BASE}/scenarios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP error! status: ${response.status}`,
      }));
      throw new Error(error.error || `Failed to create scenario`);
    }

    return response.json();
  },

  /**
   * Get a specific scenario by name
   * @param name - Scenario name
   * @returns Scenario details
   */
  async getScenario(name: string): Promise<{ scenario: Scenario }> {
    const response = await fetch(
      `${MOCK_API_BASE}/scenarios/${encodeURIComponent(name)}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP error! status: ${response.status}`,
      }));
      throw new Error(error.error || `Failed to get scenario`);
    }

    return response.json();
  },

  /**
   * Get currently active scenario
   * @returns Active scenario name and last updated timestamp
   */
  async getActiveScenario(): Promise<ActiveScenarioResponse> {
    const response = await fetch(`${MOCK_API_BASE}/scenarios/active`);

    if (!response.ok) {
      throw new Error(`Failed to get active scenario: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Update an existing scenario
   * @param name - Scenario name to update
   * @param request - Update request with new endpoint configurations
   * @returns Updated scenario
   */
  async updateScenario(
    name: string,
    request: UpdateScenarioRequest
  ): Promise<ScenarioResponse> {
    const response = await fetch(
      `${MOCK_API_BASE}/scenarios/${encodeURIComponent(name)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP error! status: ${response.status}`,
      }));
      throw new Error(error.error || `Failed to update scenario`);
    }

    return response.json();
  },

  /**
   * Delete a scenario
   * @param name - Scenario name to delete
   * @returns Success message
   */
  async deleteScenario(name: string): Promise<DeleteScenarioResponse> {
    const response = await fetch(
      `${MOCK_API_BASE}/scenarios/${encodeURIComponent(name)}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP error! status: ${response.status}`,
      }));
      throw new Error(error.error || `Failed to delete scenario`);
    }

    return response.json();
  },

  /**
   * Fetch all available endpoints (for scenario configuration)
   * @returns List of all mock endpoints
   */
  async fetchEndpoints(): Promise<any[]> {
    const response = await fetch(`${MOCK_API_BASE}/endpoints`);
    if (!response.ok) {
      throw new Error(`Failed to fetch endpoints: ${response.status}`);
    }
    return response.json();
  },
};
