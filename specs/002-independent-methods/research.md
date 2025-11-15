# Research: Independent PUT and DELETE Method Statistics

**Feature**: 002-independent-methods
**Date**: 2025-11-15
**Phase**: 0 - Research

## Research Items

### 1. Testing Framework (NEEDS CLARIFICATION Resolution)

**Decision**: Jest 29 with ts-jest + React Testing Library

**Rationale**:
- Project already configured with Jest 29.7.0 and ts-jest preset
- Test scripts exist: `npm test` and `npm test:watch`
- React Testing Library is industry standard for component testing
- Aligns with TDD constitution mandate

**Configuration Found**:
```javascript
// jest.config.js
{
  preset: "ts-jest",
  testEnvironment: "node",  // Will need "jsdom" for React components
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"]
}
```

**Required Additions**:
- Update testEnvironment to "jsdom" for React component DOM testing
- Add @testing-library/react, @testing-library/jest-dom dependencies
- No test files currently exist - will create new test suite

**Alternatives Considered**:
- Vitest: Faster but requires new setup (rejected - use existing Jest)
- Enzyme: Deprecated (rejected - use modern React Testing Library)

### 2. Component Structure Analysis

**Current Implementation** (`src/frontend/components/Stats.tsx:29-34`):
```tsx
<div className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow">
  <div className="text-3xl font-bold text-error-600 mb-2">
    {stats.put + stats.delete}  // LINE 31 - Combined calculation
  </div>
  <div className="text-gray-600 text-sm">PUT/DELETE Requests</div>
</div>
```

**Decision**: Replace single combined card with two separate cards

**Pattern to Follow**: Duplicate existing card structure used for GET (lines 17-22) and POST (lines 23-28)

**Color Scheme Decision**:
- PUT: `text-warning-600` (amber/yellow - represents update/modification)
- DELETE: `text-error-600` (red - represents destructive action)
- Rationale: Semantic colors following UX conventions

### 3. Grid Layout

**Current**: `grid-cols-2 md:grid-cols-4` (4 cards total)

**Decision**: `grid-cols-2 md:grid-cols-6` (6 cards total)

**Rationale**:
- Mobile: 2 columns, 3 rows (Total, GET | POST, PUT | DELETE, Other)
- Desktop: 6 columns, 1 row (all methods visible horizontally)
- Maintains responsive design pattern
- Scalable for future methods (PATCH, OPTIONS)

**Alternatives Considered**:
- `grid-cols-3`: Breaks on mobile (rejected - too narrow)
- `grid-cols-2 md:grid-cols-3`: Creates 2 rows on desktop (rejected - less compact)

### 4. Data Model Verification

**Stats Interface** (`src/frontend/types/index.ts:9-15`):
```typescript
export interface Stats {
  total: number;
  get: number;
  post: number;
  put: number;    // Already separate
  delete: number; // Already separate
}
```

**Decision**: No interface changes required

**Rationale**:
- Backend already calculates put and delete independently
- App.tsx already filters: `endpoints.filter(e => e.method === "PUT").length`
- Only display layer combines them - this is purely a UI fix

## Best Practices Applied

### React Component Testing (TDD Workflow)

**Pattern**: Arrange-Act-Assert with React Testing Library
```typescript
import { render, screen } from '@testing-library/react';

// 1. Arrange - setup test data
const stats = { total: 6, get: 2, post: 3, put: 1, delete: 0 };

// 2. Act - render component
render(<StatsComponent stats={stats} />);

// 3. Assert - verify behavior
expect(screen.getByText('1')).toBeInTheDocument();
expect(screen.getByText('PUT Requests')).toBeInTheDocument();
```

**Best Practices**:
- Query by accessible labels (screen.getByText, getByRole)
- Test user-visible behavior, not implementation
- One assertion per behavior tested
- Descriptive test names (should/when/given format)

### Tailwind CSS Consistency

**Pattern**: Maintain exact class structure from existing cards
```tsx
// Reuse pattern from lines 17-22 (GET card)
className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow"
```

**Best Practice**: Copy-paste existing card, only change:
1. Color class (text-warning-600 or text-error-600)
2. Stats value ({stats.put} or {stats.delete})
3. Label text ("PUT Requests" or "DELETE Requests")

## Dependencies Required

```json
{
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.1.0"
}
```

**Installation**: `npm install --save-dev @testing-library/react @testing-library/jest-dom`

## Configuration Changes

### jest.config.js Update
```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",  // Changed from "node"
  // ... rest unchanged
};
```

## Summary

**All NEEDS CLARIFICATION items resolved**:
- ✅ Testing framework identified: Jest + React Testing Library
- ✅ Component pattern analyzed: Duplicate card structure
- ✅ Grid layout decided: grid-cols-2 md:grid-cols-6
- ✅ Color scheme defined: PUT=warning-600, DELETE=error-600
- ✅ Backend verified: No changes needed (already independent)

**Ready for Phase 1**: Design & Contracts
