# Workflow Steps Detailed

## progressPercent calculation
progressPercent = round((currentStepOrder / 20) * 100)
Updated on each step start.

## Checkpoint persistence rule
- Project.checkpointStepOrder and Project.checkpointLoopIteration are updated only when a step finishes with success.
- Never update checkpoint values on step start, queued state, or failed/blocked step completion.
- The checkpoint step set is every successful step from Step 01 through Step 20.
- For loop re-execution of Steps 11-17, checkpointLoopIteration must be set to the current loopIteration of the successful step.
- Resume target is always `(checkpointStepOrder + 1, checkpointLoopIteration)` as defined in loop-control/loop_policy.yml.
- If the last successful checkpoint is Step 20, resume is not allowed because the workflow is already complete.

## Step 01 intake
Input artifacts: none (uses ProjectInput record)
AI call: NO
Output artifacts: none
Step success condition: normalized input saved
Step failure condition: invalid request

## Step 02 common_features_apply
Input artifacts: none
AI call: NO
Output artifacts: common_features_resolved
Step success condition: project common feature relations saved and resolved feature names/descriptions materialized
Step failure condition: feature lookup failure

## Step 03 requirements_generate
Input artifacts: common_features_resolved (optional reference only)
AI call: YES — ai-prompts/requirements_generate.md
Prompt inputs: rawPrompt, goal, problem, targetUsers, requiredFeatures, optionalFeatures
Output artifacts: requirements_draft
Step success condition: artifact saved and parsed output valid
Step failure condition: AI call fails after AI_RETRY_LIMIT=1 or output invalid

## Step 04 requirements_polish_1
Input artifacts: requirements_draft
AI call: YES — ai-prompts/requirements_polish.md
Prompt inputs: requirementsDraft
Output artifacts: requirements_polish_1
Step success condition: artifact saved
Step failure condition: AI call fails or output invalid

## Step 05 requirements_polish_2
Input artifacts: requirements_polish_1
AI call: YES — ai-prompts/requirements_polish.md
Prompt inputs: requirementsDraft
Output artifacts: requirements_final
Step success condition: artifact saved
Step failure condition: AI call fails or output invalid

## Step 06 requirements_audit_1
Input artifacts: requirements_final
AI call: YES — ai-prompts/requirements_audit.md
Prompt inputs: requirementsDraft, previousFindings=[]
Output artifacts: requirements_audit_1
Step success condition: audit findings saved and valid against schemas/audit_findings.schema.json
Step failure condition: AI call fails or output invalid

## Step 07 requirements_audit_2
Input artifacts: requirements_final, requirements_audit_1
AI call: YES — ai-prompts/requirements_audit.md
Prompt inputs: requirementsDraft, previousFindings=requirements_audit_1.findings
Output artifacts: requirements_audit_final
Step success condition: audit findings saved and valid against schemas/audit_findings.schema.json
Step failure condition: AI call fails or output invalid

## Step 08 specification_generate
Input artifacts: requirements_final, common_features_resolved
AI call: YES — ai-prompts/specification_generate.md
Prompt inputs: requirementsFinal, enabledCommonFeatures, template
Output artifacts: specification_draft
Step success condition: artifact saved and structure valid
Step failure condition: AI call fails or output invalid

## Step 09 specification_polish_1
Input artifacts: specification_draft
AI call: YES — ai-prompts/specification_polish.md
Prompt inputs: specificationDraft
Output artifacts: specification_polish_1
Step success condition: artifact saved
Step failure condition: AI call fails or output invalid

## Step 10 specification_polish_2
Input artifacts: specification_polish_1
AI call: YES — ai-prompts/specification_polish.md
Prompt inputs: specificationDraft
Output artifacts: specification_final
Step success condition: artifact saved
Step failure condition: AI call fails or output invalid

## Step 11 specification_audit_1
Input artifacts: specification_final
AI call: YES — ai-prompts/specification_audit.md
Prompt inputs: specificationDraft, previousFindings=[]
Output artifacts: specification_audit_1
Step success condition: findings saved as JSON and valid against schemas/audit_findings.schema.json
Step failure condition: AI call fails or output invalid JSON

## Step 12 specification_audit_2
Input artifacts: specification_final, specification_audit_1
AI call: YES — ai-prompts/specification_audit.md
Prompt inputs: specificationDraft, previousFindings=specification_audit_1.findings
Output artifacts: specification_audit_final
Step success condition: findings saved as JSON and valid against schemas/audit_findings.schema.json
Step failure condition: AI call fails or output invalid JSON

## Step 13 specification_id_assign
Input artifacts: specification_final
AI call: NO
Output artifacts: specification_with_ids
Persistence strategy:
- SpecificationNode must be written with UPSERT using unique key (projectId, nodeCode)
- Mutable node fields updated on re-run: nodeType, title, content
- SpecificationEdge must be written with UPSERT using unique key (projectId, fromNodeId, toNodeId, relationType)
- Do NOT delete and re-insert existing graph rows during loop re-execution
Step success condition: REQ/UI/API/DB/TEST IDs assigned, nodes extracted, and edges extracted using docs/spec_graph_rules.md (Links columns/lines preferred, exact ID references fallback); SpecificationNode/SpecificationEdge now represent the project's active graph snapshot
Step failure condition: ID extraction failure

Graph consumption rule:
- SpecificationNode and SpecificationEdge are project-scoped current-state tables produced by the latest successful Step 13 UPSERT for the project.
- Steps 14, 15, and 16 must read this current graph state; they must not expect per-loop historical graph rows in these tables.
- Historical comparisons across loops use versioned artifacts such as conflict_report and spec_score_report.

## Step 14 conflict_check
Input artifacts: specification_with_ids
AI call: NO
Output artifacts: conflict_report
Step success condition: rules.yml executed, latest-version conflicts stored for current workflowRunId + loopIteration only, and conflict_report valid against schemas/conflict_report.schema.json
Step failure condition: rule engine error

## Step 15 spec_score
Input artifacts: specification_with_ids, conflict_report
AI call: NO
Output artifacts: spec_score_report
Step success condition: 10 category scores + total score + weakCategories saved
Step failure condition: scoring engine error

## Step 16 spec_test
Input artifacts: specification_with_ids, spec_score_report
AI call: NO
Output artifacts: spec_test_report
Step success condition: all spec test categories executed and spec_test_report valid against schemas/spec_test_report.schema.json
Step failure condition: test engine error

## Step 17 spec_feedback
Input artifacts: specification_with_ids, specification_audit_final, spec_score_report
AI call: YES — ai-prompts/specification_improve.md
Prompt inputs:
- specificationDraft = latest(specification_with_ids)
- weakCategories = string[] of category names with score < minimumCategoryScore
- findings = JSON array from specification_audit_final.findings, or [] if none
Output artifacts: specification_feedback_candidate
Step success condition: improvement candidate saved
Step failure condition: AI call fails or loop policy stops

## Loop-back behavior (Step 17)
Definitions used by stop evaluation:
- quality_regression = currentScore < lastScore
- critical_conflict_increase = current critical conflict count > previous critical conflict count
- total_timeout = workflow runtime exceeded loop-control/loop_policy.yml.totalTimeoutSec
- gating conditions at Step 17 = score/conflict/category conditions only; future artifacts from Steps 18-20 are NOT evaluated here

Evaluation order (checked BEFORE incrementing loopCount):
1. if manual_stop_requested = true → stop and set project.status = blocked
2. if loopCount >= hardLimit → stop and continue to Step 18
3. if quality_regression detected → stop and set project.status = blocked
4. if critical_conflict_increase detected → stop and set project.status = blocked
5. if total_timeout elapsed → stop and set project.status = failed
6. if totalScore >= targetScore AND zero critical conflicts AND all category scores >= minimumCategoryScore → stop (target_achieved) and continue to Step 18
7. if loopCount >= softLimit AND scoreDelta <= 1 → stop (soft_limit_reached) and continue to Step 18
8. otherwise → continue

If continue allowed:
1. specification_feedback_candidate is saved as new version of specification_final
2. loopCount increments by 1 on Project
3. Steps 11 → 17 are re-initialized as new WorkflowStep rows
4. re-initialized rows must use loopIteration = current loopCount
5. Execution resumes from Step 11

If stop triggered because of target_achieved, hard_limit, or soft_limit_reached:
1. Loop stops
2. loopStatus set per loop_policy.yml priority
3. Execution continues to Step 18

If stop triggered because of manual_stop, quality_regression, critical_conflict_increase, or total_timeout:
1. Loop stops
2. project.status and stopReason are updated as defined above
3. Execution does NOT continue to Step 18 automatically

## Step 18 ui_navigation_diagram
Input artifacts: specification_with_ids
AI call: YES — ai-prompts/ui_navigation_diagram_generate.md
Prompt inputs: specificationWithIds
Output artifacts: ui_navigation_diagram_mmd, ui_navigation_diagram_md, ui_navigation_diagram_png
Step success condition: mmd and png saved
Step failure condition:
- AI output invalid
- mmdc failure
- if no UI-NNN exists in section 7, create warning status instead of hard failure

Post-step behavior:
- On Step 18 success, project.status transitions to awaiting_approval
- Workflow execution pauses (worker releases the run)
- The UI navigation diagram PNG is presented to the user via the monitor UI
- User calls POST /api/projects/{id}/approve-diagram with { "approved": true } or { "approved": false }
- If approved: project.status transitions back to running, workflow resumes from Step 19
- If rejected: project.status transitions to blocked, stopReason = "diagram_rejected"
- Rejected projects can be resumed from blocked state; resume re-executes Step 18

## Step 19 export_spec
Precondition: Step 18 must be approved (project must have transitioned through awaiting_approval → running via approve-diagram)
Input artifacts: all latest required_before_export artifacts defined in validation/required_artifacts.yml and available after Step 18
AI call: NO
Output artifacts: export_bundle
Output format: ZIP file containing all required_before_export artifacts bundled together
ZIP contents:
- requirements_final (Markdown)
- specification_final (Markdown)
- conflict_report (JSON)
- spec_score_report (JSON)
- spec_test_report (JSON)
- ui_navigation_diagram_png (PNG)
- ui_navigation_diagram_mmd (Mermaid source)
Step success condition: ZIP export bundle saved as artifact with storagePath pointing to the generated ZIP file
Step failure condition: artifact lookup failure

## Step 20 devin_gate
Input artifacts: all latest required_for_gate artifacts defined in validation/required_artifacts.yml
AI call: NO
Output artifacts: devin_gate_result
Step success condition: readyForDevin boolean saved after final gate evaluation and devin_gate_result persisted
Step failure condition: gate evaluation error
