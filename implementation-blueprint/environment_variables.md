DATABASE_URL=
AI_MODE=mock
CLAUDE_API_KEY=
OPENAI_API_KEY=
MERMAID_CLI_PATH=mmdc
WORKER_POLL_INTERVAL_MS=5000
WORKER_CONCURRENCY=1
WORKER_STEP_TIMEOUT_MS=120000
WORKFLOW_TOTAL_TIMEOUT_MS=1800000
AI_RETRY_LIMIT=1

# Policy values such as score thresholds / loop limits are sourced from:
# - validation/scoring.yml
# - loop-control/loop_policy.yml
# Environment variables must not override those values silently.
