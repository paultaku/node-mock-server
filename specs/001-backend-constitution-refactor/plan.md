# Implementation Plan: Backend Codebase Constitution Alignment

**Branch**: `001-backend-constitution-refactor` | **Date**: 2025-11-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-backend-constitution-refactor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Reorganize the backend codebase from a technical-layer structure (types, services, cli) to a domain-driven structure aligned with the constitution principles. The refactor will be executed incrementally domain-by-domain (Mock Generation → Server Runtime → CLI Tools) with full test validation between each phase. This is a pure refactor with zero functional changes—only structural improvements to enhance maintainability, reduce coupling, and improve developer experience through clear domain boundaries and ubiquitous language.

## Technical Context

**Language/Version**: TypeScript (existing), Node.js 16+ (per package.json engines)
**Primary Dependencies**: Express 4.x (server runtime), Commander 13.x (CLI), YAML 2.x (Swagger parsing), Zod 3.x (validation), fs-extra 11.x (file operations)
**Storage**: File system only (mock response files, no database)
**Testing**: Jest 29.x (existing test framework per package.json)
**Target Platform**: Node.js server + CLI tool (published npm package)
**Project Type**: Single project with both library and CLI capabilities
**Performance Goals**: No performance changes required (preserve existing performance characteristics)
**Constraints**: Zero breaking changes to public APIs or CLI interfaces, 100% test pass rate maintained throughout refactor
**Scale/Scope**: ~11 TypeScript source files in src/, excluding frontend (out of scope for this phase)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Test-Driven Development (NON-NEGOTIABLE)

**Status**: ⚠️ DEFERRED - This is a refactoring project, not new feature development
**Rationale**: Since this is pure restructuring with zero functional changes, we will:
1. Run existing test suite before each domain refactor (Red - ensure tests pass with old structure)
2. Move/refactor files maintaining exact functionality (Green - ensure tests still pass)
3. Clean up and optimize within each domain (Refactor - tests continue passing)

The TDD cycle applies at the refactor level: existing tests act as our specification.

**Justification**: Strict TDD (write new tests first) doesn't apply to code reorganization. However, the spirit of TDD is honored: tests define expected behavior, we refactor to pass them, then optimize.

### II. Domain-Driven Development (Primary Architecture)

**Status**: ✅ PASS - This refactor's primary goal is DDD alignment
**Evidence**:
- Organizing by business domains (Mock Generation, Server Runtime, CLI Tools)
- Using ubiquitous language (MockRoute, SwaggerParser, ResponseGenerator)
- Defining bounded contexts with explicit interfaces
- Separating concerns by business capability

### III. SOLID Principles

**Status**: ✅ PASS - Refactor improves SOLID adherence
**Evidence**:
- Single Responsibility: Each domain context has one clear purpose
- Open/Closed: Clear interfaces enable extension without modification
- Dependency Inversion: Dependencies will flow through abstractions, not concrete implementations

### IV. Contract-First API Development

**Status**: ✅ PASS - Applies to bounded context interfaces
**Evidence**:
- Will define explicit interfaces for cross-domain communication
- Type definitions act as contracts (TypeScript interfaces)
- Public CLI and programmatic API remain unchanged (backward compatible)

### V. Type Safety

**Status**: ✅ PASS - TypeScript strict mode already enabled
**Evidence**:
- Existing codebase uses TypeScript
- Zod for runtime validation at boundaries (already in use)
- Refactor maintains all type safety guarantees

### VI. KISS Principle (Keep It Simple, Stupid)

**Status**: ✅ PASS - Refactor simplifies through clarity
**Evidence**:
- Domain organization is simpler to navigate than technical layers
- Clear naming reduces cognitive load
- Explicit boundaries prevent accidental complexity
- Incremental approach (domain-by-domain) keeps changes manageable

### Summary

**Gates Passed**: 5/6 (TDD deferred with justification)
**Proceed**: ✅ YES - Proceed to Phase 0 research

## Project Structure

### Documentation (this feature)

```text
specs/001-backend-constitution-refactor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

**Current Structure** (technical layers):
```text
src/
├── types/               # Type definitions
│   └── swagger.ts
├── cli/                 # CLI commands
│   └── generate-mock.ts
├── frontend/            # Frontend code (out of scope)
│   ├── types/
│   ├── hooks/
│   └── services/
├── mock-generator.ts    # Mock file generation logic
├── mock-server-manager.ts  # Server management
├── status-manager.ts    # Status tracking
├── server.ts            # Server entry point
├── index.ts             # Library entry point
└── multi-server-demo.ts # Demo/examples

tests/                   # Test files (structure TBD)
```

**Target Structure** (domain-driven):
```text
src/
├── domains/
│   ├── mock-generation/           # Domain: Mock Generation
│   │   ├── swagger-parser.ts      # Parse OpenAPI/Swagger specs
│   │   ├── mock-file-generator.ts # Generate mock response files
│   │   ├── response-builder.ts    # Build mock responses
│   │   └── index.ts               # Public interface for this domain
│   │
│   ├── server-runtime/            # Domain: Server Runtime
│   │   ├── mock-server.ts         # Server aggregate root
│   │   ├── route-matcher.ts       # Match requests to mock files
│   │   ├── response-renderer.ts   # Render mock responses
│   │   ├── status-tracker.ts      # Track server status
│   │   └── index.ts               # Public interface for this domain
│   │
│   └── cli-tools/                 # Domain: CLI Tools
│       ├── generate-command.ts    # CLI command for mock generation
│       ├── command-parser.ts      # Parse CLI arguments
│       └── index.ts               # Public interface for this domain
│
├── shared/                        # Shared Kernel
│   ├── types/                     # Common types
│   │   ├── swagger-types.ts       # OpenAPI/Swagger types
│   │   ├── mock-types.ts          # Mock-related types
│   │   └── index.ts
│   ├── file-system/               # File operations
│   │   ├── file-writer.ts
│   │   ├── file-reader.ts
│   │   └── index.ts
│   └── validation/                # Validation utilities
│       └── index.ts
│
├── index.ts                       # Main library entry (exports domain facades)
├── server.ts                      # Server entry point (minimal, delegates to server-runtime)
└── multi-server-demo.ts           # Demo (uses domain public interfaces)

tests/
├── domains/
│   ├── mock-generation/
│   ├── server-runtime/
│   └── cli-tools/
├── integration/                   # Cross-domain integration tests
└── contract/                      # Bounded context interface tests
```

**Structure Decision**:

We're using a **domain-driven single project** structure with three primary bounded contexts:

1. **Mock Generation Domain**: Responsible for parsing Swagger/OpenAPI specs and generating mock response files
2. **Server Runtime Domain**: Responsible for serving mock responses at runtime (request matching, response rendering)
3. **CLI Tools Domain**: Responsible for command-line interface and user interaction

The **Shared Kernel** contains:
- Common types used across domains
- File system operations (cross-cutting concern)
- Validation utilities

This structure maps directly to the business capabilities rather than technical concerns.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| TDD (tests-first) deferred for refactor | This is code reorganization, not new feature development. Existing tests define the specification. | Writing new tests before refactoring would duplicate existing test coverage and provide no additional value. The existing test suite already validates all behavior. |
