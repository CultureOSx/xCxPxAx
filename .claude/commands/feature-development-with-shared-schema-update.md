---
name: feature-development-with-shared-schema-update
description: Workflow command scaffold for feature-development-with-shared-schema-update in xCxPxAx.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /feature-development-with-shared-schema-update

Use this workflow when working on **feature-development-with-shared-schema-update** in `xCxPxAx`.

## Goal

Implements a new feature that requires both frontend and backend changes, including updates to shared schema/types.

## Common Files

- `shared/schema/*.ts`
- `functions/src/routes/*.ts`
- `functions/src/services/*.ts`
- `app/**/*.tsx`
- `lib/api.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Update or create files in shared/schema/ (e.g., shared/schema.ts, shared/schema/event.ts, shared/schema/update.ts)
- Update backend route handlers or services (functions/src/routes/*.ts, functions/src/services/*.ts)
- Update frontend screens/components to use new schema (app/..., components/...)
- Update or add API utilities if needed (lib/api.ts)
- Update documentation if relevant (docs/...)

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.