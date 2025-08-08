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
