/**
 * API Contract: Create Endpoint
 * Feature: 003-add-endpoint
 * Endpoint: POST /_mock/endpoints
 *
 * This contract defines the request/response schema for creating new mock endpoints
 * through the dashboard UI. It uses Zod for runtime validation and TypeScript type
 * inference to ensure type safety across frontend and backend.
 */

import { z } from "zod";

// ============================================================================
// HTTP Method Enum
// ============================================================================

/**
 * Supported HTTP methods for mock endpoints
 */
export const HttpMethodSchema = z.enum([
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
]);

export type HttpMethod = z.infer<typeof HttpMethodSchema>;

// ============================================================================
// Path Validation
// ============================================================================

/**
 * Endpoint path validation rules:
 * - Must start with /
 * - Can contain: letters, numbers, hyphens, slashes, curly braces (for params)
 * - Cannot contain invalid file system characters: : | < > " * ?
 * - Cannot start with /_mock/ (reserved for management API)
 * - Max length: 500 characters
 */
export const EndpointPathSchema = z
  .string()
  .min(1, "Path is required")
  .max(500, "Path is too long (max 500 characters)")
  .regex(
    /^\/[a-z0-9\-\/{}]*$/i,
    "Path must start with / and can only contain letters, numbers, hyphens, slashes, and {braces} for parameters"
  )
  .refine(
    (path) => !/[:"|*?<>]/.test(path),
    "Path contains invalid file system characters. Remove: : | < > \" * ?"
  )
  .refine(
    (path) => !path.startsWith("/_mock/"),
    "Cannot create endpoints with reserved /_mock prefix (used for management API)"
  );

// ============================================================================
// Request Schema
// ============================================================================

/**
 * Request body schema for POST /_mock/endpoints
 *
 * Example:
 * {
 *   "path": "/pet/status/{id}",
 *   "method": "GET"
 * }
 */
export const CreateEndpointRequestSchema = z.object({
  /**
   * API endpoint path
   * @example "/users"
   * @example "/pet/status/{id}"
   * @example "/api/v1/products/{productId}/reviews"
   */
  path: EndpointPathSchema,

  /**
   * HTTP method for the endpoint
   * @example "GET"
   * @example "POST"
   */
  method: HttpMethodSchema,
});

export type CreateEndpointRequest = z.infer<typeof CreateEndpointRequestSchema>;

// ============================================================================
// Success Response Schema
// ============================================================================

/**
 * Success response schema (HTTP 201 Created)
 *
 * Example:
 * {
 *   "success": true,
 *   "message": "Endpoint created successfully",
 *   "endpoint": {
 *     "path": "/pet/status/{id}",
 *     "method": "GET",
 *     "filesCreated": [
 *       "success-200.json",
 *       "unexpected-error-default.json",
 *       "status.json"
 *     ],
 *     "availableAt": "http://localhost:3000/pet/status/123",
 *     "mockDirectory": "/mock/pet/status/{id}/GET"
 *   }
 * }
 */
export const CreateEndpointSuccessSchema = z.object({
  /**
   * Indicates successful endpoint creation
   */
  success: z.literal(true),

  /**
   * Human-readable success message
   */
  message: z.string(),

  /**
   * Details about the created endpoint
   */
  endpoint: z.object({
    /**
     * The endpoint path that was created
     */
    path: z.string(),

    /**
     * The HTTP method for the endpoint
     */
    method: HttpMethodSchema,

    /**
     * List of files that were generated
     */
    filesCreated: z.array(z.string()),

    /**
     * Example URL where the endpoint is now available
     * (with path parameters replaced with example values)
     */
    availableAt: z.string(),

    /**
     * File system directory where mock files are stored
     */
    mockDirectory: z.string(),
  }),
});

export type CreateEndpointSuccessResponse = z.infer<
  typeof CreateEndpointSuccessSchema
>;

// ============================================================================
// Error Response Schemas
// ============================================================================

/**
 * Validation error detail
 */
const ValidationErrorDetailSchema = z.object({
  /**
   * Field that failed validation
   */
  field: z.string(),

  /**
   * Validation error message
   */
  message: z.string(),
});

/**
 * Error response schema (HTTP 400, 409, 500)
 *
 * Example (400 Validation Error):
 * {
 *   "error": "Validation failed",
 *   "details": [
 *     { "field": "path", "message": "Path is required" },
 *     { "field": "method", "message": "Invalid enum value. Expected 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'" }
 *   ]
 * }
 *
 * Example (409 Duplicate):
 * {
 *   "error": "Endpoint already exists",
 *   "existingEndpoint": {
 *     "path": "/users",
 *     "method": "GET",
 *     "mockDirectory": "/mock/users/GET"
 *   }
 * }
 *
 * Example (500 Server Error):
 * {
 *   "error": "Failed to create endpoint files",
 *   "detail": "EACCES: permission denied, mkdir '/mock/users'"
 * }
 */
export const CreateEndpointErrorSchema = z.object({
  /**
   * Error message describing what went wrong
   */
  error: z.string(),

  /**
   * Validation error details (for 400 errors)
   */
  details: z.array(ValidationErrorDetailSchema).optional(),

  /**
   * Server error detail (for 500 errors)
   */
  detail: z.string().optional(),

  /**
   * Existing endpoint info (for 409 duplicate errors)
   */
  existingEndpoint: z
    .object({
      path: z.string(),
      method: z.string(),
      mockDirectory: z.string(),
    })
    .optional(),
});

export type CreateEndpointErrorResponse = z.infer<
  typeof CreateEndpointErrorSchema
>;

// ============================================================================
// HTTP Status Codes
// ============================================================================

/**
 * Expected HTTP status codes for this endpoint
 */
export const HTTP_STATUS = {
  /**
   * 201 Created - Endpoint was successfully created
   */
  CREATED: 201,

  /**
   * 400 Bad Request - Validation failed (invalid path, method, etc.)
   */
  BAD_REQUEST: 400,

  /**
   * 409 Conflict - Endpoint with same path and method already exists
   */
  CONFLICT: 409,

  /**
   * 500 Internal Server Error - File system error, permission denied, etc.
   */
  INTERNAL_ERROR: 500,
} as const;

// ============================================================================
// Contract Validation Helpers
// ============================================================================

/**
 * Validate a request against the schema
 */
export function validateCreateEndpointRequest(
  data: unknown
): { success: true; data: CreateEndpointRequest } | { success: false; errors: z.ZodError } {
  const result = CreateEndpointRequestSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Format Zod errors for API response
 */
export function formatValidationErrors(
  zodError: z.ZodError
): CreateEndpointErrorResponse {
  return {
    error: "Validation failed",
    details: zodError.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    })),
  };
}
