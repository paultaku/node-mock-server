# Domain Organization

This directory contains the domain-driven architecture of the node-mock-server project.

## Domain Structure

### Mock Generation (`mock-generation/`)
**Responsibility**: Transform API specifications into mock data files

- `swagger-parser.ts` - Parse OpenAPI/Swagger specifications
- `mock-file-generator.ts` - Generate mock response files
- `response-builder.ts` - Build mock responses from schemas
- `index.ts` - Public interface (barrel export)

**Dependencies**: Shared Kernel only

### Server Runtime (`server-runtime/`)
**Responsibility**: Serve mock responses for HTTP requests

- `mock-server.ts` - Express app and server startup
- `route-matcher.ts` - Match requests to mock files
- `response-renderer.ts` - Render mock responses
- `status-tracker.ts` - Track endpoint status
- `server-manager.ts` - MockServerManager and MultiServerManager
- `index.ts` - Public interface (barrel export)

**Dependencies**: Shared Kernel only (does NOT depend on Mock Generation)

### CLI Tools (`cli-tools/`)
**Responsibility**: Parse CLI arguments and execute commands

- `command-parser.ts` - Parse CLI arguments with Commander
- `generate-command.ts` - Execute generate command workflow
- `index.ts` - Public interface (barrel export)

**Dependencies**: Mock Generation domain, Shared Kernel

## Dependency Flow

```
CLI Tools
    ├── → Mock Generation
    │       └── → Shared Kernel
    └── → Server Runtime
            └── → Shared Kernel
```

**Key Principles**:
- All domains import ONLY from public interfaces (`index.ts`)
- No circular dependencies between domains
- Server Runtime does NOT depend on Mock Generation
- Shared Kernel is dependency-free

## Usage Guidelines

### Importing from Domains

```typescript
// ✅ CORRECT - Use public interface
import { generateMockFromSwagger } from './domains/mock-generation';
import { startMockServer } from './domains/server-runtime';
import { executeGenerateCommand } from './domains/cli-tools';

// ❌ WRONG - Don't import internal files
import { parseSwaggerSpec } from './domains/mock-generation/swagger-parser';
import { matchTemplate } from './domains/server-runtime/route-matcher';
```

### Adding New Features

1. Identify which domain owns the feature
2. Add internal implementation files as needed
3. Update the domain's `index.ts` ONLY if the feature needs to be public
4. Keep internal utilities private by NOT exporting them

### Testing Domains

Place tests in `tests/domains/<domain-name>/` following the same structure as the source.

## Architecture Benefits

- **Faster Navigation**: Find code in <30 seconds by knowing the domain
- **Clear Boundaries**: Changes stay within domain boundaries (90%+ single-domain)
- **Business Language**: Names like `SwaggerParser`, `MockFileGenerator`, `RouteMatcherService`
- **No Circular Dependencies**: Unidirectional dependency flow
- **Easy Onboarding**: New developers understand structure in <10 minutes
