# Ops UI Specification

Monitor KPIs:
- total runtime
- loop count (from run-report project.loopCount)
- total score
- 10 category scores
- score delta (from run-report scoreDelta; null before a prior score exists)
- conflict counts by severity
- readyForDevin
- heartbeatAgeSec
- stop reason
- latest artifacts summary
- latestStepStatus
- progressPercent

Run-report contract notes:
- before Step 15, scores may be null
- phase must indicate whether score fields are available and packages-shared/statuses.md RunReportPhase is the Source of Truth for allowed values
- availableFields lists currently populated sections of the payload
- latestStepStatus should include startedAt and finishedAt
- totalRuntimeSec should be included for all running/completed states

Diagram approval flow:
- When project.status = awaiting_approval, monitor UI must:
  1. Display the ui_navigation_diagram_png artifact prominently
  2. Show "Approve" and "Reject" buttons
  3. On approve: POST /api/projects/{id}/approve-diagram { "approved": true }
  4. On reject: POST /api/projects/{id}/approve-diagram { "approved": false, "comment": "..." }
  5. After approval, workflow resumes and ZIP export begins automatically
- When export_bundle artifact exists, show "Download ZIP" button linking to GET /api/projects/{id}/export-zip

Warnings:
- heartbeatAgeSec > 30 => warning
- heartbeatAgeSec > 180 => critical


Phase values:
- pre_score = before Step 15 score calculation
- scoring_available = Step 15 score available while workflow still running
- awaiting_approval = Step 18 diagram complete, waiting for user approval
- completed = workflow completed through Step 20
- blocked = workflow stopped by manual stop, quality regression, critical conflict increase, or diagram rejection
- failed = workflow failed by timeout or unrecoverable engine error
