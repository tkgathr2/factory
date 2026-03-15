# Shared Status Rules

Project statuses:
- draft
- queued
- running
- blocked
- completed
- ready_for_devin
- failed

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

RunReport phases:
- pre_score
- scoring_available
- completed
- blocked
- failed


## RunReportPhase
Allowed values:
- pre_score
- scoring_available
- completed
- blocked
- failed

Meaning:
- pre_score = workflow running before Step 15 score output exists
- scoring_available = score output exists while workflow still running or looping
- completed = workflow reached post-Step20 completion without block/failure
- blocked = workflow stopped intentionally or by policy and did not continue automatically
- failed = workflow stopped because of runtime or execution failure


RunReportPhase in this file is the Source of Truth for OpenAPI and JSON Schema phase enum values.
