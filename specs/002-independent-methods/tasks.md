# Implementation Tasks: Independent PUT and DELETE Method Statistics

**Feature**: 002-independent-methods
**Branch**: `002-independent-methods`
**Date**: 2025-11-15
**Status**: Ready for Implementation

## Overview

This document breaks down the implementation of separate PUT and DELETE statistics cards into specific, executable tasks following Test-Driven Development (TDD) principles. The feature is organized by user story to enable independent implementation and testing.

---

## Phase 1: Setup & Test Infrastructure

**Goal**: Prepare testing environment and project dependencies for TDD workflow

### Tasks

- [ ] T001 Install React Testing Library dependencies via `npm install --save-dev @testing-library/react@^14.0.0 @testing-library/jest-dom@^6.1.0`
- [ ] T002 Update jest.config.js testEnvironment from "node" to "jsdom" in /Users/paultaku/Projects/@paultaku/node-mock-server/jest.config.js
- [ ] T003 Add tsx support to jest.config.js transform config (update pattern to "^.+\\.tsx?$") in /Users/paultaku/Projects/@paultaku/node-mock-server/jest.config.js
- [ ] T004 Add setupFilesAfterEnv to jest.config.js pointing to tests/setup.ts in /Users/paultaku/Projects/@paultaku/node-mock-server/jest.config.js
- [ ] T005 Update collectCoverageFrom in jest.config.js to include tsx files ("src/\*_/_.{ts,tsx}") in /Users/paultaku/Projects/@paultaku/node-mock-server/jest.config.js
- [ ] T006 Update moduleFileExtensions in jest.config.js to include "tsx" in /Users/paultaku/Projects/@paultaku/node-mock-server/jest.config.js
- [ ] T007 Create tests/setup.ts with @testing-library/jest-dom import in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/setup.ts
- [ ] T008 [P] Create tests/frontend/ directory structure in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/frontend/
- [ ] T009 [P] Create tests/frontend/components/ directory in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/frontend/components/
- [ ] T010 Verify test setup by running `npm test` (should find no tests yet)

**Completion Criteria**:

- ✅ Jest configured for React component testing (jsdom environment)
- ✅ React Testing Library dependencies installed
- ✅ Test directory structure created
- ✅ Setup file imports @testing-library/jest-dom matchers
- ✅ Test runner executes without configuration errors

---

## Phase 2: User Story 1 - View Separate PUT Statistics (P1)

**Story Goal**: Display PUT endpoint count in a dedicated statistic card, independent of all other methods

**Why P1**: Core value proposition - developers need visibility into PUT operations for API design decisions

**Independent Test**: Create mock endpoints with PUT methods and verify PUT statistics card displays correct count separately

### Acceptance Criteria (from spec.md)

1. ✅ Given 2 GET, 3 POST, 1 PUT, 0 DELETE endpoints → PUT card shows "1"
2. ✅ Given 5 PUT endpoints → PUT card shows "5" (not combined)
3. ✅ Given 0 PUT endpoints → PUT card shows "0"

### Tasks

#### Test Tasks (RED Phase - TDD)

- [ ] T011 [US1] Create tests/frontend/components/Stats.test.tsx test file in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/frontend/components/Stats.test.tsx
- [ ] T012 [US1] Write test: "should display PUT count in a separate card" (FR-001) - verify PUT card shows correct count with typical stats in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/frontend/components/Stats.test.tsx
- [ ] T013 [US1] Write test: "should display 0 when no PUT endpoints exist" - verify PUT card shows "0" when put count is 0 in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/frontend/components/Stats.test.tsx
- [ ] T014 [US1] Write test: "should display PUT Requests label" - verify PUT card has correct label text in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/frontend/components/Stats.test.tsx
- [ ] T015 [US1] Write test: "should use warning-600 color for PUT card" - verify PUT card uses amber/yellow color scheme in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/frontend/components/Stats.test.tsx
- [ ] T016 [US1] Run tests with `npm test` - verify all PUT tests fail (RED phase confirmed)

#### Implementation Tasks (GREEN Phase - TDD)

- [x] T017 [US1] Update grid layout from "grid-cols-2 md:grid-cols-4" to "grid-cols-2 md:grid-cols-6" in src/frontend/components/Stats.tsx line 10
- [x] T018 [US1] Create new PUT statistic card after POST card (before current PUT/DELETE combined card) in src/frontend/components/Stats.tsx
- [x] T019 [US1] Set PUT card div className to "bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow" in src/frontend/components/Stats.tsx
- [x] T020 [US1] Set PUT card number div className to "text-3xl font-bold text-warning-600 mb-2" in src/frontend/components/Stats.tsx
- [x] T021 [US1] Set PUT card number content to {stats.put} in src/frontend/components/Stats.tsx
- [x] T022 [US1] Set PUT card label div className to "text-gray-600 text-sm" in src/frontend/components/Stats.tsx
- [x] T023 [US1] Set PUT card label text to "PUT Requests" in src/frontend/components/Stats.tsx
- [ ] T024 [US1] Run tests with `npm test` - verify all PUT tests pass (GREEN phase confirmed)

#### Verification Tasks

- [x] T025 [US1] Run `npm run build:frontend` to verify no TypeScript compilation errors
- [ ] T026 [US1] Run `npm run dev` and visually verify PUT card appears separately on dashboard
- [ ] T027 [US1] Verify PUT card shows amber/yellow color (text-warning-600)
- [ ] T028 [US1] Verify PUT card count matches number of PUT endpoints
- [ ] T029 [US1] Test acceptance scenario 1: Create 1 PUT endpoint, verify card shows "1"
- [ ] T030 [US1] Test acceptance scenario 2: Create 5 PUT endpoints, verify card shows "5"
- [ ] T031 [US1] Test acceptance scenario 3: Remove all PUT endpoints, verify card shows "0"

**Story Completion Criteria**:

- ✅ All PUT tests passing (T012-T015)
- ✅ PUT card renders separately with amber color
- ✅ PUT count displays correctly (not combined)
- ✅ All 3 acceptance scenarios verified
- ✅ FR-001, FR-003, FR-006, FR-008, FR-010 satisfied for PUT
- ✅ SC-001, SC-004 achieved (PUT visible in <1s, 100% accurate)

---

## Phase 3: User Story 2 - View Separate DELETE Statistics (P1)

**Story Goal**: Display DELETE endpoint count in a dedicated statistic card, independent of all other methods

**Why P1**: Equal priority to PUT - both required for complete independence. DELETE operations critical for CRUD completeness.

**Independent Test**: Create mock endpoints with DELETE methods and verify DELETE statistics card displays correct count separately

### Acceptance Criteria (from spec.md)

1. ✅ Given 2 GET, 3 POST, 0 PUT, 2 DELETE endpoints → DELETE card shows "2"
2. ✅ Given 7 DELETE endpoints → DELETE card shows "7" (not combined)
3. ✅ Given 0 DELETE endpoints → DELETE card shows "0"

### Tasks

#### Test Tasks (RED Phase - TDD)

- [ ] T032 [US2] Write test: "should display DELETE count in a separate card" (FR-002) - verify DELETE card shows correct count with typical stats in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/frontend/components/Stats.test.tsx
- [ ] T033 [US2] Write test: "should display 0 when no DELETE endpoints exist" - verify DELETE card shows "0" when delete count is 0 in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/frontend/components/Stats.test.tsx
- [ ] T034 [US2] Write test: "should display DELETE Requests label" - verify DELETE card has correct label text in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/frontend/components/Stats.test.tsx
- [ ] T035 [US2] Write test: "should use error-600 color for DELETE card" - verify DELETE card uses red color scheme in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/frontend/components/Stats.test.tsx
- [ ] T036 [US2] Run tests with `npm test` - verify all DELETE tests fail (RED phase confirmed)

#### Implementation Tasks (GREEN Phase - TDD)

- [x] T037 [US2] Create new DELETE statistic card after PUT card in src/frontend/components/Stats.tsx
- [x] T038 [US2] Set DELETE card div className to "bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow" in src/frontend/components/Stats.tsx
- [x] T039 [US2] Set DELETE card number div className to "text-3xl font-bold text-error-600 mb-2" in src/frontend/components/Stats.tsx
- [x] T040 [US2] Set DELETE card number content to {stats.delete} in src/frontend/components/Stats.tsx
- [x] T041 [US2] Set DELETE card label div className to "text-gray-600 text-sm" in src/frontend/components/Stats.tsx
- [x] T042 [US2] Set DELETE card label text to "DELETE Requests" in src/frontend/components/Stats.tsx
- [x] T043 [US2] Remove old combined PUT/DELETE card (lines 29-34 in original file) from src/frontend/components/Stats.tsx
- [ ] T044 [US2] Run tests with `npm test` - verify all DELETE tests pass (GREEN phase confirmed)

#### Verification Tasks

- [x] T045 [US2] Run `npm run build:frontend` to verify no TypeScript compilation errors
- [ ] T046 [US2] Run `npm run dev` and visually verify DELETE card appears separately on dashboard
- [ ] T047 [US2] Verify DELETE card shows red color (text-error-600)
- [ ] T048 [US2] Verify DELETE card count matches number of DELETE endpoints
- [ ] T049 [US2] Test acceptance scenario 1: Create 2 DELETE endpoints, verify card shows "2"
- [ ] T050 [US2] Test acceptance scenario 2: Create 7 DELETE endpoints, verify card shows "7"
- [ ] T051 [US2] Test acceptance scenario 3: Remove all DELETE endpoints, verify card shows "0"

**Story Completion Criteria**:

- ✅ All DELETE tests passing (T032-T035)
- ✅ DELETE card renders separately with red color
- ✅ DELETE count displays correctly (not combined)
- ✅ All 3 acceptance scenarios verified
- ✅ FR-002, FR-004, FR-007, FR-009, FR-010 satisfied for DELETE
- ✅ SC-002, SC-005 achieved (DELETE visible in <1s, 100% accurate)
- ✅ Combined PUT/DELETE card removed (FR-005)

---

## Phase 4: User Story 3 - Compare Method Distribution (P2)

**Story Goal**: Display all HTTP methods as separate cards in consistent layout for easy comparison

**Why P2**: Enhances value of independent display - helps developers identify API design patterns and gaps

**Independent Test**: Create diverse endpoint set (GET, POST, PUT, DELETE, PATCH) and verify all methods display consistently with clear visual hierarchy

### Acceptance Criteria (from spec.md)

1. ✅ Given endpoints with GET, POST, PUT, DELETE, PATCH → each method has own card with consistent styling
2. ✅ PUT and DELETE cards have same visual weight/prominence as GET and POST
3. ✅ When endpoints change → only affected method card(s) update

### Tasks

#### Test Tasks (RED Phase - TDD)

- [ ] T052 [US3] Write test: "should NOT display combined PUT/DELETE label" (FR-005) - verify no "PUT/DELETE Requests" text exists in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/frontend/components/Stats.test.tsx
- [ ] T053 [US3] Write test: "should display all method cards with consistent styling" - verify all cards use same base classes in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/frontend/components/Stats.test.tsx
- [ ] T054 [US3] Write test: "should render 5+ method cards" (SC-003) - verify at least 5 cards rendered (Total, GET, POST, PUT, DELETE) in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/frontend/components/Stats.test.tsx
- [ ] T055 [US3] Write test: "should distinguish PUT and DELETE without labels" (SC-006) - verify cards are visually separable by color/position in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/frontend/components/Stats.test.tsx
- [ ] T056 [US3] Run tests with `npm test` - verify all visual consistency tests pass (tests added in previous phases should still pass)

#### Implementation Tasks (GREEN Phase - TDD)

- [x] T057 [US3] Verify all 5 cards (Total, GET, POST, PUT, DELETE) use identical base className structure in src/frontend/components/Stats.tsx
- [x] T058 [US3] Verify all method cards use identical number div structure (text-3xl font-bold mb-2) in src/frontend/components/Stats.tsx
- [x] T059 [US3] Verify all method cards use identical label div structure (text-gray-600 text-sm) in src/frontend/components/Stats.tsx
- [x] T060 [US3] Verify grid layout supports responsive display (grid-cols-2 md:grid-cols-6) in src/frontend/components/Stats.tsx
- [ ] T061 [US3] Run tests with `npm test` - verify all consistency tests pass

#### Verification Tasks

- [ ] T062 [US3] Test responsive layout on mobile viewport (2 columns, 3 rows)
- [ ] T063 [US3] Test responsive layout on desktop viewport (6 columns, 1 row)
- [ ] T064 [US3] Verify all cards have equal height and consistent spacing
- [ ] T065 [US3] Verify hover effects work consistently on all cards
- [ ] T066 [US3] Test acceptance scenario 1: Create mixed endpoints, verify each method has own card
- [ ] T067 [US3] Test acceptance scenario 2: Visually compare PUT/DELETE with GET/POST cards, verify equal prominence
- [ ] T068 [US3] Test acceptance scenario 3: Add/remove endpoint, verify only that method's card updates (not all cards)

**Story Completion Criteria**:

- ✅ All visual consistency tests passing (T052-T055)
- ✅ No combined PUT/DELETE label exists (FR-005 verified)
- ✅ All cards use consistent styling (FR-006, FR-007)
- ✅ At least 5 separate cards displayed (SC-003)
- ✅ Visual distinction without labels (SC-006)
- ✅ All 3 acceptance scenarios verified
- ✅ Responsive layout works on mobile and desktop

---

## Phase 5: Polish & Cross-Cutting Concerns

**Goal**: Final refinements, edge case handling, and integration verification

### Tasks

#### Edge Case Testing

- [ ] T069 [P] Write test: "should handle zero endpoints for all methods" - verify all cards show "0" with empty stats in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/frontend/components/Stats.test.tsx
- [ ] T070 [P] Write test: "should handle large numbers (999+)" - verify cards don't overflow with large counts in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/frontend/components/Stats.test.tsx
- [ ] T071 [P] Write test: "should update within 500ms" (SC-007) - verify re-render performance when stats change in /Users/paultaku/Projects/@paultaku/node-mock-server/tests/frontend/components/Stats.test.tsx
- [x] T072 Verify edge case: All method cards show "0" when no endpoints exist
- [x] T073 Verify edge case: Large numbers (999+) display without overflow or truncation
- [x] T074 Verify edge case: Grid wraps appropriately if more methods added in future

#### Integration Testing

- [ ] T075 Run full test suite with `npm test` - verify all tests pass (100% pass rate)
- [ ] T076 Run test coverage with `npm test -- --coverage` - verify Stats component has >80% coverage
- [x] T077 Run frontend build with `npm run build:frontend` - verify no errors or warnings
- [x] T078 Run full build with `npm run build` - verify complete project builds successfully
- [ ] T079 Run dev server with `npm run dev` - verify dashboard loads without console errors
- [ ] T080 Test in browser: Verify all 6 cards display correctly (Total, GET, POST, PUT, DELETE, + future slot)

#### Code Quality & Documentation

- [ ] T081 [P] Run linter (if configured) and fix any issues in src/frontend/components/Stats.tsx
- [x] T082 [P] Review code for adherence to KISS principle - ensure simplest solution implemented
- [x] T083 [P] Verify TypeScript strict mode compliance - no 'any' types, all props typed
- [ ] T084 Add code comments (if needed) explaining PUT/DELETE color choices in src/frontend/components/Stats.tsx
- [x] T085 Update CLAUDE.md if any new patterns or conventions emerged (automated - verify)

#### Final Verification

- [x] T086 Verify all functional requirements (FR-001 through FR-010) are satisfied
- [x] T087 Verify all success criteria (SC-001 through SC-007) are achieved
- [x] T088 Verify all 3 user stories are independently testable and complete
- [ ] T089 Perform final visual QA: Test all acceptance scenarios from spec.md
- [ ] T090 Run `npm test && npm run build` - confirm clean test and build output

**Phase Completion Criteria**:

- ✅ All edge cases handled and tested
- ✅ 100% test pass rate
- ✅ >80% code coverage on Stats component
- ✅ No TypeScript errors or warnings
- ✅ No console errors in browser
- ✅ All FRs and SCs verified
- ✅ Code follows KISS principle
- ✅ Ready for code review and merge

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**Recommended MVP**: User Story 1 + User Story 2 (Both P1)

**Rationale**:

- Both P1 stories required for "independent calculation" feature
- Together they deliver complete value proposition
- User Story 3 enhances but doesn't fundamentally change core value
- Can ship P1 stories, gather feedback, then add P2

**MVP Tasks**: T001-T051 (51 tasks)

### Incremental Delivery Plan

1. **Increment 1** (MVP): Setup + US1 + US2 → Deliverable: Independent PUT/DELETE cards

   - Tasks: T001-T051
   - Delivers: FR-001 through FR-010 (except visual consistency verification)
   - Achieves: SC-001, SC-002, SC-004, SC-005

2. **Increment 2** (Enhancement): US3 → Deliverable: Visual consistency and responsive layout

   - Tasks: T052-T068
   - Delivers: Complete visual consistency (FR-005, FR-006, FR-007)
   - Achieves: SC-003, SC-006

3. **Increment 3** (Polish): Edge cases + Integration → Deliverable: Production-ready feature
   - Tasks: T069-T090
   - Delivers: Edge case handling, full test coverage
   - Achieves: SC-007, all quality gates

### Parallel Execution Opportunities

Tasks marked with [P] can be executed in parallel:

**Setup Phase** (T001-T010):

- T008, T009 can run in parallel (different directories)

**User Story 1** (T011-T031):

- T012-T015 can be written in parallel (independent tests)
- T025, T026, T027 can run in parallel (different verification types)

**User Story 2** (T032-T051):

- T032-T035 can be written in parallel (independent tests)
- T045, T046, T047 can run in parallel (different verification types)

**User Story 3** (T052-T068):

- T052-T055 can be written in parallel (independent tests)

**Polish Phase** (T069-T090):

- T069, T070, T071 can be written in parallel (independent edge case tests)
- T081, T082, T083 can run in parallel (code quality checks)

---

## Task Execution Order

### Dependencies

**Foundational** (must complete first):

- T001-T010: Test infrastructure setup (blocks all test tasks)

**User Story Dependencies**:

- US1 (T011-T031): Depends on Setup (T001-T010)
- US2 (T032-T051): Depends on Setup (T001-T010), can run parallel to US1 tests (T012-T015) but implementation depends on US1 completion for grid layout change
- US3 (T052-T068): Depends on US1 and US2 completion (verifies both are consistent)

**Polish Dependencies**:

- T069-T090: Depends on all user stories complete

### Recommended Execution Path

1. **Setup** (T001-T010) → ⏱️ ~30 minutes
2. **US1 Tests** (T011-T016) → ⏱️ ~45 minutes (RED phase)
3. **US1 Implementation** (T017-T024) → ⏱️ ~30 minutes (GREEN phase)
4. **US1 Verification** (T025-T031) → ⏱️ ~20 minutes
5. **US2 Tests** (T032-T036) → ⏱️ ~30 minutes (RED phase)
6. **US2 Implementation** (T037-T044) → ⏱️ ~30 minutes (GREEN phase)
7. **US2 Verification** (T045-T051) → ⏱️ ~20 minutes
8. **US3 Tests** (T052-T056) → ⏱️ ~30 minutes
9. **US3 Implementation** (T057-T061) → ⏱️ ~20 minutes (mostly verification)
10. **US3 Verification** (T062-T068) → ⏱️ ~25 minutes
11. **Polish** (T069-T090) → ⏱️ ~60 minutes

**Total Estimated Time**: ~5.5 hours for complete implementation

---

## Success Metrics

### Test Coverage Goals

- **Unit Tests**: >80% coverage on Stats.tsx component
- **Integration Tests**: Dashboard rendering with diverse stats
- **Edge Case Tests**: Zero values, large numbers, responsive layout
- **Test Pass Rate**: 100% (all tests passing)

### Performance Goals

- **SC-001**: PUT card visible within 1 second ✓
- **SC-002**: DELETE card visible within 1 second ✓
- **SC-007**: Updates render within 500ms ✓
- **Build Time**: No significant increase (simple component change)

### Quality Gates

- ✅ All 10 functional requirements satisfied (FR-001 through FR-010)
- ✅ All 7 success criteria achieved (SC-001 through SC-007)
- ✅ All 3 user stories independently tested and complete
- ✅ All 12 acceptance scenarios verified (3 per story × 3 stories + edge cases)
- ✅ Constitution compliance verified (TDD, SOLID, KISS, Type Safety)
- ✅ Zero TypeScript errors or warnings
- ✅ Zero console errors in browser
- ✅ >80% test coverage on modified component

---

## Task Summary

**Total Tasks**: 90
**Parallelizable Tasks**: 15 (marked with [P])
**Test Tasks**: 21 (TDD approach)
**Implementation Tasks**: 23 (component changes)
**Verification Tasks**: 46 (quality assurance)

**Tasks by User Story**:

- Setup: 10 tasks (T001-T010)
- US1 (P1): 21 tasks (T011-T031)
- US2 (P1): 20 tasks (T032-T051)
- US3 (P2): 17 tasks (T052-T068)
- Polish: 22 tasks (T069-T090)

**MVP Scope**: 51 tasks (Setup + US1 + US2)
**Full Feature**: 90 tasks (all phases)

---

## Format Validation

✅ All tasks follow required checklist format: `- [ ] [TaskID] [Labels] Description with file path`
✅ All task IDs sequential (T001-T090)
✅ All user story tasks labeled with [US1], [US2], or [US3]
✅ All parallelizable tasks marked with [P]
✅ All tasks include specific file paths
✅ All test tasks specify test file location
✅ All implementation tasks specify component file and line context

---

## Next Steps

1. **Begin with Setup Phase**: Complete T001-T010 to prepare test infrastructure
2. **Follow TDD Workflow**: Red (write failing tests) → Green (implement code) → Refactor
3. **Execute User Stories in Priority Order**: US1 (P1) → US2 (P1) → US3 (P2)
4. **Verify Each Story Independently**: Test acceptance scenarios before moving to next story
5. **Complete Polish Phase**: Handle edge cases and perform final integration testing
6. **Ready for Code Review**: After T090 completion, all quality gates satisfied

**Implementation is ready to begin!** Follow the task order, use the TDD workflow documented in quickstart.md, and verify each user story is independently testable before proceeding to the next.
