# Data Model: Backend Codebase Constitution Alignment

**Date**: 2025-11-14
**Feature**: Backend Constitution Refactor
**Purpose**: Define the conceptual entities and their relationships in the refactored domain structure

## Overview

This refactor reorganizes code, not data. The "entities" here are **code organization concepts** (domains, modules, interfaces) rather than runtime data structures. However, we document them to clarify the domain model and bounded context relationships.

## Domain Contexts

### 1. Mock Generation Context

**Purpose**: Parse Swagger/OpenAPI specifications and generate mock response files

**Aggregate Root**: `MockGenerationService`

**Entities**:

- **SwaggerSpecification** (Value Object)
  - Fields: `filePath: string`, `parsed: OpenAPISpec`, `version: string`
  - Lifecycle: Immutable once parsed
  - Validation: Must be valid OpenAPI 2.0 or 3.0 format

- **MockFile** (Entity)
  - Fields: `route: string`, `method: HttpMethod`, `status: HttpStatus`, `response: any`, `outputPath: string`
  - Identity: Unique by (route, method, status)
  - Lifecycle: Created during generation, written to file system

- **RouteDefinition** (Value Object)
  - Fields: `path: string`, `method: HttpMethod`, `parameters: Parameter[]`, `responses: Response[]`
  - Relationships: Extracted from SwaggerSpecification, produces MockFiles

**Services**:
- `SwaggerParser`: Parses OpenAPI YAML/JSON → SwaggerSpecification
- `MockFileGenerator`: SwaggerSpecification → MockFile[]
- `ResponseBuilder`: Generates sample response data from schema

**Public Interface**:
```typescript
export interface MockGenerationService {
  generateFromSwagger(swaggerPath: string, outputDir: string): Promise<GenerationResult>;
}

export interface GenerationResult {
  filesCreated: number;
  routes: RouteDefinition[];
  errors: GenerationError[];
}
```

**Bounded Context Interface** (exports to other domains):
- `MockGenerationService` (used by CLI Tools)
- `RouteDefinition` type (used by Server Runtime to understand routes)

---

### 2. Server Runtime Context

**Purpose**: Serve mock responses at runtime by matching HTTP requests to mock files

**Aggregate Root**: `MockServer`

**Entities**:

- **MockServer** (Aggregate Root)
  - Fields: `port: number`, `mockRoot: string`, `status: ServerStatus`, `routes: MockRoute[]`
  - Identity: Unique by port
  - Lifecycle: Created → Started → Running → Stopped
  - Invariant: Cannot start if port already in use

- **MockRoute** (Entity)
  - Fields: `pattern: string`, `method: HttpMethod`, `handler: RequestHandler`
  - Identity: Unique by (pattern, method)
  - Relationships: Loaded from MockFile directory structure

- **ServerStatus** (Value Object)
  - Fields: `state: 'stopped' | 'starting' | 'running' | 'error'`, `startTime?: Date`, `requestCount: number`
  - Immutable snapshot of server state

**Services**:
- `RouteMatcher`: HTTP Request → MockRoute (file system path resolution)
- `ResponseRenderer`: MockRoute + Request → HTTP Response
- `StatusTracker`: Tracks server metrics and state

**Public Interface**:
```typescript
export interface MockServerService {
  start(port: number, mockRoot: string): Promise<void>;
  stop(): Promise<void>;
  getStatus(): ServerStatus;
}

export interface ServerStatus {
  state: 'stopped' | 'starting' | 'running' | 'error';
  port?: number;
  requestCount: number;
  uptime?: number; // milliseconds
}
```

**Bounded Context Interface** (exports to other domains):
- `MockServerService` (used by CLI Tools, library consumers)
- `ServerStatus` type (used externally for monitoring)

---

### 3. CLI Tools Context

**Purpose**: Command-line interface for mock generation and server control

**Aggregate Root**: `CliApplication`

**Entities**:

- **GenerateCommand** (Entity)
  - Fields: `swaggerPath: string`, `outputDir: string`, `options: GenerateOptions`
  - Validation: Paths must exist and be accessible
  - Executes: Calls MockGenerationService

- **CommandOptions** (Value Object)
  - Fields: Parsed command-line flags and arguments
  - Immutable after parsing

**Services**:
- `CommandParser`: Process.argv → CommandOptions
- `OutputFormatter`: Format results for terminal display

**Public Interface**:
```typescript
export interface CliCommand {
  execute(args: string[]): Promise<ExitCode>;
}

export type ExitCode = 0 | 1; // 0 = success, 1 = error
```

**Bounded Context Interface** (exports to other domains):
- None (CLI is a consumer, not a provider)

---

## Shared Kernel

**Purpose**: Common types, utilities, and cross-cutting concerns used by multiple domains

**Contents**:

- **Types**:
  - `HttpMethod`: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  - `HttpStatus`: 200 | 201 | 400 | 404 | 500 | ...
  - `SwaggerTypes`: OpenAPI specification types (from existing `types/swagger.ts`)
  - `MockTypes`: Common mock-related types

- **File System Utilities**:
  - `FileWriter`: Write files safely with error handling
  - `FileReader`: Read files with validation
  - `PathResolver`: Resolve paths consistently

- **Validation Utilities**:
  - Zod schemas for runtime validation
  - Common validation functions

**Relationships**:
- Shared Kernel has NO dependencies on domains
- All domains MAY depend on Shared Kernel
- Shared Kernel is the **only** place for cross-domain types

---

## Domain Relationships & Dependency Flow

```
┌─────────────────┐
│   CLI Tools     │ (Orchestrates, no exports)
│    Context      │
└────────┬────────┘
         │ depends on
         ↓
┌─────────────────────┐     ┌─────────────────────┐
│  Mock Generation    │     │  Server Runtime     │
│      Context        │     │      Context        │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           │ depends on                │ depends on
           ↓                           ↓
         ┌─────────────────────────────────┐
         │       Shared Kernel             │
         │  (Types, File System, Utils)    │
         └─────────────────────────────────┘
```

**Key Dependency Rules**:
1. **CLI Tools** may import from **Mock Generation**, **Server Runtime**, and **Shared Kernel**
2. **Mock Generation** and **Server Runtime** are PEERS (no direct dependencies between them)
3. Both **Mock Generation** and **Server Runtime** may import from **Shared Kernel**
4. **Shared Kernel** has NO imports from any domain
5. All cross-domain imports go through public interfaces (index.ts barrel exports)

---

## File-to-Domain Mapping (Current → Target)

| Current File | Current Location | Target Domain | Target Location |
|--------------|-----------------|---------------|-----------------|
| swagger.ts | src/types/ | Shared Kernel | src/shared/types/swagger-types.ts |
| mock-generator.ts | src/ | Mock Generation | src/domains/mock-generation/mock-file-generator.ts |
| (parsing logic) | src/mock-generator.ts | Mock Generation | src/domains/mock-generation/swagger-parser.ts |
| mock-server-manager.ts | src/ | Server Runtime | src/domains/server-runtime/mock-server.ts |
| status-manager.ts | src/ | Server Runtime | src/domains/server-runtime/status-tracker.ts |
| (routing logic) | src/server.ts | Server Runtime | src/domains/server-runtime/route-matcher.ts |
| generate-mock.ts | src/cli/ | CLI Tools | src/domains/cli-tools/generate-command.ts |
| (CLI parsing) | src/cli/generate-mock.ts | CLI Tools | src/domains/cli-tools/command-parser.ts |
| server.ts | src/ | Entry Point | src/server.ts (minimal delegation to Server Runtime) |
| index.ts | src/ | Entry Point | src/index.ts (exports domain facades) |

---

## Contract Tests Required

To ensure bounded context interfaces remain stable:

1. **Mock Generation Interface**:
   - Test: Can generate mocks from valid Swagger spec
   - Test: Handles invalid Swagger gracefully
   - Test: Returns expected GenerationResult shape

2. **Server Runtime Interface**:
   - Test: Can start/stop server
   - Test: Returns accurate ServerStatus
   - Test: Serves mock responses correctly

3. **CLI Tools Interface**:
   - Test: Commands execute and return correct exit codes
   - Test: Output formatting is consistent

---

## State Transitions

### MockServer Lifecycle

```
       start()
┌────┐ ──────→ ┌─────────┐ ───────→ ┌─────────┐
│    │         │         │   ready  │         │
│Stop│         │Starting │          │ Running │
│    │         │         │          │         │
└────┘ ←────── └─────────┘ ←─────── └─────────┘
       stop()       ↓               stop()
                    │ error
                    ↓
                 ┌───────┐
                 │ Error │
                 └───────┘
```

### Mock File Generation Lifecycle

```
    parseSwagger()
┌────────┐ ──────→ ┌────────┐ ──────────→ ┌──────────┐
│ Swagger│         │ Parsed │ generateMocks│ Mock     │
│  YAML  │         │  Spec  │              │  Files   │
└────────┘         └────────┘              └──────────┘
                       │
                       │ validation error
                       ↓
                   ┌───────┐
                   │ Error │
                   └───────┘
```

---

## Summary

This data model defines:
- **3 Domain Contexts** with clear responsibilities
- **Shared Kernel** for common concerns
- **Explicit bounded context interfaces** (public APIs between domains)
- **Unidirectional dependency flow** (no circular dependencies)
- **Contract tests** to protect public interfaces

The refactor reorganizes existing code to match this model, with NO changes to runtime behavior.
