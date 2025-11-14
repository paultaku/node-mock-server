# Research: Backend Codebase Constitution Alignment

**Date**: 2025-11-14
**Feature**: Backend Constitution Refactor
**Purpose**: Research domain-driven refactoring patterns and establish safe migration strategies

## Research Questions

### Q1: How to safely refactor from technical layers to domain-driven structure in TypeScript?

**Decision**: Incremental domain-by-domain migration with barrel exports (index.ts) as stable facades

**Rationale**:
- **Barrel Pattern**: Each domain exports a stable public interface through `index.ts`, hiding internal structure changes
- **Incremental Migration**: Move one domain at a time, maintaining backward compatibility at each step
- **Import Path Updates**: Update imports progressively as domains are established, using TypeScript compiler to catch breaks
- **Deprecation Strategy**: Mark old paths with `@deprecated` JSDoc, provide clear migration path in comments

**Alternatives Considered**:
- **Big Bang Rewrite**: Move all files at once - REJECTED due to high risk of breaking changes and difficult rollback
- **Dual Structure Temporarily**: Keep both old and new structures with re-exports - REJECTED as it adds confusion and maintenance burden
- **Automated Refactoring Tools** (ts-morph, jscodeshift): REJECTED for initial pass as manual control ensures understanding, but may use for bulk import updates

**Best Practices Applied**:
1. One domain at a time: Mock Generation → Server Runtime → CLI Tools
2. Full test suite passes after each domain migration
3. Commit granularly with clear messages showing domain completion status
4. Document technical debt (tight coupling) when discovered, don't block on perfection

### Q2: How to define bounded context interfaces in TypeScript for domain communication?

**Decision**: Use TypeScript interfaces + barrel exports + explicit dependency injection

**Rationale**:
- **TypeScript Interfaces**: Define contracts for cross-domain communication as interfaces
- **Barrel Exports**: Each domain's `index.ts` exports only public interfaces and facades
- **Dependency Direction**: Dependencies flow inward (CLI → Mock Generation → Shared, Server → Mock Generation → Shared)
- **No Circular Dependencies**: Use dependency inversion when needed (interfaces in shared, implementations in domains)

**Pattern Example**:
```typescript
// src/domains/mock-generation/index.ts (Public Interface)
export interface SwaggerParserService {
  parseSpec(filePath: string): Promise<ParsedSpec>;
}

export interface MockGeneratorService {
  generateMocks(spec: ParsedSpec, outputDir: string): Promise<void>;
}

// Only expose facades, hide internal implementation
export { createSwaggerParser } from './swagger-parser';
export { createMockGenerator } from './mock-file-generator';
```

**Alternatives Considered**:
- **Abstract Base Classes**: REJECTED as interfaces are more flexible and align better with TypeScript patterns
- **Event-Driven Communication**: REJECTED as overkill for this synchronous, function-call based tool
- **Shared Types Package**: REJECTED as we're not a monorepo; shared/ kernel is sufficient

**Best Practices Applied**:
1. Explicit over implicit: Import from domain public interface, never from internal files
2. Dependency injection for testability
3. Interface segregation: Small, focused interfaces over large ones

### Q3: How to identify and document tight coupling during refactor?

**Decision**: Use TODO comments with migration path + technical-debt.md catalog

**Rationale**:
- **In-Code Markers**: Add `// TODO(refactor): [description] - See technical-debt.md#TD-XXX` at coupling sites
- **Central Catalog**: Maintain `specs/001-backend-constitution-refactor/technical-debt.md` listing each instance
- **Migration Path**: Each entry includes specific steps to eventually break the coupling
- **Don't Block Progress**: Document and continue, address in future refactor phases

**Template for Technical Debt Entry**:

Each entry in `specs/001-backend-constitution-refactor/technical-debt.md` should follow this format:

```markdown
## TD-XXX: [Brief descriptive title]

**Location**: `[file-path]:[line-number]`
**Discovered**: [Date] during [which task, e.g., T028]
**Issue**: [Clear description of the coupling or problem]
**Impact**: [How it affects maintainability, testing, or future changes]
**Migration Path**:
1. [Specific step 1]
2. [Specific step 2]
3. [Specific step 3]

**Priority**: [High/Medium/Low]
**Estimated Effort**: [e.g., 2 hours, 1 day]
**Blocks**: [Any features this prevents, or "None"]
```

**Example Entry**:

```markdown
## TD-001: Mock Generator directly imports Express types

**Location**: `src/domains/mock-generation/mock-file-generator.ts:42`
**Discovered**: 2025-11-14 during T028
**Issue**: Mock generation domain depends on server runtime framework (Express). Direct import of `Request` and `Response` types creates coupling.
**Impact**: Changes to server framework (e.g., switching from Express to Fastify) would require changes in mock generation domain, violating domain independence.
**Migration Path**:
1. Create generic HTTP types in `src/shared/types/http-types.ts` (HttpRequest, HttpResponse interfaces)
2. Update mock generation to use generic HTTP types
3. Create adapter layer in server-runtime to map Express types to generic types
4. Remove direct Express import from mock-generation

**Priority**: Low
**Estimated Effort**: 3-4 hours
**Blocks**: None (Express is stable, unlikely to change)
```

**Usage in Tasks**:
- T028: Document Mock Generation domain coupling
- T048: Document Server Runtime domain coupling
- T068: Document CLI Tools domain coupling
- T084: Review and finalize all entries

**Alternatives Considered**:
- **Block Refactor Until Perfect**: REJECTED as it prevents progress and violates pragmatic refactoring principles
- **Ignore Coupling**: REJECTED as technical debt accumulates invisibly
- **Automated Dependency Analysis**: Consider madge/dependency-cruiser for visualization, but manual documentation sufficient initially

**Best Practices Applied**:
1. Visibility: All technical debt explicitly tracked
2. Prioritization: Assess impact and urgency for each debt item
3. Continuous improvement: Address highest-priority debt in subsequent iterations

### Q4: How to structure tests to match domain organization?

**Decision**: Mirror domain structure in tests/, add contract tests for bounded context interfaces

**Rationale**:
- **Mirror Structure**: `tests/domains/mock-generation/` mirrors `src/domains/mock-generation/`
- **Unit Tests Per Domain**: Test domain internals in isolation
- **Contract Tests**: New tests in `tests/contract/` verify bounded context interfaces work as specified
- **Integration Tests**: `tests/integration/` tests cross-domain scenarios (e.g., CLI → Mock Generation → File System)
- **Preserve Existing Tests**: Move existing tests to appropriate locations, don't rewrite unless necessary

**Test Organization**:
```text
tests/
├── domains/
│   ├── mock-generation/
│   │   ├── swagger-parser.test.ts
│   │   └── mock-file-generator.test.ts
│   ├── server-runtime/
│   │   ├── route-matcher.test.ts
│   │   └── mock-server.test.ts
│   └── cli-tools/
│       └── generate-command.test.ts
├── contract/
│   ├── mock-generation-interface.test.ts  # Tests public interface stability
│   └── server-runtime-interface.test.ts
└── integration/
    ├── cli-to-mock-generation.test.ts     # End-to-end CLI workflows
    └── server-runtime-full-flow.test.ts
```

**Alternatives Considered**:
- **Keep Flat Test Structure**: REJECTED as it doesn't aid navigation and violates domain alignment
- **Co-locate Tests with Source**: REJECTED as project already uses separate tests/ directory

**Best Practices Applied**:
1. Tests as documentation: Each domain's test directory shows its capabilities
2. Contract tests prevent breaking changes to public interfaces
3. Integration tests validate cross-domain workflows

### Q5: What refactoring tools and techniques minimize risk?

**Decision**: TypeScript compiler + Jest + Manual review, no automated refactoring for initial pass

**Rationale**:
- **TypeScript Compiler**: Primary safety net; compile errors immediately show broken imports
- **Jest Test Suite**: Run full suite after each change; 100% pass rate required
- **Manual Code Review**: Human understanding ensures domain boundaries make sense
- **Git Granular Commits**: Small commits enable easy rollback of specific changes
- **Feature Branch**: All work on `001-backend-constitution-refactor` branch, merge only when complete

**Refactoring Workflow Per Domain**:
```
1. Create new domain structure (e.g., src/domains/mock-generation/)
2. Move/rename files to new locations
3. Update imports within that domain
4. Create domain public interface (index.ts)
5. Update imports from other modules to use new domain public interface
6. Run TypeScript compiler (npm run build) - MUST PASS
7. Run Jest test suite (npm test) - MUST PASS
8. Commit with message: "refactor(mock-generation): reorganize to domain structure [3/10 files]"
9. Repeat for next file/module
10. Final domain commit: "refactor(mock-generation): domain complete ✅ tests passing"
```

**Alternatives Considered**:
- **Automated Refactoring (ts-morph, codemod)**: DEFERRED to bulk import updates phase; manual control ensures understanding initially
- **IDE Refactoring (VS Code rename)**: Use for simple renames, but manual verification required
- **No Testing Between Changes**: REJECTED as it delays error detection

**Best Practices Applied**:
1. Fail fast: Compile and test after every logical change
2. Small commits: Easy to identify and revert problematic changes
3. Clear commit messages: Progress tracking through git log

## Technology Stack Summary

**Existing (Preserved)**:
- TypeScript with strict mode
- Node.js 16+
- Express 4.x (server runtime)
- Commander 13.x (CLI)
- YAML 2.x (Swagger parsing)
- Zod 3.x (validation)
- fs-extra 11.x (file operations)
- Jest 29.x (testing)

**New Patterns (Introduced by Refactor)**:
- Domain-driven directory structure
- Bounded context pattern with explicit interfaces
- Barrel exports (index.ts) as public facades
- Technical debt tracking (technical-debt.md)
- Contract tests for domain interfaces

**No New Dependencies Required**: This is purely a structural refactor.

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|---------|------------|
| Breaking public API | Low | High | Lock public exports in src/index.ts, comprehensive integration tests |
| Test failures during refactor | Medium | Medium | Run tests after every file move, commit only when passing |
| Performance regression | Very Low | Medium | Preserve exact logic, no algorithmic changes |
| Merge conflicts (other devs) | Low | Medium | Frequent communication, branch protection, small incremental PRs |
| Tight coupling blocks clean separation | Medium | Low | Document as technical debt, don't block progress |
| Lost developer productivity | Low | Medium | Clear documentation, pair programming for domain boundary decisions |

## Success Validation

**How we know refactor succeeded**:
1. ✅ All existing tests pass (100%)
2. ✅ Public API unchanged (no breaking changes)
3. ✅ Build completes without errors or warnings
4. ✅ Developer can locate "mock generation" code in <30 seconds
5. ✅ New team member understands domain structure in <10 minutes
6. ✅ Zero circular dependencies (verified by madge or dependency-cruiser)
7. ✅ Each domain has clear public interface (index.ts)
8. ✅ Technical debt catalog complete with migration paths

## Next Steps

Proceed to Phase 1:
- Generate data-model.md (domain entities and relationships)
- Generate contracts/ (TypeScript interfaces for bounded contexts)
- Generate quickstart.md (developer guide for new structure)
