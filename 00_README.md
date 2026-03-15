# Specification Engine – Complete Audited Package v35

This package reflects post-v32 hardening for full Devin handoff safety.
The package closes the remaining contract and traceability ambiguities around graph persistence scope,
phase-aware monitoring, audit schema validation, latest-version conflict persistence,
and authoritative implementation guidance.

## v30 Changes
- Completed OpenAPI error contracts for monitor and control endpoints with 404 / 409 / 500 responses where applicable
- Aligned OpenAPI RunReportResponse with the canonical JSON schema: phase-aware fields, nullable scores, availableFields, totalRuntimeSec, startedAt / finishedAt
- Added projectCode to create-project response contract and kept generation policy server-side only
- Tightened audit-step success conditions to require validation against schemas/audit_findings.schema.json
- Added conflict duplicate prevention unique key for current workflowRunId + loopIteration scope
- Updated sample run-report example to match phase-aware payload semantics
- Refreshed START_HERE and Devin handoff guidance for the current authoritative file set
- Normalized package version markers from v29 to v30

## Existing reference materials
- diagrams/ contains reference-only visual aids
- implementation Source of Truth still takes precedence over simplified diagrams or prose summaries


## v31 Changes
- Defined derived metrics with extraction sources, formulas, types, and rounding rules
- Defined score formulas and integer totalScore rounding explicitly
- Split required artifacts into stage-specific sets in validation/required_artifacts.yml
- Added conflict_report and spec_test_report schemas
- Fixed Step 13/19/20 wording to make graph extraction and artifact stages explicit
- Made RunReport phase enum explicit and clarified logs/artifacts pagination semantics

## v32 Changes
- Added WorkflowRun.conflicts reverse relation for Prisma schema validity
- Defined Step 13 loop re-execution graph persistence strategy as UPSERT
- Added RunReport phase values to shared statuses
- Clarified spec graph re-execution behavior in workflow and Devin instructions


## v33 Changes
- Clarified that SpecificationNode and SpecificationEdge are project-scoped current-state tables, not historical per-loop snapshots
- Aligned derived-metrics graph scope with Step 13 UPSERT persistence strategy
- Added RunReportPhase section to shared statuses for explicit cross-file reuse
- Refreshed START_HERE and Devin handoff guidance for the v33 authoritative alignment points


## v35 Changes
- Aligned derived metric section references with the 27-section template and markdown contract
- Added authoritative checkpoint persistence and resume update rules to workflow SoT
- Aligned sample run report with phase enum and added loopCount/scoreDelta example fields
- Clarified RunReportPhase Source of Truth in JSON Schema, OpenAPI, and shared statuses
- Removed required-artifact gate ambiguity by pointing scoring gate logic directly to validation/required_artifacts.yml
- Made conflict report title optional and defined deterministic title generation from conflictCode
