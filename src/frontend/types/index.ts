export interface Endpoint {
  path: string;
  method: string;
  currentMock: string;
  availableMocks: string[];
  delayMillisecond?: number;
}

export interface Stats {
  total: number;
  get: number;
  post: number;
  put: number;
  delete: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface EndpointCreationForm {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
}

export interface CreateEndpointResponse {
  success: true;
  message: string;
  endpoint: {
    path: string;
    method: string;
    filesCreated: string[];
    availableAt: string;
    mockDirectory: string;
  };
}
