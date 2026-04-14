---
name: add-or-update-hook-unit-tests
description: Workflow command scaffold for add-or-update-hook-unit-tests in xCxPxAx.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-or-update-hook-unit-tests

Use this workflow when working on **add-or-update-hook-unit-tests** in `xCxPxAx`.

## Goal

Adds or updates comprehensive unit tests for a React hook, including handling of error paths and mocking of dependencies.

## Common Files

- `hooks/__tests__/*.test.ts`
- `hooks/use*.ts`
- `package.json`
- `pnpm-lock.yaml`
- `package-lock.json`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update test files in hooks/__tests__/, named after the hook being tested.
- Mock external/native dependencies (e.g., expo-calendar, react-native/Alert) to isolate logic.
- Add or update test cases for permission errors, missing dependencies, and exception handling.
- Update the hook implementation file if necessary to facilitate testing (e.g., remove test-only exports, refactor for better testability).
- Update package.json or lock files if new test dependencies are added.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.