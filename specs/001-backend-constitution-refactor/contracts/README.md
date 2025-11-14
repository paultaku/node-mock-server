# Bounded Context Contracts

This directory contains TypeScript interface definitions for the bounded contexts in the refactored codebase.

## Purpose

These contracts define the **public interfaces** between domains. They serve as:

1. **Architectural Documentation**: Clear definition of what each domain exposes
2. **Type Safety**: TypeScript interfaces ensure compile-time checking
3. **Contract Tests**: Can be validated with automated tests
4. **Dependency Management**: Only these interfaces should be imported across domain boundaries

## Contracts

### [`mock-generation-context.ts`](./mock-generation-context.ts)

**Domain**: Mock Generation
**Purpose**: Parse Swagger/OpenAPI specs and generate mock response files

**Key Exports**:
- `MockGenerationService` - Main service interface
- `GenerationResult` - Result of mock generation
- `RouteDefinition` - Extracted route information

**Used By**: CLI Tools, external library consumers

---

### [`server-runtime-context.ts`](./server-runtime-context.ts)

**Domain**: Server Runtime
**Purpose**: Serve mock responses at runtime

**Key Exports**:
- `MockServerService` - Main service interface
- `ServerStatus` - Server state and metrics
- `MockServerOptions` - Configuration options

**Used By**: CLI Tools, external library consumers, demo scripts

---

### [`cli-tools-context.ts`](./cli-tools-context.ts)

**Domain**: CLI Tools
**Purpose**: Command-line interface

**Key Exports**:
- `CliCommand` - Command execution interface
- `GenerateCommandOptions` - CLI options
- `CliResult` - Execution result

**Used By**: Mainly internal (CLI entry point), rarely used programmatically

---

## Usage Rules

### ✅ DO

```typescript
// Import from domain public interface
import { MockGenerationService } from '@/domains/mock-generation';
import { MockServerService } from '@/domains/server-runtime';

// Use only exported types and interfaces
const generator: MockGenerationService = createMockGenerator();
```

### ❌ DON'T

```typescript
// Don't import internal implementation details
import { SwaggerParser } from '@/domains/mock-generation/swagger-parser'; // ❌

// Don't bypass public interface
import { internalHelper } from '@/domains/mock-generation/internal/utils'; // ❌

// Don't create circular dependencies
// Mock Generation importing from Server Runtime or vice versa // ❌
```

## Dependency Flow

```
CLI Tools Context
    ↓ depends on
    ├─→ Mock Generation Context
    └─→ Server Runtime Context
         ↓ depends on
      Shared Kernel
```

**Key Rules**:
1. CLI Tools can depend on both Mock Generation and Server Runtime
2. Mock Generation and Server Runtime are **peers** (no dependencies between them)
3. All domains can depend on Shared Kernel
4. Shared Kernel has NO dependencies on any domain
5. All imports go through index.ts barrel exports

## Contract Testing

Each contract should be validated with tests in `tests/contract/`:

```typescript
// tests/contract/mock-generation-interface.test.ts
import { MockGenerationService } from '@/domains/mock-generation';

describe('MockGenerationService Contract', () => {
  it('should implement all required methods', () => {
    const service: MockGenerationService = createMockGenerator();
    expect(service.generateFromSwagger).toBeDefined();
  });

  it('should return GenerationResult with required fields', async () => {
    const result = await service.generateFromSwagger('spec.yaml', 'output/');
    expect(result).toHaveProperty('filesCreated');
    expect(result).toHaveProperty('routes');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('duration');
  });
});
```

## Versioning

These contracts represent **commitments** to external consumers. Changes must follow semantic versioning:

- **Patch**: Documentation, internal refactors (no interface changes)
- **Minor**: Adding new methods or optional fields (backward compatible)
- **Major**: Removing methods, changing signatures, removing fields (breaking changes)

Breaking changes require:
1. Deprecation warnings in prior version
2. Migration guide
3. Major version bump
