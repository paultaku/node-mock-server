# Implementation Plan: Add Endpoint UI

**Branch**: `003-add-endpoint` | **Date**: 2025-11-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-add-endpoint/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature adds a dashboard UI button and form that allows developers to create mock API endpoints through a visual interface instead of manually editing configuration files or using the CLI. When an endpoint is created, the backend automatically generates a folder structure mirroring the API path (e.g., `<mock-root>/pet/status/{id}/GET/`) with default JSON response templates (`success-200.json`, `unexpected-error-default.json`) and a `status.json` file for endpoint tracking. The system uses a `/_mock/` API prefix for management operations, validates input (empty paths, invalid file system characters, duplicates), and persists all endpoints as static files that survive server restarts.

## Technical Context

**Language/Version**: TypeScript 5.3+, Node.js 16+
**Primary Dependencies**: Express 4.x (backend API), React 18.x (frontend UI), fs-extra 11.x (file operations), Zod 3.x (validation)
**Storage**: File system based - mock endpoints stored as folder structure mirroring API paths
**Testing**: Jest 29.x + ts-jest, React Testing Library (frontend component tests)
**Target Platform**: Web application (browser dashboard + Node.js backend server)
**Project Type**: Web application with frontend + backend
**Performance Goals**: Endpoint creation <30s end-to-end, endpoint available for API calls within 1s, form validation feedback <500ms
**Constraints**: File system character restrictions (no `:`, `|`, `<`, `>`, `"`, `*`, `?`), atomic file operations for concurrency safety, 50+ endpoints without performance degradation
**Scale/Scope**: Single feature touching both frontend (form UI) and backend (API + file generation), ~5-10 new files

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Test-Driven Development (NON-NEGOTIABLE) ✅

**Status**: PASS - Tests will be written first

**Plan**:
- Write failing component tests for "Add Endpoint" button and form (React Testing Library)
- Write failing API endpoint tests for `/_mock/endpoints/create` (Jest + supertest)
- Write failing file system tests for folder structure creation and JSON template generation
- Write failing validation tests for path rules, character restrictions, duplicates
- Implement minimal code to pass tests
- Refactor for clarity and maintainability

**Test Coverage Required**:
- Unit tests: Form validation logic, file path generation, JSON template creation
- Integration tests: Full flow from button click → API call → file creation → endpoint availability
- Contract tests: `/_mock/` API request/response schema validation
- Edge case tests: Concurrent creation, invalid characters, path parameters, file system errors

### II. Domain-Driven Development ✅

**Status**: PASS - Aligns with existing domain structure

**Analysis**:
- Feature operates within two existing bounded contexts:
  - **Frontend Dashboard** (presentation domain): UI for endpoint creation
  - **Server Runtime** (server-runtime domain): Dynamic endpoint registration and file management
- Uses existing domain language: `Endpoint`, `MockServer`, `Route`, `Response`
- No new domain concepts introduced (leverages existing endpoint/response model)
- Clear boundary: Frontend sends creation request → Backend generates files and registers endpoint
- File structure mirrors domain concept (API path = folder path)

### III. SOLID Principles ✅

**Status**: PASS - Design maintains SOLID compliance

**Analysis**:
- **Single Responsibility**:
  - Form component: UI input and validation only
  - API endpoint handler: Request validation and orchestration
  - File generator service: File/folder creation only
  - Endpoint registry: Runtime endpoint registration only
- **Open/Closed**: Can extend with new HTTP methods or file templates without modifying core logic
- **Liskov Substitution**: N/A (no inheritance hierarchies in this feature)
- **Interface Segregation**: Separate interfaces for API request, file generation config, validation rules
- **Dependency Inversion**: Components depend on interfaces (e.g., `IFileSystemService`, `IEndpointRegistry`), not concrete implementations

### IV. Contract-First API Development ✅

**Status**: PASS - API contract will be defined first

**Plan**:
- Define OpenAPI/TypeScript contract for `/_mock/endpoints/create` POST endpoint before implementation
- Request schema: `{ path: string, method: HttpMethod }`
- Response schemas: Success (201) with endpoint details, Error (400/409) with validation messages
- Generate TypeScript types from contract using Zod schemas
- Contract tests verify implementation matches specification

### V. Type Safety ✅

**Status**: PASS - Full TypeScript strict mode

**Analysis**:
- Project already uses TypeScript 5.3+ with strict mode enabled
- All new code will maintain strict typing:
  - Form inputs: Typed with `EndpointCreationForm` interface
  - API request/response: Zod schemas with inferred TypeScript types
  - File operations: Typed paths and content structures
- Runtime validation at boundaries: Zod validation for API requests, form input validation
- No `any` types unless explicitly justified (none anticipated)

### VI. KISS Principle ✅

**Status**: PASS - Simple, straightforward implementation

**Analysis**:
- Solution: Direct button → form → API call → file creation flow
- No complex abstractions or patterns needed
- File structure directly mirrors API path (intuitive mapping)
- Minimal placeholder JSON templates (no complex templating engine)
- Standard form validation (no custom validation framework)
- Leverages existing Express routing and fs-extra utilities
- Clear, readable implementation approach

### Gate Summary

**Overall Status**: ✅ ALL GATES PASSED

This feature fully complies with all constitution principles:
- TDD mandate will be followed (tests first, Red-Green-Refactor)
- Aligns with existing DDD domain structure
- Maintains SOLID design principles
- API contract will be defined before implementation
- Full TypeScript strict mode type safety
- Simple, direct implementation (no over-engineering)

## Project Structure

### Documentation (this feature)

```text
specs/003-add-endpoint/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── create-endpoint-api.contract.ts
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── frontend/
│   ├── components/
│   │   ├── Stats.tsx              # Existing - no changes needed
│   │   ├── EndpointCard.tsx       # Existing - may reference for patterns
│   │   ├── AddEndpointButton.tsx  # NEW - "Add Endpoint" button component
│   │   ├── AddEndpointForm.tsx    # NEW - Form modal for endpoint creation
│   │   └── App.tsx                # UPDATE - add button and form to dashboard
│   ├── types/
│   │   └── index.ts               # UPDATE - add EndpointCreationForm interface
│   ├── services/
│   │   └── api.ts                 # NEW - API client for /_mock/ endpoints
│   └── styles/
│       └── [Tailwind CSS]         # Existing patterns
│
├── domains/
│   ├── server-runtime/
│   │   ├── mock-server.ts              # UPDATE - expose /_mock/endpoints/create API
│   │   ├── endpoint-file-generator.ts  # NEW - generates folder structure and JSON files
│   │   ├── endpoint-validator.ts       # NEW - validates path, characters, duplicates
│   │   └── endpoint-registry.ts        # UPDATE - dynamic endpoint registration
│   ├── mock-generation/
│   │   └── mock-file-generator.ts      # Existing - may reference for file patterns
│   └── cli-tools/
│       └── [CLI commands]              # Existing - no changes needed
│
└── shared/
    └── types/
        ├── mock-types.ts          # UPDATE - add EndpointCreationRequest type
        └── validation-schemas.ts  # NEW - Zod schemas for API validation

tests/
├── frontend/
│   └── components/
│       ├── AddEndpointButton.test.tsx  # NEW - button tests
│       └── AddEndpointForm.test.tsx    # NEW - form validation tests
├── integration/
│   └── create-endpoint.test.ts         # NEW - end-to-end flow tests
└── unit/
    ├── endpoint-file-generator.test.ts # NEW - file generation tests
    └── endpoint-validator.test.ts      # NEW - validation logic tests
```

**Structure Decision**: Web application structure with frontend/backend separation. This feature adds UI components to the existing React dashboard (`src/frontend/components/`) and backend API endpoints to the server-runtime domain (`src/domains/server-runtime/`). File operations leverage existing fs-extra patterns from mock-generation domain. No changes to CLI or shared types infrastructure except for adding new request/response types.

**Files Requiring Changes**:
1. **Frontend**: 3 new components (AddEndpointButton, AddEndpointForm, api service), 2 updated files (App.tsx, types/index.ts)
2. **Backend**: 3 new modules (endpoint-file-generator, endpoint-validator, validation-schemas), 2 updated files (mock-server.ts, endpoint-registry.ts)
3. **Tests**: 5 new test files (2 frontend component, 1 integration, 2 unit)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: N/A - No constitution violations. All gates passed.

---

## Phase 0: Research - COMPLETED ✅

**Output**: [research.md](./research.md)

**Key Findings**:
- File system: Use shared `writeJson()` and `ensureDirectory()` utilities from `src/shared/file-system/`
- Express API: Add POST route at `/_mock/endpoints` with Zod validation
- Frontend: React + TypeScript + Tailwind CSS with modal component pattern
- Validation: Zod schemas for runtime validation with TypeScript type inference
- File structure: `<mock-root>/{path segments}/{METHOD}/{response files}`
- Path handling: Preserve `{id}` syntax literally in folder names for parameters

**All research questions resolved** - Ready for design phase

---

## Phase 1: Design & Contracts - COMPLETED ✅

**Outputs**:
- [data-model.md](./data-model.md) - Entity definitions, file structure, validation rules
- [contracts/create-endpoint-api.contract.ts](./contracts/create-endpoint-api.contract.ts) - Zod schemas, TypeScript types, OpenAPI spec
- [quickstart.md](./quickstart.md) - Step-by-step TDD implementation guide

**Entities Defined**:
1. `EndpointCreationRequest` - User input validation (path, method)
2. `EndpointFileStructure` - File system organization with default JSON templates
3. `RuntimeEndpoint` - Dynamically registered Express endpoint
4. `MockResponse` - Response file served by endpoint

**Contracts Created**:
- Request schema: `CreateEndpointRequestSchema` with path validation, character restrictions
- Success response: HTTP 201 with endpoint details and files created
- Error responses: HTTP 400 (validation), 409 (duplicate), 500 (server error)
- Test scenarios: 16 test cases covering valid/invalid/duplicate/error conditions

**Agent Context Updated**: CLAUDE.md updated with React + Tailwind CSS + Zod technologies

---

## Post-Phase 1 Constitution Check Re-evaluation

### I. Test-Driven Development ✅

**Status**: PASS - TDD workflow fully documented

**Evidence**:
- quickstart.md provides complete Red-Green-Refactor workflow
- Test files defined for all components (unit, integration, component tests)
- Tests cover file generation, validation, API endpoints, frontend components
- 5 phases of testing documented with specific test cases

**Compliance**: Full adherence to TDD mandate - tests will be written before implementation

### II. Domain-Driven Development ✅

**Status**: PASS - Domain alignment maintained

**Evidence**:
- Entities follow existing domain patterns (Endpoint, MockServer, Route)
- Clear bounded contexts: Frontend (presentation), Server Runtime (application), File System (infrastructure)
- File structure mirrors domain concept (API path = folder path)
- No new domain concepts introduced

**Compliance**: Fully aligned with existing DDD architecture

### III. SOLID Principles ✅

**Status**: PASS - Design maintains SOLID compliance

**Evidence**:
- Single Responsibility: Each module has one clear purpose (file generation, validation, API handling)
- Open/Closed: Can add new HTTP methods or response templates without modifying core logic
- Interface Segregation: Separate interfaces for EndpointConfig, ValidationResult, CreateEndpointRequest
- Dependency Inversion: Uses abstractions (IFileSystem utilities, Zod schemas)

**Compliance**: Meets all applicable SOLID principles

### IV. Contract-First API Development ✅

**Status**: PASS - API contract defined and validated

**Evidence**:
- Complete contract specification in `create-endpoint-api.contract.ts`
- Zod schemas define request/response structure before implementation
- TypeScript types inferred from schemas
- OpenAPI 3.0 specification provided for documentation
- 16 test scenarios defined from contract

**Compliance**: Full contract-first approach with executable validation

### V. Type Safety ✅

**Status**: PASS - Full TypeScript type coverage

**Evidence**:
- All entities have TypeScript interfaces
- Zod schemas provide runtime validation + compile-time types
- No `any` types used (except in constrained generic contexts)
- Type inference from schemas ensures frontend/backend type consistency

**Compliance**: Strict TypeScript typing maintained throughout

### VI. KISS Principle ✅

**Status**: PASS - Simple, maintainable design

**Evidence**:
- Direct flow: Button → Modal → API → File Generation → Registration
- No complex abstractions or frameworks introduced
- Leverages existing utilities (writeJson, ensureDirectory, Express routes)
- File structure directly mirrors API paths (intuitive mapping)
- Default JSON templates with minimal structure

**Compliance**: Simplest solution that meets all requirements

### Final Gate Status

**Overall**: ✅ ALL GATES PASSED (Post-Phase 1)

**Summary**:
- Design phase completed without introducing complexity
- All constitution principles upheld
- No violations or exceptions required
- Ready for task generation and implementation

---

## Phase 2: Tasks Generation

**Note**: Phase 2 (tasks.md generation) is handled by the `/speckit.tasks` command, not `/speckit.plan`.

Run `/speckit.tasks` to generate the actionable task breakdown for implementation.

---

## Plan Completion Summary

**Branch**: `003-add-endpoint`
**Status**: Planning Complete ✅
**Date**: 2025-11-15

### Artifacts Generated

| Document | Status | Purpose |
|----------|--------|---------|
| plan.md | ✅ Complete | This implementation plan |
| research.md | ✅ Complete | Code pattern research and technology decisions |
| data-model.md | ✅ Complete | Entity definitions and file structure |
| contracts/create-endpoint-api.contract.ts | ✅ Complete | TypeScript/Zod contract with test scenarios |
| quickstart.md | ✅ Complete | TDD implementation guide (Red-Green-Refactor) |
| CLAUDE.md | ✅ Updated | Agent context updated with new technologies |

### Constitution Compliance

- ✅ Test-Driven Development (TDD workflow documented with 16+ test scenarios)
- ✅ Domain-Driven Development (aligns with existing bounded contexts)
- ✅ SOLID Principles (clear separation of concerns, dependency inversion)
- ✅ Contract-First Development (complete API contract with OpenAPI spec)
- ✅ Type Safety (full TypeScript + Zod validation)
- ✅ KISS Principle (direct, simple implementation)

### Technical Decisions

1. **File System**: Use `src/shared/file-system/` utilities (writeJson, ensureDirectory)
2. **API Pattern**: POST `/_mock/endpoints` with Zod validation
3. **Frontend**: React modal component with Tailwind CSS styling
4. **Validation**: Zod schemas for runtime + compile-time type safety
5. **File Structure**: Preserve `{param}` syntax in folder names, generate 3 default files
6. **Concurrency**: File system locks for duplicate prevention (first-write-wins)

### Ready For

- ✅ Task generation (`/speckit.tasks`)
- ✅ Implementation (follow quickstart.md TDD workflow)
- ✅ Testing (all test scenarios defined)
- ✅ Code review (constitution compliance verified)

**Next Command**: `/speckit.tasks`
