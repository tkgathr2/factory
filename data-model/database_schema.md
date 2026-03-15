# Database Schema Reference

This document is explanatory only.
Implementation Source of Truth is `prisma/schema.prisma`.

Drift policy:
- If this file conflicts with Prisma, Prisma wins.
- Keep terminology aligned with Prisma names: `output`, `loopIteration`, `checkpointLoopIteration`.

Key notes:
- WorkflowStep uniqueness is `(workflowRunId, stepOrder, loopIteration)`.
- Project resume uses `checkpointStepOrder` + `checkpointLoopIteration`.
- SpecificationConflict is version-aware through `workflowRunId` and `loopIteration`.
- SpecificationEdge prevents duplicates with unique `(projectId, fromNodeId, toNodeId, relationType)`.

- SpecificationNode and SpecificationEdge are project-scoped current-state tables refreshed by Step 13 UPSERT.
