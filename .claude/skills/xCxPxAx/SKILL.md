```markdown
# xCxPxAx Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `xCxPxAx` TypeScript codebase. It covers file naming, import/export styles, commit message patterns, and testing conventions. By following these guidelines, contributors can ensure consistency and maintainability across the project.

## Coding Conventions

### File Naming
- **PascalCase** is used for file names.
  - Example:  
    ```
    MyComponent.ts
    UserService.ts
    ```

### Import Style
- **Alias imports** are preferred.
  - Example:
    ```typescript
    import { UserService as US } from './UserService';
    ```

### Export Style
- **Mixed exports** are used; both named and default exports may appear.
  - Example:
    ```typescript
    // Named export
    export function doSomething() { ... }

    // Default export
    export default class MyClass { ... }
    ```

### Commit Message Patterns
- Commit messages are of mixed types, often prefixed with `fix`.
- Average commit message length is 85 characters.
  - Example:
    ```
    fix: correct user authentication flow to handle expired tokens
    ```

## Workflows

### Code Fix Workflow
**Trigger:** When a bug or issue is identified and needs to be fixed  
**Command:** `/fix`

1. Identify the bug or issue in the codebase.
2. Create a new branch for the fix.
3. Implement the fix, following coding conventions.
4. Write or update relevant tests (`*.test.*` files).
5. Commit changes with a message prefixed by `fix:`.
6. Open a pull request for review.

### Add Feature Workflow
**Trigger:** When adding a new feature or module  
**Command:** `/add-feature`

1. Plan the feature and define its scope.
2. Create a new branch for the feature.
3. Create new files using PascalCase naming.
4. Use alias imports and mixed export styles as needed.
5. Write or update relevant tests.
6. Commit changes with a descriptive message.
7. Open a pull request for review.

## Testing Patterns

- Test files follow the `*.test.*` naming pattern.
  - Example:  
    ```
    UserService.test.ts
    ```
- The testing framework is unknown; check existing test files for patterns.
- Place test files alongside the code they test or in a dedicated test directory.

## Commands
| Command      | Purpose                                  |
|--------------|------------------------------------------|
| /fix         | Start a bug fix workflow                 |
| /add-feature | Start a new feature development workflow |
```
