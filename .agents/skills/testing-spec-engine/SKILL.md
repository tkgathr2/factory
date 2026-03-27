# Testing Specification Engine v35

## Overview
The Specification Engine is a monorepo (pnpm workspaces) with:
- `apps/web` — Next.js 14 frontend + API routes (port 3000)
- `apps/worker` — Node.js worker that polls for queued projects
- `packages/shared` — Types, constants, workflow step definitions
- `packages/spec-engine` — Core engine logic

## Prerequisites
- Node.js v22+
- PostgreSQL running locally
- pnpm installed

## Devin Secrets Needed
- `DATABASE_URL` — PostgreSQL connection string for the spec_engine database

## Environment Setup

### 1. Database Setup
```bash
# Use the DATABASE_URL secret
export DATABASE_URL="$DATABASE_URL"
# Create database if needed
psql -c "CREATE DATABASE spec_engine_test;"
# Run migrations
cd apps/web && npx prisma migrate dev
# Seed data
npx prisma db seed
```

### 2. Start Web Server (Terminal 1)
```bash
export DATABASE_URL="$DATABASE_URL"
export AI_MODE="mock"
cd apps/web && npx next dev --port 3000
```

### 3. Start Worker (Terminal 2)
```bash
export DATABASE_URL="$DATABASE_URL"
export AI_MODE="mock"
cd apps/worker && npx tsx src/index.ts
```

## Key Testing Notes

### Seed Data Upsert Behavior
The seed file (`apps/web/prisma/seed.ts`) uses Prisma `upsert`. If records already exist in the DB, the `update` clause controls whether fields get updated. Make sure the `update` clause includes fields you want to refresh (e.g., `name`, `description`). An empty `update: {}` will NOT update existing records.

### Workflow Execution
- `AI_MODE=mock` uses deterministic mock responses (no real AI calls)
- The mock workflow takes ~15-30 seconds to complete all 20 steps
- Steps 11-17 loop up to 3 times before hitting `soft_limit_reached` in mock mode
- Step 18 pauses at `awaiting_approval` — requires clicking "図を承認" or "図を却下"
- Mock score is 91-93, never reaching the 94 target, so `readyForDevin` is always `false`

### E2E Test Flow
1. Navigate to http://localhost:3000
2. Click "新規作成" → fill form → "案件を作成"
3. On project detail page, click "ワークフロー開始"
4. Wait ~15-30s for Steps 1-18 to execute
5. When `awaiting_approval`, click "図を承認" to continue
6. Wait ~5s for Steps 19-20
7. Verify "ZIPダウンロード" button appears
8. Check worker terminal for Japanese log messages

### Rejection Path Test
1. Create second project, start workflow
2. At Step 18, click "図を却下"
3. Status becomes `blocked` with `diagram_rejected`
4. Click "再開" → Step 18 re-executes (not Step 19)
5. Click "図を承認" → workflow completes

### Localization Verification
- All UI text should be in Japanese (labels, buttons, placeholders, panel headers)
- Common features in DB should have Japanese names (check with psql)
- Worker logs should be entirely in Japanese
- Error messages in API routes are also in Japanese

### Common Issues
- If common features show English names after re-seeding, check the `update` clause in seed.ts
- If worker logs show English, restart the worker process after code changes
- The web dev server auto-recompiles but the worker does NOT — must be manually restarted
- No CI is configured; use `tsc --noEmit` in each workspace to check types locally
