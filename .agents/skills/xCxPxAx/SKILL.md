```markdown
# xCxPxAx Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill provides a comprehensive guide to the development patterns used in the xCxPxAx repository, a TypeScript React codebase. It covers coding conventions, commit message standards, testing approaches, and detailed workflows for maintaining and improving code quality—especially around custom React hooks and their unit tests.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `useCustomHook.ts`, `calendarUtils.ts`

### Import Style
- Use **import aliases** for modules.
  - Example:
    ```typescript
    import { getEvents } from 'utils/calendarUtils';
    import * as CalendarAPI from 'services/calendarService';
    ```

### Export Style
- Use **named exports** exclusively.
  - Example:
    ```typescript
    // calendarUtils.ts
    export function getEvents() { ... }
    export const CALENDAR_TYPE = 'local';
    ```

### Commit Messages
- Follow **conventional commit** style.
- Use prefixes such as `test`, `fix`.
- Keep messages concise (~85 characters).
  - Example: `fix: handle permission error in useCalendar hook`

## Workflows

### add-or-update-hook-unit-tests
**Trigger:** When you want to add or improve unit tests for a custom React hook, especially for error handling and edge cases.  
**Command:** `/add-hook-tests`

1. **Create or update test files**  
   - Place them in `hooks/__tests__/`, named after the hook being tested.  
     Example: `hooks/__tests__/useCalendar.test.ts`
2. **Mock external/native dependencies**  
   - Use mocking to isolate hook logic from libraries like `expo-calendar` or `react-native/Alert`.
     ```typescript
     jest.mock('expo-calendar', () => ({
       getCalendarsAsync: jest.fn(),
     }));
     ```
3. **Add or update test cases**  
   - Cover permission errors, missing dependencies, and exception handling.
     ```typescript
     it('handles permission error', async () => {
       // Arrange: mock permission denied
       // Act: call hook
       // Assert: expect error state
     });
     ```
4. **Refactor hook implementation if needed**  
   - Remove test-only exports or refactor for better testability.
5. **Update dependencies**  
   - If new test utilities are used, update `package.json` and lock files (`pnpm-lock.yaml`, `package-lock.json`).

## Testing Patterns

- **Test Framework:** (Unknown, but uses `*.test.*` pattern)
- **Test File Naming:**  
  - Place tests alongside hooks in `hooks/__tests__/`
  - Name test files as `useHookName.test.ts`
- **Mocking:**  
  - Mock external/native modules to isolate logic.
- **Test Coverage:**  
  - Focus on error paths, edge cases, and dependency handling.

## Commands
| Command         | Purpose                                                            |
|-----------------|--------------------------------------------------------------------|
| /add-hook-tests | Add or update unit tests for a custom React hook, including mocks. |
```
