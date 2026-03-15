# Devin Final Start Prompt

You are implementing **Specification Engine**.

## Hard Rules
- Implementation only. Do NOT redesign architecture without reporting.
- Follow `templates/project_spec_template.md` and `docs/markdown_structure_contract.md` exactly.
- Never infer missing design decisions.
- Treat these as authoritative:
  - `prisma/schema.prisma`
  - `api/openapi.yaml`
  - `schemas/*.schema.json`
  - `workflow/state_machine.mmd`
  - `workflow-spec/workflow_steps_detailed.md`
  - `workflow-spec/prompt_input_mapping.md`
  - `workflow-spec/result_merge_spec.md`
  - `validation/rules.yml`
  - `validation/dsl_spec.md`
  - `validation/derived_metrics_spec.md`
  - `validation/scoring.yml`
  - `validation/spec_score_rules.md`
  - `validation/required_artifacts.yml`
  - `loop-control/loop_policy.yml`
  - `packages-shared/statuses.md`
  - `docs/ops_ui_spec.md`
  - `docs/spec_graph_rules.md`
  - `docs/id_assignment_policy.md`

## Implementation notes
- Step 13 is the only authoritative ID assignment point.
- Run-report is phase-aware. Before Step 15, score fields may be null.
- Final required artifact gate applies at Step 20 only.
- Audit JSON must validate against `schemas/audit_findings.schema.json`.
- Use `projectCode` as a server-generated identifier only. Clients never submit it.

- Conflict reports must validate against `schemas/conflict_report.schema.json`.
- Spec test reports must validate against `schemas/spec_test_report.schema.json`.
- Score formulas and rounding are authoritative in `validation/spec_score_rules.md`.

Additional v32 alignment points:
- WorkflowRun now declares reverse SpecificationConflict relation and Prisma schema must generate successfully
- Step 13 graph persistence is UPSERT-based during loop re-execution; do not delete and re-insert graph rows
- RunReport phase values are fixed in api/openapi.yaml and packages-shared/statuses.md


Additional v33 alignment points:
- SpecificationNode and SpecificationEdge are project-scoped current-state tables updated by Step 13 UPSERT; they are not historical per-loop snapshots.
- Validation and scoring must read the current graph state produced by the latest successful Step 13 for the project.
- Reuse RunReport phase values exactly as listed in packages-shared/statuses.md.


Additional v35 alignment points:
- Derived metrics must use the exact section numbers from templates/project_spec_template.md and docs/markdown_structure_contract.md.
- Update checkpointStepOrder/checkpointLoopIteration only on successful step completion; never on step start or failed step.
- Run-report payloads now include loopCount and scoreDelta, and sample payloads must validate against schema/openapi contracts.
