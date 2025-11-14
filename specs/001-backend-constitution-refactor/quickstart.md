# Developer Quickstart: Domain-Driven Codebase Structure

**Last Updated**: 2025-11-14
**Audience**: New developers, contributors, maintainers

## Overview

The Node Mock Server codebase is organized by **business domains** rather than technical layers. This means code is grouped by what it does (mock generation, server runtime, CLI tools) rather than how it's structured (controllers, services, utilities).

### Why Domain-Driven?

- **Faster Navigation**: Find all "mock generation" code in one place
- **Clear Ownership**: Each domain has a focused responsibility
- **Easier Refactoring**: Changes stay within domain boundaries
- **Better Onboarding**: Domain structure reflects business capabilities

## Quick Directory Tour

```text
src/
├── domains/               # 🎯 Start here - business capabilities
│   ├── mock-generation/   # Parse Swagger → Generate mock files
│   ├── server-runtime/    # Serve mock responses at runtime
│   └── cli-tools/         # Command-line interface
│
├── shared/                # Common utilities used everywhere
│   ├── types/             # TypeScript type definitions
│   ├── file-system/       # File read/write utilities
│   └── validation/        # Zod schemas and validators
│
├── index.ts               # 📦 Main library entry point
└── server.ts              # 🚀 Server entry point
```

## Understanding Domains

### 1. Mock Generation Domain

**Location**: `src/domains/mock-generation/`

**Purpose**: Parse Swagger/OpenAPI specifications and generate mock response files

**Key Files**:
- `swagger-parser.ts` - Parse YAML/JSON OpenAPI specs
- `mock-file-generator.ts` - Create mock response files
- `response-builder.ts` - Build sample responses from schemas
- `index.ts` - **Public interface** (use this for imports)

**Example Usage**:
```typescript
import { createMockGenerator } from '@/domains/mock-generation';

const generator = createMockGenerator();
const result = await generator.generateFromSwagger('swagger.yaml', 'output/');
console.log(`Generated ${result.filesCreated} mock files`);
```

### 2. Server Runtime Domain

**Location**: `src/domains/server-runtime/`

**Purpose**: Serve mock responses at runtime by matching HTTP requests to files

**Key Files**:
- `mock-server.ts` - Server aggregate root (start/stop)
- `route-matcher.ts` - Match requests to mock files
- `response-renderer.ts` - Render mock responses
- `status-tracker.ts` - Track server metrics
- `index.ts` - **Public interface** (use this for imports)

**Example Usage**:
```typescript
import { createMockServer } from '@/domains/server-runtime';

const server = createMockServer({ mockRoot: './mocks' });
await server.start(8080, './mocks');
console.log(server.getStatus()); // { state: 'running', port: 8080, ... }
```

### 3. CLI Tools Domain

**Location**: `src/domains/cli-tools/`

**Purpose**: Command-line interface for mock generation

**Key Files**:
- `generate-command.ts` - CLI command implementation
- `command-parser.ts` - Parse CLI arguments
- `index.ts` - **Public interface**

**Example Usage**:
```bash
npx @paultaku/node-mock-server -s swagger.yaml -o mocks/
```

### 4. Shared Kernel

**Location**: `src/shared/`

**Purpose**: Common types and utilities used across all domains

**Key Files**:
- `types/swagger-types.ts` - OpenAPI/Swagger type definitions
- `types/mock-types.ts` - Mock-related shared types
- `file-system/` - File operations (read/write)
- `validation/` - Zod schemas

**Usage Rule**: Any domain can import from shared, but shared NEVER imports from domains

## Import Rules

### ✅ DO: Import from Domain Public Interfaces

```typescript
// Use barrel exports (index.ts)
import { createMockGenerator } from '@/domains/mock-generation';
import { createMockServer } from '@/domains/server-runtime';
import { SwaggerTypes } from '@/shared/types';
```

### ❌ DON'T: Import Internal Implementation

```typescript
// Don't reach into internal files
import { SwaggerParser } from '@/domains/mock-generation/swagger-parser'; // ❌
import { internalHelper } from '@/domains/server-runtime/internal/util'; // ❌
```

### ❌ DON'T: Create Circular Dependencies

```typescript
// Mock Generation should NOT import from Server Runtime
import { MockServer } from '@/domains/server-runtime'; // ❌ in mock-generation domain
```

## Finding Code

### "Where is the code that...?"

| Task | Domain | File(s) |
|------|--------|---------|
| Parses Swagger files | Mock Generation | `swagger-parser.ts` |
| Generates mock response files | Mock Generation | `mock-file-generator.ts` |
| Starts the mock server | Server Runtime | `mock-server.ts` |
| Matches HTTP requests to mock files | Server Runtime | `route-matcher.ts` |
| Handles CLI commands | CLI Tools | `generate-command.ts` |
| Defines Swagger types | Shared Kernel | `shared/types/swagger-types.ts` |

### "Where should I add...?"

| New Feature | Domain | Reason |
|------------|--------|--------|
| New mock generation strategy | Mock Generation | Affects how mocks are created |
| New response format | Mock Generation | Part of mock file generation |
| Request logging/metrics | Server Runtime | Runtime server concern |
| New CLI command | CLI Tools | Command-line interface |
| New shared type | Shared Kernel | Used across multiple domains |

## Adding a New Feature

### Example: Add response delay to mock server

**Step 1: Identify Domain**
- Response delay affects runtime serving → **Server Runtime Domain**

**Step 2: Update Domain**
```typescript
// src/domains/server-runtime/response-renderer.ts
export class ResponseRenderer {
  async render(request: Request, mockRoute: MockRoute): Promise<Response> {
    // Add delay logic here
    if (mockRoute.delay) {
      await new Promise(resolve => setTimeout(resolve, mockRoute.delay));
    }
    // ... existing response logic
  }
}
```

**Step 3: Update Public Interface** (if exposing externally)
```typescript
// src/domains/server-runtime/index.ts
export interface MockServerOptions {
  // ... existing options
  defaultDelay?: number; // NEW
}
```

**Step 4: Write Tests**
```typescript
// tests/domains/server-runtime/response-renderer.test.ts
describe('ResponseRenderer', () => {
  it('should delay response when configured', async () => {
    // ... test implementation
  });
});
```

**Step 5: Update Documentation**
- Update `quickstart.md` if public API changed
- Add JSDoc comments to new interfaces

## Testing Strategy

### Unit Tests (per domain)

```text
tests/domains/
├── mock-generation/
│   ├── swagger-parser.test.ts
│   └── mock-file-generator.test.ts
├── server-runtime/
│   ├── route-matcher.test.ts
│   └── mock-server.test.ts
└── cli-tools/
    └── generate-command.test.ts
```

### Contract Tests (public interfaces)

```text
tests/contract/
├── mock-generation-interface.test.ts  # Validate public API stability
├── server-runtime-interface.test.ts
└── cli-tools-interface.test.ts
```

### Integration Tests (cross-domain)

```text
tests/integration/
├── cli-to-mock-generation.test.ts     # End-to-end CLI workflows
└── server-runtime-full-flow.test.ts   # Complete server request cycle
```

## Common Patterns

### Pattern 1: Barrel Exports (Public Interface)

Each domain exposes a clean public interface through `index.ts`:

```typescript
// src/domains/mock-generation/index.ts

// Export public types
export type { MockGenerationService, GenerationResult } from './types';

// Export factory functions (hide implementation)
export { createMockGenerator } from './mock-file-generator';

// Do NOT export internal utilities
// Internal files stay private
```

### Pattern 2: Dependency Injection

Services accept dependencies rather than importing them directly:

```typescript
// Good: Dependency injected
export class MockFileGenerator {
  constructor(
    private parser: SwaggerParser,
    private fileWriter: FileWriter
  ) {}
}

// Bad: Hard-coded dependency
import { parser } from './swagger-parser'; // ❌
```

### Pattern 3: Value Objects for Immutability

Use immutable value objects for data:

```typescript
// Good: Immutable value object
export interface RouteDefinition {
  readonly path: string;
  readonly method: HttpMethod;
  readonly statuses: readonly HttpStatus[];
}

// Bad: Mutable class
export class Route {
  path: string; // Can be changed accidentally
  method: HttpMethod;
}
```

## Troubleshooting

### "I get circular dependency errors"

**Cause**: Domain A imports from Domain B, and Domain B imports from Domain A

**Solution**:
1. Check if both domains need a shared type → Move to `shared/types/`
2. Use dependency inversion: Define interface in shared, implement in domain
3. Reconsider domain boundaries: Maybe code belongs in same domain

### "I can't find where to import X from"

**Solution**:
1. Check domain `index.ts` files for exports
2. Use IDE "Go to Definition" to trace imports
3. Consult `contracts/` directory for public interfaces
4. Ask in team chat or check documentation

### "Tests fail after moving files"

**Solution**:
1. Update test imports to use new domain structure
2. Check if tests need to move to match domain organization
3. Run `npm run build` to catch TypeScript errors
4. Verify mock paths in tests point to correct locations

## Next Steps

1. ✅ Read this quickstart
2. 📖 Review [contracts/README.md](./contracts/README.md) for bounded context interfaces
3. 🏗️ Explore a domain: Start with `src/domains/mock-generation/`
4. 🧪 Run tests: `npm test`
5. 🛠️ Make a change: Pick a small task and follow "Adding a New Feature" above
6. 🤝 Ask questions: Team is here to help!

## Additional Resources

- [data-model.md](./data-model.md) - Detailed domain entities and relationships
- [contracts/](./contracts/) - TypeScript interface definitions
- [research.md](./research.md) - Refactoring decisions and patterns
- [Constitution](../../.specify/memory/constitution.md) - Project principles (TDD, DDD, SOLID, KISS)
