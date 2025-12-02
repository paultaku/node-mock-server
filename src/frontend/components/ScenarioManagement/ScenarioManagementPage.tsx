import React, { useState } from "react";
import { useScenarios } from "../../hooks/useScenarios";
import { ScenarioList } from "./ScenarioList";
import { ScenarioForm, ScenarioFormMode } from "./ScenarioForm";

/**
 * ScenarioManagementPage Component
 *
 * Main page for viewing and managing scenarios.
 * Displays list of scenarios with active indicator.
 *
 * @see specs/004-scenario-management/spec.md
 */
export const ScenarioManagementPage: React.FC = () => {
  const [formMode, setFormMode] = useState<ScenarioFormMode | null>(null);

  const {
    scenarios,
    activeScenario,
    selectedScenario,
    loading,
    error,
    message,
    selectScenario,
    clearSelectedScenario,
    updateScenario,
    removeEndpointConfig,
  } = useScenarios();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Loading...
          </h2>
          <p className="text-gray-500">Fetching scenarios</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-xl p-8 mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Scenario Management</h1>
          <p className="text-xl opacity-90">
            View and manage your test scenarios
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-error-50 border-l-4 border-error-400 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-error-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-error-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className="bg-success-50 border-l-4 border-success-400 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-success-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-success-700">{message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Scenarios List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Scenarios</h2>
            <button
              onClick={() => {
                // TODO: Open create scenario modal
              }}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              Create Scenario
            </button>
          </div>
        </div>

        {selectedScenario && formMode ? (
          <ScenarioForm
            scenario={selectedScenario}
            mode={formMode}
            onSave={async (scenario) => {
              await updateScenario(scenario.name, {
                endpointConfigurations: scenario.endpointConfigurations,
              });
              setFormMode(null);
              clearSelectedScenario();
            }}
            onCancel={() => {
              setFormMode(null);
              clearSelectedScenario();
            }}
            onModeChange={setFormMode}
            onRemoveEndpoint={async (path, method) => {
              if (selectedScenario) {
                await removeEndpointConfig(selectedScenario.name, path, method);
                // Refresh selected scenario
                await selectScenario(selectedScenario.name);
              }
            }}
          />
        ) : (
          <ScenarioList
            scenarios={scenarios}
            activeScenario={activeScenario}
            onView={async (name) => {
              await selectScenario(name);
              setFormMode("view");
            }}
            onEdit={async (name) => {
              await selectScenario(name);
              setFormMode("edit");
            }}
          />
        )}
      </div>
    </div>
  );
};
