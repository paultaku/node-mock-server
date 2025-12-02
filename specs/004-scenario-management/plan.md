# Implementation Plan: User Scenario Management

**Branch**: `004-scenario-management` | **Date**: 2025-11-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-scenario-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable users to create named scenarios that configure multiple mock API endpoints with specific response files and delay settings. When a scenario is saved, it persists to a JSON file (`mock/scenario/{name}.json`) and immediately applies its configuration to live endpoints by updating their `status.json` files. The UI displays an "Active" badge next to the currently active scenario, tracked via a metadata file (`mock/scenario/_active.json`).

## Technical Context

**Language/Version**: TypeScript 5.3+, Node.js 16+
**Primary Dependencies**: Express 4.x (backend API), React 18.x (frontend UI), fs-extra 11.x (file operations), Zod 3.x (validation), Tailwind CSS 3.4 (styling)
**Storage**: File system based - scenarios stored as JSON files in `mock/scenario/` directory, active scenario tracked in `mock/scenario/_active.json`
**Testing**: Jest 29.7 with ts-jest, React Testing Library 14.3, Supertest 7.1 for API integration tests
**Target Platform**: Node.js server (backend) + Web browser (frontend React SPA)
**Project Type**: Web application (backend Express API + frontend React UI)
**Performance Goals**: Dropdown updates <200ms when switching endpoints, scenario save operations complete in <500ms, support 20+ endpoint configurations per scenario without UI degradation
**Constraints**: Synchronous file I/O acceptable for <100 scenarios, no database required, maintain existing endpoint structure (`status.json` per endpoint)
**Scale/Scope**: Expected <100 scenarios per project, each scenario configuring 1-50 endpoints, file sizes <100KB per scenario

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Test-Driven Development (NON-NEGOTIABLE)
✅ **PASS** - Implementation plan includes comprehensive test strategy:
- Contract tests for scenario management API endpoints (POST/GET/DELETE `/_ mock/scenarios`)
- Integration tests for scenario application to endpoint `status.json` files
- Unit tests for scenario validation logic (duplicate prevention, empty scenario checks)
- React component tests for scenario UI (create, edit, delete, active indicator)
- End-to-end tests for complete scenario workflow (create → configure → save → verify active)

### II. Domain-Driven Development
✅ **PASS** - Feature aligns with existing domain structure:
- New domain concept: Scenario (aggregate root managing endpoint configurations)
- Fits within existing `server-runtime` domain alongside endpoint management
- Uses ubiquitous language: Scenario, EndpointConfiguration, ActiveScenario
- Clear bounded context: Scenario management separate from mock generation and endpoint serving
- Reuses existing domain services: StatusTracker (for updating `status.json`), RouteMatcher (for endpoint discovery)

### III. SOLID Principles
✅ **PASS** - Design follows SOLID:
- Single Responsibility: ScenarioManager handles scenario CRUD, ScenarioApplicator applies configurations to endpoints
- Open/Closed: Extends existing endpoint management without modifying core mock server logic
- Interface Segregation: Separate interfaces for ScenarioRepository, ActiveScenarioTracker
- Dependency Inversion: Backend API depends on scenario abstractions, not file system implementation

### IV. Contract-First API Development
✅ **PASS** - API contracts will be defined before implementation:
- OpenAPI/REST contracts for scenario management endpoints (`/_mock/scenarios`)
- TypeScript interfaces generated from Zod schemas for request/response validation
- Frontend consumes well-defined backend contract
- Breaking changes require version increment (already at v1.1.0-rc.9)

### V. Type Safety
✅ **PASS** - Strict TypeScript throughout:
- Zod schemas for runtime validation of scenario JSON files and API requests
- Type guards for scenario file parsing
- No `any` types - all scenario data structures fully typed
- Explicit error types for validation failures (DuplicateEndpointError, EmptyScenarioError)

### VI. KISS Principle
✅ **PASS** - Simple, straightforward design:
- File-based storage (no database complexity)
- Separate metadata file for active tracking (single source of truth)
- Direct status.json updates (no elaborate state machine)
- React UI uses existing patterns from endpoint management
- Minimal abstractions - scenario is just a collection of endpoint configs

**GATE STATUS: ✅ PASSED - All constitution principles satisfied. No violations requiring justification.**

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── domains/
│   └── server-runtime/
│       ├── scenario-manager.ts           # NEW: Scenario CRUD operations
│       ├── scenario-applicator.ts        # NEW: Apply scenarios to endpoints
│       ├── active-scenario-tracker.ts    # NEW: Manage _active.json
│       ├── scenario-repository.ts        # NEW: File I/O for scenarios
│       ├── mock-server.ts                # MODIFIED: Add scenario endpoints
│       ├── status-tracker.ts             # EXISTING: Reused for status.json updates
│       └── route-matcher.ts              # EXISTING: Reused for endpoint discovery
├── shared/
│   └── types/
│       ├── scenario-types.ts             # NEW: Scenario, EndpointConfiguration types
│       └── validation-schemas.ts         # MODIFIED: Add scenario Zod schemas
└── frontend/
    ├── components/
    │   ├── ScenarioManagement/
    │   │   ├── ScenarioList.tsx          # NEW: List all scenarios with active badge
    │   │   ├── ScenarioForm.tsx          # NEW: Create/edit scenario
    │   │   ├── EndpointConfigForm.tsx    # NEW: Add endpoint config to scenario
    │   │   ├── ScenarioCard.tsx          # NEW: Scenario card view
    │   │   └── ActiveBadge.tsx           # NEW: Active indicator component
    │   └── App.tsx                        # MODIFIED: Add scenario route
    ├── services/
    │   └── scenarioApi.ts                 # NEW: API client for scenarios
    └── hooks/
        └── useScenarios.ts                # NEW: React hook for scenario state

tests/
├── contract/
│   └── scenario-api.contract.test.ts     # NEW: API contract tests
├── integration/
│   ├── scenario-application.test.ts       # NEW: Scenario → status.json integration
│   └── scenario-persistence.test.ts       # NEW: File I/O integration
└── unit/
    ├── scenario-manager.test.ts           # NEW: CRUD logic tests
    ├── scenario-applicator.test.ts        # NEW: Application logic tests
    ├── scenario-validation.test.ts        # NEW: Zod schema validation tests
    └── frontend/
        └── components/
            └── ScenarioManagement/         # NEW: React component tests
```

**Structure Decision**: Web application structure - backend TypeScript in `src/domains/server-runtime` following DDD principles, frontend React components in `src/frontend/components/ScenarioManagement`, shared types in `src/shared/types`. Tests mirror source structure with contract/integration/unit separation as per TDD constitution requirement.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations detected** - all constitution principles are satisfied without requiring justification.
