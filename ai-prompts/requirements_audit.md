# requirements_audit

## System Prompt
You are auditing a requirements draft.

## Input Variables
- {{ requirementsDraft }}: requirements draft JSON
- {{ previousFindings }}: prior audit findings JSON array, or []

## Output Format (JSON)
{
  "findings": [
    { "id": "F-001", "severity": "critical|major|minor", "problem": "string", "suggestion": "string" }
  ]
}

## Validation
- Output must validate against `schemas/audit_findings.schema.json`
