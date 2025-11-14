# Tasks: Backend Codebase Constitution Alignment

**Input**: Design documents from `/specs/001-backend-constitution-refactor/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: This is a pure refactoring project. Existing tests validate behavior remains unchanged - no new tests required.

**Organization**: Tasks are grouped by user story (domain-by-domain refactoring) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below use absolute paths for TypeScript project

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 [P] Create technical debt tracking document at specs/001-backend-constitution-refactor/technical-debt.md
- [ ] T002 [P] Create domain structure directories: src/domains/mock-generation/, src/domains/server-runtime/, src/domains/cli-tools/
- [ ] T003 [P] Create shared kernel directories: src/shared/types/, src/shared/file-system/, src/shared/validation/
- [ ] T004 [P] Create test structure directories: tests/domains/mock-generation/, tests/domains/server-runtime/, tests/domains/cli-tools/, tests/contract/, tests/integration/
- [ ] T005 Run existing test suite to establish baseline (npm test) - MUST PASS 100%

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 [P] Move shared types: Migrate src/types/swagger.ts → src/shared/types/swagger-types.ts
- [ ] T007 [P] Create shared mock types file at src/shared/types/mock-types.ts with HttpMethod, HttpStatus types
- [ ] T008 [P] Create src/shared/types/index.ts barrel export for all shared types
- [ ] T009 [P] Create file system utilities: src/shared/file-system/file-writer.ts wrapper around fs-extra
- [ ] T010 [P] Create file system utilities: src/shared/file-system/file-reader.ts wrapper around fs-extra
- [ ] T011 [P] Create src/shared/file-system/index.ts barrel export
- [ ] T012 Run TypeScript compiler (npm run build) - MUST PASS with no errors
- [ ] T013 Run test suite after shared kernel setup (npm test) - MUST PASS 100%
- [ ] T014 Commit with message: "refactor(shared): establish shared kernel ✅ tests passing"

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Domain-Organized Code Navigation (Priority: P1) 🎯 MVP

**Goal**: Organize Mock Generation domain so developers can find all mock generation code in one place

**Independent Test**: Developer can locate all "mock generation from Swagger" code within 30 seconds by navigating to src/domains/mock-generation/

### Implementation for User Story 1

- [ ] T015 [P] [US1] Create Mock Generation domain public interface at src/domains/mock-generation/index.ts (empty initially, will populate)
- [ ] T016 [US1] Extract Swagger parsing logic from src/mock-generator.ts → src/domains/mock-generation/swagger-parser.ts
- [ ] T017 [US1] Update swagger-parser.ts imports to use src/shared/types/swagger-types
- [ ] T018 [US1] Extract mock file generation logic from src/mock-generator.ts → src/domains/mock-generation/mock-file-generator.ts
- [ ] T019 [US1] Update mock-file-generator.ts imports to use src/shared/file-system and src/shared/types
- [ ] T020 [US1] Create response builder at src/domains/mock-generation/response-builder.ts (extract schema-to-response logic)
- [ ] T021 [US1] Update src/domains/mock-generation/index.ts to export MockGenerationService interface and createMockGenerator factory
- [ ] T022 [US1] Update src/index.ts library entry point to import from src/domains/mock-generation/index.ts (preserve backward compatibility)
- [ ] T023 [US1] Delete empty src/mock-generator.ts file (logic fully migrated)
- [ ] T024 [US1] Run TypeScript compiler (npm run build) - MUST PASS
- [ ] T025 [US1] Run test suite (npm test) - MUST PASS 100%
- [ ] T026 [US1] Move/update tests: Migrate relevant tests → tests/domains/mock-generation/
- [ ] T027 [US1] Run tests again after test migration (npm test) - MUST PASS 100%
- [ ] T028 [US1] Document any tight coupling discovered in specs/001-backend-constitution-refactor/technical-debt.md with TODO comments
- [ ] T029 [US1] Commit with message: "refactor(mock-generation): reorganize domain ✅ tests passing [Domain 1/3 complete]"

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Mock Generation code is now organized by domain.

---

## Phase 4: User Story 2 - Clear Module Boundaries and Dependencies (Priority: P2)

**Goal**: Organize Server Runtime domain with clear boundaries, ensuring no unintended dependencies

**Independent Test**: Modify CLI generation logic without affecting server runtime behavior; verify dependencies flow in one direction

### Implementation for User Story 2

- [ ] T030 [P] [US2] Create Server Runtime domain public interface at src/domains/server-runtime/index.ts (empty initially)
- [ ] T031 [US2] Extract server management logic from src/mock-server-manager.ts → src/domains/server-runtime/mock-server.ts
- [ ] T032 [US2] Update mock-server.ts imports to use src/shared/types and NOT import from mock-generation domain
- [ ] T033 [US2] Extract route matching logic from src/server.ts → src/domains/server-runtime/route-matcher.ts
- [ ] T034 [US2] Update route-matcher.ts to use src/shared/file-system for file operations
- [ ] T035 [US2] Create response rendering at src/domains/server-runtime/response-renderer.ts (extract response serving logic)
- [ ] T036 [US2] Extract status tracking from src/status-manager.ts → src/domains/server-runtime/status-tracker.ts
- [ ] T037 [US2] Update src/domains/server-runtime/index.ts to export MockServerService interface and createMockServer factory
- [ ] T038 [US2] Update src/server.ts entry point to be minimal facade delegating to src/domains/server-runtime/mock-server
- [ ] T039 [US2] Update src/index.ts to also export server runtime facade for programmatic use
- [ ] T040 [US2] Delete empty src/mock-server-manager.ts and src/status-manager.ts (logic migrated)
- [ ] T041 [US2] Run TypeScript compiler (npm run build) - MUST PASS
- [ ] T042 [US2] Run test suite (npm test) - MUST PASS 100%
- [ ] T043 [US2] Move/update tests: Migrate relevant tests → tests/domains/server-runtime/
- [ ] T044 [US2] Run tests again after test migration (npm test) - MUST PASS 100%
- [ ] T045 [US2] Create contract test at tests/contract/server-runtime-interface.test.ts to validate MockServerService public API stability
- [ ] T046 [US2] Run contract tests (npm test tests/contract/) - MUST PASS
- [ ] T047 [US2] Verify no circular dependencies using imports: Ensure server-runtime does NOT import from mock-generation
- [ ] T048 [US2] Document any tight coupling in specs/001-backend-constitution-refactor/technical-debt.md
- [ ] T049 [US2] Commit with message: "refactor(server-runtime): establish domain boundaries ✅ tests passing [Domain 2/3 complete]"

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Server Runtime has clear boundaries.

---

## Phase 5: User Story 3 - Consistent Naming with Business Language (Priority: P3)

**Goal**: Organize CLI Tools domain with business-aligned naming so code is self-documenting

**Independent Test**: Non-developer familiar with mock servers can understand module names without explanation

### Implementation for User Story 3

- [ ] T050 [P] [US3] Create CLI Tools domain public interface at src/domains/cli-tools/index.ts (empty initially)
- [ ] T051 [US3] Extract CLI command from src/cli/generate-mock.ts → src/domains/cli-tools/generate-command.ts
- [ ] T052 [US3] Rename generic functions in generate-command.ts to business language: main() → executeGenerateCommand(), etc.
- [ ] T053 [US3] Update generate-command.ts imports to use src/domains/mock-generation public interface (NOT internal files)
- [ ] T054 [US3] Extract CLI argument parsing to src/domains/cli-tools/command-parser.ts using Commander
- [ ] T055 [US3] Create output formatter at src/domains/cli-tools/output-formatter.ts for terminal display
- [ ] T056 [US3] Update src/domains/cli-tools/index.ts to export CliCommand interface and createCliCommand factory
- [ ] T057 [US3] Update src/cli/generate-mock.ts (CLI entry point) to be minimal facade calling src/domains/cli-tools/generate-command
- [ ] T058 [US3] Ensure CLI bin entry (dist/cli/generate-mock.js) still works correctly
- [ ] T059 [US3] Run TypeScript compiler (npm run build) - MUST PASS
- [ ] T060 [US3] Run test suite (npm test) - MUST PASS 100%
- [ ] T061 [US3] Move/update tests: Migrate relevant tests → tests/domains/cli-tools/
- [ ] T062 [US3] Run tests again after test migration (npm test) - MUST PASS 100%
- [ ] T063 [US3] Create contract test at tests/contract/cli-tools-interface.test.ts for CliCommand interface
- [ ] T064 [US3] Test CLI manually: Run npx @paultaku/node-mock-server -h to verify help output works
- [ ] T065 [US3] Test CLI manually: Generate mocks from demo swagger.yaml to verify end-to-end functionality
- [ ] T066 [US3] Review all module names across domains: Ensure business language (SwaggerParser, MockFileGenerator, MockServer, GenerateCommand)
- [ ] T067 [US3] Update src/multi-server-demo.ts to import from domain public interfaces (NOT internal files)
- [ ] T068 [US3] Document final tight coupling items in specs/001-backend-constitution-refactor/technical-debt.md
- [ ] T069 [US3] Commit with message: "refactor(cli-tools): align naming with business language ✅ tests passing [Domain 3/3 complete]"

**Checkpoint**: All user stories should now be independently functional. All domains use business language.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [ ] T070 [P] Create integration test at tests/integration/cli-to-mock-generation.test.ts for full CLI workflow
- [ ] T071 [P] Create integration test at tests/integration/server-runtime-full-flow.test.ts for complete request cycle
- [ ] T072 [P] Update README.md to reference new domain structure (if needed)
- [ ] T073 [P] Create contract test at tests/contract/mock-generation-interface.test.ts for MockGenerationService stability
- [ ] T074 Run full test suite (npm test) - MUST PASS 100%
- [ ] T075 Run TypeScript compiler with no warnings (npm run build) - MUST PASS clean
- [ ] T076 Verify backward compatibility: Ensure src/index.ts exports maintain existing public API
- [ ] T077 Verify CLI backward compatibility: Test existing CLI commands still work identically
- [ ] T078 Run dependency analysis to verify no circular dependencies exist (use madge or manual inspection)
- [ ] T079 Verify success criteria: Developer can locate "mock generation" code in <30 seconds (manual test)
- [ ] T080 Verify success criteria: New developer can identify domains in <10 minutes (manual test with fresh developer)
- [ ] T081 [P] Update package.json scripts if any paths changed
- [ ] T082 [P] Update webpack configs if paths changed (webpack.config.js, webpack.frontend.config.js)
- [ ] T083 Create migration guide at specs/001-backend-constitution-refactor/MIGRATION.md documenting import path changes for contributors
- [ ] T084 Review and finalize specs/001-backend-constitution-refactor/technical-debt.md with all discovered coupling issues
- [ ] T085 Run final build (npm run build) and test (npm test) - ALL MUST PASS
- [ ] T086 Commit with message: "refactor(all): finalize domain structure and polish ✅ all tests passing [Refactor Complete]"

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in priority order (P1 → P2 → P3)
  - Must complete sequentially due to interdependencies (CLI depends on Mock Generation interface)
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after User Story 1 (needs mock-generation public interface defined)
- **User Story 3 (P3)**: Can start after User Stories 1 & 2 (CLI depends on both mock-generation and server-runtime)

### Within Each User Story

- Domain structure creation before file migrations
- File migrations before import updates
- Import updates before test migrations
- Test migrations before contract test creation
- All tests passing before moving to next story

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Within Mock Generation domain (US1): T015-T020 can be partially parallel (different files)
- Within Server Runtime domain (US2): T030-T036 can be partially parallel (different files)
- Within CLI Tools domain (US3): T050-T055 can be partially parallel (different files)
- Polish tasks marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Mock Generation Domain)
4. **STOP and VALIDATE**: Test that mock generation domain works independently
5. Decide whether to continue or deploy/demo

### Incremental Delivery (Recommended)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Commit (MVP - Mock Generation organized!)
3. Add User Story 2 → Test independently → Commit (Server Runtime boundaries clear!)
4. Add User Story 3 → Test independently → Commit (Business language throughout!)
5. Polish → Final validation → Commit (Complete refactor!)

Each user story adds value without breaking previous stories.

---

## Notes

- [P] tasks = different files, no dependencies, can work in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests pass after EVERY domain migration (T025, T042, T060, T074, T085)
- Commit after each major domain completion
- Stop at any checkpoint to validate story independently
- **NO NEW TESTS REQUIRED**: Existing test suite validates behavior unchanged
- Use specs/001-backend-constitution-refactor/technical-debt.md to track discovered coupling (don't block on perfection)
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Refactoring Workflow Per Task

```bash
# For each file migration task:
1. Create new domain file/directory
2. Move/copy code to new location
3. Update imports in moved file
4. Update imports in files that reference moved code
5. Run: npm run build (TypeScript must compile)
6. Run: npm test (All tests must pass)
7. Commit if significant milestone
8. Continue to next task

# For each domain completion:
1. Ensure all files migrated
2. Create domain public interface (index.ts)
3. Update all external imports to use public interface
4. Run: npm run build && npm test (Must pass)
5. Commit: "refactor(domain-name): complete ✅"
```

---

## Success Validation Checklist

After completing all tasks, verify:

- ✅ All existing tests pass (100%)
- ✅ Public API unchanged (backward compatible)
- ✅ Build completes without errors or warnings
- ✅ Developer can locate "mock generation" code in <30 seconds
- ✅ New team member understands domain structure in <10 minutes
- ✅ Zero circular dependencies (manual inspection or madge)
- ✅ Each domain has clear public interface (index.ts)
- ✅ Technical debt catalog complete (technical-debt.md)
- ✅ CLI commands work identically to before refactor
- ✅ npm package can be built and published successfully

---

## Total Task Count: 86 tasks

**By Phase**:
- Phase 1 (Setup): 5 tasks
- Phase 2 (Foundational): 9 tasks
- Phase 3 (US1 - Mock Generation): 15 tasks
- Phase 4 (US2 - Server Runtime): 20 tasks
- Phase 5 (US3 - CLI Tools): 20 tasks
- Phase 6 (Polish): 17 tasks

**By User Story**:
- User Story 1 (Domain Navigation): 15 tasks
- User Story 2 (Clear Boundaries): 20 tasks
- User Story 3 (Business Language): 20 tasks
- Setup + Infrastructure: 31 tasks

**Parallel Opportunities**: ~25 tasks marked [P] can be executed in parallel when appropriate

**Estimated Timeline**: 3-5 days for careful incremental refactoring with full validation between each domain
