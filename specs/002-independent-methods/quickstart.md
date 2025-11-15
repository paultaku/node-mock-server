# Quickstart Guide: Independent PUT and DELETE Method Statistics

**Feature**: 002-independent-methods
**Branch**: `002-independent-methods`
**Last Updated**: 2025-11-15

## Overview

This guide provides a quick reference for implementing and testing the separation of PUT and DELETE statistics into independent display cards.

## Prerequisites

```bash
# Ensure you're on the feature branch
git checkout 002-independent-methods

# Install dependencies (if not already installed)
npm install

# Install new testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

## File Locations

### Files to Modify

| File | Path | Changes |
|------|------|---------|
| Stats Component | `src/frontend/components/Stats.tsx` | Split combined PUT/DELETE card into two separate cards |
| Jest Config | `jest.config.js` | Update testEnvironment from "node" to "jsdom" |

### Files to Create

| File | Path | Purpose |
|------|------|---------|
| Stats Tests | `tests/frontend/components/Stats.test.tsx` | Component tests (TDD) |
| Integration Tests | `tests/integration/dashboard.test.tsx` | Full dashboard testing |

## TDD Workflow (Red-Green-Refactor)

### Step 1: Setup Test Environment

**Update `jest.config.js`**:
```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",  // Changed from "node"
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",  // Support .tsx files
  },
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts", "!src/cli/**/*.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],  // Setup file
};
```

**Create `tests/setup.ts`**:
```typescript
import '@testing-library/jest-dom';
```

### Step 2: Write Failing Tests (RED)

**Create `tests/frontend/components/Stats.test.tsx`**:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatsComponent } from '../../../src/frontend/components/Stats';
import { Stats } from '../../../src/frontend/types';

describe('StatsComponent', () => {
  describe('PUT Statistics (FR-001)', () => {
    it('should display PUT count in a separate card', () => {
      const stats: Stats = {
        total: 10,
        get: 4,
        post: 3,
        put: 2,
        delete: 1,
      };

      render(<StatsComponent stats={stats} />);

      // Verify PUT card exists with correct count
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('PUT Requests')).toBeInTheDocument();
    });

    it('should display 0 when no PUT endpoints exist', () => {
      const stats: Stats = {
        total: 5,
        get: 2,
        post: 2,
        put: 0,
        delete: 1,
      };

      render(<StatsComponent stats={stats} />);

      const putCards = screen.getAllByText('0');
      expect(putCards.length).toBeGreaterThan(0); // At least one zero shown
      expect(screen.getByText('PUT Requests')).toBeInTheDocument();
    });
  });

  describe('DELETE Statistics (FR-002)', () => {
    it('should display DELETE count in a separate card', () => {
      const stats: Stats = {
        total: 10,
        get: 4,
        post: 3,
        put: 2,
        delete: 1,
      };

      render(<StatsComponent stats={stats} />);

      // Verify DELETE card exists with correct count
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('DELETE Requests')).toBeInTheDocument();
    });
  });

  describe('Independence (FR-005)', () => {
    it('should NOT combine PUT and DELETE counts', () => {
      const stats: Stats = {
        total: 10,
        get: 4,
        post: 3,
        put: 2,
        delete: 1,
      };

      render(<StatsComponent stats={stats} />);

      // Should NOT find combined label
      expect(screen.queryByText('PUT/DELETE Requests')).not.toBeInTheDocument();

      // Should find separate labels
      expect(screen.getByText('PUT Requests')).toBeInTheDocument();
      expect(screen.getByText('DELETE Requests')).toBeInTheDocument();
    });
  });
});
```

**Run tests (they should FAIL)**:
```bash
npm test
```

### Step 3: Implement Minimal Code (GREEN)

**Modify `src/frontend/components/Stats.tsx`**:

```tsx
import React from "react";
import { Stats } from "../types";

interface StatsProps {
  stats: Stats;
}

export const StatsComponent: React.FC<StatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
      {/* Total Card */}
      <div className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow">
        <div className="text-3xl font-bold text-primary-600 mb-2">
          {stats.total}
        </div>
        <div className="text-gray-600 text-sm">Total Endpoints</div>
      </div>

      {/* GET Card */}
      <div className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow">
        <div className="text-3xl font-bold text-success-600 mb-2">
          {stats.get}
        </div>
        <div className="text-gray-600 text-sm">GET Requests</div>
      </div>

      {/* POST Card */}
      <div className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow">
        <div className="text-3xl font-bold text-warning-600 mb-2">
          {stats.post}
        </div>
        <div className="text-gray-600 text-sm">POST Requests</div>
      </div>

      {/* PUT Card - NEW SEPARATE CARD */}
      <div className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow">
        <div className="text-3xl font-bold text-warning-600 mb-2">
          {stats.put}
        </div>
        <div className="text-gray-600 text-sm">PUT Requests</div>
      </div>

      {/* DELETE Card - NEW SEPARATE CARD */}
      <div className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow">
        <div className="text-3xl font-bold text-error-600 mb-2">
          {stats.delete}
        </div>
        <div className="text-gray-600 text-sm">DELETE Requests</div>
      </div>
    </div>
  );
};
```

**Run tests (they should PASS)**:
```bash
npm test
```

### Step 4: Refactor (REFACTOR)

At this point, the code is simple enough that minimal refactoring is needed. Possible improvements:

1. Extract card component if duplication bothers you
2. Add data-testid attributes for more robust testing
3. Ensure accessibility (aria-labels if needed)

Example with test IDs:
```tsx
<div className="..." data-testid="stat-card-put">
  <div className="text-3xl font-bold text-warning-600 mb-2">
    {stats.put}
  </div>
  <div className="text-gray-600 text-sm">PUT Requests</div>
</div>
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test Stats.test.tsx
```

## Building and Verifying

```bash
# Build frontend
npm run build:frontend

# Run dev server to see changes
npm run dev

# Or run both frontend and backend
npm run dev
```

## Visual Verification Checklist

After implementation, verify in browser:

- [ ] Dashboard displays 6 cards total (not 4)
- [ ] PUT card shows count independently
- [ ] DELETE card shows count independently
- [ ] No "PUT/DELETE Requests" combined label visible
- [ ] Cards are visually consistent (same size, spacing, shadow)
- [ ] PUT card uses amber/yellow color
- [ ] DELETE card uses red color
- [ ] Mobile view shows 2 columns (responsive)
- [ ] Desktop view shows 6 columns in a row
- [ ] Hover effects work on all cards
- [ ] Counts update when mock configuration changes

## Troubleshooting

### Tests failing with "jsdom not found"

```bash
npm install --save-dev jest-environment-jsdom
```

### Tests failing with "cannot find @testing-library"

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### Cards not rendering properly

Check that you:
1. Changed grid from `grid-cols-4` to `grid-cols-6`
2. Removed the combined PUT/DELETE card
3. Added two separate cards with correct stats

### Colors not matching

Verify Tailwind classes:
- PUT: `text-warning-600`
- DELETE: `text-error-600`

## Success Criteria Validation

| Criterion | How to Verify | Expected Result |
|-----------|---------------|-----------------|
| SC-001: PUT visible in 1s | Load dashboard, check timing | PUT card renders immediately |
| SC-002: DELETE visible in 1s | Load dashboard, check timing | DELETE card renders immediately |
| SC-004: PUT 100% accurate | Add 5 PUT endpoints | Card shows exactly "5" |
| SC-005: DELETE 100% accurate | Add 3 DELETE endpoints | Card shows exactly "3" |
| SC-007: Updates in 500ms | Add endpoint dynamically | Count updates quickly |

## Next Steps

After implementation:
1. Run full test suite: `npm test`
2. Check coverage: `npm test -- --coverage`
3. Build project: `npm run build`
4. Manual QA: `npm run dev` and verify visually
5. Create pull request with test results

## Reference

- **Spec**: [spec.md](./spec.md)
- **Plan**: [plan.md](./plan.md)
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Contract**: [contracts/StatsComponent.contract.ts](./contracts/StatsComponent.contract.ts)
