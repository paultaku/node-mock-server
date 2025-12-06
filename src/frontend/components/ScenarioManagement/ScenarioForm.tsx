import React, { useState, useEffect } from "react";
import { Scenario, EndpointConfiguration, HttpMethod } from "../../../shared/types/scenario-types";

export type ScenarioFormMode = "view" | "edit";

interface AvailableEndpoint {
  path: string;
  method: HttpMethod;
  currentMock?: string;
  availableMocks: string[];
}

interface ScenarioFormProps {
  scenario: Scenario;
  mode: ScenarioFormMode;
  onSave: (scenario: Scenario) => void;
  onCancel: () => void;
  onModeChange?: (mode: ScenarioFormMode) => void;
  onRemoveEndpoint?: (path: string, method: HttpMethod) => void;
  availableEndpoints?: AvailableEndpoint[];
}

/**
 * ScenarioForm Component
 *
 * Displays scenario details with view and edit modes.
 * View mode shows read-only endpoint configurations.
 * Edit mode allows adding/removing endpoints and changing mock file selections.
 *
 * @see specs/004-scenario-management/spec.md
 */
export const ScenarioForm: React.FC<ScenarioFormProps> = ({
  scenario,
  mode,
  onSave,
  onCancel,
  onModeChange,
  onRemoveEndpoint,
  availableEndpoints = [],
}) => {
  const [editedScenario, setEditedScenario] = useState<Scenario>(scenario);
  const [removingEndpoint, setRemovingEndpoint] = useState<{
    path: string;
    method: HttpMethod;
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAddEndpoint, setShowAddEndpoint] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState<{
    path: string;
    method: HttpMethod;
    selectedMockFile: string;
    delayMillisecond: number;
  } | null>(null);

  // Update edited scenario when scenario prop changes
  useEffect(() => {
    setEditedScenario(scenario);
  }, [scenario]);

  const formatDelay = (delayMs: number): string => {
    if (delayMs === 0) return "0 ms";
    if (delayMs < 1000) return `${delayMs} ms`;
    return `${(delayMs / 1000).toFixed(1)} s`;
  };

  const getMethodColor = (method: HttpMethod): string => {
    const colors = {
      [HttpMethod.GET]: "bg-blue-500 text-white",
      [HttpMethod.POST]: "bg-green-500 text-white",
      [HttpMethod.PUT]: "bg-orange-500 text-white",
      [HttpMethod.DELETE]: "bg-red-500 text-white",
      [HttpMethod.PATCH]: "bg-purple-500 text-white",
    };
    return colors[method] || "bg-gray-500 text-white";
  };

  const handleRemoveClick = (path: string, method: HttpMethod) => {
    const isLastEndpoint = editedScenario.endpointConfigurations.length === 1;

    if (isLastEndpoint) {
      // Show warning for last endpoint
      setRemovingEndpoint({ path, method });
      setShowConfirmDialog(true);
    } else {
      // Show confirmation dialog
      setRemovingEndpoint({ path, method });
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmRemove = () => {
    if (removingEndpoint) {
      const updatedConfigs = editedScenario.endpointConfigurations.filter(
        (config) => !(config.path === removingEndpoint.path && config.method === removingEndpoint.method)
      );
      setEditedScenario({
        ...editedScenario,
        endpointConfigurations: updatedConfigs,
      });
    }
    setShowConfirmDialog(false);
    setRemovingEndpoint(null);
  };

  const handleCancelRemove = () => {
    setShowConfirmDialog(false);
    setRemovingEndpoint(null);
  };

  const handleAddEndpointClick = () => {
    setShowAddEndpoint(true);
    // Find first available endpoint not already in scenario
    const usedEndpoints = new Set(
      editedScenario.endpointConfigurations.map((c) => `${c.path}|${c.method}`)
    );
    const availableEndpoint = availableEndpoints.find(
      (ep) => !usedEndpoints.has(`${ep.path}|${ep.method}`)
    );

    if (availableEndpoint && availableEndpoint.availableMocks.length > 0) {
      setNewEndpoint({
        path: availableEndpoint.path,
        method: availableEndpoint.method,
        selectedMockFile: availableEndpoint.availableMocks[0]!,
        delayMillisecond: 0,
      });
    }
  };

  const handleCancelAddEndpoint = () => {
    setShowAddEndpoint(false);
    setNewEndpoint(null);
  };

  const handleConfirmAddEndpoint = () => {
    if (newEndpoint) {
      // Check for duplicates
      const isDuplicate = editedScenario.endpointConfigurations.some(
        (config) => config.path === newEndpoint.path && config.method === newEndpoint.method
      );

      if (isDuplicate) {
        alert("This endpoint is already configured in the scenario.");
        return;
      }

      setEditedScenario({
        ...editedScenario,
        endpointConfigurations: [
          ...editedScenario.endpointConfigurations,
          newEndpoint,
        ],
      });
      setShowAddEndpoint(false);
      setNewEndpoint(null);
    }
  };

  const handleEndpointSelectionChange = (endpointKey: string) => {
    const [path, method] = endpointKey.split("|");
    const endpoint = availableEndpoints.find(
      (ep) => ep.path === path && ep.method === method
    );

    if (endpoint && endpoint.availableMocks.length > 0 && newEndpoint) {
      setNewEndpoint({
        ...newEndpoint,
        path: endpoint.path,
        method: endpoint.method as HttpMethod,
        selectedMockFile: endpoint.availableMocks[0]!,
      });
    }
  };

  const handleMockFileChange = (
    path: string,
    method: HttpMethod,
    mockFile: string
  ) => {
    const updatedConfigs = editedScenario.endpointConfigurations.map((config) =>
      config.path === path && config.method === method
        ? { ...config, selectedMockFile: mockFile }
        : config
    );
    setEditedScenario({
      ...editedScenario,
      endpointConfigurations: updatedConfigs,
    });
  };

  const handleDelayChange = (
    path: string,
    method: HttpMethod,
    delay: number
  ) => {
    const updatedConfigs = editedScenario.endpointConfigurations.map((config) =>
      config.path === path && config.method === method
        ? { ...config, delayMillisecond: delay }
        : config
    );
    setEditedScenario({
      ...editedScenario,
      endpointConfigurations: updatedConfigs,
    });
  };

  const getAvailableMockFiles = (path: string, method: HttpMethod): string[] => {
    const endpoint = availableEndpoints.find(
      (ep) => ep.path === path && ep.method === method
    );
    return endpoint?.availableMocks || [];
  };

  const getUnusedEndpoints = () => {
    const usedEndpoints = new Set(
      editedScenario.endpointConfigurations.map((c) => `${c.path}|${c.method}`)
    );
    return availableEndpoints.filter(
      (ep) => !usedEndpoints.has(`${ep.path}|${ep.method}`)
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{scenario.name}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Version {scenario.metadata.version} • Created:{" "}
            {new Date(scenario.metadata.createdAt).toLocaleDateString()}
          </p>
        </div>
        {mode === "view" && onModeChange && (
          <button
            onClick={() => onModeChange("edit")}
            className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {/* Endpoint Configurations */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Endpoint Configurations ({editedScenario.endpointConfigurations.length})
          </h3>
          {mode === "edit" && (
            <button
              onClick={handleAddEndpointClick}
              disabled={getUnusedEndpoints().length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              title={getUnusedEndpoints().length === 0 ? "All endpoints are already configured" : "Add new endpoint"}
            >
              + Add Endpoint
            </button>
          )}
        </div>
        <div className="space-y-4">
          {editedScenario.endpointConfigurations.map((config, index) => {
            const isLastEndpoint = editedScenario.endpointConfigurations.length === 1;
            const availableMockFiles = getAvailableMockFiles(config.path, config.method);

            return (
              <div
                key={`${config.path}-${config.method}-${index}`}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getMethodColor(
                        config.method
                      )}`}
                    >
                      {config.method}
                    </span>
                    <span className="font-mono text-sm text-gray-800">
                      {config.path}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {mode === "view" && (
                      <span className="text-xs text-gray-500">
                        {formatDelay(config.delayMillisecond)}
                      </span>
                    )}
                    {mode === "edit" && (
                      <button
                        onClick={() => handleRemoveClick(config.path, config.method)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded px-2 py-1"
                        title={isLastEndpoint ? "Warning: This is the last endpoint. Removing it will make the scenario empty." : "Remove endpoint"}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {mode === "view" ? (
                  <div className="mt-2">
                    <span className="text-sm text-gray-600">
                      Mock File: <span className="font-mono">{config.selectedMockFile}</span>
                    </span>
                    <span className="ml-4 text-sm text-gray-600">
                      Delay: {formatDelay(config.delayMillisecond)}
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {/* Mock File Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mock Response File
                      </label>
                      <select
                        value={config.selectedMockFile}
                        onChange={(e) =>
                          handleMockFileChange(config.path, config.method, e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-mono"
                      >
                        {availableMockFiles.map((file) => (
                          <option key={file} value={file}>
                            {file}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Delay Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Response Delay (milliseconds)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="60000"
                        value={config.delayMillisecond}
                        onChange={(e) =>
                          handleDelayChange(
                            config.path,
                            config.method,
                            Math.min(60000, Math.max(0, parseInt(e.target.value) || 0))
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        placeholder="0"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Current: {formatDelay(config.delayMillisecond)} (max: 60000ms)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Endpoint Dialog */}
      {showAddEndpoint && newEndpoint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Endpoint Configuration
            </h3>

            <div className="space-y-4 mb-6">
              {/* Endpoint Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Endpoint
                </label>
                <select
                  value={`${newEndpoint.path}|${newEndpoint.method}`}
                  onChange={(e) => handleEndpointSelectionChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  {getUnusedEndpoints().map((ep) => (
                    <option key={`${ep.path}|${ep.method}`} value={`${ep.path}|${ep.method}`}>
                      {ep.method} {ep.path}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mock File Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mock Response File
                </label>
                <select
                  value={newEndpoint.selectedMockFile}
                  onChange={(e) =>
                    setNewEndpoint({ ...newEndpoint, selectedMockFile: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-mono"
                >
                  {getAvailableMockFiles(newEndpoint.path, newEndpoint.method).map((file) => (
                    <option key={file} value={file}>
                      {file}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delay Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Response Delay (milliseconds)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60000"
                  value={newEndpoint.delayMillisecond}
                  onChange={(e) =>
                    setNewEndpoint({
                      ...newEndpoint,
                      delayMillisecond: Math.min(60000, Math.max(0, parseInt(e.target.value) || 0)),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Range: 0-60000ms (current: {formatDelay(newEndpoint.delayMillisecond)})
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelAddEndpoint}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddEndpoint}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                Add Endpoint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      {showConfirmDialog && removingEndpoint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editedScenario.endpointConfigurations.length === 1
                ? "Warning: Last Endpoint"
                : "Confirm Removal"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {editedScenario.endpointConfigurations.length === 1 ? (
                <>
                  This is the last endpoint configuration in this scenario. Removing it will make
                  the scenario empty, which is not allowed. The scenario must have at least one
                  endpoint configuration.
                </>
              ) : (
                <>
                  Are you sure you want to remove the endpoint configuration{" "}
                  <span className="font-mono font-semibold">
                    {removingEndpoint.method} {removingEndpoint.path}
                  </span>
                  ?
                </>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelRemove}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              {editedScenario.endpointConfigurations.length > 1 && (
                <button
                  onClick={handleConfirmRemove}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        {mode === "view" ? (
          <button
            onClick={onCancel}
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Close
          </button>
        ) : (
          <>
            <button
              onClick={onCancel}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(editedScenario)}
              disabled={editedScenario.endpointConfigurations.length === 0}
              className="bg-primary-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              title={editedScenario.endpointConfigurations.length === 0 ? "Scenario must have at least one endpoint" : "Save changes"}
            >
              Save
            </button>
          </>
        )}
      </div>
    </div>
  );
};

