---
name: backend-job-or-cron-implementation
description: Workflow command scaffold for backend-job-or-cron-implementation in xCxPxAx.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /backend-job-or-cron-implementation

Use this workflow when working on **backend-job-or-cron-implementation** in `xCxPxAx`.

## Goal

Adds a new backend job or scheduled task, often for data sync or background processing.

## Common Files

- `functions/src/jobs/*.ts`
- `functions/src/services/*.ts`
- `functions/src/app.ts`
- `functions/src/triggers.ts`
- `functions/package.json`
- `functions/package-lock.json`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create new job file in functions/src/jobs/
- Update or create service utilities (functions/src/services/*.ts)
- Update app entry or triggers (functions/src/app.ts, functions/src/triggers.ts)
- Update related route handlers if necessary (functions/src/routes/*.ts)
- Update dependencies if required (functions/package.json, functions/package-lock.json)

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.