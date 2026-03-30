# Railway Deployment & Configuration

## Railway Project Info
- Project: `factory` (ID: `60eeb0fd-6dfc-4085-9262-d44923ce3b24`)
- Environment: `production` (ID: `17863ef2-412a-489c-a9a5-566561229cf4`)
- Services:
  - `s-factory` (Web): ID `4a4becf1-86d5-43a3-95b6-800944ae6d7a`
  - `worker`: ID `99fc8ed7-2ae6-4ac2-bc52-82a0ffa0f972`
  - `PostgreSQL`: ID `4b228f8d-f28c-4cda-8c03-0aa5d414ea85`
- Live URL: `https://s-factory.up.railway.app/`

## Railway API Authentication
- Token stored as secret: `RAILWAY_TOKEN`
- API endpoint: `https://backboard.railway.app/graphql/v2`
- Auth header: `Authorization: Bearer ${RAILWAY_TOKEN}`

## Setting Environment Variables via API
```graphql
mutation {
  variableUpsert(input: {
    projectId: "PROJECT_ID",
    environmentId: "ENV_ID",
    serviceId: "SERVICE_ID",
    name: "VAR_NAME",
    value: "VAR_VALUE"
  })
}
```
Note: Setting env vars automatically triggers a redeployment.

## Checking Deployment Status
```graphql
query {
  deployments(first: 1, input: {
    projectId: "PROJECT_ID",
    environmentId: "ENV_ID",
    serviceId: "SERVICE_ID"
  }) {
    edges { node { id status createdAt } }
  }
}
```
Statuses: BUILDING → DEPLOYING → SUCCESS (or FAILED)

## Merge & Deploy Workflow
1. Merge PR to `master` branch
2. Railway auto-deploys from `master`
3. Verify deployment status via API

## Slack Notification Setup
- Worker env vars needed: `SLACK_WEBHOOK_URL`, `APP_URL`
- Webhook URL format: `https://hooks.slack.com/services/...`
- APP_URL: `https://s-factory.up.railway.app`
- Notification is sent by `apps/worker/src/slack-notifier.ts`
- Triggered from `finalizeWorkflow()` in `apps/worker/src/executor.ts` (line ~555)
- Also triggered on step failure (line ~270)

## E2E Testing on Production
1. Navigate to `https://s-factory.up.railway.app/projects/new`
2. Fill in project details and create
3. Chat 3+ times (user messages >= 3) to unlock "仕様書生成を開始" button
4. Click start → monitor progress on project page
5. Step 18 pauses for UI diagram approval → click "図を承認"
6. Steps 19-20 complete → Slack DM notification sent
7. Worker runs in AI_MODE=mock (fast) on production
