/**
 * Endpoint API Client
 *
 * Client-side service for interacting with the /_mock/endpoints API.
 */

import type {
  CreateEndpointRequest,
  CreateEndpointSuccessResponse,
  CreateEndpointErrorResponse,
} from "../../shared/types/validation-schemas";

/**
 * Create a new mock endpoint
 *
 * @param path - API endpoint path (e.g., "/users" or "/pet/status/{id}")
 * @param method - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @returns Promise resolving to success response
 * @throws Error with user-friendly message on failure
 */
export async function createEndpoint(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
): Promise<CreateEndpointSuccessResponse> {
  const requestBody: CreateEndpointRequest = { path, method };

  const response = await fetch("/_mock/endpoints", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData: CreateEndpointErrorResponse = await response.json();

    // Format error message based on status code
    if (response.status === 400) {
      // Validation error
      const detailMessages = errorData.details
        ?.map((d) => d.message)
        .join(", ");
      throw new Error(detailMessages || errorData.error || "Validation failed");
    } else if (response.status === 409) {
      // Duplicate endpoint
      throw new Error("Endpoint already exists");
    } else {
      // Server error
      throw new Error(
        errorData.detail || errorData.error || "Failed to create endpoint"
      );
    }
  }

  const successData: CreateEndpointSuccessResponse = await response.json();
  return successData;
}
