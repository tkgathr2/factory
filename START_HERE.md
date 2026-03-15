# START HERE

最初に `00_README.md` を読み、その後は次の順で読むこと。

1. `devin-start-final.md`
2. `docs/glossary.md`
3. `architecture/architecture_overview.md`
4. `docs/system_spec.md`
5. `docs/implementation_plan.md`
6. `docs/prisma_source_of_truth.md`
7. `docs/markdown_structure_contract.md`
8. `docs/llm_safety_controls.md`
9. `templates/project_spec_template.md`
10. `data-model/database_schema.md`
11. `prisma/schema.prisma`
12. `prisma/seed.ts`
13. `packages-shared/statuses.md`
14. `api/openapi.yaml`
15. `schemas/run_report.schema.json`
16. `schemas/spec_model.schema.json`
17. `schemas/spec_score_report.schema.json`
18. `schemas/conflict_report.schema.json`
19. `schemas/spec_test_report.schema.json`
20. `schemas/audit_findings.schema.json`
21. `schemas/id.schema.json`
22. `ui-spec/ui_spec.md`
23. `workflow/state_machine.mmd`
24. `workflow-spec/workflow_steps_detailed.md`
25. `workflow-spec/prompt_input_mapping.md`
26. `workflow-spec/result_merge_spec.md`
27. `validation/rules.yml`
28. `validation/dsl_spec.md`
29. `validation/derived_metrics_spec.md`
30. `validation/scoring.yml`
31. `validation/spec_score_rules.md`
32. `validation/required_artifacts.yml`
33. `validation/spec_test_cases.md`
34. `loop-control/loop_policy.yml`
35. `docs/spec_graph_rules.md`
36. `docs/ops_ui_spec.md`
37. `docs/id_assignment_policy.md`
38. `implementation-task-graph/task_graph.md`
39. `implementation-task-graph/task_definitions.md`
40. `ai-prompts/*`
41. `devin-instructions/*`
42. `examples/*`
43. `docs/specification_id_reference.md`
44. `docs/diagram_index.md`
45. `diagrams/*`

Additional v30 must-read alignment points:
- Run-report is phase-aware before Step 15, so `scores` may be null
- Step 13 is the only authoritative ID assignment point
- Final required-artifact gating is Step 20 only
- Audit outputs must validate against `schemas/audit_findings.schema.json`

- Derived metrics and score formulas are authoritative in `validation/derived_metrics_spec.md` and `validation/spec_score_rules.md`
- Required artifacts are stage-specific and authoritative in `validation/required_artifacts.yml`
- Step 13 must extract both nodes and edges using `docs/spec_graph_rules.md`

Additional v32 alignment points:
- WorkflowRun now declares reverse SpecificationConflict relation and Prisma schema must generate successfully
- Step 13 graph persistence is UPSERT-based during loop re-execution; do not delete and re-insert graph rows
- RunReport phase values are fixed in api/openapi.yaml and packages-shared/statuses.md

Additional v33 alignment points:
- SpecificationNode and SpecificationEdge are project-scoped current-state tables updated by Step 13 UPSERT; they are not historical per-loop snapshots
- Validation and scoring must read the current graph state produced by the latest successful Step 13 for the project
- RunReport phase values are reused from packages-shared/statuses.md and must not be invented per implementation

Additional v35 alignment points:
- Derived metric section references must exactly match the 27-section template numbering
- Project checkpoint fields are updated only on successful step completion and resume uses the last successful checkpoint
- Run-report includes loopCount and scoreDelta; sample payloads must validate against the schema
