# Phase 9 Spec Graph

## Goal
T-060〜T-062: Generate and persist the traceability graph without manual interpretation.

## Target files
- docs/spec_graph_rules.md
- implementation-task-graph/task_graph.md
- implementation-task-graph/task_definitions.md
- prisma/schema.prisma

## Implementation rules
- Build nodes only from assigned IDs in specification_with_ids
- Supported node types: REQ, UI, API, DB, TEST
- Create edges only by SoT rules:
  - REQ → UI
  - REQ → API
  - API → DB
  - REQ → TEST
- Do not infer unsupported edge types
- nodeCode must remain unique per project
- Loop re-execution strategy: use UPSERT for SpecificationNode on (projectId, nodeCode)
- Loop re-execution strategy: use UPSERT for SpecificationEdge on (projectId, fromNodeId, toNodeId, relationType)
- Do not delete and re-insert graph rows during loop re-execution
- These tables do not preserve historical per-loop snapshots. Historical comparisons must use versioned artifacts.
- Store graph rows in project-scoped current-state tables SpecificationNode and SpecificationEdge

## Completion
- SpecificationNode rows created from specification_with_ids
- SpecificationEdge rows created by rule-based linking only
- Duplicate edges are prevented
- Missing referenced IDs are reported as conflicts or warnings, not silently ignored
- Graph output supports traceability checks used by validation and scoring
