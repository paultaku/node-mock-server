import React, { useState } from "react";
import { Scenario, EndpointConfiguration, HttpMethod } from "../../../shared/types/scenario-types";

export type ScenarioFormMode = "view" | "edit";

interface ScenarioFormProps {
  scenario: Scenario;
  mode: ScenarioFormMode;
  onSave: (scenario: Scenario) => void;
  onCancel: () => void;
  onModeChange?: (mode: ScenarioFormMode) => void;
  onRemoveEndpoint?: (path: string, method: HttpMethod) => void;
}

/**
 * ScenarioForm Component
 *
 * Displays scenario details with view and edit modes.
 * View mode shows read-only endpoint configurations.
 * Edit mode allows modifying scenario (future enhancement).
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
}) => {
  const [removingEndpoint, setRemovingEndpoint] = useState<{
    path: string;
    method: HttpMethod;
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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
    const isLastEndpoint = scenario.endpointConfigurations.length === 1;
    
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
    if (removingEndpoint && onRemoveEndpoint) {
      onRemoveEndpoint(removingEndpoint.path, removingEndpoint.method);
    }
    setShowConfirmDialog(false);
    setRemovingEndpoint(null);
  };

  const handleCancelRemove = () => {
    setShowConfirmDialog(false);
    setRemovingEndpoint(null);
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Endpoint Configurations ({scenario.endpointConfigurations.length})
        </h3>
        <div className="space-y-4">
          {scenario.endpointConfigurations.map((config, index) => {
            const isLastEndpoint = scenario.endpointConfigurations.length === 1;
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
                    {mode === "edit" && onRemoveEndpoint && (
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
                <div className="mt-2">
                  <span className="text-sm text-gray-600">
                    Mock File: <span className="font-mono">{config.selectedMockFile}</span>
                  </span>
                  {mode === "view" && (
                    <span className="ml-4 text-sm text-gray-600">
                      Delay: {formatDelay(config.delayMillisecond)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && removingEndpoint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {scenario.endpointConfigurations.length === 1
                ? "Warning: Last Endpoint"
                : "Confirm Removal"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {scenario.endpointConfigurations.length === 1 ? (
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
              {scenario.endpointConfigurations.length > 1 && (
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
              onClick={() => onSave(scenario)}
              className="bg-primary-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              Save
            </button>
          </>
        )}
      </div>
    </div>
  );
};

