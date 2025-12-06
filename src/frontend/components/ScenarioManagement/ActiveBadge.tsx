import React from "react";

/**
 * ActiveBadge Component
 *
 * Displays a green badge indicating that a scenario is currently active.
 * Used in scenario cards and lists to show which scenario is active.
 *
 * @see specs/004-scenario-management/spec.md
 */
export const ActiveBadge: React.FC = () => {
  return (
    <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
      Active
    </span>
  );
};

