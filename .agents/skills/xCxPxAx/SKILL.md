---
name: xcxpxax-conventions
description: Development conventions and patterns for xCxPxAx. TypeScript React project with conventional commits.
---

# Xcxpxax Conventions

> Generated from [CultureOSx/xCxPxAx](https://github.com/CultureOSx/xCxPxAx) on 2026-03-22

## Overview

This skill teaches Claude the development patterns and conventions used in xCxPxAx.

## Tech Stack

- **Primary Language**: TypeScript
- **Framework**: React
- **Architecture**: type-based module organization
- **Test Location**: mixed
- **Test Framework**: jest

## When to Use This Skill

Activate this skill when:
- Making changes to this repository
- Adding new features following established patterns
- Writing tests that match project conventions
- Creating commits with proper message format

## Commit Conventions

Follow these commit message conventions based on 18 analyzed commits.

### Commit Style: Conventional Commits

### Prefixes Used

- `feat`
- `fix`
- `refactor`

### Message Guidelines

- Average message length: ~54 characters
- Keep first line concise and descriptive
- Use imperative mood ("Add feature" not "Added feature")


*Commit message example*

```text
feat: add Algolia backfill job to index published events and profiles from Firestore
```

*Commit message example*

```text
refactor: remove Sentry integration and related configurations
```

*Commit message example*

```text
fix: correct typo in CulturePass description
```

*Commit message example*

```text
feat: Implement centralized error logging with Sentry across all routes
```

*Commit message example*

```text
feat: implement GPS-based event discovery with useNearbyEvents hook
```

*Commit message example*

```text
feat: add Go-To-Market & Infrastructure Scaling Plan document
```

*Commit message example*

```text
fix: remove placeholder logo image
```

*Commit message example*

```text
fix: sync package-lock.json for EAS npm ci compatibility
```

## Architecture

### Project Structure: Single Package

This project uses **type-based** module organization.

### Configuration Files

- `.github/workflows/checks-app-compliance-scan.yml`
- `.github/workflows/ci-tests-codecov.yml`
- `.github/workflows/ci.yml`
- `eslint.config.js`
- `functions/jest.config.js`
- `functions/package.json`
- `functions/tsconfig.json`
- `jest.config.js`
- `package.json`
- `server/Dockerfile`
- `server/package.json`
- `server/tsconfig.json`
- `tsconfig.json`

### Guidelines

- Group code by type (components, services, utils)
- Keep related functionality in the same type folder
- Avoid circular dependencies between type folders

## Code Style

### Language: TypeScript

### Naming Conventions

| Element | Convention |
|---------|------------|
| Files | camelCase |
| Functions | camelCase |
| Classes | PascalCase |
| Constants | SCREAMING_SNAKE_CASE |

### Import Style: Path Aliases (@/, ~/)

### Export Style: Default Exports


*Preferred import style*

```typescript
// Use path aliases for imports
import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
```

*Preferred export style*

```typescript
// Use default exports for main component/function
export default function UserProfile() { ... }
```

## Testing

### Test Framework: jest

### File Pattern: `*.test.ts`

### Test Types

- **Unit tests**: Test individual functions and components in isolation
- **Integration tests**: Test interactions between multiple components/services

### Mocking: jest.mock


*Test file structure*

```typescript
import { describe, it, expect } from 'jest'

describe('MyFunction', () => {
  it('should return expected result', () => {
    const result = myFunction(input)
    expect(result).toBe(expected)
  })
})
```

## Error Handling

### Error Handling Style: Error Boundaries

React **Error Boundaries** are used for graceful UI error handling.


## Common Workflows

These workflows were detected from analyzing commit patterns.

### Feature Development

Standard feature implementation workflow

**Frequency**: ~13 times per month

**Steps**:
1. Add feature implementation
2. Add tests for feature
3. Update documentation

**Files typically involved**:
- `app/(tabs)/*`
- `app/*`
- `app/admin/*`
- `**/api/**`

**Example commit sequence**:
```
feat(events): enhance event creation with new fields and validation
first commit
feat: implement updates feature with admin management and public display
```

### Feature Development With Shared Schema Update

Implements a new feature that requires both frontend and backend changes, including updates to shared schema/types.

**Frequency**: ~2 times per month

**Steps**:
1. Update or create files in shared/schema/ (e.g., shared/schema.ts, shared/schema/event.ts, shared/schema/update.ts)
2. Update backend route handlers or services (functions/src/routes/*.ts, functions/src/services/*.ts)
3. Update frontend screens/components to use new schema (app/..., components/...)
4. Update or add API utilities if needed (lib/api.ts)
5. Update documentation if relevant (docs/...)

**Files typically involved**:
- `shared/schema/*.ts`
- `functions/src/routes/*.ts`
- `functions/src/services/*.ts`
- `app/**/*.tsx`
- `lib/api.ts`

**Example commit sequence**:
```
Update or create files in shared/schema/ (e.g., shared/schema.ts, shared/schema/event.ts, shared/schema/update.ts)
Update backend route handlers or services (functions/src/routes/*.ts, functions/src/services/*.ts)
Update frontend screens/components to use new schema (app/..., components/...)
Update or add API utilities if needed (lib/api.ts)
Update documentation if relevant (docs/...)
```

### Backend Job Or Cron Implementation

Adds a new backend job or scheduled task, often for data sync or background processing.

**Frequency**: ~1 times per month

**Steps**:
1. Create new job file in functions/src/jobs/
2. Update or create service utilities (functions/src/services/*.ts)
3. Update app entry or triggers (functions/src/app.ts, functions/src/triggers.ts)
4. Update related route handlers if necessary (functions/src/routes/*.ts)
5. Update dependencies if required (functions/package.json, functions/package-lock.json)

**Files typically involved**:
- `functions/src/jobs/*.ts`
- `functions/src/services/*.ts`
- `functions/src/app.ts`
- `functions/src/triggers.ts`
- `functions/package.json`
- `functions/package-lock.json`

**Example commit sequence**:
```
Create new job file in functions/src/jobs/
Update or create service utilities (functions/src/services/*.ts)
Update app entry or triggers (functions/src/app.ts, functions/src/triggers.ts)
Update related route handlers if necessary (functions/src/routes/*.ts)
Update dependencies if required (functions/package.json, functions/package-lock.json)
```

### Dependency Update And Build Fix

Synchronizes or updates dependencies and fixes build configuration issues, especially for deployment compatibility.

**Frequency**: ~2 times per month

**Steps**:
1. Update package.json and/or package-lock.json (root and/or functions/)
2. Update build or config files (.npmrc, .gitignore, eas.json, app.json, patches/...)
3. Regenerate lock files as needed
4. Document changes in commit message

**Files typically involved**:
- `package.json`
- `package-lock.json`
- `functions/package.json`
- `functions/package-lock.json`
- `.npmrc`
- `.gitignore`
- `eas.json`
- `app.json`
- `patches/*.patch`

**Example commit sequence**:
```
Update package.json and/or package-lock.json (root and/or functions/)
Update build or config files (.npmrc, .gitignore, eas.json, app.json, patches/...)
Regenerate lock files as needed
Document changes in commit message
```

### Sentry Or Error Logging Integration Or Removal

Adds or removes Sentry (or similar) error logging integration across the codebase.

**Frequency**: ~1 times per month

**Steps**:
1. Add or remove Sentry utility files (lib/reporting.ts, captureRouteError, etc.)
2. Update all route handlers to use or remove error logging (functions/src/routes/*.ts)
3. Update configuration files (app.json, package.json, eas.json, etc.)
4. Update dependencies as needed

**Files typically involved**:
- `lib/reporting.ts`
- `functions/src/routes/*.ts`
- `app.json`
- `package.json`
- `package-lock.json`
- `eas.json`

**Example commit sequence**:
```
Add or remove Sentry utility files (lib/reporting.ts, captureRouteError, etc.)
Update all route handlers to use or remove error logging (functions/src/routes/*.ts)
Update configuration files (app.json, package.json, eas.json, etc.)
Update dependencies as needed
```


## Best Practices

Based on analysis of the codebase, follow these practices:

### Do

- Use conventional commit format (feat:, fix:, etc.)
- Write tests using jest
- Follow *.test.ts naming pattern
- Use camelCase for file names
- Prefer default exports

### Don't

- Don't use long relative imports (use aliases)
- Don't write vague commit messages
- Don't skip tests for new features
- Don't deviate from established patterns without discussion

---

*This skill was auto-generated by [ECC Tools](https://ecc.tools). Review and customize as needed for your team.*
