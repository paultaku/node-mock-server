import React, { useState, useEffect } from "react";
import {
  CreateScenarioRequest,
  HttpMethod,
  EndpointConfiguration,
} from "../../../shared/types/scenario-types";
import { Endpoint } from "../../types";

interface CreateScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (request: CreateScenarioRequest) => Promise<void>;
  availableEndpoints: Endpoint[];
  fetchEndpoints: () => Promise<void>;
}

/**
 * CreateScenarioModal Component
 *
 * Modal dialog for creating a new scenario with multiple endpoint configurations.
 * Allows user to add multiple endpoints before creating the scenario.
 *
 * @see specs/004-scenario-management/spec.md
 */
export const CreateScenarioModal: React.FC<CreateScenarioModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  availableEndpoints,
  fetchEndpoints,
}) => {
  const [scenarioName, setScenarioName] = useState("");
  const [selectedEndpointIndex, setSelectedEndpointIndex] = useState<
    number | null
  >(null);
  const [selectedMockFile, setSelectedMockFile] = useState("");
  const [delayMillisecond, setDelayMillisecond] = useState(0);
  const [endpointConfigurations, setEndpointConfigurations] = useState<
    EndpointConfiguration[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch endpoints when modal opens
  useEffect(() => {
    if (isOpen && availableEndpoints.length === 0) {
      fetchEndpoints();
    }
  }, [isOpen, availableEndpoints.length, fetchEndpoints]);

  // Get selected endpoint details
  const selectedEndpoint =
    selectedEndpointIndex !== null
      ? availableEndpoints[selectedEndpointIndex]
      : null;

  // Reset selected mock file when endpoint changes
  useEffect(() => {
    if (selectedEndpoint && selectedEndpoint.availableMocks.length > 0) {
      setSelectedMockFile(selectedEndpoint.availableMocks[0] || "");
    } else {
      setSelectedMockFile("");
    }
  }, [selectedEndpoint]);

  const handleAddEndpoint = () => {
    // Validate endpoint selection
    if (selectedEndpointIndex === null || !selectedEndpoint) {
      setValidationError("Please select an endpoint");
      return;
    }

    if (!selectedMockFile) {
      setValidationError("Please select a mock file");
      return;
    }

    // Validate delay
    if (delayMillisecond < 0) {
      setValidationError("Delay cannot be negative");
      return;
    }

    if (delayMillisecond > 60000) {
      setValidationError("Delay cannot exceed 60000ms (60 seconds)");
      return;
    }

    // Check for duplicate endpoint (same path and method)
    const endpointKey = `${selectedEndpoint.path}|${selectedEndpoint.method.toUpperCase()}`;
    const isDuplicate = endpointConfigurations.some(
      (config) => `${config.path}|${config.method}` === endpointKey
    );

    if (isDuplicate) {
      setValidationError(
        `Endpoint ${selectedEndpoint.method.toUpperCase()} ${
          selectedEndpoint.path
        } is already added`
      );
      return;
    }

    // Add endpoint configuration to list
    const newConfig: EndpointConfiguration = {
      path: selectedEndpoint.path,
      method: selectedEndpoint.method.toUpperCase() as HttpMethod,
      selectedMockFile: selectedMockFile,
      delayMillisecond: delayMillisecond,
    };

    setEndpointConfigurations([...endpointConfigurations, newConfig]);
    setValidationError(null);

    // Reset form fields for adding another endpoint
    setSelectedEndpointIndex(null);
    setSelectedMockFile("");
    setDelayMillisecond(0);
  };

  const handleRemoveEndpoint = (index: number) => {
    setEndpointConfigurations(
      endpointConfigurations.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate scenario name
    if (!scenarioName.trim()) {
      setValidationError("Scenario name is required");
      return;
    }

    if (scenarioName.length < 3) {
      setValidationError("Scenario name must be at least 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(scenarioName)) {
      setValidationError(
        "Scenario name can only contain letters, numbers, hyphens, and underscores"
      );
      return;
    }

    // Validate at least one endpoint
    if (endpointConfigurations.length === 0) {
      setValidationError("Please add at least one endpoint configuration");
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      await onCreate({
        name: scenarioName,
        endpointConfigurations: endpointConfigurations,
      });

      // Reset form and close modal on success
      resetForm();
      onClose();
    } catch (error) {
      // Error is handled by the parent component (useScenarios hook)
      // Just re-enable the submit button
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setScenarioName("");
    setSelectedEndpointIndex(null);
    setSelectedMockFile("");
    setDelayMillisecond(0);
    setEndpointConfigurations([]);
    setValidationError(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Create New Scenario
          </h3>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Close"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Scenario Name */}
          <div className="mb-6">
            <label
              htmlFor="scenarioName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Scenario Name
            </label>
            <input
              type="text"
              id="scenarioName"
              value={scenarioName}
              onChange={(e) => {
                setScenarioName(e.target.value);
                setValidationError(null);
              }}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="e.g., error-scenario"
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">
              Use letters, numbers, hyphens, and underscores only
            </p>
          </div>

          {/* Added Endpoints List */}
          {endpointConfigurations.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Endpoint Configurations ({endpointConfigurations.length})
              </h4>
              <div className="space-y-2">
                {endpointConfigurations.map((config, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded">
                          {config.method}
                        </span>
                        <span className="font-medium text-gray-900">
                          {config.path}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        Mock: <span className="font-mono">{config.selectedMockFile}</span>
                        {config.delayMillisecond > 0 && (
                          <span className="ml-3">
                            Delay: {config.delayMillisecond}ms
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEndpoint(index)}
                      disabled={isSubmitting}
                      className="ml-3 text-red-600 hover:text-red-800 focus:outline-none disabled:opacity-50"
                      aria-label="Remove endpoint"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Endpoint Section */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Add Endpoint Configuration
            </h4>

            {/* Endpoint Selection */}
            <div className="mb-3">
              <label
                htmlFor="endpoint"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Endpoint
              </label>
              {availableEndpoints.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  Loading endpoints...
                </p>
              ) : (
                <select
                  id="endpoint"
                  value={selectedEndpointIndex ?? ""}
                  onChange={(e) => {
                    const index =
                      e.target.value === "" ? null : parseInt(e.target.value);
                    setSelectedEndpointIndex(index);
                    setValidationError(null);
                  }}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Select an endpoint...</option>
                  {availableEndpoints.map((endpoint, index) => {
                    const key = `${endpoint.path}|${endpoint.method.toUpperCase()}`;
                    const isAdded = endpointConfigurations.some(
                      (config) => `${config.path}|${config.method}` === key
                    );
                    return (
                      <option key={index} value={index} disabled={isAdded}>
                        {endpoint.method.toUpperCase()} {endpoint.path}
                        {isAdded ? " (already added)" : ""}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Mock File Selection */}
            {selectedEndpoint && (
              <div className="mb-3">
                <label
                  htmlFor="mockFile"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mock Response File
                </label>
                {selectedEndpoint.availableMocks.length === 0 ? (
                  <p className="text-sm text-red-600">
                    No mock files available for this endpoint
                  </p>
                ) : (
                  <select
                    id="mockFile"
                    value={selectedMockFile}
                    onChange={(e) => {
                      setSelectedMockFile(e.target.value);
                      setValidationError(null);
                    }}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    {selectedEndpoint.availableMocks.map((mockFile) => (
                      <option key={mockFile} value={mockFile}>
                        {mockFile}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Delay Configuration */}
            {selectedEndpoint && (
              <div className="mb-3">
                <label
                  htmlFor="delay"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Response Delay (ms)
                </label>
                <input
                  type="number"
                  id="delay"
                  min="0"
                  max="60000"
                  value={delayMillisecond}
                  onChange={(e) => {
                    setDelayMillisecond(parseInt(e.target.value) || 0);
                    setValidationError(null);
                  }}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="0"
                />
              </div>
            )}

            {/* Add Button */}
            <button
              type="button"
              onClick={handleAddEndpoint}
              disabled={isSubmitting || !selectedEndpoint}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Endpoint
            </button>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{validationError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                endpointConfigurations.length === 0 ||
                !scenarioName.trim()
              }
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Creating..."
                : `Create Scenario${
                    endpointConfigurations.length > 0
                      ? ` (${endpointConfigurations.length} endpoint${
                          endpointConfigurations.length > 1 ? "s" : ""
                        })`
                      : ""
                  }`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
