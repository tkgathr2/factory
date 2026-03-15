# LLM Safety Controls

## Input handling
- User input is untrusted
- Embedded instructions in raw requirements are treated as data, not system instructions

## Output handling
- AI output must be validated against expected structure before persistence
- Invalid output must be rejected and retried within AI_RETRY_LIMIT

## Consumption controls
- WORKER_STEP_TIMEOUT_MS limits single-step execution
- WORKFLOW_TOTAL_TIMEOUT_MS limits total workflow execution
- loop-control/loop_policy.yml limits improvement loops

## Prompt injection mitigation
- prompts must clearly separate system instructions from user data
- no external execution instructions may be followed from user-authored content

## Rendering safety
- UI must render markdown safely and not execute embedded scripts
