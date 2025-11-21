# Research: Add Endpoint UI Feature

**Feature**: 003-add-endpoint
**Date**: 2025-11-15
**Status**: Complete ✅

## Overview

This document consolidates research findings from the existing node-mock-server codebase to inform the implementation of the Add Endpoint UI feature. Research focused on four key areas: file system patterns, Express API patterns, frontend component patterns, and validation patterns.

## 1. File System Patterns

### Decision

Use centralized file system utilities from `src/shared/file-system/` that wrap `fs-extra` for all file operations.

### Rationale

- **Consistency**: Single source of truth for file operations across all domains
- **Safety**: Automatic directory creation with `ensureDir()` prevents "directory not found" errors
- **Testability**: Easier to mock file operations in tests
- **Domain-friendly**: Simple async API that hides low-level file system details

### Key Implementation Details

**File system utilities** (from `src/shared/file-system/file-writer.ts`):
```typescript
export async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

export async function writeJson(
  filePath: string,
  data: unknown,
  options?: { spaces?: number }
): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.ensureDir(dir);  // Automatically creates parent dirs
  await fs.writeJson(filePath, data, { spaces: options?.spaces || 2 });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
```

**Mock file structure** (from `src/domains/mock-generation/mock-file-generator.ts`):
```
mock/
└── {path-segment}/
    └── {path-segment}/
        └── {METHOD}/
            ├── successful-operation-200.json
            ├── unexpected-error-default.json
            └── status.json
```

**Mock file format**:
```json
{
  "header": [],
  "body": { /* response data */ }
}
```

**Status file format**:
```json
{
  "selected": "successful-operation-200.json",
  "delayMillisecond": 0
}
```

**Path sanitization** (from `src/domains/mock-generation/mock-file-generator.ts`):
```typescript
function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")           // Convert spaces to -
    .replace(/[^a-z0-9\-_]/g, "-")  // Convert illegal characters to -
    .replace(/-+/g, "-")             // Merge consecutive -
    .replace(/^-|-$/g, "")           // Remove leading/trailing -
    .substring(0, 100);              // Limit length
}
```

### Recommendations for Endpoint Creation

1. **Import shared utilities**:
   ```typescript
   import { writeJson, ensureDirectory, fileExists } from "../../shared/file-system";
   ```

2. **File generation pattern**:
   ```typescript
   // Create directory structure
   const endpointDir = path.join(mockRoot, ...pathSegments, method);
   await ensureDirectory(endpointDir);

   // Write JSON files
   await writeJson(
     path.join(endpointDir, "success-200.json"),
     { header: [], body: { status: "success", message: "Mock response" } },
     { spaces: 2 }
   );
   ```

3. **Preserve path parameters**: Unlike `sanitizeFileName()`, preserve `{id}` syntax in folder names:
   ```typescript
   // /pet/status/{id} → mock/pet/status/{id}/GET/
   // Path segments keep curly braces literally
   ```

4. **Validate before creating**: Check for duplicates using `fileExists()` before creating folders

---

## 2. Express API Patterns

### Decision

All management API routes use the `/_mock` URL prefix and are registered in the Express app creation function.

### Rationale

- **Separation of concerns**: Management API is distinct from mock endpoints
- **No conflicts**: `/_mock` prefix ensures management routes don't clash with mock routes
- **Middleware chain**: Static files → management routes → mock handler → 404
- **Validation**: Uses Zod for request validation on critical endpoints

### Key Implementation Details

**Route registration pattern** (from `src/domains/server-runtime/mock-server.ts`):
```typescript
export function createApp(mockRoot: string = DEFAULT_MOCK_ROOT): Application {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "../../../public")));

  // Management API routes
  app.get("/_mock/endpoints", async (req: Request, res: Response) => { /* ... */ });
  app.post("/_mock/update", async (req: Request, res: Response) => { /* ... */ });
  app.get("/_mock/status", async (req: Request, res: Response) => { /* ... */ });
  app.post("/_mock/set-delay", async (req: Request, res: Response) => { /* ... */ });

  // Catch-all for mock responses
  app.use(async (req: Request, res: Response, next) => { /* Handle mock endpoints */ });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  return app;
}
```

**Error handling pattern**:
```typescript
app.post("/_mock/update", async (req: Request, res: Response) => {
  try {
    const { path: apiPath, method, mockFile } = req.body;

    // Validation
    if (!apiPath || !method) {
      return res.status(400).json({
        error: "Missing required parameters: path and method"
      });
    }

    // Business logic
    const statusPath = getStatusJsonPath(mockRoot, apiPath, method);
    await writeJson(statusPath, { selected: mockFile });

    // Success response
    return res.json({
      success: true,
      message: "Mock status updated successfully",
      status: { selected: mockFile },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to update mock status",
      detail: String(error)
    });
  }
});
```

**Zod validation pattern**:
```typescript
const SetDelayRequestSchema = z.object({
  path: z.string(),
  method: z.string(),
  delayMillisecond: z.number().min(0).max(60000),
});

app.post("/_mock/set-delay", async (req: Request, res: Response) => {
  try {
    const { path: apiPath, method, delayMillisecond } =
      SetDelayRequestSchema.parse(req.body);

    // Type-safe validated data

    return res.json({ success: true, message: `Delay set to ${delayMillisecond}ms` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request data",
        details: error.errors
      });
    }
    return res.status(500).json({
      error: "Failed to set delay",
      detail: String(error)
    });
  }
});
```

### Recommendations for Endpoint Creation

1. **Add new route**:
   ```typescript
   app.post("/_mock/endpoints", async (req: Request, res: Response) => {
     // Create new endpoint
   });
   ```

2. **Response format consistency**:
   ```typescript
   // Success
   { success: true, message: string, endpoint?: EndpointDetails }

   // Client error (400)
   { error: string, details?: ZodError[] }

   // Server error (500)
   { error: string, detail?: string }
   ```

3. **HTTP status codes**:
   - 201: Endpoint created successfully
   - 400: Validation error or duplicate endpoint
   - 500: File system error or unexpected failure

4. **Validation flow**:
   - Validate request schema with Zod
   - Check for duplicate endpoints (same path + method)
   - Validate path characters (reject invalid file system chars)
   - Generate files and register endpoint
   - Return success with endpoint details

---

## 3. Frontend Component Patterns

### Decision

React functional components with TypeScript, custom hooks for business logic, and Tailwind CSS for styling.

### Rationale

- **Type safety**: TypeScript interfaces ensure props are correct
- **Reusability**: Components are modular and composable
- **Utility-first CSS**: Tailwind enables rapid UI development
- **Hooks pattern**: Custom hooks (`useEndpoints`) separate business logic from UI
- **Consistent styling**: Design tokens (primary, success, error, warning colors)

### Key Implementation Details

**Component structure** (from `src/frontend/components/EndpointCard.tsx`):
```typescript
import React from "react";
import { Endpoint } from "../types";

interface EndpointCardProps {
  endpoint: Endpoint;
  onMockChange: (path: string, method: string, mockFile: string) => void;
  onDelayChange: (path: string, method: string, delayInput: string) => void;
}

export const EndpointCard: React.FC<EndpointCardProps> = ({
  endpoint,
  onMockChange,
  onDelayChange,
}) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all">
      {/* Component content */}
    </div>
  );
};
```

**Tailwind color system**:
```typescript
// Method badge colors
const getMethodColor = (method: string): string => {
  const colors = {
    GET: "bg-blue-500 text-white",
    POST: "bg-green-500 text-white",
    PUT: "bg-orange-500 text-white",
    DELETE: "bg-red-500 text-white",
    PATCH: "bg-purple-500 text-white",
  };
  return colors[method.toUpperCase() as keyof typeof colors] || "bg-gray-500 text-white";
};

// Status badges with semantic colors
className={`text-xs px-2 py-1 rounded-full ${
  status === "success"
    ? "bg-success-100 text-success-800"
    : "bg-error-100 text-error-800"
}`}

// Primary button
className="bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"

// Disabled button
className="bg-gray-300 text-gray-500 cursor-not-allowed"
```

**Custom hook pattern** (from `src/frontend/hooks/useEndpoints.ts`):
```typescript
export const useEndpoints = () => {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.fetchEndpoints();
      setEndpoints(data);
    } catch (err) {
      setError(`Failed to fetch endpoints: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, []);

  return { endpoints, loading, error, message, fetchEndpoints };
};
```

**API service pattern** (from `src/frontend/services/api.ts`):
```typescript
const MOCK_API_BASE = "/_mock";

export const apiService = {
  async fetchEndpoints(): Promise<Endpoint[]> {
    const response = await fetch(`${MOCK_API_BASE}/endpoints`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async setMockResponse(path: string, method: string, mockFile: string): Promise<void> {
    const response = await fetch(`${MOCK_API_BASE}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, method, mockFile }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },
};
```

**Loading and error states** (from `src/frontend/components/App.tsx`):
```typescript
// Loading state
if (loading) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );
}

// Error notification
{error && (
  <div className="bg-error-50 border-l-4 border-error-400 p-4 mb-6 rounded-md">
    <p className="text-sm text-error-700">{error}</p>
  </div>
)}

// Success notification
{message && (
  <div className="bg-success-50 border-l-4 border-success-400 p-4 mb-6 rounded-md">
    <p className="text-sm text-success-700">{message}</p>
  </div>
)}
```

### Recommendations for Endpoint Creation

1. **Create modal component**:
   ```typescript
   interface AddEndpointModalProps {
     isOpen: boolean;
     onClose: () => void;
     onEndpointCreated: () => void;
   }

   export const AddEndpointModal: React.FC<AddEndpointModalProps> = ({
     isOpen,
     onClose,
     onEndpointCreated,
   }) => {
     const [formData, setFormData] = useState({
       path: "",
       method: "GET" as HttpMethod,
     });

     return isOpen ? (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
           {/* Form content */}
         </div>
       </div>
     ) : null;
   };
   ```

2. **Add to API service**:
   ```typescript
   async createEndpoint(path: string, method: string): Promise<void> {
     const response = await fetch(`${MOCK_API_BASE}/endpoints`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ path, method }),
     });
     if (!response.ok) {
       const error = await response.json();
       throw new Error(error.error || "Failed to create endpoint");
     }
   }
   ```

3. **Form validation pattern**:
   ```typescript
   const validatePath = (path: string): string | null => {
     if (!path) return "Path is required";
     if (!path.startsWith("/")) return "Path must start with /";
     if (/[:"|*?<>]/.test(path)) return "Path contains invalid characters";
     return null;
   };

   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     const pathError = validatePath(formData.path);
     if (pathError) {
       setError(pathError);
       return;
     }
     // Submit form
   };
   ```

4. **Tailwind styling**:
   - Modal overlay: `fixed inset-0 bg-black bg-opacity-50 z-50`
   - Modal content: `bg-white rounded-lg p-8 max-w-2xl`
   - Form inputs: `border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500`
   - Submit button: `bg-primary-600 text-white hover:bg-primary-700 px-6 py-2 rounded-md`

---

## 4. Zod Validation Patterns

### Decision

Use Zod for schema-first validation with automatic TypeScript type inference.

### Rationale

- **Type safety**: Zod schemas automatically infer TypeScript types
- **Runtime validation**: Validates data at API boundaries
- **Error handling**: Provides detailed validation error messages
- **Schema reusability**: Schemas can be composed and extended

### Key Implementation Details

**Schema definition**:
```typescript
import { z } from "zod";

const SetDelayRequestSchema = z.object({
  path: z.string(),
  method: z.string(),
  delayMillisecond: z.number().min(0).max(60000),
});

// Automatically infer TypeScript type
type SetDelayRequest = z.infer<typeof SetDelayRequestSchema>;
```

**Validation in route handler**:
```typescript
app.post("/_mock/set-delay", async (req: Request, res: Response) => {
  try {
    const validatedData = SetDelayRequestSchema.parse(req.body);
    // validatedData is fully typed and validated
    const { path, method, delayMillisecond } = validatedData;

    // Business logic

    return res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request data",
        details: error.errors
      });
    }
    return res.status(500).json({
      error: "Server error",
      detail: String(error)
    });
  }
});
```

**Common validation patterns**:
```typescript
// String validation
z.string()                          // Required string
z.string().optional()               // Optional string
z.string().regex(/^\/[a-z0-9\/]*$/) // Pattern validation
z.string().min(1).max(100)          // Length constraints

// Number validation
z.number()                          // Required number
z.number().min(0).max(60000)        // Range validation
z.number().int().positive()         // Integer and positive

// Enum validation
z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"])

// Object validation
z.object({
  path: z.string(),
  method: z.string(),
})

// Array validation
z.array(z.object({ name: z.string() }))
```

### Recommendations for Endpoint Creation

1. **Define comprehensive schema**:
   ```typescript
   const CreateEndpointSchema = z.object({
     path: z.string()
       .min(1, "Path is required")
       .regex(/^\/[a-z0-9\-\/{}]*$/i, "Invalid path format")
       .refine(
         (val) => !/[:"|*?<>]/.test(val),
         "Path contains invalid file system characters"
       ),
     method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
   });

   export type CreateEndpointRequest = z.infer<typeof CreateEndpointSchema>;
   ```

2. **Use in route handler**:
   ```typescript
   app.post("/_mock/endpoints", async (req: Request, res: Response) => {
     try {
       const { path, method } = CreateEndpointSchema.parse(req.body);

       // Type-safe validated data
       // path: string (validated format)
       // method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"

     } catch (error) {
       if (error instanceof z.ZodError) {
         return res.status(400).json({
           error: "Validation failed",
           details: error.errors.map(e => ({
             field: e.path.join('.'),
             message: e.message,
           })),
         });
       }
       return res.status(500).json({ error: "Server error" });
     }
   });
   ```

3. **Custom refinements**:
   ```typescript
   .refine(
     (val) => !val.startsWith("/_mock/"),
     "Cannot create endpoints with reserved /_mock prefix"
   )
   .refine(
     async (val) => !(await endpointExists(val, method)),
     "Endpoint with this path and method already exists"
   )
   ```

---

## Summary and Recommendations

### Technology Stack Confirmed

| Component | Technology | Version | Usage |
|-----------|-----------|---------|-------|
| Language | TypeScript | 5.3+ | All code |
| Backend Framework | Express | 4.x | API routes |
| Frontend Framework | React | 18.x | UI components |
| Styling | Tailwind CSS | 3.x | All styling |
| File Operations | fs-extra | 11.x | File system |
| Validation | Zod | 3.x | Schema validation |
| Testing | Jest + React Testing Library | 29.x | All tests |

### Implementation Patterns to Follow

1. **File System**:
   - Use `writeJson()` and `ensureDirectory()` from shared utilities
   - Follow existing folder structure: `mock/{path}/{METHOD}/{response}.json`
   - Create `status.json` with default selected response
   - Preserve `{id}` syntax in path parameters

2. **Backend API**:
   - Add POST route at `/_mock/endpoints`
   - Use Zod schema for request validation
   - Return 201 for success, 400 for validation errors, 500 for server errors
   - Follow JSON response format: `{ success, message, data? }` or `{ error, details? }`

3. **Frontend**:
   - Create modal component with form inputs
   - Use custom hook for form state and API calls
   - Follow Tailwind color system (primary, success, error colors)
   - Display loading spinners and error/success notifications
   - Validate on blur with final check on submit

4. **Validation**:
   - Define Zod schema with path format, character restrictions
   - Check for duplicates (same path + method)
   - Reject `/_mock` prefix
   - Validate file system character constraints

### Next Steps

This research provides all necessary context for Phase 1 (Design & Contracts). Key deliverables:

1. **data-model.md**: Define entities (Endpoint, EndpointCreationRequest, FileStructure)
2. **contracts/create-endpoint-api.contract.ts**: TypeScript/Zod contract for API
3. **quickstart.md**: TDD implementation guide following Red-Green-Refactor

All patterns, utilities, and conventions have been identified and documented. Implementation can proceed with confidence that it will align with existing codebase standards.
