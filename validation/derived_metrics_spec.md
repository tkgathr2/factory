# Derived Metrics Specification

Scope rule:
- All conflict, graph, and section metrics must be computed from the latest successful `specification_with_ids` artifact for the current `workflowRunId` and `loopIteration` only.
- Never aggregate historical rows across prior loop iterations unless a formula below explicitly references `previousLoop`.
- All ratios are computed as floating point and then converted by the metric-specific rounding rule below.

Rounding rules used in this document:
- `ratio_to_percent_round(x)` = round(x * 100) to nearest integer, halves away from zero
- `clamp_0_100(x)` = min(100, max(0, x))
- All count metrics are non-negative integers
- All presence metrics are binary `0 | 1`


Graph persistence scope:
- `SpecificationNode` and `SpecificationEdge` are current-state tables scoped by `projectId`.
- They are refreshed by Step 13 using UPSERT and represent the latest successful graph snapshot for the project.
- They are not historical per-loop snapshots; historical scoring and conflict comparisons must use versioned artifacts (`conflict_report`, `spec_score_report`) rather than archived graph rows.

Inputs:
- `specMarkdown` = latest successful `specification_with_ids` markdown content for current workflowRunId + loopIteration
- `conflictsCurrent` = latest `conflict_report` rows for current workflowRunId + loopIteration
- `conflictsPreviousLoop` = latest `conflict_report` rows for previous loopIteration in same workflowRunId, or empty set
- `graphCurrent` = current project-scoped `SpecificationNode` + `SpecificationEdge` rows after the latest successful Step 13 UPSERT for the project
- `auditCurrent` = latest successful `specification_audit_final` findings for current workflowRunId + loopIteration

Section placement alignment note:
- The authoritative 27-section numbering comes from `templates/project_spec_template.md` and `docs/markdown_structure_contract.md`.
- Derived metrics that inspect specific sections must always follow that numbering exactly.
- If the template numbering changes, this file must be updated in the same change set.

Definitions:

## present_sections
- type: integer
- source: `specMarkdown`
- formula: count of sections matching exact heading pattern `^## {n}. ` for n = 1..27
- valid range: 0..27

## ambiguity_penalty
- type: integer
- source: `specMarkdown`
- formula:
  - count matches of ambiguous phrases: `TBD|to be decided|to be determined|somehow|etc\.|and so on|適宜|必要に応じて|未定|後で決める`
  - penalty = min(100, ambiguous_match_count * 5)

## api_ids_present
- type: binary
- source: `graphCurrent`
- formula: 1 if at least one node with prefix `API-` exists, else 0

## db_ids_present
- type: binary
- source: `graphCurrent`
- formula: 1 if at least one node with prefix `DB-` exists, else 0

## ui_to_api_link_exists
- type: binary
- source: `graphCurrent`
- formula: 1 if there exists at least one REQ→API edge and at least one REQ→UI edge for the current graph, else 0

## missing_error_entries
- type: integer
- source: `specMarkdown`
- formula:
  - inspect sections 7, 8, 12, 14
  - for each section, if none of `error`, `retry`, `fallback`, `例外`, `失敗時` appear, count 1 missing section
- valid range: 0..4

## contradiction_count
- type: integer
- source: `conflictsCurrent`
- formula: number of conflict rows where `severity in ('critical','major')`
- note: this is intentionally aligned with consistency scoring penalties

## critical_conflict_count
- type: integer
- source: `conflictsCurrent`
- formula: number of conflict rows where `severity = 'critical'`

## major_conflict_count
- type: integer
- source: `conflictsCurrent`
- formula: number of conflict rows where `severity = 'major'`

## tests_present
- type: binary
- source: `specMarkdown`
- formula: 1 if section 19 contains at least one `TEST-\d{3}` reference, else 0

## acceptance_present
- type: binary
- source: `specMarkdown`
- formula: 1 if section 20 is non-empty after trimming whitespace and table separators, else 0

## req_to_test_links_present
- type: binary
- source: `graphCurrent`
- formula: 1 if at least one edge `REQ -> TEST` exists, else 0

## implementation_guide_present
- type: binary
- source: `specMarkdown`
- formula: 1 if section 24 contains `implementation`, `実装`, `module`, `ownership`, `extension`, or `Phase` guidance text, else 0

## out_of_scope_present
- type: binary
- source: `specMarkdown`
- formula: 1 if section 22 contains `out of scope`, `対象外`, or equivalent exclusion text, else 0

## module_boundary_defined
- type: binary
- source: `specMarkdown`
- formula: 1 if section 24 defines module boundary, folder ownership, or extension points, or if sections 8, 9, or 13 define explicit module/component boundaries by headings or tables, else 0

## log_policy_present
- type: binary
- source: `specMarkdown`
- formula: 1 if section 14 or section 24 contains logging, audit trail, retention, or observability policy text, else 0

## audit_reference_present
- type: binary
- source: `specMarkdown`
- formula: 1 if section 25 or 26 references `audit`, `監査`, or `findings`, else 0

## stop_controls_present
- type: binary
- source: `specMarkdown`
- formula: 1 if section 14 or section 24 references stop/manual stop/timeout/hard limit/soft limit controls, else 0

## heartbeat_defined
- type: binary
- source: `specMarkdown`
- formula: 1 if section 24 references `heartbeat` or `heartbeatAgeSec`, else 0

## template_order_ok
- type: binary
- source: `specMarkdown`
- formula: 1 if all section headings appear in exact ascending order from 1 to 27, else 0

## markdown_ok
- type: binary
- source: `specMarkdown`
- formula: 1 if required heading format `## n. Title` is used for all detected sections and no heading level greater than `##` is used for primary sections, else 0

## ids_ok
- type: binary
- source: `specMarkdown`
- formula: 1 if every detected ID matches `schemas/id.schema.json` and there are no duplicate IDs within the current artifact, else 0

## req_count
- type: integer
- source: `graphCurrent`
- formula: count of nodes with prefix `REQ-`

## req_ids_with_test_link_count
- type: integer
- source: `graphCurrent`
- formula: count of distinct REQ nodes that have at least one outgoing edge to TEST

## quality_regression
- type: binary
- source: current and previous loop score reports
- formula: 1 if `currentTotalScore < previousTotalScore`, else 0

## critical_conflict_increase
- type: binary
- source: `conflictsCurrent`, `conflictsPreviousLoop`
- formula: 1 if `critical_conflict_count(current) > critical_conflict_count(previousLoop)`, else 0
