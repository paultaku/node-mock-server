import { Endpoint } from "../types";

const MOCK_API_BASE = "/_mock";

export const apiService = {
  async fetchEndpoints(): Promise<Endpoint[]> {
    const response = await fetch(`${MOCK_API_BASE}/endpoints`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json() as Promise<Endpoint[]>;
  },

  async setMockResponse(
    path: string,
    method: string,
    mockFile: string
  ): Promise<void> {
    const response = await fetch(`${MOCK_API_BASE}/update`, {
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
    const response = await fetch(`${MOCK_API_BASE}/update`, {
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

  async updateMockStatus(
    path: string,
    method: string,
    mockFile?: string,
    delayMillisecond?: number
  ): Promise<void> {
    const body: any = { path, method };
    if (mockFile !== undefined) body.mockFile = mockFile;
    if (delayMillisecond !== undefined)
      body.delayMillisecond = delayMillisecond;

    const response = await fetch(`${MOCK_API_BASE}/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },

  async getMockStatus(path: string, method: string): Promise<any> {
    const response = await fetch(
      `${MOCK_API_BASE}/status?path=${encodeURIComponent(
        path
      )}&method=${encodeURIComponent(method)}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
};
