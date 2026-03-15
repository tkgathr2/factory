# Shared Status Rules

Project statuses:
- draft
- queued
- running
- awaiting_approval
- blocked
- completed
- ready_for_devin
- failed

Approval policy:
- After Step 18 (ui_navigation_diagram) completes, project.status transitions to awaiting_approval
- Workflow pauses until user calls POST /api/projects/{id}/approve-diagram
- On approval, project.status transitions back to running and Step 19 (export_spec) begins
- User can also reject, which transitions to blocked with stopReason = diagram_rejected

Resume policy:
- allowed only from blocked
- resume target = (checkpointStepOrder + 1, checkpointLoopIteration)
- checkpointLoopIteration is equal to the loopIteration of the most recent successful checkpoint step
- resume is idempotent at step boundary

Loop stop reasons:
- manual_stop -> blocked, no automatic transition to Step 18
- quality_regression -> blocked, no automatic transition to Step 18
- critical_conflict_increase -> blocked, no automatic transition to Step 18
- total_timeout -> failed, no automatic transition to Step 18
- hard_limit -> stop loop, continue to Step 18
- target_achieved -> stop loop, continue to Step 18
- soft_limit_reached -> stop loop, continue to Step 18

Diagram approval stop reasons:
- diagram_rejected -> blocked, user rejected UI navigation diagram at Step 18

RunReport phases:
- pre_score
- scoring_available
- awaiting_approval
- completed
- blocked
- failed


## RunReportPhase
Allowed values:
- pre_score
- scoring_available
- awaiting_approval
- completed
- blocked
- failed

Meaning:
- pre_score = workflow running before Step 15 score output exists
- scoring_available = score output exists while workflow still running or looping
- awaiting_approval = Step 18 diagram complete, workflow paused waiting for user to approve/reject UI navigation diagram
- completed = workflow reached post-Step20 completion without block/failure
- blocked = workflow stopped intentionally or by policy and did not continue automatically (includes diagram_rejected)
- failed = workflow stopped because of runtime or execution failure


RunReportPhase in this file is the Source of Truth for OpenAPI and JSON Schema phase enum values.
