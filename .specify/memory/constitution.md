<!--
Sync Impact Report:
Version: 1.0.0 → 1.1.0
Rationale: Adding KISS (Keep It Simple, Stupid) principle to enhance code readability and maintainability

Modified Principles:
- NEW: KISS Principle (Keep It Simple, Stupid) - Design guideline for readability and maintenance

Previous Version (1.0.0) Principles:
- Test-Driven Development (TDD) - NON-NEGOTIABLE (unchanged)
- Domain-Driven Development (DDD) - Primary architectural principle (unchanged)
- SOLID Principles - Guiding design practice (unchanged)
- Contract-First API Development (unchanged)
- Type Safety (unchanged)

Added Sections:
- Core Principles now has 6 principles (was 5)

Removed Sections: None

Templates Requiring Updates:
✅ plan-template.md - Verified: Constitution Check section aligns with principles
✅ spec-template.md - Verified: User Scenarios align with TDD requirements
✅ tasks-template.md - Verified: Test-first workflow aligns with TDD mandate

Follow-up TODOs: None
-->

# Node Mock Server Constitution

## Core Principles

### I. Test-Driven Development (NON-NEGOTIABLE)

**Tests MUST be written before implementation. This is mandatory and not open to exceptions.**

- Write failing tests first (Red phase)
- Implement minimal code to pass tests (Green phase)
- Refactor with confidence (Refactor phase)
- All features require test coverage before merge
- Contract tests for API boundaries
- Integration tests for component interactions
- Unit tests for business logic

**Rationale**: TDD ensures design quality, prevents regressions, provides living documentation, and enables confident refactoring. It forces clear requirement understanding before coding begins.

### II. Domain-Driven Development (Primary Architecture)

**System architecture MUST reflect the business domain through bounded contexts, aggregates, and ubiquitous language.**

- Organize code by domain concepts, not technical layers
- Use domain language in code (e.g., MockRoute, SwaggerParser, ResponseGenerator)
- Define clear boundaries between contexts (e.g., CLI generation vs. runtime serving)
- Model business rules explicitly as domain logic
- Services coordinate between aggregates
- Value objects for domain concepts without identity

**Rationale**: DDD keeps the codebase aligned with business needs, making it easier for domain experts and developers to collaborate. Domain-centric organization reduces cognitive load and improves maintainability.

### III. SOLID Principles

**Code design SHOULD follow SOLID principles to maintain flexibility and testability.**

- **Single Responsibility**: Each class/module has one reason to change
- **Open/Closed**: Extend behavior without modifying existing code
- **Liskov Substitution**: Subtypes must be substitutable for base types
- **Interface Segregation**: Clients shouldn't depend on unused interfaces
- **Dependency Inversion**: Depend on abstractions, not concretions

**Rationale**: SOLID principles produce loosely coupled, highly cohesive code that's easier to test, extend, and maintain. While not always achievable, they guide design decisions toward better architecture.

### IV. Contract-First API Development

**All API interfaces MUST be designed and documented before implementation.**

- Define Swagger/OpenAPI specifications first
- Generate TypeScript types from contracts
- Contract tests verify implementation matches specification
- Breaking changes require version increments
- API documentation generated from contracts, not code comments

**Rationale**: Contract-first development enables parallel frontend/backend work, ensures API consistency, and provides clear integration points. For a mock server tool, this principle is particularly important as the tool itself generates from contracts.

### V. Type Safety

**TypeScript MUST be used with strict mode enabled. Runtime validation MUST complement compile-time checks.**

- Enable all strict TypeScript compiler flags
- No `any` types without explicit justification
- Use Zod or similar for runtime validation at boundaries
- Type guards for discriminated unions
- Explicit error types and handling

**Rationale**: Type safety catches bugs at compile time, improves IDE support, serves as living documentation, and enables confident refactoring. Runtime validation protects against external data sources.

### VI. KISS Principle (Keep It Simple, Stupid)

**Code SHOULD favor simplicity over cleverness. Readable, maintainable code trumps overly complex solutions.**

- Choose simple solutions over complex ones when both solve the problem
- Avoid premature optimization and over-engineering
- Write code for humans to read, not just machines to execute
- Break complex functions into smaller, focused units
- Limit abstraction layers to what's truly necessary
- Clear variable and function names over cryptic abbreviations
- Direct implementations over clever tricks
- Document only when code cannot be made self-explanatory

**Rationale**: Simple code is easier to understand, debug, test, and maintain. Team velocity increases when developers can quickly comprehend existing code. KISS reduces cognitive load, minimizes bugs, and lowers onboarding time for new contributors. In a mock server context, straightforward request/response handling is preferable to elaborate frameworks.

## Development Workflow

### Code Review Requirements

- All code must pass automated tests before review
- PRs must include test coverage for new functionality
- Architecture decisions must reference constitution principles
- Breaking changes require explicit justification and migration path

### Testing Gates

- **Pre-commit**: Unit tests must pass
- **Pre-merge**: Contract and integration tests must pass
- **Pre-release**: Full test suite including end-to-end scenarios

### Quality Standards

- Code coverage minimum: 80% for business logic
- No compiler warnings in strict mode
- Linting rules enforced via CI/CD
- Performance regression tests for critical paths

## Governance

### Amendment Process

1. Proposed changes documented with rationale
2. Team review and discussion period (minimum 3 days)
3. Approval requires consensus from project maintainers
4. Version increment per semantic versioning rules
5. Update all dependent templates and documentation
6. Migration path documented for breaking changes

### Constitution Supersedes

This constitution supersedes all other development practices and guidelines. When conflicts arise, constitution principles take precedence.

### Compliance

- All pull requests MUST verify compliance with constitution principles
- Complexity that violates principles MUST be justified in plan.md
- Regular constitution reviews (quarterly recommended)
- New team members MUST read and acknowledge constitution

### Versioning

- **MAJOR**: Backward incompatible governance changes or principle removals
- **MINOR**: New principles added or substantial expansions
- **PATCH**: Clarifications, wording improvements, non-semantic changes

**Version**: 1.1.0 | **Ratified**: 2025-11-14 | **Last Amended**: 2025-11-14
