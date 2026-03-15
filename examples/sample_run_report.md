# Sample Run Report

```json
{
  "project": {
    "id": "proj_123",
    "title": "Backlog to Slack Notifications",
    "status": "running",
    "progressPercent": 55,
    "loopCount": 0,
    "latestStepStatus": {
      "stepOrder": 11,
      "stepKey": "specification_audit_1",
      "status": "running",
      "startedAt": "2026-03-15T14:02:00Z",
      "finishedAt": null
    },
    "stopReason": null,
    "loopStopReason": null
  },
  "phase": "pre_score",
  "availableFields": [
    "project",
    "conflictsSummary",
    "artifactsSummary",
    "readyForDevin",
    "heartbeatAgeSec",
    "totalRuntimeSec"
  ],
  "scores": null,
  "conflictsSummary": {
    "critical": 0,
    "major": 1,
    "minor": 2
  },
  "artifactsSummary": [
    {
      "artifactType": "requirements_final",
      "versionNo": 1,
      "storagePath": "artifacts/proj_123/requirements_final/v1.json",
      "createdAt": "2026-03-15T14:00:30Z"
    },
    {
      "artifactType": "specification_final",
      "versionNo": 1,
      "storagePath": "artifacts/proj_123/specification_final/v1.md",
      "createdAt": "2026-03-15T14:01:45Z"
    }
  ],
  "readyForDevin": false,
  "heartbeatAgeSec": 4,
  "totalRuntimeSec": 138,
  "scoreDelta": null,
  "improvementRecommendations": [
    "Add explicit error handling to sections 7, 8, 12, and 14",
    "Increase traceability coverage from REQ to TEST links"
  ]
}
```
