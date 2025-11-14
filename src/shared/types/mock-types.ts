/**
 * Shared mock-related types used across domains
 */

/**
 * HTTP methods supported by the mock server
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

/**
 * HTTP status codes commonly used in mock responses
 */
export type HttpStatus = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 500 | 502 | 503;

/**
 * Common HTTP status code strings
 */
export type HttpStatusString = '200' | '201' | '204' | '400' | '401' | '403' | '404' | '500' | '502' | '503';

/**
 * Route definition for a mock endpoint
 */
export interface RouteDefinition {
  readonly path: string;
  readonly method: HttpMethod;
  readonly statuses: readonly HttpStatus[];
}

/**
 * Mock response template
 */
export interface ResponseTemplate {
  readonly status: HttpStatus;
  readonly body: unknown;
  readonly headers?: Record<string, string>;
}
