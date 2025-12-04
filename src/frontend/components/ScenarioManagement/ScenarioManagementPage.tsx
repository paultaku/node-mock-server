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
              onClick={() => setIsCreating(true)}
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
            onDelete={handleDelete}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirmation?.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 bg-red-100 rounded-full p-3 mr-4">
                  <svg
                    className="h-6 w-6 text-red-600"
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
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the scenario "
                <strong>{deleteConfirmation.scenarioName}</strong>"? This action
                cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
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
