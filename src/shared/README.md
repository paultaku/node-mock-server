# Shared Kernel

The Shared Kernel contains common types and utilities used across all domains.

## Structure

### Types (`types/`)
Common type definitions shared across domains:

- `swagger-types.ts` - Swagger/OpenAPI type definitions with Zod validation
- `mock-types.ts` - HTTP methods, status codes, route definitions
- `index.ts` - Public interface

**Usage**:
```typescript
import { SwaggerDoc, HttpMethod, RouteDefinition } from '../../shared/types';
```

### File System (`file-system/`)
Wrapper around fs-extra for consistent file operations:

- `file-reader.ts` - Read files and directories
- `file-writer.ts` - Write files with directory creation
- `index.ts` - Public interface

**Usage**:
```typescript
import { readFile, writeJson, ensureDirectory } from '../../shared/file-system';
```

### Validation (`validation/`)
Common validation utilities (future):

- Zod schemas
- Type guards
- Validation helpers

## Design Principles

1. **Dependency-Free**: Shared kernel has NO dependencies on domains
2. **Stable Interface**: Changes here affect all domains - keep stable
3. **Generic Utilities**: Only add truly cross-cutting concerns
4. **Domain-Agnostic**: No business logic - only technical utilities

## When to Add to Shared Kernel

✅ **Add when**:
- Used by 2+ domains
- Pure utility with no domain logic
- Stable interface unlikely to change frequently

❌ **Don't add when**:
- Only used by one domain (keep it domain-internal)
- Contains business logic (belongs in a domain)
- Frequently changing (keep it localized)

## Examples

### Good Shared Kernel Additions
- Common HTTP types (HttpMethod, HttpStatus)
- File I/O wrappers (readJson, writeJson)
- Validation schemas (Swagger schema validation)
- Path utilities
- Date/time utilities

### Bad Shared Kernel Additions
- Mock generation logic (belongs in Mock Generation domain)
- Route matching logic (belongs in Server Runtime domain)
- CLI parsing logic (belongs in CLI Tools domain)
- Domain-specific validation rules
