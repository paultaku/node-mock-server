import React from "react";
import { useEndpoints } from "../hooks/useEndpoints";
import { StatsComponent } from "./Stats";
import { EndpointCard } from "./EndpointCard";
import { Stats } from "../types";

export const App: React.FC = () => {
  const {
    endpoints,
    loading,
    error,
    message,
    delayInputs,
    setDelayInputs,
    fetchEndpoints,
    setMockResponse,
    setDelay,
  } = useEndpoints();

  const stats: Stats = {
    total: endpoints.length,
    get: endpoints.filter((e) => e.method === "GET").length,
    post: endpoints.filter((e) => e.method === "POST").length,
    put: endpoints.filter((e) => e.method === "PUT").length,
    delete: endpoints.filter((e) => e.method === "DELETE").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Loading...
          </h2>
          <p className="text-gray-500">Fetching API endpoint information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-xl p-8 mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Mock Server Manager</h1>
          <p className="text-xl opacity-90">
            Manage and switch API endpoint mock responses
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-error-50 border-l-4 border-error-400 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-error-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-error-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className="bg-success-50 border-l-4 border-success-400 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-success-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-success-700">{message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={fetchEndpoints}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors mb-8"
        >
          Refresh Endpoints
        </button>

        {/* Stats */}
        <StatsComponent stats={stats} />

        {/* Endpoints Grid */}
        {endpoints.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {endpoints.map((endpoint, index) => (
              <EndpointCard
                key={`${endpoint.path}-${endpoint.method}-${index}`}
                endpoint={endpoint}
                delayInput={
                  delayInputs[`${endpoint.path}|${endpoint.method}`] || ""
                }
                onMockChange={setMockResponse}
                onDelayChange={(path, method, value) => {
                  setDelayInputs((prev) => ({
                    ...prev,
                    [`${path}|${method}`]: value,
                  }));
                }}
                onDelaySave={setDelay}
              />
            ))}
          </div>
        ) : (
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
              No Endpoints Found
            </h2>
            <p className="text-gray-500">
              Please ensure there are generated mock files in the mock directory
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
