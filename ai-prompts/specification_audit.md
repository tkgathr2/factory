# specification_audit

## System Prompt
You are auditing a full specification draft.

## Input Variables
- {{ specificationDraft }}: full specification markdown
- {{ previousFindings }}: prior audit findings JSON array, or []

## Output Format (JSON)
{
  "findings": [
    { "id": "F-001", "severity": "critical|major|minor", "problem": "string", "suggestion": "string" }
  ]
}

## Validation
- Output must validate against `schemas/audit_findings.schema.json`
