import React, { useState } from "react";
import { useScenarios } from "../../hooks/useScenarios";
import { ScenarioList } from "./ScenarioList";
import { ScenarioForm, ScenarioFormMode } from "./ScenarioForm";
import { CreateScenarioModal } from "./CreateScenarioModal";

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
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    scenarioName: string;
    show: boolean;
  } | null>(null);

  const {
    scenarios,
    activeScenario,
    selectedScenario,
    availableEndpoints,
    loading,
    error,
    message,
    selectScenario,
    clearSelectedScenario,
    createScenario,
    updateScenario,
    deleteScenario,
    removeEndpointConfig,
    fetchEndpoints,
    setActiveScenario,
  } = useScenarios();

  const handleDelete = async (name: string) => {
    setDeleteConfirmation({ scenarioName: name, show: true });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation) {
      try {
        await deleteScenario(deleteConfirmation.scenarioName);
        setDeleteConfirmation(null);
      } catch (err) {
        // Error is handled by useScenarios hook
        setDeleteConfirmation(null);
      }
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const handleCreate = async (request: any) => {
    await createScenario(request);
    setIsCreating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 rounded-full animate-spin border-primary-600"></div>
          <h2 className="mb-2 text-xl font-semibold text-gray-700">
            Loading...
          </h2>
          <p className="text-gray-500">Fetching scenarios</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="p-8 mb-8 text-center text-white bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl">
          <h1 className="mb-4 text-4xl font-bold">Scenario Management</h1>
          <p className="text-xl opacity-90">
            View and manage your test scenarios
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 mb-6 border-l-4 rounded-md bg-error-50 border-error-400">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-error-400"
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
          <div className="p-4 mb-6 border-l-4 rounded-md bg-success-50 border-success-400">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-success-400"
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
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 font-medium text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
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
            availableEndpoints={availableEndpoints}
          />
        ) : (
          <ScenarioList
            scenarios={scenarios}
            onView={async (name) => {
              await selectScenario(name);
              setFormMode("view");
            }}
            onEdit={async (name) => {
              await selectScenario(name);
              setFormMode("edit");
            }}
            onDelete={handleDelete}
            onActivate={async (name) => {
              await setActiveScenario(name);
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirmation?.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 p-3 mr-4 bg-red-100 rounded-full">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Scenario
                  </h3>
                </div>
              </div>
              <p className="mb-6 text-gray-600">
                Are you sure you want to delete the scenario "
                <strong>{deleteConfirmation.scenarioName}</strong>"? This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-gray-800 transition-colors bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-white transition-colors bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Scenario Modal */}
        <CreateScenarioModal
          isOpen={isCreating}
          onClose={() => setIsCreating(false)}
          onCreate={handleCreate}
          availableEndpoints={availableEndpoints}
          fetchEndpoints={fetchEndpoints}
        />
      </div>
    </div>
  );
};
