import React from "react";
import { Scenario } from "../../../shared/types/scenario-types";
import { ScenarioCard } from "./ScenarioCard";

interface ScenarioListProps {
  scenarios: Scenario[];
  activeScenario: string | null;
  onView: (name: string) => void;
  onEdit: (name: string) => void;
}

/**
 * ScenarioList Component
 *
 * Displays a list of scenario cards in a grid layout.
 * Shows empty state when no scenarios exist.
 *
 * @see specs/004-scenario-management/spec.md
 */
export const ScenarioList: React.FC<ScenarioListProps> = ({
  scenarios,
  activeScenario,
  onView,
  onEdit,
}) => {
  if (scenarios.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          No Scenarios Found
        </h2>
        <p className="text-gray-500">
          Create your first scenario to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {scenarios.map((scenario) => (
        <ScenarioCard
          key={scenario.name}
          scenario={scenario}
          isActive={scenario.name === activeScenario}
          onView={onView}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

