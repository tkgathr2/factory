# Task Definitions

## T-001 Monorepo scaffold
Output:
- apps/web
- apps/worker
- packages/shared
- packages/spec-engine
Completion:
- pnpm workspace boots

## T-010 Prisma schema
Input:
- prisma/schema.prisma
Output:
- migrate-ready schema
Completion:
- migrate succeeds

## T-020 Projects API
Output:
- POST /api/projects
- GET /api/projects
- GET /api/projects/{id}
- GET /api/projects/{id}/run-report
- GET /api/projects/{id}/artifacts
Completion:
- responses match openapi.yaml

## T-021 Common features API
Output:
- GET /api/common-features
- POST /api/common-features
- PATCH /api/common-features/{id}
Completion:
- CRUD basics work

## T-030 Workflow run creation
Input:
- project.status=draft
Output:
- workflowRun row
- project.status=queued

## T-031 Step initialization
Input:
- workflow_steps_detailed.md
Output:
- 20 workflow steps inserted in order

## T-032 Worker polling queued projects
Runtime:
- interval=5000ms
- concurrency=1

## T-033 Step execution loop
Output:
- step status transitions
- checkpoint updates
- progressPercent updates
- loopIteration respected

## T-034 Heartbeat updates
Output:
- project.lastHeartbeatAt updates
- heartbeatAgeSec visible in run-report

## T-035 Artifact generation
Output:
- versioned artifacts saved

## T-040 Conflict detection
Input:
- validation/rules.yml
- validation/dsl_spec.md
Output:
- conflict_report artifact
- specification_conflicts rows

## T-041 Spec score engine
Input:
- validation/scoring.yml
- validation/spec_score_rules.md
- validation/derived_metrics_spec.md
- schemas/spec_score_report.schema.json
Output:
- total score
- 10 category scores
- weakCategories
- scoreDelta

## T-042 Spec test engine
Input:
- validation/spec_test_cases.md
- examples/sample_01_minimum_input.md
- examples/sample_02_normal_case.md
- examples/sample_03_conflict_case.md
Output:
- spec_test_report artifact

## T-043 Devin gate engine
Condition:
- total score >= 94
- critical conflict count == 0
- all category scores >= 80
- required artifacts present
Output:
- readyForDevin boolean

## T-050 AI provider interface
Output:
- generate / audit / improve abstraction

## T-051 Mock provider
Output:
- deterministic local responses

## T-052 Live provider adapters
Output:
- provider-specific HTTP calls

## T-053 Prompt loader
Output:
- prompts loaded from ai-prompts/*.md
- variables resolved per workflow-spec/prompt_input_mapping.md

## T-054 Requirements generation
Prompt:
- ai-prompts/requirements_generate.md
Output:
- requirements_draft

## T-055 Specification generation
Prompt:
- ai-prompts/specification_generate.md
Output:
- specification_draft

## T-056 Audit / improve generation
Prompts:
- ai-prompts/specification_audit.md
- ai-prompts/specification_improve.md
Output:
- findings / improved draft

## T-060 Spec graph extraction
Output:
- REQ/UI/API/DB/TEST nodes
- edges derived from Links or exact ID references

## T-061 Spec graph storage
Output:
- SpecificationNode rows
- SpecificationEdge rows

## T-062 Spec graph monitor UI
Output:
- JSON summary on monitor page

## T-070 Improvement loop controller
Source of truth:
- loop-control/loop_policy.yml
- workflow-spec/workflow_steps_detailed.md
- devin-instructions/008_loop_control.md

## T-074 Resume / unblock behavior
Precondition:
- blocked only
Output:
- resume from next checkpoint

## T-081 Mermaid to PNG conversion
Command:
- mmdc -i <input> -o <output>
Output:
- ui_navigation_diagram_png artifact
