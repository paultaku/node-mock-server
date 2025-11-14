/**
 * Response Builder
 *
 * Generates mock response data from OpenAPI/Swagger schemas.
 * Converts JSON Schema definitions into realistic mock data.
 */

/**
 * Recursively generate mock data from a JSON Schema
 * @param schema - JSON Schema object
 * @param components - Swagger components for $ref resolution
 * @returns Generated mock data matching the schema
 */
export function generateMockDataFromSchema(schema: any, components: any): any {
  if (!schema) return null;

  // Handle $ref
  if (schema.$ref) {
    const refPath = schema.$ref.replace(/^#\//, "").split("/");
    let ref = components;
    for (const seg of refPath.slice(1)) {
      if (ref && ref[seg]) {
        ref = ref[seg];
      } else {
        console.warn(`Warning: Could not resolve $ref: ${schema.$ref}`);
        return null;
      }
    }
    return generateMockDataFromSchema(ref, components);
  }

  // Prefer example when present
  if (schema.example !== undefined) return schema.example;

  // type: object
  if (schema.type === "object" || schema.properties) {
    const obj: any = {};
    const props = schema.properties || {};
    for (const [key, propSchema] of Object.entries(props)) {
      obj[key] = generateMockDataFromSchema(propSchema, components);
    }
    return obj;
  }

  // type: array
  if (schema.type === "array" && schema.items) {
    const item = generateMockDataFromSchema(schema.items, components);
    return [item];
  }

  // type: string
  if (schema.type === "string") {
    if (schema.enum && schema.enum.length > 0) {
      return schema.enum[0];
    }
    if (schema.format === "date-time") return "2023-01-01T00:00:00Z";
    if (schema.format === "date") return "2023-01-01";
    if (schema.format === "email") return "user@example.com";
    if (schema.format === "uri") return "https://example.com";
    if (schema.format === "uuid") return "123e4567-e89b-12d3-a456-426614174000";
    return "string";
  }

  // type: integer/number
  if (schema.type === "integer" || schema.type === "number") {
    if (schema.minimum !== undefined) return schema.minimum;
    if (schema.maximum !== undefined) return Math.floor(schema.maximum / 2);
    return 0;
  }

  // type: boolean
  if (schema.type === "boolean") {
    return true;
  }

  // fallback
  return null;
}

/**
 * Generate default response templates for common HTTP status codes
 * Used when no response schema is defined in the OpenAPI spec
 * @returns Record of status code to response definition
 */
export function generateDefaultResponses(): Record<string, any> {
  return {
    "200": {
      description: "Successful operation",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    "400": {
      description: "Bad request",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              error: { type: "string" },
              code: { type: "string" },
            },
          },
        },
      },
    },
    "404": {
      description: "Not found",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              error: { type: "string" },
              code: { type: "string" },
            },
          },
        },
      },
    },
    "500": {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              error: { type: "string" },
              code: { type: "string" },
            },
          },
        },
      },
    },
  };
}

/**
 * Build mock response body from a Swagger response definition
 * @param responseDefinition - Swagger response object
 * @param status - HTTP status code
 * @param components - Swagger components for schema resolution
 * @returns Mock response body
 */
export function buildMockResponseBody(
  responseDefinition: any,
  status: string,
  components: any
): any {
  let mockBody = {};

  // Only handle application/json
  const content = responseDefinition.content?.["application/json"];
  if (content && content.schema) {
    mockBody = generateMockDataFromSchema(content.schema, components);
  } else {
    // If no schema, generate default response
    mockBody = {
      success: status === "200",
      message: responseDefinition.description || "Response",
      status: parseInt(status),
    };
  }

  return mockBody;
}
