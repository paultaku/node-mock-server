import React, { useState } from "react";
import { createEndpoint } from "../services/endpointApi";

interface AddEndpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * AddEndpointModal Component
 *
 * Modal form for creating new mock API endpoints.
 * Includes client-side validation and error handling.
 */
export const AddEndpointModal: React.FC<AddEndpointModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [path, setPath] = useState("");
  const [method, setMethod] = useState<"GET" | "POST" | "PUT" | "DELETE" | "PATCH">("GET");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validatePath = (value: string): string | null => {
    if (!value) return "Path is required";
    if (!value.startsWith("/")) return "Path must start with /";
    if (/[:"|*?<>]/.test(value)) return "Path contains invalid characters";
    if (value.startsWith("/_mock/")) return "Cannot use reserved /_mock prefix";
    return null;
  };

  const handlePathBlur = () => {
    setError(validatePath(path));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pathError = validatePath(path);
    if (pathError) {
      setError(pathError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createEndpoint(path, method);
      onSuccess();
      onClose();
      // Reset form
      setPath("");
      setMethod("GET");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create endpoint");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Add Endpoint</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="endpoint-path"
              className="block text-sm font-medium mb-2 text-gray-700"
            >
              Endpoint Path
            </label>
            <input
              id="endpoint-path"
              type="text"
              value={path}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPath(e.target.value)}
              onBlur={handlePathBlur}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="/api/users"
              aria-label="Endpoint Path"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="http-method"
              className="block text-sm font-medium mb-2 text-gray-700"
            >
              HTTP Method
            </label>
            <select
              id="http-method"
              value={method}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMethod(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              aria-label="HTTP Method"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-2 rounded-md text-white font-medium transition-colors ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary-600 hover:bg-primary-700"
              }`}
            >
              {loading ? "Creating..." : "Create Endpoint"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-md border border-gray-300 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
