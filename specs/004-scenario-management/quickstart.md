# Quickstart Guide: User Scenario Management

**Feature**: User Scenario Management
**Target**: Developers implementing this feature
**Prerequisites**: Familiarity with TypeScript, React, Express, and TDD principles

## Implementation Overview

This guide provides the implementation sequence for the scenario management feature following Test-Driven Development principles. Each step includes what to implement and which tests to write first.

---

## Phase 1: Backend Foundation (Week 1)

### Step 1.1: Define Types and Schemas (Day 1)

**Write Tests First (RED)**:
```typescript
// tests/unit/scenario-validation.test.ts
describe('Scenario Validation Schemas', () => {
  it('should validate valid scenario', () => {
    const validScenario = { /* valid data */ };
    expect(() => ScenarioSchema.parse(validScenario)).not.toThrow();
  });

  it('should reject empty endpoint configurations', () => {
    const invalidScenario = { name: 'test', endpointConfigurations: [] };
    expect(() => ScenarioSchema.parse(invalidScenario)).toThrow(EmptyScenarioError);
  });

  it('should reject duplicate endpoints', () => {
    const invalidScenario = { /* duplicate endpoints */ };
    expect(() => ScenarioSchema.parse(invalidScenario)).toThrow(DuplicateEndpointError);
  });
});
```

**Then Implement (GREEN)**:
1. Create `src/shared/types/scenario-types.ts` with interfaces
2. Add Zod schemas to `src/shared/types/validation-schemas.ts`
3. Define custom error classes
4. Run tests → should pass

**Files to Create**:
- `src/shared/types/scenario-types.ts`
- Update: `src/shared/types/validation-schemas.ts`

---

### Step 1.2: Implement ScenarioRepository (Day 2)

**Write Tests First (RED)**:
```typescript
// tests/integration/scenario-persistence.test.ts
describe('ScenarioRepository', () => {
  it('should save scenario to file system', async () => {
    const scenario = createTestScenario();
    await repository.save(scenario);
    expect(fs.existsSync(`mock/scenario/${scenario.name}.json`)).toBe(true);
  });

  it('should load scenario from file system', async () => {
    const saved = createTestScenario();
    await repository.save(saved);
    const loaded = await repository.findByName(saved.name);
    expect(loaded).toEqual(saved);
  });

  it('should list all scenarios', async () => {
    await repository.save(createTestScenario('scenario-1'));
    await repository.save(createTestScenario('scenario-2'));
    const all = await repository.findAll();
    expect(all).toHaveLength(2);
  });
});
```

**Then Implement (GREEN)**:
1. Create `src/domains/server-runtime/scenario-repository.ts`
2. Implement `IScenarioRepository` interface with fs-extra
3. Handle file I/O errors gracefully
4. Run tests → should pass

**Files to Create**:
- `src/domains/server-runtime/scenario-repository.ts`

---

### Step 1.3: Implement ActiveScenarioTracker (Day 2)

**Write Tests First (RED)**:
```typescript
// tests/unit/active-scenario-tracker.test.ts
describe('ActiveScenarioTracker', () => {
  it('should set active scenario', async () => {
    await tracker.setActive('testing');
    const active = await tracker.getActive();
    expect(active).toBe('testing');
  });

  it('should return null when no active scenario', async () => {
    const active = await tracker.getActive();
    expect(active).toBeNull();
  });

  it('should update _active.json file', async () => {
    await tracker.setActive('testing');
    const content = await fs.readJson('mock/scenario/_active.json');
    expect(content.activeScenario).toBe('testing');
  });
});
```

**Then Implement (GREEN)**:
1. Create `src/domains/server-runtime/active-scenario-tracker.ts`
2. Implement `IActiveScenarioTracker` interface
3. Manage `_active.json` file
4. Run tests → should pass

**Files to Create**:
- `src/domains/server-runtime/active-scenario-tracker.ts`

---

### Step 1.4: Implement ScenarioApplicator (Day 3)

**Write Tests First (RED)**:
```typescript
// tests/integration/scenario-application.test.ts
describe('ScenarioApplicator', () => {
  it('should apply scenario to endpoint status files', async () => {
    const scenario = createTestScenario();
    await applicator.apply(scenario);

    const statusPath = 'mock/pet/status/GET/status.json';
    const status = await fs.readJson(statusPath);
    expect(status.selected).toBe('success-200.json');
    expect(status.delayMillisecond).toBe(1000);
  });

  it('should handle partial failures', async () => {
    const scenario = createScenarioWithInvalidEndpoint();
    const result = await applicator.apply(scenario);
    expect(result.failures).toHaveLength(1);
    expect(result.successes).toBeGreaterThan(0);
  });
});
```

**Then Implement (GREEN)**:
1. Create `src/domains/server-runtime/scenario-applicator.ts`
2. Iterate endpoint configs and update `status.json` files
3. Reuse `StatusTracker` for file updates
4. Collect failures and report
5. Run tests → should pass

**Files to Create**:
- `src/domains/server-runtime/scenario-applicator.ts`

---

### Step 1.5: Implement ScenarioManager (Day 4)

**Write Tests First (RED)**:
```typescript
// tests/unit/scenario-manager.test.ts
describe('ScenarioManager', () => {
  it('should create and save scenario', async () => {
    const request = createCreateScenarioRequest();
    const scenario = await manager.create(request);
    expect(scenario.name).toBe(request.name);
    expect(scenario.metadata.version).toBe(1);
  });

  it('should reject duplicate scenario names', async () => {
    await manager.create(createCreateScenarioRequest('test'));
    await expect(manager.create(createCreateScenarioRequest('test')))
      .rejects.toThrow(DuplicateScenarioError);
  });

  it('should update existing scenario', async () => {
    const created = await manager.create(createCreateScenarioRequest());
    const updated = await manager.update(created.name, { /* new configs */ });
    expect(updated.metadata.version).toBe(2);
  });
});
```

**Then Implement (GREEN)**:
1. Create `src/domains/server-runtime/scenario-manager.ts`
2. Coordinate repository, applicator, and tracker
3. Implement CRUD operations
4. Auto-generate metadata (timestamps, version)
5. Run tests → should pass

**Files to Create**:
- `src/domains/server-runtime/scenario-manager.ts`

---

### Step 1.6: Add API Endpoints to Mock Server (Day 5)

**Write Tests First (RED)**:
```typescript
// tests/contract/scenario-api.contract.test.ts
describe('Scenario API Endpoints', () => {
  it('POST /_mock/scenarios should create scenario', async () => {
    const response = await request(app)
      .post('/_mock/scenarios')
      .send(createScenarioRequest)
      .expect(201);

    expect(response.body.scenario.name).toBe('testing');
  });

  it('GET /_mock/scenarios should list all scenarios', async () => {
    const response = await request(app)
      .get('/_mock/scenarios')
      .expect(200);

    expect(response.body).toHaveProperty('scenarios');
    expect(response.body).toHaveProperty('activeScenario');
  });

  it('PUT /_mock/scenarios/:name should update scenario', async () => {
    await createTestScenario(app);
    const response = await request(app)
      .put('/_mock/scenarios/testing')
      .send(updateRequest)
      .expect(200);

    expect(response.body.scenario.metadata.version).toBe(2);
  });

  it('DELETE /_mock/scenarios/:name should delete scenario', async () => {
    await createTestScenario(app);
    await request(app)
      .delete('/_mock/scenarios/testing')
      .expect(200);
  });
});
```

**Then Implement (GREEN)**:
1. Update `src/domains/server-runtime/mock-server.ts`
2. Add Express routes for scenario CRUD
3. Wire up ScenarioManager
4. Add request validation with Zod
5. Add error handling middleware
6. Run tests → should pass

**Files to Modify**:
- `src/domains/server-runtime/mock-server.ts`

---

## Phase 2: Frontend Implementation (Week 2)

### Step 2.1: Create Scenario API Client (Day 6)

**Write Tests First (RED)**:
```typescript
// tests/frontend/services/scenarioApi.test.ts
describe('ScenarioApi', () => {
  it('should fetch all scenarios', async () => {
    mockFetch.mockResolvedValueOnce({ scenarios: [], activeScenario: null });
    const result = await scenarioApi.fetchScenarios();
    expect(result.scenarios).toEqual([]);
  });

  it('should create scenario', async () => {
    const request = createScenarioRequest();
    mockFetch.mockResolvedValueOnce({ scenario: { ...request, metadata: {} } });
    const result = await scenarioApi.createScenario(request);
    expect(result.scenario.name).toBe(request.name);
  });
});
```

**Then Implement (GREEN)**:
1. Create `src/frontend/services/scenarioApi.ts`
2. Implement fetch wrappers for all endpoints
3. Add error handling
4. Run tests → should pass

**Files to Create**:
- `src/frontend/services/scenarioApi.ts`

---

### Step 2.2: Create useScenarios Hook (Day 7)

**Write Tests First (RED)**:
```typescript
// tests/frontend/hooks/useScenarios.test.tsx
describe('useScenarios', () => {
  it('should load scenarios on mount', async () => {
    const { result } = renderHook(() => useScenarios());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.scenarios).toBeDefined();
  });

  it('should create scenario', async () => {
    const { result } = renderHook(() => useScenarios());
    await act(async () => {
      await result.current.createScenario(createRequest);
    });
    expect(result.current.scenarios).toContain(expect.objectContaining({ name: 'test' }));
  });
});
```

**Then Implement (GREEN)**:
1. Create `src/frontend/hooks/useScenarios.ts`
2. Manage scenario state with React hooks
3. Implement CRUD operations
4. Handle loading/error states
5. Run tests → should pass

**Files to Create**:
- `src/frontend/hooks/useScenarios.ts`

---

### Step 2.3: Build Scenario UI Components (Days 8-9)

**Write Tests First (RED)**:
```typescript
// tests/frontend/components/ScenarioManagement/ScenarioList.test.tsx
describe('ScenarioList', () => {
  it('should render scenarios with active badge', () => {
    const { getByText } = render(<ScenarioList scenarios={testScenarios} activeScenario="testing" />);
    expect(getByText('Active')).toBeInTheDocument();
  });

  it('should show empty state when no scenarios', () => {
    const { getByText } = render(<ScenarioList scenarios={[]} />);
    expect(getByText(/create your first scenario/i)).toBeInTheDocument();
  });
});

// Similar tests for ScenarioForm, EndpointConfigForm, etc.
```

**Then Implement (GREEN)**:
1. Create `src/frontend/components/ScenarioManagement/` directory
2. Implement components:
   - `ScenarioList.tsx` - List view with active badge
   - `ScenarioForm.tsx` - Create/edit form
   - `EndpointConfigForm.tsx` - Add endpoint config
   - `ScenarioCard.tsx` - Card view
   - `ActiveBadge.tsx` - Active indicator
3. Add Tailwind CSS styling
4. Run tests → should pass

**Files to Create**:
- `src/frontend/components/ScenarioManagement/ScenarioList.tsx`
- `src/frontend/components/ScenarioManagement/ScenarioForm.tsx`
- `src/frontend/components/ScenarioManagement/EndpointConfigForm.tsx`
- `src/frontend/components/ScenarioManagement/ScenarioCard.tsx`
- `src/frontend/components/ScenarioManagement/ActiveBadge.tsx`

---

### Step 2.4: Integrate into Main App (Day 10)

**Write Tests First (RED)**:
```typescript
// tests/frontend/App.test.tsx
describe('App with Scenario Management', () => {
  it('should render scenario management route', () => {
    const { getByText } = render(<App />);
    fireEvent.click(getByText(/scenarios/i));
    expect(getByText(/scenario management/i)).toBeInTheDocument();
  });
});
```

**Then Implement (GREEN)**:
1. Update `src/frontend/components/App.tsx`
2. Add scenario management route
3. Add navigation link
4. Run tests → should pass

**Files to Modify**:
- `src/frontend/components/App.tsx`

---

## Phase 3: End-to-End Testing & Polish (Week 3)

### Step 3.1: End-to-End Workflow Tests (Days 11-12)

**Write Tests First (RED)**:
```typescript
// tests/e2e/scenario-workflow.test.ts
describe('Complete Scenario Workflow', () => {
  it('should create, apply, and verify scenario', async () => {
    // Create scenario via UI
    await createScenarioViaUI('testing', endpointConfigs);

    // Verify file created
    expect(fs.existsSync('mock/scenario/testing.json')).toBe(true);

    // Verify endpoints updated
    const status = await fs.readJson('mock/pet/status/GET/status.json');
    expect(status.selected).toBe('success-200.json');

    // Verify active badge shows
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Make API request to verify mock behavior
    const response = await request(app).get('/pet/status');
    expect(response.status).toBe(200);
  });
});
```

**Then Implement (GREEN)**:
1. Add E2E test infrastructure if needed
2. Write comprehensive workflow tests
3. Run tests → should pass

---

### Step 3.2: Performance & Edge Case Testing (Day 13)

**Tests to Add**:
- Large scenario (50 endpoint configs) performance
- Concurrent scenario operations
- File system error handling
- Invalid scenario file recovery
- Browser compatibility

---

### Step 3.3: Documentation & Code Review (Day 14)

**Deliverables**:
- Update README with scenario management features
- Add JSDoc comments to public APIs
- Code review checklist verification
- Constitution compliance re-check

---

## Testing Checklist

### Contract Tests
- ✅ All API endpoints match OpenAPI spec
- ✅ Request/response validation works
- ✅ Error responses have correct structure

### Integration Tests
- ✅ Scenario file I/O operations
- ✅ Status.json updates from scenarios
- ✅ Active scenario tracking

### Unit Tests
- ✅ Scenario validation logic
- ✅ Manager CRUD operations
- ✅ Applicator endpoint updates
- ✅ Repository file operations

### Component Tests
- ✅ Scenario list rendering
- ✅ Form validation
- ✅ Active badge display
- ✅ User interactions

### End-to-End Tests
- ✅ Complete create workflow
- ✅ Update existing scenario
- ✅ Delete scenario
- ✅ Active scenario switching

---

## Success Criteria Verification

Before marking the feature complete, verify all success criteria from spec.md:

- [ ] **SC-001**: Create 5-endpoint scenario in <3 minutes
- [ ] **SC-002**: Dropdown updates in <200ms
- [ ] **SC-003**: 100% file persistence success
- [ ] **SC-004**: No data loss on edit
- [ ] **SC-005**: Error messages in <100ms
- [ ] **SC-006**: 20+ configs without UI lag
- [ ] **SC-007**: 100% accurate scenario list
- [ ] **SC-008**: 95% first-time success without docs

---

## Development Commands

```bash
# Run backend unit tests
npm run test -- tests/unit

# Run integration tests
npm run test -- tests/integration

# Run contract tests
npm run test -- tests/contract

# Run frontend tests
npm run test -- tests/frontend

# Run all tests
npm test

# Watch mode for TDD
npm run test:watch

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## Common Pitfalls to Avoid

1. **Skipping tests**: Don't write implementation before tests (violates TDD)
2. **Overengineering**: Keep it simple (KISS principle)
3. **Ignoring edge cases**: Test empty scenarios, duplicates, file errors
4. **Type safety gaps**: Avoid `any` types, use Zod for runtime validation
5. **Poor error messages**: Be specific about what went wrong and how to fix it

---

## Next Steps After Implementation

1. Run `/speckit.tasks` to generate detailed task breakdown
2. Follow task order from tasks.md
3. Track progress using GitHub issues/project board
4. Regular code reviews after each phase
5. Deploy to staging for QA testing

---

## Getting Help

- Review [spec.md](spec.md) for requirements
- Check [data-model.md](data-model.md) for entity definitions
- See [contracts/scenario-api.yaml](contracts/scenario-api.yaml) for API details
- Consult [research.md](research.md) for technical decisions
- Ask team for clarification on unclear requirements
