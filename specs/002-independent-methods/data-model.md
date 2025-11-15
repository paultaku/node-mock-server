# Data Model: Independent PUT and DELETE Method Statistics

**Feature**: 002-independent-methods
**Date**: 2025-11-15
**Phase**: 1 - Design

## Overview

This feature modifies only the presentation layer. The underlying data model already supports independent PUT and DELETE statistics. This document describes the entities and their relationships at the component level.

## Entities

### StatisticCard (Component Entity)

**Description**: Visual representation of a single HTTP method's endpoint count

**Attributes**:

| Attribute | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| value | number | Yes | Count of endpoints for this method | >= 0 |
| label | string | Yes | Display name of the method | Non-empty string |
| colorClass | string | Yes | Tailwind color utility class | Must be valid Tailwind class |
| testId | string | No | Data attribute for testing | kebab-case format |

**States**: None (stateless presentation component)

**Lifecycle**: Rendered on mount, re-rendered when stats prop changes

**Relationships**:
- Contained by: StatsComponent (parent)
- Uses data from: Stats interface

**Validation Rules**:
- FR-010: Label must clearly identify HTTP method
- FR-006/FR-007: colorClass must maintain visual consistency with existing cards
- SC-004/SC-005: value must represent 100% of endpoints for that method

**Example Instance (PUT card)**:
```typescript
{
  value: 5,
  label: "PUT Requests",
  colorClass: "text-warning-600",
  testId: "stat-card-put"
}
```

### Stats (Data Interface)

**Description**: Aggregated endpoint counts by HTTP method

**Attributes**:

| Attribute | Type | Required | Description | Source |
|-----------|------|----------|-------------|--------|
| total | number | Yes | Total count of all endpoints | Calculated: endpoints.length |
| get | number | Yes | Count of GET endpoints | Filtered: method === "GET" |
| post | number | Yes | Count of POST endpoints | Filtered: method === "POST" |
| put | number | Yes | Count of PUT endpoints | Filtered: method === "PUT" |
| delete | number | Yes | Count of DELETE endpoints | Filtered: method === "DELETE" |

**Invariants**:
- All values >= 0
- total === get + post + put + delete (+ other methods if present)
- Values calculated independently (no aggregation)

**Source**: Computed in App.tsx from endpoint array

**Relationships**:
- Consumed by: StatsComponent as props
- Derived from: Endpoint[] array

**No Changes Required**: Interface already exists and supports independent tracking

### StatsComponent (Presentation Component)

**Description**: Dashboard widget displaying all HTTP method statistics

**Props Interface**:
```typescript
interface StatsProps {
  stats: Stats;
}
```

**Current Structure** (4 cards):
1. Total Endpoints (stats.total)
2. GET Requests (stats.get)
3. POST Requests (stats.post)
4. PUT/DELETE Requests (stats.put + stats.delete) ← **CHANGE HERE**

**New Structure** (6 cards):
1. Total Endpoints (stats.total)
2. GET Requests (stats.get)
3. POST Requests (stats.post)
4. PUT Requests (stats.put) ← **NEW SEPARATE CARD**
5. DELETE Requests (stats.delete) ← **NEW SEPARATE CARD**
6. Other Methods (future: PATCH, OPTIONS, etc.)

**Layout Properties**:
- Grid: `grid-cols-2 md:grid-cols-6`
- Gap: 4 (gap-4)
- Responsive breakpoint: md (768px)

**Card Color Mapping**:

| Method | Tailwind Class | Semantic Meaning |
|--------|----------------|------------------|
| Total | text-primary-600 | Neutral/informational |
| GET | text-success-600 | Safe operation (green) |
| POST | text-warning-600 | Creation/modification (yellow) |
| PUT | text-warning-600 | Update operation (yellow) |
| DELETE | text-error-600 | Destructive action (red) |

**State**: Stateless (pure presentation)

## Entity Relationships

```
Endpoint[] (App state)
    ↓ (filtered & counted)
Stats (computed)
    ↓ (passed as props)
StatsComponent
    ↓ (renders 6 cards)
StatisticCard × 6
```

## Data Flow

1. **Source**: Endpoint array loaded from mock configuration
2. **Transformation**: App.tsx filters and counts by method
3. **Aggregation**: Creates Stats object with independent counts
4. **Presentation**: StatsComponent receives Stats and renders cards
5. **Update**: When endpoints change, Stats recalculates and component re-renders

**No Backend Changes**: Data already flows independently through the system

## Component Contract

### StatsComponent Interface

```typescript
interface StatsProps {
  stats: Stats;
}

interface Stats {
  total: number;
  get: number;
  post: number;
  put: number;
  delete: number;
}

const StatsComponent: React.FC<StatsProps> = ({ stats }) => {
  // Renders 6 cards in responsive grid
  // Each card: white bg, rounded, shadowed, centered text
  // Number: large, bold, colored
  // Label: small, gray
};
```

### Validation Contract

**Component Responsibilities**:
- FR-001: MUST render separate PUT card displaying stats.put
- FR-002: MUST render separate DELETE card displaying stats.delete
- FR-005: MUST NOT combine put and delete in any display
- FR-006/FR-007: MUST use consistent card structure (same Tailwind classes)
- FR-010: MUST clearly label each card with HTTP method name

**Performance Contract**:
- SC-001: Render PUT card within 1 second of mount
- SC-002: Render DELETE card within 1 second of mount
- SC-007: Re-render within 500ms when stats prop changes

**Accessibility Contract**:
- Cards should be keyboard navigable (if interactive)
- Text contrast must meet WCAG AA standards
- Labels must be screen-reader friendly

## Testing Model

### Test Data Scenarios

**Scenario 1: Typical distribution**
```typescript
{ total: 10, get: 4, post: 3, put: 2, delete: 1 }
```
Expected: 6 cards, PUT shows "2", DELETE shows "1"

**Scenario 2: Zero PUT endpoints**
```typescript
{ total: 5, get: 2, post: 2, put: 0, delete: 1 }
```
Expected: PUT card shows "0"

**Scenario 3: Zero DELETE endpoints**
```typescript
{ total: 6, get: 2, post: 3, put: 1, delete: 0 }
```
Expected: DELETE card shows "0"

**Scenario 4: All zeros**
```typescript
{ total: 0, get: 0, post: 0, put: 0, delete: 0 }
```
Expected: All cards show "0"

**Scenario 5: Large numbers**
```typescript
{ total: 1523, get: 500, post: 400, put: 423, delete: 200 }
```
Expected: Cards display numbers without overflow/truncation

## Migration Notes

**Backward Compatibility**: N/A (no API changes)

**Breaking Changes**: None (purely visual enhancement)

**Rollback Strategy**: Revert Stats.tsx to previous version if issues arise

## Summary

**Entities Modified**: 1 (StatsComponent)
**Entities Created**: 0 (all interfaces already exist)
**Interfaces Changed**: 0 (Stats interface unchanged)
**Backend Changes**: 0 (already supports independent tracking)

**Data Model Status**: ✅ Complete - ready for contract definition
