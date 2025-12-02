# Data Model: User Scenario Management

**Feature**: User Scenario Management
**Date**: 2025-11-29

## Overview

This document defines the data structures, entities, and relationships for the scenario management feature. All entities follow Domain-Driven Design principles with clear aggregate boundaries and value objects.

## Core Entities

### 1. Scenario (Aggregate Root)

**Description**: Represents a named collection of endpoint configurations that define a specific testing state.

**Fields**:
```typescript
interface Scenario {
  name: string;                          // Unique scenario identifier (1-50 chars, alphanumeric + hyphens)
  endpointConfigurations: EndpointConfiguration[];  // 1+ endpoint configs
  metadata: ScenarioMetadata;            // Timestamps and versioning
}
```

**Validation Rules**:
- `name`: Required, 1-50 characters, matches `/^[a-zA-Z0-9-]+$/`
- `endpointConfigurations`: Required, minimum 1 element, no duplicates by (path, method)
- `metadata.createdAt`: Auto-generated ISO 8601 timestamp
- `metadata.lastModified`: Auto-updated on save

**State Transitions**:
- Draft → Saved (when first persisted to file)
- Saved → Active (when most recently saved)
- Active → Inactive (when another scenario saved)

**Invariants**:
- Scenario name must be unique across all scenarios
- Endpoint configurations must reference existing mock endpoints
- At least one endpoint configuration required

---

### 2. EndpointConfiguration (Value Object)

**Description**: Defines the mock response behavior for a single endpoint within a scenario.

**Fields**:
```typescript
interface EndpointConfiguration {
  path: string;                          // Endpoint path (e.g., "/pet/status")
  method: HttpMethod;                    // HTTP method enum
  selectedMockFile: string;              // Mock response filename (e.g., "success-200.json")
  delayMillisecond: number;              // Response delay 0-60000ms
}
```

**Validation Rules**:
- `path`: Required, starts with `/`, valid path format
- `method`: Required, one of: GET | POST | PUT | DELETE | PATCH
- `selectedMockFile`: Required, must exist in endpoint's mock directory, ends with `.json`
- `delayMillisecond`: Optional (default 0), range 0-60000

**Identity**:
- Value object identified by combination of (path, method)
- Two configs with same path+method are duplicates

---

### 3. ScenarioMetadata (Value Object)

**Description**: Tracking information for scenario lifecycle.

**Fields**:
```typescript
interface ScenarioMetadata {
  createdAt: string;                     // ISO 8601 timestamp
  lastModified: string;                  // ISO 8601 timestamp
  version: number;                       // Incremental version number (starts at 1)
}
```

**Validation Rules**:
- `createdAt`: Immutable after creation
- `lastModified`: Updated on every save
- `version`: Auto-incremented on each save

---

### 4. ActiveScenarioReference (Entity)

**Description**: Tracks which scenario is currently active.

**Fields**:
```typescript
interface ActiveScenarioReference {
  activeScenario: string | null;         // Name of active scenario or null if none
  lastUpdated: string;                   // ISO 8601 timestamp of last activation
}
```

**Validation Rules**:
- `activeScenario`: Must match name of existing scenario file or be null
- `lastUpdated`: Auto-updated when active scenario changes

**Persistence**:
- Stored in `mock/scenario/_active.json`
- Single file for entire system

---

## Aggregate Relationships

```
Scenario (Aggregate Root)
├── contains 1..n EndpointConfiguration (Value Object)
├── owns 1 ScenarioMetadata (Value Object)
└── referenced by 0..1 ActiveScenarioReference (Entity)

EndpointConfiguration
└── references MockEndpoint (external aggregate in server-runtime domain)
```

**Aggregate Boundaries**:
- Scenario is the aggregate root - all modifications go through ScenarioManager
- EndpointConfigurations cannot exist independently
- ActiveScenarioReference is separate entity with its own lifecycle

---

## File Representations

### Scenario File Format (`mock/scenario/{name}.json`)

```json
{
  "name": "testing",
  "endpointConfigurations": [
    {
      "path": "/pet/status",
      "method": "GET",
      "selectedMockFile": "success-200.json",
      "delayMillisecond": 1000
    },
    {
      "path": "/pet/findByTag/{tag}",
      "method": "GET",
      "selectedMockFile": "error-404.json",
      "delayMillisecond": 0
    }
  ],
  "metadata": {
    "createdAt": "2025-11-29T10:00:00.000Z",
    "lastModified": "2025-11-29T10:15:00.000Z",
    "version": 2
  }
}
```

### Active Scenario Metadata File (`mock/scenario/_active.json`)

```json
{
  "activeScenario": "testing",
  "lastUpdated": "2025-11-29T10:15:00.000Z"
}
```

---

## TypeScript Types

### Enums

```typescript
enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

enum ScenarioState {
  DRAFT = 'DRAFT',
  SAVED = 'SAVED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}
```

### Type Aliases

```typescript
type EndpointKey = `${string}|${HttpMethod}`;  // Composite key for duplicate detection
type ScenarioName = string;                      // Branded type for validation
```

### Domain Errors

```typescript
class ScenarioValidationError extends Error {
  constructor(public field: string, public constraint: string) {
    super(`Validation failed for ${field}: ${constraint}`);
    this.name = 'ScenarioValidationError';
  }
}

class DuplicateScenarioError extends Error {
  constructor(public scenarioName: string) {
    super(`Scenario with name "${scenarioName}" already exists`);
    this.name = 'DuplicateScenarioError';
  }
}

class DuplicateEndpointError extends Error {
  constructor(public path: string, public method: HttpMethod) {
    super(`Endpoint ${method} ${path} is already configured in this scenario`);
    this.name = 'DuplicateEndpointError';
  }
}

class EmptyScenarioError extends Error {
  constructor() {
    super('Scenario must contain at least one endpoint configuration');
    this.name = 'EmptyScenarioError';
  }
}

class ScenarioNotFoundError extends Error {
  constructor(public scenarioName: string) {
    super(`Scenario "${scenarioName}" not found`);
    this.name = 'ScenarioNotFoundError';
  }
}
```

---

## Zod Schemas (Runtime Validation)

### EndpointConfiguration Schema

```typescript
const EndpointConfigurationSchema = z.object({
  path: z.string().min(1).startsWith('/').regex(/^[/a-zA-Z0-9{}\-_]+$/),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  selectedMockFile: z.string().min(1).endsWith('.json'),
  delayMillisecond: z.number().int().min(0).max(60000).default(0)
});
```

### Scenario Schema

```typescript
const ScenarioSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9-]+$/),
  endpointConfigurations: z.array(EndpointConfigurationSchema).min(1),
  metadata: z.object({
    createdAt: z.string().datetime(),
    lastModified: z.string().datetime(),
    version: z.number().int().positive()
  })
}).refine(
  (data) => {
    // Check for duplicate endpoints
    const keys = new Set<string>();
    for (const config of data.endpointConfigurations) {
      const key = `${config.path}|${config.method}`;
      if (keys.has(key)) return false;
      keys.add(key);
    }
    return true;
  },
  { message: 'Duplicate endpoint configurations detected' }
);
```

### Active Scenario Reference Schema

```typescript
const ActiveScenarioReferenceSchema = z.object({
  activeScenario: z.string().nullable(),
  lastUpdated: z.string().datetime()
});
```

---

## Data Access Patterns

### ScenarioRepository Interface

```typescript
interface IScenarioRepository {
  // Create
  save(scenario: Scenario): Promise<void>;

  // Read
  findByName(name: string): Promise<Scenario | null>;
  findAll(): Promise<Scenario[]>;
  exists(name: string): Promise<boolean>;

  // Update
  update(scenario: Scenario): Promise<void>;

  // Delete
  delete(name: string): Promise<void>;
}
```

### ActiveScenarioTracker Interface

```typescript
interface IActiveScenarioTracker {
  getActive(): Promise<string | null>;
  setActive(scenarioName: string): Promise<void>;
  clearActive(): Promise<void>;
}
```

---

## Constraints & Business Rules

### Global Constraints
1. **Uniqueness**: Scenario names must be unique across all scenarios
2. **Referential Integrity**: Endpoint configurations must reference existing mock endpoints
3. **Non-Empty**: Scenarios must have at least one endpoint configuration
4. **Active Scenario**: At most one scenario can be active at a time

### Validation Order
1. Schema validation (Zod)
2. Business rule validation (duplicates, non-empty)
3. Referential integrity (endpoint exists)
4. File system constraints (valid filename, directory writable)

### Consistency Guarantees
- Scenario file write is atomic (fs-extra writeJson)
- Active scenario update happens after all endpoint `status.json` updates succeed
- If any endpoint update fails, active scenario is not updated
- Partial failures are logged with specific endpoint paths

---

## Migration & Versioning

### Version 1 (Initial Release)
- All fields as defined above
- No migration needed for new feature

### Future Compatibility
- `version` field in metadata enables schema evolution
- Unknown fields in JSON files are ignored (forward compatibility)
- Zod `.passthrough()` allows adding fields without breaking existing scenarios

---

## Summary

The data model provides a clear domain representation following DDD principles:
- **Scenario** is the aggregate root managing its configuration
- **EndpointConfiguration** is a value object with no independent identity
- **ActiveScenarioReference** is a separate entity for global state
- All types have Zod schemas for runtime validation
- Domain errors provide clear failure messages
- File format is human-readable JSON for debugging and version control
