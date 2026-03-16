# Testing Specification Engine

## Overview
The Specification Engine is a monorepo (pnpm workspaces) with:
- `apps/web` — Next.js 14 frontend + API routes
- `apps/worker` — Node.js worker that polls for queued projects
- `packages/shared` — Types and constants
- `packages/spec-engine` — Core engine logic

## Devin Secrets Needed
- `DATABASE_URL` — PostgreSQL connection string (e.g. `postgresql://ubuntu:test123@localhost:5432/spec_engine_test`)

## Environment Setup

### 1. PostgreSQL
```bash
sudo apt-get install -y postgresql
sudo systemctl start postgresql
sudo -u postgres createuser -s ubuntu
sudo -u postgres psql -c "ALTER USER ubuntu WITH PASSWORD '<password>';"
sudo -u postgres createdb spec_engine_test -O ubuntu
```

### 2. Environment Variables
Create `.env` in the repo root:
```
DATABASE_URL=postgresql://ubuntu:<password>@localhost:5432/spec_engine_test
AI_MODE=mock
```

### 3. Database Migration & Seed
```bash
export DATABASE_URL="postgresql://ubuntu:<password>@localhost:5432/spec_engine_test"
cd apps/web && npx prisma migrate dev --name init && npx prisma db seed
```

### 4. Start Dev Servers
Terminal 1 (Next.js):
```bash
export DATABASE_URL="..." && export AI_MODE="mock" && cd apps/web && npx next dev --port 3000
```

Terminal 2 (Worker):
```bash
export DATABASE_URL="..." && export AI_MODE="mock" && cd apps/worker && npx tsx src/index.ts
```

## Testing Workflow

### Happy Path
1. Navigate to `http://localhost:3000` → verify home page with links
2. Go to `/projects` → verify empty project list
3. Go to `/projects/new` → fill form (title, requirements, goal, problem, target users) → submit
4. On project detail page, click "Start Workflow"
5. Watch worker logs — steps 1-17 execute with improvement loop (3-4 iterations in mock mode)
6. At Step 18, UI shows `awaiting_approval` status with "Approve Diagram" / "Reject Diagram" buttons
7. Click "Approve Diagram" → Steps 19-20 execute → status becomes `completed`
8. Click "Download ZIP" → verify ZIP contains 7 files

### Rejection Path
1. Create a second project and start workflow
2. At Step 18, click "Reject Diagram" → status becomes `blocked` with `diagram_rejected`
3. Click "Resume" → Step 18 re-executes (UI diagram artifacts bump to v2)
4. Approve on second try → workflow completes

## Known Issues & Gotchas

- **Mock mode scoring**: `AI_MODE=mock` produces deterministic scores based on content length. The mock score (~91) never reaches the 94 target, so `readyForDevin` is always `false`. This is expected.
- **Soft limit**: In mock mode, the improvement loop always hits the soft limit (3 iterations) because scores don't improve enough.
- **Worker polling**: Worker polls every 3 seconds. After approval/resume, there might be a brief delay before the worker picks up the project.
- **workflowStep unique constraint**: When resuming after rejection, the executor uses `upsert` (not `create`) for workflowStep records to avoid unique constraint violations. If this pattern is changed, resume-after-rejection will break.
- **export-zip path**: The ZIP file path is stored in the `content` column of the `Artifact` table (not `storagePath`). The `export-zip` route reads from `content` with fallback to `storagePath`.
- **Database reset**: To start fresh, drop and recreate the database, then re-run migrations and seed.

## Typechecking
```bash
cd apps/web && npx tsc --noEmit
cd apps/worker && npx tsc --noEmit
```
