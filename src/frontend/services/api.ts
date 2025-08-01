import { Endpoint } from "../types";

const API_BASE = "/api";

export const apiService = {
  async fetchEndpoints(): Promise<Endpoint[]> {
    const response = await fetch(`${API_BASE}/endpoints`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async setMockResponse(
    path: string,
    method: string,
    mockFile: string
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/set-mock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path, method, mockFile }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },

  async setDelay(
    path: string,
    method: string,
    delayMillisecond: number
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/set-delay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path, method, delayMillisecond }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },
};
