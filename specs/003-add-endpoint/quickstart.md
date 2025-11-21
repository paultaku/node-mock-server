# Quickstart Guide: Add Endpoint UI Feature

**Feature**: 003-add-endpoint
**Branch**: `003-add-endpoint`
**Last Updated**: 2025-11-15

## Overview

This guide provides a step-by-step TDD workflow for implementing the Add Endpoint UI feature. Follow the Red-Green-Refactor cycle to ensure test coverage before implementation.

## Prerequisites

```bash
# Ensure you're on the feature branch
git checkout 003-add-endpoint

# Install dependencies (if not already installed)
npm install

# Verify test setup
npm test
```

## File Locations

### Files to Create

| File | Path | Purpose |
|------|------|---------|
| API Contract | `src/shared/types/validation-schemas.ts` | Zod schemas for endpoint creation |
| File Generator | `src/domains/server-runtime/endpoint-file-generator.ts` | Creates folder structure and JSON files |
| Endpoint Validator | `src/domains/server-runtime/endpoint-validator.ts` | Validates paths and checks duplicates |
| Add Endpoint Button | `src/frontend/components/AddEndpointButton.tsx` | Button to open creation modal |
| Add Endpoint Modal | `src/frontend/components/AddEndpointModal.tsx` | Form modal for endpoint creation |
| API Service | `src/frontend/services/endpointApi.ts` | API client for /_mock/endpoints |

### Files to Modify

| File | Path | Changes |
|------|------|---------|
| Mock Server | `src/domains/server-runtime/mock-server.ts` | Add POST /_mock/endpoints route |
| App Component | `src/frontend/components/App.tsx` | Add button and modal |
| Frontend Types | `src/frontend/types/index.ts` | Add EndpointCreation types |

---

## TDD Workflow (Red-Green-Refactor)

### Phase 1: Backend - File Generation (Unit Tests)

#### Step 1.1: Write Failing Tests (RED)

**Create** `tests/unit/endpoint-file-generator.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import * as path from "path";
import * as fs from "fs-extra";
import { generateEndpointFiles } from "../../src/domains/server-runtime/endpoint-file-generator";

describe("EndpointFileGenerator", () => {
  const testMockRoot = path.join(__dirname, "../fixtures/test-mock");

  beforeEach(async () => {
    await fs.ensureDir(testMockRoot);
  });

  afterEach(async () => {
    await fs.remove(testMockRoot);
  });

  describe("Directory Structure", () => {
    it("should create correct folder structure for simple path", async () => {
      await generateEndpointFiles({
        mockRoot: testMockRoot,
        path: "/users",
        method: "GET",
      });

      const expectedDir = path.join(testMockRoot, "users", "GET");
      expect(await fs.pathExists(expectedDir)).toBe(true);
    });

    it("should create nested folders for complex paths", async () => {
      await generateEndpointFiles({
        mockRoot: testMockRoot,
        path: "/pet/status/{id}",
        method: "POST",
      });

      const expectedDir = path.join(testMockRoot, "pet", "status", "{id}", "POST");
      expect(await fs.pathExists(expectedDir)).toBe(true);
    });

    it("should preserve path parameters in folder names", async () => {
      await generateEndpointFiles({
        mockRoot: testMockRoot,
        path: "/api/users/{userId}/posts/{postId}",
        method: "DELETE",
      });

      const expectedDir = path.join(
        testMockRoot,
        "api",
        "users",
        "{userId}",
        "posts",
        "{postId}",
        "DELETE"
      );
      expect(await fs.pathExists(expectedDir)).toBe(true);
    });
  });

  describe("JSON Template Generation", () => {
    it("should create success-200.json with correct structure", async () => {
      await generateEndpointFiles({
        mockRoot: testMockRoot,
        path: "/users",
        method: "GET",
      });

      const successFile = path.join(testMockRoot, "users", "GET", "success-200.json");
      const content = await fs.readJson(successFile);

      expect(content).toEqual({
        header: [],
        body: {
          status: "success",
          message: "Mock response",
        },
      });
    });

    it("should create unexpected-error-default.json", async () => {
      await generateEndpointFiles({
        mockRoot: testMockRoot,
        path: "/users",
        method: "GET",
      });

      const errorFile = path.join(
        testMockRoot,
        "users",
        "GET",
        "unexpected-error-default.json"
      );
      const content = await fs.readJson(errorFile);

      expect(content).toEqual({
        header: [],
        body: {
          status: "error",
          message: "Unexpected error",
        },
      });
    });

    it("should create status.json with default configuration", async () => {
      await generateEndpointFiles({
        mockRoot: testMockRoot,
        path: "/users",
        method: "GET",
      });

      const statusFile = path.join(testMockRoot, "users", "GET", "status.json");
      const content = await fs.readJson(statusFile);

      expect(content).toEqual({
        selected: "success-200.json",
        delayMillisecond: 0,
      });
    });
  });

  describe("Error Handling", () => {
    it("should throw error if mockRoot doesn't exist and can't be created", async () => {
      await expect(
        generateEndpointFiles({
          mockRoot: "/invalid/path/that/cannot/be/created",
          path: "/users",
          method: "GET",
        })
      ).rejects.toThrow();
    });
  });
});
```

**Run tests (should FAIL)**:
```bash
npm test endpoint-file-generator
```

#### Step 1.2: Implement Minimal Code (GREEN)

**Create** `src/domains/server-runtime/endpoint-file-generator.ts`:

```typescript
import * as path from "path";
import { writeJson, ensureDirectory } from "../../shared/file-system";

export interface EndpointFileConfig {
  mockRoot: string;
  path: string;
  method: string;
}

export interface EndpointFileResult {
  filesCreated: string[];
  mockDirectory: string;
}

export async function generateEndpointFiles(
  config: EndpointFileConfig
): Promise<EndpointFileResult> {
  const { mockRoot, path: apiPath, method } = config;

  // Parse path into segments (remove leading /, split on /)
  const pathSegments = apiPath.substring(1).split("/");

  // Build directory path: <mockRoot>/{segments}/{METHOD}
  const endpointDir = path.join(mockRoot, ...pathSegments, method.toUpperCase());

  // Ensure directory exists
  await ensureDirectory(endpointDir);

  // Define file paths
  const successFile = path.join(endpointDir, "success-200.json");
  const errorFile = path.join(endpointDir, "unexpected-error-default.json");
  const statusFile = path.join(endpointDir, "status.json");

  // Write JSON templates
  await Promise.all([
    writeJson(
      successFile,
      {
        header: [],
        body: {
          status: "success",
          message: "Mock response",
        },
      },
      { spaces: 2 }
    ),
    writeJson(
      errorFile,
      {
        header: [],
        body: {
          status: "error",
          message: "Unexpected error",
        },
      },
      { spaces: 2 }
    ),
    writeJson(
      statusFile,
      {
        selected: "success-200.json",
        delayMillisecond: 0,
      },
      { spaces: 2 }
    ),
  ]);

  return {
    filesCreated: ["success-200.json", "unexpected-error-default.json", "status.json"],
    mockDirectory: endpointDir,
  };
}
```

**Run tests (should PASS)**:
```bash
npm test endpoint-file-generator
```

#### Step 1.3: Refactor (if needed)

No refactoring needed at this stage - implementation is clean and simple.

---

### Phase 2: Backend - Validation (Unit Tests)

#### Step 2.1: Write Failing Tests (RED)

**Create** `tests/unit/endpoint-validator.test.ts`:

```typescript
import { describe, it, expect } from "@jest/globals";
import { validateEndpointPath, checkDuplicateEndpoint } from "../../src/domains/server-runtime/endpoint-validator";

describe("EndpointValidator", () => {
  describe("Path Validation", () => {
    it("should accept valid simple paths", () => {
      expect(validateEndpointPath("/users")).toEqual({ valid: true });
      expect(validateEndpointPath("/api/products")).toEqual({ valid: true });
    });

    it("should accept paths with parameters", () => {
      expect(validateEndpointPath("/pet/status/{id}")).toEqual({ valid: true });
      expect(validateEndpointPath("/users/{userId}/posts/{postId}")).toEqual({
        valid: true,
      });
    });

    it("should reject paths not starting with /", () => {
      const result = validateEndpointPath("users");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("must start with /");
    });

    it("should reject paths with invalid file system characters", () => {
      const invalidChars = [
        { path: "/api/data:export", char: ":" },
        { path: "/users|filter", char: "|" },
        { path: '/api/search"test', char: '"' },
        { path: "/api/file*", char: "*" },
        { path: "/api/query?", char: "?" },
        { path: "/api/data<test", char: "<" },
        { path: "/api/data>test", char: ">" },
      ];

      invalidChars.forEach(({ path, char }) => {
        const result = validateEndpointPath(path);
        expect(result.valid).toBe(false);
        expect(result.error).toContain(char);
      });
    });

    it("should reject paths with _mock prefix", () => {
      const result = validateEndpointPath("/_mock/test");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("reserved");
    });

    it("should reject empty paths", () => {
      const result = validateEndpointPath("");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("required");
    });
  });

  describe("Duplicate Check", () => {
    it("should return false if endpoint doesn't exist", async () => {
      const isDuplicate = await checkDuplicateEndpoint({
        mockRoot: "/mock",
        path: "/users",
        method: "GET",
      });
      expect(isDuplicate).toBe(false);
    });

    it("should return true if endpoint directory exists", async () => {
      // This test requires setting up a test directory
      // Implementation will use fs.pathExists()
    });
  });
});
```

#### Step 2.2: Implement Minimal Code (GREEN)

**Create** `src/domains/server-runtime/endpoint-validator.ts`:

```typescript
import * as path from "path";
import { fileExists } from "../../shared/file-system";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateEndpointPath(apiPath: string): ValidationResult {
  // Check if empty
  if (!apiPath || apiPath.length === 0) {
    return { valid: false, error: "Path is required" };
  }

  // Check if starts with /
  if (!apiPath.startsWith("/")) {
    return { valid: false, error: "Path must start with /" };
  }

  // Check for reserved _mock prefix
  if (apiPath.startsWith("/_mock/")) {
    return { valid: false, error: "Cannot use reserved /_mock prefix" };
  }

  // Check for invalid file system characters
  const invalidChars = [":", "|", '"', "*", "?", "<", ">"];
  const foundInvalid = invalidChars.find((char) => apiPath.includes(char));
  if (foundInvalid) {
    return {
      valid: false,
      error: `Path contains invalid file system character: ${foundInvalid}`,
    };
  }

  // Check regex pattern
  const pathRegex = /^\/[a-z0-9\-\/{}]*$/i;
  if (!pathRegex.test(apiPath)) {
    return {
      valid: false,
      error: "Path can only contain letters, numbers, hyphens, slashes, and {braces}",
    };
  }

  return { valid: true };
}

export async function checkDuplicateEndpoint(config: {
  mockRoot: string;
  path: string;
  method: string;
}): Promise<boolean> {
  const { mockRoot, path: apiPath, method } = config;

  const pathSegments = apiPath.substring(1).split("/");
  const endpointDir = path.join(mockRoot, ...pathSegments, method.toUpperCase());

  return await fileExists(endpointDir);
}
```

**Run tests**:
```bash
npm test endpoint-validator
```

---

### Phase 3: Backend - API Endpoint (Integration Tests)

#### Step 3.1: Write Failing Tests (RED)

**Create** `tests/integration/create-endpoint.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { createApp } from "../../src/domains/server-runtime/mock-server";
import * as path from "path";
import * as fs from "fs-extra";

describe("POST /_mock/endpoints", () => {
  const testMockRoot = path.join(__dirname, "../fixtures/test-mock-integration");
  let app: any;

  beforeAll(async () => {
    await fs.ensureDir(testMockRoot);
    app = createApp(testMockRoot);
  });

  afterAll(async () => {
    await fs.remove(testMockRoot);
  });

  describe("Success Cases (201)", () => {
    it("should create a simple endpoint", async () => {
      const response = await request(app)
        .post("/_mock/endpoints")
        .send({ path: "/users", method: "GET" })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        endpoint: {
          path: "/users",
          method: "GET",
          filesCreated: expect.arrayContaining([
            "success-200.json",
            "unexpected-error-default.json",
            "status.json",
          ]),
        },
      });

      // Verify files were created
      const endpointDir = path.join(testMockRoot, "users", "GET");
      expect(await fs.pathExists(endpointDir)).toBe(true);
    });

    it("should create endpoint with path parameters", async () => {
      const response = await request(app)
        .post("/_mock/endpoints")
        .send({ path: "/pet/status/{id}", method: "POST" })
        .expect(201);

      expect(response.body.endpoint.path).toBe("/pet/status/{id}");

      // Verify folder structure preserves {id}
      const endpointDir = path.join(testMockRoot, "pet", "status", "{id}", "POST");
      expect(await fs.pathExists(endpointDir)).toBe(true);
    });
  });

  describe("Validation Errors (400)", () => {
    it("should reject missing path", async () => {
      const response = await request(app)
        .post("/_mock/endpoints")
        .send({ method: "GET" })
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.any(String),
        details: expect.arrayContaining([
          expect.objectContaining({
            field: "path",
            message: expect.stringContaining("required"),
          }),
        ]),
      });
    });

    it("should reject invalid file system characters", async () => {
      const response = await request(app)
        .post("/_mock/endpoints")
        .send({ path: "/api/data:export", method: "GET" })
        .expect(400);

      expect(response.body.error).toContain("invalid");
    });

    it("should reject _mock prefix", async () => {
      const response = await request(app)
        .post("/_mock/endpoints")
        .send({ path: "/_mock/test", method: "GET" })
        .expect(400);

      expect(response.body.error).toContain("reserved");
    });
  });

  describe("Duplicate Endpoints (409)", () => {
    it("should reject duplicate path and method", async () => {
      // Create first endpoint
      await request(app)
        .post("/_mock/endpoints")
        .send({ path: "/products", method: "GET" })
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post("/_mock/endpoints")
        .send({ path: "/products", method: "GET" })
        .expect(409);

      expect(response.body.error).toContain("already exists");
    });

    it("should allow same path with different method", async () => {
      // Create GET endpoint
      await request(app)
        .post("/_mock/endpoints")
        .send({ path: "/items", method: "GET" })
        .expect(201);

      // Create POST endpoint (should succeed)
      await request(app)
        .post("/_mock/endpoints")
        .send({ path: "/items", method: "POST" })
        .expect(201);
    });
  });
});
```

#### Step 3.2: Implement API Route (GREEN)

**Update** `src/domains/server-runtime/mock-server.ts`:

```typescript
import { CreateEndpointRequestSchema } from "../../shared/types/validation-schemas";
import { generateEndpointFiles } from "./endpoint-file-generator";
import { validateEndpointPath, checkDuplicateEndpoint } from "./endpoint-validator";
import { z } from "zod";

// Add to createApp function:
app.post("/_mock/endpoints", async (req: Request, res: Response) => {
  try {
    // Validate request with Zod
    const { path: apiPath, method } = CreateEndpointRequestSchema.parse(req.body);

    // Additional path validation
    const pathValidation = validateEndpointPath(apiPath);
    if (!pathValidation.valid) {
      return res.status(400).json({
        error: pathValidation.error,
      });
    }

    // Check for duplicates
    const isDuplicate = await checkDuplicateEndpoint({
      mockRoot,
      path: apiPath,
      method,
    });

    if (isDuplicate) {
      return res.status(409).json({
        error: "Endpoint already exists",
        existingEndpoint: {
          path: apiPath,
          method,
        },
      });
    }

    // Generate files
    const result = await generateEndpointFiles({
      mockRoot,
      path: apiPath,
      method,
    });

    // TODO: Register endpoint dynamically

    // Return success
    return res.status(201).json({
      success: true,
      message: "Endpoint created successfully",
      endpoint: {
        path: apiPath,
        method,
        filesCreated: result.filesCreated,
        availableAt: `http://localhost:3000${apiPath.replace(/{[^}]+}/g, "123")}`,
        mockDirectory: result.mockDirectory,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    return res.status(500).json({
      error: "Failed to create endpoint",
      detail: String(error),
    });
  }
});
```

**Run tests**:
```bash
npm test create-endpoint
```

---

### Phase 4: Frontend - Components (Component Tests)

#### Step 4.1: Write Failing Tests (RED)

**Create** `tests/frontend/components/AddEndpointModal.test.tsx`:

```typescript
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddEndpointModal } from "../../../src/frontend/components/AddEndpointModal";

describe("AddEndpointModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render when open", () => {
    render(
      <AddEndpointModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    expect(screen.getByText(/add endpoint/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/endpoint path/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/http method/i)).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(
      <AddEndpointModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    expect(screen.queryByText(/add endpoint/i)).not.toBeInTheDocument();
  });

  it("should validate path on blur", async () => {
    render(
      <AddEndpointModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const pathInput = screen.getByLabelText(/endpoint path/i);

    // Enter invalid path
    fireEvent.change(pathInput, { target: { value: "invalid" } });
    fireEvent.blur(pathInput);

    await waitFor(() => {
      expect(screen.getByText(/must start with \//i)).toBeInTheDocument();
    });
  });

  it("should show error for invalid characters", async () => {
    render(
      <AddEndpointModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const pathInput = screen.getByLabelText(/endpoint path/i);

    fireEvent.change(pathInput, { target: { value: "/api/data:export" } });
    fireEvent.blur(pathInput);

    await waitFor(() => {
      expect(screen.getByText(/invalid.*character/i)).toBeInTheDocument();
    });
  });

  it("should submit valid form", async () => {
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        endpoint: { path: "/users", method: "GET" },
      }),
    });

    render(
      <AddEndpointModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/endpoint path/i), {
      target: { value: "/users" },
    });
    fireEvent.change(screen.getByLabelText(/http method/i), {
      target: { value: "GET" },
    });

    // Submit
    fireEvent.click(screen.getByText(/create endpoint/i));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
```

#### Step 4.2: Implement Component (GREEN)

**Create** `src/frontend/components/AddEndpointModal.tsx`:

```typescript
import React, { useState } from "react";
import { createEndpoint } from "../services/endpointApi";

interface AddEndpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddEndpointModal: React.FC<AddEndpointModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [path, setPath] = useState("");
  const [method, setMethod] = useState<"GET" | "POST" | "PUT" | "DELETE" | "PATCH">("GET");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validatePath = (value: string): string | null => {
    if (!value) return "Path is required";
    if (!value.startsWith("/")) return "Path must start with /";
    if (/[:"|*?<>]/.test(value)) return "Path contains invalid characters";
    return null;
  };

  const handlePathBlur = () => {
    setError(validatePath(path));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pathError = validatePath(path);
    if (pathError) {
      setError(pathError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createEndpoint(path, method);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create endpoint");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Add Endpoint</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="endpoint-path" className="block text-sm font-medium mb-2">
              Endpoint Path
            </label>
            <input
              id="endpoint-path"
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              onBlur={handlePathBlur}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="/api/users"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="http-method" className="block text-sm font-medium mb-2">
              HTTP Method
            </label>
            <select
              id="http-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>

          {error && (
            <div className="mb-4 text-sm text-error-700 bg-error-50 border border-error-200 rounded-md p-3">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-2 rounded-md text-white ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary-600 hover:bg-primary-700"
              }`}
            >
              {loading ? "Creating..." : "Create Endpoint"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

**Run tests**:
```bash
npm test AddEndpointModal
```

---

## Running the Full Test Suite

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test:watch

# Run specific test file
npm test endpoint-file-generator
```

---

## Building and Manual Testing

```bash
# Build backend
npm run build

# Build frontend
npm run build:frontend

# Run dev server (both frontend and backend)
npm run dev
```

**Manual Test Checklist**:
- [ ] "Add Endpoint" button appears on dashboard
- [ ] Clicking button opens modal with form
- [ ] Path validation shows errors on blur
- [ ] Cannot submit with invalid path
- [ ] Success message appears after creation
- [ ] New endpoint appears in endpoint list
- [ ] Created endpoint responds to API calls
- [ ] Files are created in correct directory structure
- [ ] Duplicate endpoint shows 409 error

---

## Troubleshooting

### Tests Failing with File System Errors

```bash
# Ensure test fixtures directory exists
mkdir -p tests/fixtures

# Clean up test directories
rm -rf tests/fixtures/test-mock*
```

### Frontend Tests Failing

```bash
# Ensure React Testing Library is installed
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Check jest.config.js has jsdom environment
# testEnvironment: "jsdom"
```

---

## Next Steps

After implementation:
1. Run full test suite: `npm test`
2. Check coverage: `npm test -- --coverage` (target: >80%)
3. Build project: `npm run build`
4. Manual QA: `npm run dev` and verify in browser
5. Create pull request with test results

## Reference

- **Spec**: [spec.md](./spec.md)
- **Plan**: [plan.md](./plan.md)
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Contract**: [contracts/create-endpoint-api.contract.ts](./contracts/create-endpoint-api.contract.ts)
