# Phase 0: Research & Decisions

**Feature**: User Scenario Management
**Date**: 2025-11-29

## Overview

This document captures research findings and technical decisions for implementing scenario management functionality in the node-mock-server project. All clarifications from the Technical Context section have been resolved through analysis of the existing codebase and industry best practices.

## Research Topics

### 1. File-Based Scenario Storage Strategy

**Decision**: Use individual JSON files per scenario in `mock/scenario/` directory with separate `_active.json` metadata file

**Rationale**:
- Aligns with existing file-based architecture (`status.json` per endpoint)
- Simple to implement - leverages existing `fs-extra` dependency
- Easy to version control and share between team members
- Human-readable for debugging and manual edits if needed
- Separate metadata file provides single source of truth for active scenario without modifying scenario files

**Alternatives Considered**:
- Single aggregated `scenarios.json` file: Rejected due to potential merge conflicts in version control and scaling issues with many scenarios
- Database (SQLite/PostgreSQL): Rejected as overkill for expected scale (<100 scenarios) and adds unnecessary complexity
- Embedded active status in each scenario file: Rejected as it requires updating multiple files when changing active scenario

**Implementation Notes**:
- Create `mock/scenario/` directory on first scenario save
- File naming: `{scenarioName}.json` (validate no special characters)
- Active tracking: `mock/scenario/_active.json` contains `{"activeScenario": "scenario-name"}`
- File format validation using Zod schemas

---

### 2. Scenario Application Mechanism

**Decision**: Directly update endpoint `status.json` files when scenario is saved

**Rationale**:
- Immediate feedback - users see configuration applied instantly
- Reuses existing StatusTracker service - no new infrastructure needed
- Aligns with user expectation from spec clarifications (Option A: immediate application)
- Simple implementation - just iterate endpoint configs and call existing file write logic

**Alternatives Considered**:
- Lazy application (apply on endpoint request): Rejected as adds complexity to request handling and doesn't provide clear feedback to users
- Background worker/queue: Rejected as overkill for synchronous file operations that complete in <50ms
- In-memory state only: Rejected as doesn't persist across server restarts

**Implementation Notes**:
- ScenarioApplicator service coordinates batch `status.json` updates
- Use fs-extra `writeJson` with atomic write semantics
- Error handling: If any endpoint update fails, continue with others and report which failed
- Update `_active.json` only after all endpoint updates succeed

---

### 3. Duplicate Endpoint Prevention Strategy

**Decision**: Client-side validation with server-side enforcement using Map-based lookup

**Rationale**:
- Fast O(1) duplicate detection using `Map<string, EndpointConfig>` keyed by `${path}|${method}`
- Prevents duplicate entries in scenario JSON file
- Clear error message to user before attempting save
- Server validates as well to prevent API misuse

**Alternatives Considered**:
- Array-based linear search: Rejected as O(n) performance degrades with many endpoint configs
- Database unique constraint: Rejected as not using database
- Allow duplicates, use last: Rejected due to user confusion about which config is active

**Implementation Notes**:
- TypeScript type: `type EndpointKey = \`${string}|${string}\``
- Validation error: `DuplicateEndpointError extends Error`
- UI displays inline error below endpoint selection dropdown

---

### 4. Active Scenario UI Indicator Implementation

**Decision**: Badge component with conditional rendering based on `_active.json` lookup

**Rationale**:
- Simple visual indicator familiar to users (similar to "Active" labels in deployment tools)
- Single read of `_active.json` when loading scenario list
- React component can be reused in both list and card views
- Tailwind CSS provides pre-built badge styling

**Alternatives Considered**:
- Highlight entire scenario row: Rejected as less clear than explicit badge
- Icon-only indicator: Rejected as text is clearer for accessibility
- Toast notification: Rejected as transient, users need persistent indicator

**Implementation Notes**:
- Component: `ActiveBadge.tsx` - green badge with "Active" text
- Props: `isActive: boolean`
- Styling: `bg-green-500 text-white text-xs px-2 py-1 rounded-full`
- Update badge when active scenario changes without full page reload

---

### 5. Scenario Validation Rules

**Decision**: Multi-layer validation using Zod schemas with custom refinements

**Rationale**:
- Zod provides runtime type safety matching TypeScript compile-time types
- Custom refinements for business rules (non-empty, no duplicates)
- Clear error messages for each validation failure
- Same validation logic reused on client and server

**Validation Rules Implemented**:
1. Scenario name: non-empty string, valid filename characters only, max 50 chars
2. Endpoint configurations: array with at least 1 element
3. Each config: valid path (starts with `/`), valid HTTP method, existing mock file, delay 0-60000ms
4. No duplicate endpoints within scenario
5. All referenced endpoints exist in mock directory

**Alternatives Considered**:
- Manual validation: Rejected as error-prone and duplicates logic
- JSON Schema: Rejected as Zod integrates better with TypeScript
- Class-validator decorators: Rejected as adds dependency and Zod is already in project

**Implementation Notes**:
- Schema file: `src/shared/types/validation-schemas.ts`
- Custom error type: `ScenarioValidationError` with field-specific messages
- Frontend uses same Zod schema for pre-submit validation

---

### 6. Performance Optimization for Dropdown Updates

**Decision**: Debounce endpoint selection changes by 100ms, preload available mocks

**Rationale**:
- Meets <200ms requirement from Technical Context
- Preloading available mocks for all endpoints on page load eliminates API roundtrip
- Debouncing prevents rapid-fire API calls if user scrolls through dropdown

**Alternatives Considered**:
- On-demand loading: Rejected as adds latency to user interaction
- Full caching without invalidation: Rejected as stale if mock files added/removed
- WebSocket for realtime updates: Rejected as overkill for this feature

**Implementation Notes**:
- Load all endpoints with available mocks on scenario form mount
- Store in React state: `Record<EndpointKey, string[]>`
- Dropdown filters this map based on selected endpoint
- Use lodash.debounce (already in project) for selection changes

---

### 7. Error Handling Strategy

**Decision**: Graceful degradation with user-friendly error messages

**Error Categories**:
1. **Validation errors**: Show inline next to affected field, prevent save
2. **File I/O errors**: Show toast notification, allow retry
3. **Missing files**: Show warning, allow save with invalid refs marked
4. **Concurrent modifications**: Last write wins, log warning

**Rationale**:
- Clear feedback helps users fix issues quickly
- Graceful degradation prevents data loss
- Logging aids debugging production issues

**Implementation Notes**:
- Error boundary component wraps scenario management UI
- Toast component for transient errors
- Inline validation errors for form fields
- Console.error for unexpected errors with stack trace

---

### 8. Testing Strategy (TDD Compliance)

**Decision**: Write tests in this order per TDD red-green-refactor

**Test Development Sequence**:
1. Contract tests: API endpoint contracts (RED)
2. Unit tests: Scenario validation, manager CRUD (RED)
3. Integration tests: File I/O, scenario application to status.json (RED)
4. Component tests: React UI components (RED)
5. End-to-end: Full workflow create → save → verify active (RED)
6. Implement minimum code to pass each test (GREEN)
7. Refactor for clarity while keeping tests green (REFACTOR)

**Rationale**:
- Follows TDD constitution mandate
- Contract-first ensures API design clarity
- Unit → Integration → E2E mirrors testing pyramid
- Each test defines a requirement before implementation

**Test Tools**:
- Jest + ts-jest (unit/integration)
- Supertest (API contract)
- React Testing Library (component)
- Testcafe or Playwright (E2E - if added)

**Coverage Goals**:
- Scenario validation: 100%
- Scenario manager: >90%
- Scenario applicator: >90%
- React components: >80%
- Overall: >85%

---

## Summary

All technical decisions align with project constitution (TDD, DDD, SOLID, Contract-First, Type Safety, KISS). No additional dependencies required beyond existing fs-extra, Zod, React, Express stack. Implementation can proceed to Phase 1: Design & Contracts.
