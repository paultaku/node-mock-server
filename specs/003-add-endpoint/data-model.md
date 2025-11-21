# Data Model: Add Endpoint UI

**Feature**: 003-add-endpoint
**Date**: 2025-11-15
**Status**: Design Phase

## Overview

This document defines the data entities, relationships, and file structures for the Add Endpoint UI feature. The design follows the existing domain-driven patterns in the codebase, with clear separation between presentation (frontend), application (API), and infrastructure (file system) layers.

## Domain Entities

### 1. Endpoint Creation Request

Represents the user's input for creating a new mock endpoint.

**Entity**: `EndpointCreationRequest`

**Attributes**:
- `path` (string, required): API endpoint path (e.g., `/pet/status/{id}`)
  - Must start with `/`
  - Can contain path parameters in `{param}` format
  - Alphanumeric, hyphens, slashes, and curly braces only
  - Cannot start with `/_mock/` (reserved prefix)
  - Max length: 500 characters

- `method` (HttpMethod, required): HTTP method for the endpoint
  - Enum: `GET` | `POST` | `PUT` | `DELETE` | `PATCH`
  - Case-insensitive input, stored as uppercase

**Validation Rules**:
1. Path must match regex: `^\/[a-z0-9\-\/{}]*$` (case-insensitive)
2. Path cannot contain invalid file system characters: `:`, `|`, `<`, `>`, `"`, `*`, `?`
3. Path + Method combination must be unique (no duplicates)
4. Path cannot start with `/_mock/`

**Relationships**:
- Creates → `EndpointFileStructure` (1:1)
- Validated by → `CreateEndpointSchema` (Zod schema)

---

### 2. Endpoint File Structure

Represents the physical file system organization for a mock endpoint.

**Entity**: `EndpointFileStructure`

**Attributes**:
- `basePath` (string): Root directory for mock endpoints (e.g., `/mock`)
- `pathSegments` (string[]): API path broken into segments (e.g., `['pet', 'status', '{id}']`)
- `method` (string): HTTP method in uppercase (e.g., `GET`)
- `fullPath` (string): Complete file system path (e.g., `/mock/pet/status/{id}/GET`)

**Files Generated**:
1. `success-200.json`: Default successful response
   ```json
   {
     "header": [],
     "body": {
       "status": "success",
       "message": "Mock response"
     }
   }
   ```

2. `unexpected-error-default.json`: Default error response
   ```json
   {
     "header": [],
     "body": {
       "status": "error",
       "message": "Unexpected error"
     }
   }
   ```

3. `status.json`: Endpoint configuration
   ```json
   {
     "selected": "success-200.json",
     "delayMillisecond": 0
   }
   ```

**Relationships**:
- Created from → `EndpointCreationRequest` (1:1)
- Registered as → `RuntimeEndpoint` (1:1)

---

### 3. Runtime Endpoint

Represents a dynamically registered endpoint in the Express application.

**Entity**: `RuntimeEndpoint`

**Attributes**:
- `path` (string): API endpoint path
- `method` (string): HTTP method
- `handler` (Function): Express route handler function
- `currentMock` (string): Currently selected mock file
- `availableMocks` (string[]): List of available response files
- `delayMillisecond` (number): Response delay in milliseconds

**Lifecycle**:
1. **Created**: When endpoint files are generated
2. **Registered**: Added to Express router dynamically
3. **Active**: Responds to HTTP requests matching path + method
4. **Persisted**: Survives server restart (files remain on disk)

**Relationships**:
- Defined by → `EndpointFileStructure` (1:1)
- Responds with → `MockResponse` (1:N)

---

### 4. Mock Response

Represents a response file that can be served by an endpoint.

**Entity**: `MockResponse`

**Attributes**:
- `fileName` (string): Response file name (e.g., `success-200.json`)
- `statusCode` (number): HTTP status code (e.g., 200, 404, 500)
- `description` (string): Human-readable description
- `headers` (Header[]): HTTP headers to include in response
- `body` (object): Response body content

**Relationships**:
- Belongs to → `RuntimeEndpoint` (N:1)
- Selected via → `status.json` configuration

---

## State Transitions

### Endpoint Creation Flow

```
┌─────────────────┐
│  User Input     │
│  (Form Data)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Validate Request       │
│  - Path format          │
│  - Method enum          │
│  - Duplicate check      │
│  - Character validation │
└────────┬────────────────┘
         │ [Valid]
         ▼
┌─────────────────────────┐
│  Generate File Structure│
│  - Create directories   │
│  - Write JSON templates │
│  - Write status.json    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Register Endpoint      │
│  - Add Express route    │
│  - Attach handler       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Return Success         │
│  - 201 Created          │
│  - Endpoint details     │
└─────────────────────────┘
```

**Error States**:
- **Validation Failure**: Return 400 with error details
- **Duplicate Endpoint**: Return 409 Conflict
- **File System Error**: Return 500 with error message
- **Permission Denied**: Return 500 with permission error

---

## File System Structure

### Directory Layout

```
<mock-root>/
├── pet/
│   └── status/
│       └── {id}/
│           ├── GET/
│           │   ├── success-200.json
│           │   ├── unexpected-error-default.json
│           │   └── status.json
│           └── DELETE/
│               ├── success-200.json
│               ├── unexpected-error-default.json
│               └── status.json
├── users/
│   ├── GET/
│   │   ├── success-200.json
│   │   ├── unexpected-error-default.json
│   │   └── status.json
│   └── POST/
│       ├── success-200.json
│       ├── unexpected-error-default.json
│       └── status.json
└── _mock/
    └── (reserved for management API)
```

**Path Mapping Rules**:
1. API path `/pet/status/{id}` → Directory `<mock-root>/pet/status/{id}/`
2. Path parameters `{id}` are preserved literally in folder names
3. Method `GET` → Subdirectory `GET/`
4. Each method directory contains response files and status configuration

### File Naming Conventions

**Response Files**:
- Format: `{description}-{status}.json`
- Examples:
  - `success-200.json`
  - `created-201.json`
  - `not-found-404.json`
  - `server-error-500.json`
  - `unexpected-error-default.json`

**Status File**:
- Name: Always `status.json`
- Purpose: Tracks which response file is currently selected and delay settings

---

## TypeScript Interfaces

### Request/Response Types

```typescript
// Request body for POST /_mock/endpoints
export interface CreateEndpointRequest {
  path: string;
  method: HttpMethod;
}

// Success response from POST /_mock/endpoints
export interface CreateEndpointResponse {
  success: true;
  message: string;
  endpoint: {
    path: string;
    method: string;
    filesCreated: string[];
    availableAt: string; // URL where endpoint is now available
  };
}

// Error response
export interface ErrorResponse {
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}
```

### Internal Types

```typescript
// HTTP methods supported
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// Mock response file structure
export interface MockFile {
  header: Array<{ key: string; value: string }>;
  body: Record<string, any>;
}

// Status.json file structure
export interface EndpointStatus {
  selected: string;
  delayMillisecond: number;
}

// Endpoint configuration for file generation
export interface EndpointConfig {
  mockRoot: string;
  path: string;
  method: HttpMethod;
  templates: {
    success: MockFile;
    error: MockFile;
  };
}
```

---

## Validation Schema (Zod)

```typescript
import { z } from "zod";

// HTTP method enum
const HttpMethodSchema = z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]);

// Path validation with custom refinements
const EndpointPathSchema = z
  .string()
  .min(1, "Path is required")
  .max(500, "Path is too long")
  .regex(/^\/[a-z0-9\-\/{}]*$/i, "Invalid path format")
  .refine(
    (path) => !/[:"|*?<>]/.test(path),
    "Path contains invalid file system characters"
  )
  .refine(
    (path) => !path.startsWith("/_mock/"),
    "Cannot create endpoints with reserved /_mock prefix"
  );

// Complete request schema
export const CreateEndpointSchema = z.object({
  path: EndpointPathSchema,
  method: HttpMethodSchema,
});

// Inferred TypeScript type
export type CreateEndpointRequest = z.infer<typeof CreateEndpointSchema>;
```

---

## Data Flow Diagram

```
┌──────────────┐
│   Frontend   │
│   (React)    │
└──────┬───────┘
       │ POST /_mock/endpoints
       │ { path, method }
       ▼
┌──────────────────────┐
│   Express API        │
│   - Validate Schema  │
│   - Check Duplicates │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  File Generator      │
│  - Create Dirs       │
│  - Write JSON Files  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Endpoint Registry   │
│  - Add Route         │
│  - Register Handler  │
└──────┬───────────────┘
       │
       │ 201 Created
       │ { success, endpoint }
       ▼
┌──────────────┐
│   Frontend   │
│   (Update UI)│
└──────────────┘
```

---

## Concurrency Handling

### Duplicate Prevention Strategy

**Problem**: Multiple users/tabs create the same endpoint simultaneously.

**Solution**: File system atomic operations with duplicate checking.

**Implementation**:
1. Check if endpoint directory exists before creation
2. Use file system locks (via fs-extra) for directory creation
3. If directory exists, return 409 Conflict error
4. First write wins, subsequent requests fail gracefully

**Pseudocode**:
```typescript
async function createEndpoint(path: string, method: string): Promise<void> {
  const endpointDir = getEndpointDirectory(path, method);

  // Atomic check-and-create
  if (await directoryExists(endpointDir)) {
    throw new DuplicateEndpointError(
      `Endpoint ${method} ${path} already exists`
    );
  }

  // Create directory atomically
  await ensureDirectory(endpointDir);

  // Write files
  await Promise.all([
    writeJson(successFile, successTemplate),
    writeJson(errorFile, errorTemplate),
    writeJson(statusFile, statusTemplate),
  ]);
}
```

---

## Summary

This data model provides:

1. **Clear entity definitions** with attributes, validation rules, and relationships
2. **File system structure** that mirrors API paths intuitively
3. **Type safety** with TypeScript interfaces and Zod schemas
4. **State transitions** showing endpoint lifecycle from creation to runtime
5. **Concurrency handling** to prevent duplicate endpoint creation
6. **Consistent patterns** aligned with existing codebase conventions

All entities follow the existing domain-driven design principles and leverage established patterns from the research phase (file system utilities, Express routing, Zod validation).

**Next Steps**: Create API contract specification and quickstart guide.
