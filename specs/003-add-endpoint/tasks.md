# Tasks: Add Endpoint UI

**Feature**: 003-add-endpoint
**Branch**: `003-add-endpoint`
**Input**: Design documents from `/specs/003-add-endpoint/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: This feature follows TDD (Test-Driven Development) - all test tasks use Red-Green-Refactor workflow.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This project uses the following structure:
- Backend: `src/domains/server-runtime/`, `src/shared/`
- Frontend: `src/frontend/components/`, `src/frontend/services/`
- Tests: `tests/unit/`, `tests/integration/`, `tests/frontend/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for the feature

- [X] T001 Create API contract types in src/shared/types/validation-schemas.ts
- [X] T002 [P] Create test fixtures directory at tests/fixtures/
- [X] T003 [P] Verify TypeScript strict mode enabled in tsconfig.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core validation schemas that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create Zod schemas in src/shared/types/validation-schemas.ts (HttpMethodSchema, EndpointPathSchema, CreateEndpointRequestSchema, CreateEndpointSuccessSchema, CreateEndpointErrorSchema)
- [X] T005 [P] Create shared file system utilities wrapper in src/shared/file-system/index.ts (if not already present - export writeJson, ensureDirectory, fileExists)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Manual Endpoint Creation via UI (Priority: P1) 🎯 MVP

**Goal**: Developers can click a button on the dashboard to create a new API endpoint by filling in a form (path + method), and the endpoint is immediately available for testing.

**Independent Test**: Open dashboard → Click "Add Endpoint" button → Enter `/test/users` and `GET` → Submit → Verify endpoint responds at `/test/users` with default JSON.

### Tests for User Story 1 (RED Phase)

> **TDD: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T006 [P] [US1] Write failing unit tests for file generation in tests/unit/endpoint-file-generator.test.ts (test directory structure, JSON template content, path parameters preservation)
- [X] T007 [P] [US1] Write failing integration tests for success cases in tests/integration/create-endpoint.test.ts (test POST /_mock/endpoints with valid path/method, verify 201 response, verify files created)
- [X] T008 [P] [US1] Write failing component tests for button in tests/frontend/components/AddEndpointButton.test.tsx (test button renders, onClick handler)
- [X] T009 [P] [US1] Write failing component tests for modal in tests/frontend/components/AddEndpointModal.test.tsx (test form renders, path/method inputs, submit handler)

### Implementation for User Story 1 (GREEN Phase)

- [X] T010 [P] [US1] Implement endpoint file generator in src/domains/server-runtime/endpoint-file-generator.ts (generateEndpointFiles function with folder creation, 3 JSON templates)
- [X] T011 [P] [US1] Create AddEndpointButton component in src/frontend/components/AddEndpointButton.tsx (render button with onClick handler)
- [X] T012 [US1] Create endpoint API client in src/frontend/services/endpointApi.ts (createEndpoint function calling POST /_mock/endpoints)
- [X] T013 [US1] Create AddEndpointModal component in src/frontend/components/AddEndpointModal.tsx (form with path input, method dropdown, submit handler calling API)
- [X] T014 [US1] Add POST /_mock/endpoints route in src/domains/server-runtime/mock-server.ts (accept request, call generateEndpointFiles, return 201 success response)
- [X] T015 [US1] Update App component in src/frontend/components/App.tsx (add AddEndpointButton and AddEndpointModal, manage modal state)
- [X] T016 [US1] Add frontend types in src/frontend/types/index.ts (EndpointCreationForm interface, CreateEndpointResponse type)

### Verification for User Story 1

- [X] T017 [US1] Run all User Story 1 tests and verify they pass (npm test endpoint-file-generator && npm test create-endpoint && npm test AddEndpoint)
- [ ] T018 [US1] Manual QA: Start dev server, click button, create endpoint, verify API responds

**Checkpoint**: At this point, User Story 1 should be fully functional - developers can create endpoints through the UI and use them immediately.

---

## Phase 4: User Story 2 - Endpoint Validation and Error Handling (Priority: P2)

**Goal**: System validates endpoint configuration before creation, preventing invalid/duplicate endpoints with clear error messages.

**Independent Test**: Try to create endpoint with empty path → See "Path is required" error. Create `/users` GET → Try to create `/users` GET again → See "already exists" error.

### Tests for User Story 2 (RED Phase)

> **TDD: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T019 [P] [US2] Write failing unit tests for path validation in tests/unit/endpoint-validator.test.ts (test empty path, path without /, invalid characters, _mock prefix, valid paths with parameters)
- [ ] T020 [P] [US2] Write failing unit tests for duplicate detection in tests/unit/endpoint-validator.test.ts (test checkDuplicateEndpoint returns false for new, true for existing)
- [ ] T021 [P] [US2] Write failing integration tests for validation errors in tests/integration/create-endpoint.test.ts (test 400 for missing path, invalid characters, _mock prefix, invalid method)
- [ ] T022 [P] [US2] Write failing integration tests for duplicate errors in tests/integration/create-endpoint.test.ts (test 409 for same path+method, 201 for same path different method)
- [ ] T023 [P] [US2] Write failing component tests for validation feedback in tests/frontend/components/AddEndpointModal.test.tsx (test error display on blur, invalid character error, submit blocked by validation)

### Implementation for User Story 2 (GREEN Phase)

- [ ] T024 [P] [US2] Implement endpoint validator in src/domains/server-runtime/endpoint-validator.ts (validateEndpointPath function with all validation rules, checkDuplicateEndpoint function)
- [ ] T025 [US2] Update POST /_mock/endpoints route in src/domains/server-runtime/mock-server.ts (add Zod validation with error formatting, call validateEndpointPath, call checkDuplicateEndpoint, return 400/409 errors)
- [ ] T026 [US2] Add client-side validation to AddEndpointModal in src/frontend/components/AddEndpointModal.tsx (validatePath function, onBlur handler, error state display, prevent submit with errors)
- [ ] T027 [US2] Add error handling to endpoint API client in src/frontend/services/endpointApi.ts (parse 400/409 errors, throw with user-friendly messages)

### Verification for User Story 2

- [ ] T028 [US2] Run all User Story 2 tests and verify they pass (npm test endpoint-validator && npm test create-endpoint)
- [ ] T029 [US2] Manual QA: Try invalid paths, duplicate endpoints, verify error messages

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - endpoints can be created with full validation and error handling.

---

## Phase 5: User Story 3 - Endpoint Persistence and Management (Priority: P3)

**Goal**: Endpoints created through the UI persist across server restarts so test configuration is not lost.

**Independent Test**: Create 3 endpoints via UI → Restart mock server → Verify all 3 endpoints still respond correctly.

### Tests for User Story 3 (RED Phase)

> **TDD: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T030 [P] [US3] Write failing integration tests for persistence in tests/integration/endpoint-persistence.test.ts (test create endpoint, stop server, start server, verify endpoint still exists and responds)

### Implementation for User Story 3 (GREEN Phase)

- [ ] T031 [US3] Verify endpoint persistence in src/domains/server-runtime/mock-server.ts (confirm file-based storage automatically persists, server reads existing endpoints on startup)
- [ ] T032 [US3] Add endpoint discovery on server start in src/domains/server-runtime/mock-server.ts (scan mock root directory, register all existing endpoints dynamically)

### Verification for User Story 3

- [ ] T033 [US3] Run all User Story 3 tests and verify they pass (npm test endpoint-persistence)
- [ ] T034 [US3] Manual QA: Create endpoints, restart server, verify persistence

**Checkpoint**: All user stories should now be independently functional - full feature complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T035 [P] Run full test suite with coverage (npm test -- --coverage, verify >80% coverage)
- [ ] T036 [P] Run linter and fix any issues (npm run lint)
- [ ] T037 [P] Validate against quickstart.md manual testing checklist in specs/003-add-endpoint/quickstart.md
- [ ] T038 Add success toast notification to AddEndpointModal in src/frontend/components/AddEndpointModal.tsx (show confirmation after creation)
- [ ] T039 Refresh endpoint list after creation in src/frontend/components/App.tsx (update dashboard to show newly created endpoint)
- [ ] T040 [P] Add JSDoc comments to all new functions in src/domains/server-runtime/ (document parameters, return types, examples)
- [ ] T041 Performance test: Create 50 endpoints and verify dashboard performance in tests/integration/performance.test.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Builds on US1 API route but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Verifies US1 persistence but independently testable

### Within Each User Story (TDD Workflow)

1. **RED**: Write all tests for the story, ensure they FAIL
2. **GREEN**: Implement minimal code to make tests PASS
3. **REFACTOR**: Clean up implementation while keeping tests green
4. Models before services
5. Services before API routes
6. Backend before frontend integration
7. Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1 (Setup)**: All 3 tasks marked [P] can run in parallel
- **Phase 2 (Foundational)**: Both tasks (T004, T005) can run in parallel if T005 needed
- **Within User Story 1 Tests (RED)**: T006, T007, T008, T009 can all be written in parallel
- **Within User Story 1 Implementation (GREEN)**: T010, T011 can run in parallel (different components)
- **Within User Story 2 Tests (RED)**: T019, T020, T021, T022, T023 can all be written in parallel
- **Within User Story 2 Implementation (GREEN)**: T024, T027 can run in parallel
- **Across User Stories**: Once Foundational completes, US1, US2, US3 can start in parallel by different developers
- **Phase 6 (Polish)**: T035, T036, T037, T040 can run in parallel

---

## Parallel Example: User Story 1 (RED Phase)

```bash
# Launch all test files for User Story 1 together:
Task: "Write failing unit tests for file generation in tests/unit/endpoint-file-generator.test.ts"
Task: "Write failing integration tests for success cases in tests/integration/create-endpoint.test.ts"
Task: "Write failing component tests for button in tests/frontend/components/AddEndpointButton.test.tsx"
Task: "Write failing component tests for modal in tests/frontend/components/AddEndpointModal.test.tsx"
```

## Parallel Example: User Story 1 (GREEN Phase)

```bash
# Launch independent implementation tasks together:
Task: "Implement endpoint file generator in src/domains/server-runtime/endpoint-file-generator.ts"
Task: "Create AddEndpointButton component in src/frontend/components/AddEndpointButton.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (3 tasks)
2. Complete Phase 2: Foundational (2 tasks) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (13 tasks total: 4 tests + 7 implementation + 2 verification)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo basic endpoint creation functionality

**At this point you have**: A working "Add Endpoint" button that creates functional API endpoints with default responses.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (5 tasks)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! - 13 tasks)
3. Add User Story 2 → Test independently → Deploy/Demo (validation added - 11 tasks)
4. Add User Story 3 → Test independently → Deploy/Demo (persistence verified - 5 tasks)
5. Add Polish → Final release (7 tasks)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (5 tasks)
2. Once Foundational is done:
   - **Developer A**: User Story 1 - Core creation (13 tasks)
   - **Developer B**: User Story 2 - Validation (11 tasks) - starts in parallel
   - **Developer C**: User Story 3 - Persistence (5 tasks) - starts in parallel
3. Stories complete and integrate independently
4. Team completes Polish together (7 tasks)

---

## Task Statistics

### Total Task Count

- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 2 tasks
- **Phase 3 (User Story 1 - P1)**: 13 tasks (4 test + 7 implementation + 2 verification)
- **Phase 4 (User Story 2 - P2)**: 11 tasks (5 test + 4 implementation + 2 verification)
- **Phase 5 (User Story 3 - P3)**: 5 tasks (1 test + 2 implementation + 2 verification)
- **Phase 6 (Polish)**: 7 tasks

**Total: 41 tasks**

### Tasks by User Story

- **US1 (Manual Creation)**: 13 tasks
- **US2 (Validation)**: 11 tasks
- **US3 (Persistence)**: 5 tasks
- **Infrastructure**: 12 tasks (Setup + Foundational + Polish)

### Parallel Opportunities Identified

- **Setup Phase**: 2 of 3 tasks can run in parallel (67%)
- **Foundational Phase**: Both tasks can run in parallel (100%)
- **US1 Tests**: All 4 test tasks can run in parallel (100%)
- **US1 Implementation**: 2 of 7 tasks can run in parallel (29%)
- **US2 Tests**: All 5 test tasks can run in parallel (100%)
- **US2 Implementation**: 2 of 4 tasks can run in parallel (50%)
- **US3 Tests**: 1 task (no parallelization)
- **Polish Phase**: 4 of 7 tasks can run in parallel (57%)
- **Cross-Story**: All 3 user stories can run in parallel once Foundational completes

### Independent Test Criteria

**User Story 1**: ✅ Open dashboard → Click button → Fill form (`/test/users`, `GET`) → Submit → API call to `/test/users` returns 200 with `{"status": "success", "message": "Mock response"}`

**User Story 2**: ✅ Try invalid path (no `/`) → See error. Try duplicate → See 409 error.

**User Story 3**: ✅ Create 3 endpoints → Restart server → All 3 endpoints still respond correctly.

### Suggested MVP Scope

**MVP = User Story 1 only** (13 tasks after 5 setup tasks = 18 total)

**Delivers**: Developers can click "Add Endpoint" button, enter path and method, and immediately use the endpoint for testing. This is the core value proposition and can be shipped independently.

**Deferred to later releases**:
- User Story 2 (validation) - Nice to have but not blocking
- User Story 3 (persistence) - Endpoints already persist via file system, just needs testing

---

## Notes

- [P] tasks = different files, no dependencies, can run concurrently
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD Workflow**: RED (write failing tests) → GREEN (minimal implementation) → REFACTOR (clean up)
- Verify tests fail before implementing (RED phase requirement)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow quickstart.md for detailed TDD examples and troubleshooting
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Format Validation

✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
✅ All user story tasks include [Story] label (US1, US2, US3)
✅ All parallelizable tasks include [P] marker
✅ All tasks include specific file paths
✅ Task IDs are sequential (T001-T041)
✅ Tasks organized by user story for independent testing
