import React from "react";
import { Endpoint } from "../types";

interface EndpointCardProps {
  endpoint: Endpoint;
  delayInput: string;
  onMockChange: (path: string, method: string, mockFile: string) => void;
  onDelayChange: (path: string, method: string, delayInput: string) => void;
  onDelaySave: (path: string, method: string, delayMillisecond: number) => void;
}

const getMethodColor = (method: string): string => {
  const colors = {
    GET: "bg-blue-500 text-white",
    POST: "bg-green-500 text-white",
    PUT: "bg-orange-500 text-white",
    DELETE: "bg-red-500 text-white",
    PATCH: "bg-purple-500 text-white",
  };
  return (
    colors[method.toUpperCase() as keyof typeof colors] ||
    "bg-gray-500 text-white"
  );
};

const getStatusColor = (mockFile: string): string => {
  if (mockFile.includes("200")) return "bg-success-500";
  if (
    mockFile.includes("400") ||
    mockFile.includes("404") ||
    mockFile.includes("500")
  ) {
    return "bg-error-500";
  }
  return "bg-warning-500";
};

export const EndpointCard: React.FC<EndpointCardProps> = ({
  endpoint,
  delayInput,
  onMockChange,
  onDelayChange,
  onDelaySave,
}) => {
  const key = `${endpoint.path}|${endpoint.method}`;
  const currentDelay =
    typeof endpoint.delayMillisecond === "number"
      ? endpoint.delayMillisecond
      : "";
  const hasChanges = delayInput !== currentDelay.toString();

  return (
    <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-200 animate-slide-up">
      <div className="flex items-center mb-4">
        <span
          className={`px-3 py-1 rounded-full text-sm font-bold mr-4 ${getMethodColor(
            endpoint.method
          )}`}
        >
          {endpoint.method}
        </span>
        <span className="font-mono text-lg text-gray-800 flex-1">
          {endpoint.path}
        </span>
        <div
          className={`w-3 h-3 rounded-full ${getStatusColor(
            endpoint.currentMock
          )}`}
        ></div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Mock Response:
          </label>
          <select
            value={endpoint.currentMock}
            onChange={(e) =>
              onMockChange(endpoint.path, endpoint.method, e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {endpoint.availableMocks.map((mock, index) => (
              <option key={index} value={mock}>
                {mock}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Response Delay (ms):
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min={0}
              max={60000}
              step={100}
              value={delayInput}
              onChange={(e) =>
                onDelayChange(endpoint.path, endpoint.method, e.target.value)
              }
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
            <button
              onClick={() => {
                const value = delayInput === "" ? 0 : Number(delayInput);
                onDelaySave(endpoint.path, endpoint.method, value);
              }}
              disabled={!hasChanges}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                hasChanges
                  ? "bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
