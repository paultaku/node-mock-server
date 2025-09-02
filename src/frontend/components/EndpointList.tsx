import React from "react";
import { Endpoint } from "../types";

interface EndpointListProps {
  endpoints: Endpoint[];
  delayInputs: Record<string, string>;
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

export const EndpointList: React.FC<EndpointListProps> = ({
  endpoints,
  delayInputs,
  onMockChange,
  onDelayChange,
  onDelaySave,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Path
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Mock Response
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Response delay (ms)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {endpoints.map((endpoint, index) => {
              const key = `${endpoint.path}|${endpoint.method}`;
              const currentDelay =
                typeof endpoint.delayMillisecond === "number"
                  ? endpoint.delayMillisecond
                  : "";
              const hasChanges = delayInputs[key] !== currentDelay.toString();

              return (
                <tr key={`${endpoint.path}-${endpoint.method}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodColor(
                        endpoint.method
                      )}`}
                    >
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm text-gray-900 font-mono">
                      {endpoint.path}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(
                          endpoint.currentMock
                        )} mr-2`}
                      ></div>
                      <span className="text-sm text-gray-900">
                        {endpoint.currentMock.includes("200") ? "Success" : 
                         endpoint.currentMock.includes("400") || endpoint.currentMock.includes("404") || endpoint.currentMock.includes("500") ? "Error" : "Warning"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={endpoint.currentMock}
                      onChange={(e) =>
                        onMockChange(endpoint.path, endpoint.method, (e.target as HTMLSelectElement).value)
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {endpoint.availableMocks.map((mock, mockIndex) => (
                        <option key={mockIndex} value={mock}>
                          {mock}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min={0}
                        max={60000}
                        step={100}
                        value={delayInputs[key] || ""}
                        onChange={(e) =>
                          onDelayChange(endpoint.path, endpoint.method, (e.target as HTMLInputElement).value)
                        }
                        className="w-20 px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="0"
                      />
                      <button
                        onClick={() => {
                          const value = delayInputs[key] === "" ? 0 : Number(delayInputs[key]);
                          onDelaySave(endpoint.path, endpoint.method, value);
                        }}
                        disabled={!hasChanges}
                        className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                          hasChanges
                            ? "bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        Save
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">
                        {endpoint.availableMocks.length} responses
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

