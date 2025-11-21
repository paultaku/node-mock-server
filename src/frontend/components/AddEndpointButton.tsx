import React from "react";

interface AddEndpointButtonProps {
  onClick: () => void;
}

/**
 * AddEndpointButton Component
 *
 * Renders a button that triggers the endpoint creation modal.
 */
export const AddEndpointButton: React.FC<AddEndpointButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="btn bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center gap-2"
      aria-label="Add Endpoint"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
      Add Endpoint
    </button>
  );
};
