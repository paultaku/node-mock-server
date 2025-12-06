/**
 * useScenarios Hook
 *
 * React hook for managing scenario state and operations.
 * Feature: 004-scenario-management
 *
 * @see specs/004-scenario-management/quickstart.md
 */

import { useState, useEffect, useCallback } from "react";
import {
  Scenario,
  CreateScenarioRequest,
  UpdateScenarioRequest,
  EndpointConfiguration,
  HttpMethod,
} from "../../shared/types/scenario-types";
import { scenarioApi } from "../services/scenarioApi";

export interface UseScenariosReturn {
  // State
  scenarios: Scenario[];
  activeScenario: string | null;
  selectedScenario: Scenario | null;
  loading: boolean;
  error: string | null;
  message: string | null;
  availableEndpoints: any[];

  // Operations
  fetchScenarios: () => Promise<void>;
  createScenario: (request: CreateScenarioRequest) => Promise<void>;
  updateScenario: (
    name: string,
    request: UpdateScenarioRequest
  ) => Promise<void>;
  deleteScenario: (name: string) => Promise<void>;
  selectScenario: (name: string) => Promise<void>;
  clearSelectedScenario: () => void;
  fetchEndpoints: () => Promise<void>;
  removeEndpointConfig: (
    scenarioName: string,
    path: string,
    method: HttpMethod
  ) => Promise<void>;
  setActiveScenario: (name: string) => Promise<void>;
}

export const useScenarios = (): UseScenariosReturn => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenario, setActiveScenarioState] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [availableEndpoints, setAvailableEndpoints] = useState<any[]>([]);

  /**
   * Fetch all scenarios with active indicator
   */
  const fetchScenarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await scenarioApi.fetchScenarios();
      setScenarios(data.scenarios);
      setActiveScenarioState(data.activeScenario);
    } catch (err) {
      setError(
        `Failed to fetch scenarios: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new scenario
   */
  const createScenario = useCallback(
    async (request: CreateScenarioRequest) => {
      try {
        setLoading(true);
        setError(null);
        const response = await scenarioApi.createScenario(request);
        setMessage(
          response.message || `Scenario '${request.name}' created successfully`
        );

        // Refresh scenarios list
        await fetchScenarios();

        setTimeout(() => setMessage(null), 3000);
      } catch (err) {
        setError(
          `Failed to create scenario: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
        setTimeout(() => setError(null), 5000);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchScenarios]
  );

  /**
   * Update an existing scenario
   */
  const updateScenario = useCallback(
    async (name: string, request: UpdateScenarioRequest) => {
      try {
        setLoading(true);
        setError(null);
        const response = await scenarioApi.updateScenario(name, request);
        setMessage(
          response.message || `Scenario '${name}' updated successfully`
        );

        // Refresh scenarios list
        await fetchScenarios();

        // Update selected scenario if it's the one being updated
        if (selectedScenario?.name === name) {
          setSelectedScenario(response.scenario);
        }

        setTimeout(() => setMessage(null), 3000);
      } catch (err) {
        setError(
          `Failed to update scenario: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
        setTimeout(() => setError(null), 5000);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchScenarios, selectedScenario]
  );

  /**
   * Delete a scenario
   */
  const deleteScenario = useCallback(
    async (name: string) => {
      try {
        setLoading(true);
        setError(null);
        const response = await scenarioApi.deleteScenario(name);
        setMessage(
          response.message || `Scenario '${name}' deleted successfully`
        );

        // Clear selected scenario if it's the one being deleted
        if (selectedScenario?.name === name) {
          setSelectedScenario(null);
        }

        // Refresh scenarios list
        await fetchScenarios();

        setTimeout(() => setMessage(null), 3000);
      } catch (err) {
        setError(
          `Failed to delete scenario: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
        setTimeout(() => setError(null), 5000);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchScenarios, selectedScenario]
  );

  /**
   * Select a scenario for viewing/editing
   */
  const selectScenario = useCallback(async (name: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await scenarioApi.getScenario(name);
      setSelectedScenario(response.scenario);
    } catch (err) {
      setError(
        `Failed to load scenario: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setTimeout(() => setError(null), 5000);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear selected scenario
   */
  const clearSelectedScenario = useCallback(() => {
    setSelectedScenario(null);
  }, []);

  /**
   * Fetch available endpoints for scenario configuration
   */
  const fetchEndpoints = useCallback(async () => {
    try {
      const endpoints = await scenarioApi.fetchEndpoints();
      setAvailableEndpoints(endpoints);
    } catch (err) {
      setError(
        `Failed to fetch endpoints: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setTimeout(() => setError(null), 5000);
    }
  }, []);

  /**
   * Remove an endpoint configuration from a scenario
   */
  const removeEndpointConfig = useCallback(
    async (scenarioName: string, path: string, method: HttpMethod) => {
      try {
        // Get current scenario
        const currentScenario = await scenarioApi.getScenario(scenarioName);

        // Filter out the endpoint configuration to remove
        const updatedConfigurations =
          currentScenario.scenario.endpointConfigurations.filter(
            (config) => !(config.path === path && config.method === method)
          );

        // Update scenario with reduced configurations
        await updateScenario(scenarioName, {
          endpointConfigurations: updatedConfigurations,
        });

        // Update selected scenario if it's the one being modified
        if (selectedScenario?.name === scenarioName) {
          const updated = await scenarioApi.getScenario(scenarioName);
          setSelectedScenario(updated.scenario);
        }
      } catch (err) {
        setError(
          `Failed to remove endpoint configuration: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
        setTimeout(() => setError(null), 5000);
        throw err;
      }
    },
    [updateScenario, selectedScenario]
  );

  /**
   * Set a scenario as active
   */
  const setActiveScenario = useCallback(
    async (name: string) => {
      try {
        setLoading(true);
        setError(null);
        const response = await scenarioApi.setActiveScenario(name);
        setMessage(
          response.message || `Scenario '${name}' is now active`
        );

        // Update active scenario state
        setActiveScenarioState(name);

        // Refresh scenarios list to update UI
        await fetchScenarios();

        setTimeout(() => setMessage(null), 3000);
      } catch (err) {
        setError(
          `Failed to set active scenario: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
        setTimeout(() => setError(null), 5000);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchScenarios]
  );

  // Fetch scenarios and endpoints on mount
  useEffect(() => {
    fetchScenarios();
    fetchEndpoints();
  }, [fetchScenarios, fetchEndpoints]);

  return {
    // State
    scenarios,
    activeScenario,
    selectedScenario,
    loading,
    error,
    message,
    availableEndpoints,

    // Operations
    fetchScenarios,
    createScenario,
    updateScenario,
    deleteScenario,
    selectScenario,
    clearSelectedScenario,
    fetchEndpoints,
    removeEndpointConfig,
    setActiveScenario,
  };
};
