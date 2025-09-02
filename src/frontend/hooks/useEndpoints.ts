import { useState, useEffect } from "react";
import { Endpoint } from "../types";
import { apiService } from "../services/api";

export const useEndpoints = () => {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [delayInputs, setDelayInputs] = useState<Record<string, string>>({});

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.fetchEndpoints();
      setEndpoints(data);
    } catch (err) {
      setError(
        `Failed to fetch endpoints: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const setMockResponse = async (
    path: string,
    method: string,
    mockFile: string
  ) => {
    try {
      await apiService.setMockResponse(path, method, mockFile);
      setMessage(`Successfully updated mock response for ${method} ${path}`);

      // Update local state
      setEndpoints((prev) =>
        prev.map((endpoint) =>
          endpoint.path === path && endpoint.method === method
            ? { ...endpoint, currentMock: mockFile }
            : endpoint
        )
      );

      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(
        `Failed to set mock response: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      setTimeout(() => setError(null), 5000);
    }
  };

  const setDelay = async (
    path: string,
    method: string,
    delayMillisecond: number
  ) => {
    try {
      await apiService.setDelay(path, method, delayMillisecond);
      setMessage(
        `Successfully set delay for ${method} ${path} to ${delayMillisecond}ms`
      );
      fetchEndpoints(); // Refresh after setting
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(
        `Failed to set delay: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      setTimeout(() => setError(null), 5000);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, []);

  useEffect(() => {
    // Sync delayInputs when endpoints change
    const map: Record<string, string> = {};
    endpoints.forEach((e) => {
      map[`${e.path}|${e.method}`] =
        typeof e.delayMillisecond === "number"
          ? e.delayMillisecond.toString()
          : "";
    });
    setDelayInputs(map);
  }, [endpoints]);

  return {
    endpoints,
    loading,
    error,
    message,
    delayInputs,
    setDelayInputs,
    fetchEndpoints,
    setMockResponse,
    setDelay,
  };
};
