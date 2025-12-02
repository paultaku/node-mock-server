import React from "react";
import { Scenario } from "../../../shared/types/scenario-types";
import { ActiveBadge } from "./ActiveBadge";

interface ScenarioCardProps {
  scenario: Scenario;
  isActive: boolean;
  onView: (name: string) => void;
  onEdit: (name: string) => void;
}

/**
 * ScenarioCard Component
 *
 * Displays a scenario card with name, active badge, and action buttons.
 * Used in scenario lists to show scenario information and provide actions.
 *
 * @see specs/004-scenario-management/spec.md
 */
export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  isActive,
  onView,
  onEdit,
}) => {
  const endpointCount = scenario.endpointConfigurations.length;
  const endpointText =
    endpointCount === 1 ? "1 endpoint" : `${endpointCount} endpoints`;

  return (
    <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{scenario.name}</h3>
        {isActive && <ActiveBadge />}
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">{endpointText}</p>
        <p className="text-xs text-gray-500 mt-1">
          Version {scenario.metadata.version} • Last modified:{" "}
          {new Date(scenario.metadata.lastModified).toLocaleDateString()}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onView(scenario.name)}
          className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
        >
          View
        </button>
        <button
          onClick={() => onEdit(scenario.name)}
          className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  );
};

