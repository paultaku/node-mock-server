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

// ============================================================================
// Scenario Management Validation Schemas
// Feature: 004-scenario-management
// ============================================================================

/**
 * Endpoint configuration schema for scenarios
 *
 * Defines how a single endpoint should behave within a scenario:
 * - Which mock response file to use
 * - Response delay in milliseconds
 */
export const EndpointConfigurationSchema = z.object({
  /**
   * API endpoint path (must start with /)
   * @example "/pet/status"
   * @example "/user/login"
   */
  path: z
    .string()
    .min(1, "Path is required")
    .startsWith("/", "Path must start with /")
    .regex(
      /^[/a-zA-Z0-9{}\-_]+$/,
      "Path can only contain letters, numbers, hyphens, underscores, slashes, and {braces} for parameters"
    ),

  /**
   * HTTP method for the endpoint
   * @example "GET"
   * @example "POST"
   */
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"], {
    errorMap: () => ({ message: "Method must be one of: GET, POST, PUT, DELETE, PATCH" }),
  }),

  /**
   * Name of the mock response file to use (must end with .json)
   * @example "success-200.json"
   * @example "error-404.json"
   */
  selectedMockFile: z
    .string()
    .min(1, "Mock file name is required")
    .endsWith(".json", "Mock file must end with .json"),

  /**
   * Response delay in milliseconds (0-60000ms = 0-60 seconds)
   * @default 0
   */
  delayMillisecond: z
    .number()
    .int("Delay must be an integer")
    .min(0, "Delay cannot be negative")
    .max(60000, "Delay cannot exceed 60000ms (60 seconds)")
    .default(0),
});

export type EndpointConfiguration = z.infer<typeof EndpointConfigurationSchema>;

/**
 * Scenario metadata schema
 *
 * Auto-generated tracking information for scenario lifecycle
 */
export const ScenarioMetadataSchema = z.object({
  /**
   * ISO 8601 timestamp of scenario creation (immutable)
   * @example "2025-11-29T10:00:00.000Z"
   */
  createdAt: z.string().datetime({ message: "createdAt must be a valid ISO 8601 datetime" }),

  /**
   * ISO 8601 timestamp of last modification
   * @example "2025-11-29T10:15:00.000Z"
   */
  lastModified: z.string().datetime({ message: "lastModified must be a valid ISO 8601 datetime" }),

  /**
   * Incremental version number (starts at 1)
   */
  version: z.number().int().positive("Version must be a positive integer"),
});

export type ScenarioMetadata = z.infer<typeof ScenarioMetadataSchema>;

/**
 * Scenario schema with duplicate endpoint detection
 *
 * A scenario is a named collection of endpoint configurations.
 * Validation includes:
 * - Name format: 1-50 characters, alphanumeric + hyphens only
 * - At least one endpoint configuration required
 * - No duplicate endpoints (same path + method)
 */
export const ScenarioSchema = z
  .object({
    /**
     * Unique scenario identifier
     * - 1-50 characters
     * - Alphanumeric and hyphens only
     * @example "testing"
     * @example "error-scenarios"
     */
    name: z
      .string()
      .min(1, "Scenario name is required")
      .max(50, "Scenario name cannot exceed 50 characters")
      .regex(
        /^[a-zA-Z0-9-]+$/,
        "Scenario name can only contain letters, numbers, and hyphens"
      ),

    /**
     * Array of endpoint configurations (minimum 1 required)
     */
    endpointConfigurations: z
      .array(EndpointConfigurationSchema)
      .min(1, "Scenario must contain at least one endpoint configuration"),

    /**
     * Auto-generated metadata
     */
    metadata: ScenarioMetadataSchema,
  })
  .refine(
    (data) => {
      // Check for duplicate endpoints (same path + method)
      const keys = new Set<string>();
      for (const config of data.endpointConfigurations) {
        const key = `${config.path}|${config.method}`;
        if (keys.has(key)) return false;
        keys.add(key);
      }
      return true;
    },
    { message: "Duplicate endpoint configurations detected" }
  );

export type Scenario = z.infer<typeof ScenarioSchema>;

/**
 * Active scenario reference schema
 *
 * Tracks which scenario is currently active (stored in _active.json)
 */
export const ActiveScenarioReferenceSchema = z.object({
  /**
   * Name of the currently active scenario (null if none)
   */
  activeScenario: z.string().nullable(),

  /**
   * ISO 8601 timestamp of when the active scenario was last updated
   * @example "2025-11-29T10:15:00.000Z"
   */
  lastUpdated: z.string().datetime({ message: "lastUpdated must be a valid ISO 8601 datetime" }),
});

export type ActiveScenarioReference = z.infer<typeof ActiveScenarioReferenceSchema>;

// ============================================================================
// Scenario API Request Schemas
// ============================================================================

/**
 * Request schema for creating a new scenario
 *
 * Example:
 * {
 *   "name": "testing",
 *   "endpointConfigurations": [
 *     {
 *       "path": "/pet/status",
 *       "method": "GET",
 *       "selectedMockFile": "success-200.json",
 *       "delayMillisecond": 1000
 *     }
 *   ]
 * }
 */
export const CreateScenarioRequestSchema = z
  .object({
    /**
     * Unique scenario name (1-50 chars, alphanumeric + hyphens)
     */
    name: z
      .string()
      .min(1, "Scenario name is required")
      .max(50, "Scenario name cannot exceed 50 characters")
      .regex(
        /^[a-zA-Z0-9-]+$/,
        "Scenario name can only contain letters, numbers, and hyphens"
      ),

    /**
     * Array of endpoint configurations (minimum 1 required)
     */
    endpointConfigurations: z
      .array(EndpointConfigurationSchema)
      .min(1, "Scenario must contain at least one endpoint configuration"),
  })
  .refine(
    (data) => {
      // Check for duplicate endpoints
      const keys = new Set<string>();
      for (const config of data.endpointConfigurations) {
        const key = `${config.path}|${config.method}`;
        if (keys.has(key)) return false;
        keys.add(key);
      }
      return true;
    },
    { message: "Duplicate endpoint configurations detected" }
  );

export type CreateScenarioRequest = z.infer<typeof CreateScenarioRequestSchema>;

/**
 * Request schema for updating an existing scenario
 *
 * Example:
 * {
 *   "endpointConfigurations": [
 *     {
 *       "path": "/pet/status",
 *       "method": "GET",
 *       "selectedMockFile": "error-500.json",
 *       "delayMillisecond": 2000
 *     }
 *   ]
 * }
 */
export const UpdateScenarioRequestSchema = z
  .object({
    /**
     * Updated array of endpoint configurations (minimum 1 required)
     */
    endpointConfigurations: z
      .array(EndpointConfigurationSchema)
      .min(1, "Scenario must contain at least one endpoint configuration"),
  })
  .refine(
    (data) => {
      // Check for duplicate endpoints
      const keys = new Set<string>();
      for (const config of data.endpointConfigurations) {
        const key = `${config.path}|${config.method}`;
        if (keys.has(key)) return false;
        keys.add(key);
      }
      return true;
    },
    { message: "Duplicate endpoint configurations detected" }
  );

export type UpdateScenarioRequest = z.infer<typeof UpdateScenarioRequestSchema>;

// ============================================================================
// Scenario API Response Schemas
// ============================================================================

/**
 * Success response schema for scenario creation/update
 *
 * Example:
 * {
 *   "scenario": { ... },
 *   "message": "Scenario 'testing' created and activated successfully"
 * }
 */
export const ScenarioResponseSchema = z.object({
  /**
   * The created or updated scenario
   */
  scenario: ScenarioSchema,

  /**
   * Success message
   */
  message: z.string(),
});

export type ScenarioResponse = z.infer<typeof ScenarioResponseSchema>;

/**
 * Response schema for listing all scenarios
 *
 * Example:
 * {
 *   "scenarios": [...],
 *   "activeScenario": "testing"
 * }
 */
export const ListScenariosResponseSchema = z.object({
  /**
   * Array of all saved scenarios
   */
  scenarios: z.array(ScenarioSchema),

  /**
   * Name of currently active scenario (null if none)
   */
  activeScenario: z.string().nullable(),
});

export type ListScenariosResponse = z.infer<typeof ListScenariosResponseSchema>;

/**
 * Response schema for getting the active scenario
 *
 * Example:
 * {
 *   "activeScenario": "testing",
 *   "lastUpdated": "2025-11-29T10:15:00.000Z"
 * }
 */
export const ActiveScenarioResponseSchema = z.object({
  /**
   * Name of the currently active scenario (null if none)
   */
  activeScenario: z.string().nullable(),

  /**
   * ISO 8601 timestamp of when active scenario was last updated
   */
  lastUpdated: z.string().datetime(),
});

export type ActiveScenarioResponse = z.infer<typeof ActiveScenarioResponseSchema>;

/**
 * Response schema for scenario deletion
 *
 * Example:
 * {
 *   "message": "Scenario 'testing' deleted successfully"
 * }
 */
export const DeleteScenarioResponseSchema = z.object({
  /**
   * Success message
   */
  message: z.string(),
});

export type DeleteScenarioResponse = z.infer<typeof DeleteScenarioResponseSchema>;

/**
 * Scenario API error response schema
 *
 * Example (400 Validation Error):
 * {
 *   "error": "Validation failed",
 *   "field": "endpointConfigurations",
 *   "constraint": "Scenario must contain at least one endpoint configuration"
 * }
 *
 * Example (409 Duplicate):
 * {
 *   "error": "Scenario with name 'testing' already exists"
 * }
 *
 * Example (404 Not Found):
 * {
 *   "error": "Scenario 'testing' not found"
 * }
 */
export const ScenarioErrorResponseSchema = z.object({
  /**
   * Error message
   */
  error: z.string(),

  /**
   * Field that failed validation (for validation errors)
   */
  field: z.string().optional(),

  /**
   * Validation constraint that was violated (for validation errors)
   */
  constraint: z.string().optional(),
});

export type ScenarioErrorResponse = z.infer<typeof ScenarioErrorResponseSchema>;

// ============================================================================
// Scenario Validation Helpers
// ============================================================================

/**
 * Validate a create scenario request
 */
export function validateCreateScenarioRequest(
  data: unknown
): { success: true; data: CreateScenarioRequest } | { success: false; errors: z.ZodError } {
  const result = CreateScenarioRequestSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Validate an update scenario request
 */
export function validateUpdateScenarioRequest(
  data: unknown
): { success: true; data: UpdateScenarioRequest } | { success: false; errors: z.ZodError } {
  const result = UpdateScenarioRequestSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Validate a scenario object
 */
export function validateScenario(
  data: unknown
): { success: true; data: Scenario } | { success: false; errors: z.ZodError } {
  const result = ScenarioSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Format Zod errors for scenario API response
 */
export function formatScenarioValidationErrors(
  zodError: z.ZodError
): ScenarioErrorResponse {
  // Get first error for simplicity
  const firstError = zodError.errors[0];
  const fieldName = firstError?.path.join(".") || "unknown";
  const message = firstError?.message || "Validation error";

  return {
    error: `Validation failed: ${message}`,
    field: fieldName,
    constraint: message,
  };
}
