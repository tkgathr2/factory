# Testing Factory (工場長) App

## Overview
The Factory app (要件定義・仕様書生成システム【工場長】) is a specification engine that generates verified spec documents from rough requirements through a 20-step workflow.

## Architecture
- **Frontend**: Next.js 14 (App Router) at `apps/web/`
- **Worker**: Node.js service at `apps/worker/` (processes 20-step workflow)
- **Database**: PostgreSQL with Prisma ORM
- **Monorepo**: pnpm workspaces

## Live URL
- Production: https://s-factory.up.railway.app/
- Railway auto-deploys on merge to `master` branch

## Local Development Setup
```bash
# Install dependencies
pnpm install

# Set up PostgreSQL (password may need to be set)
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE factory;"

# Run migrations
cd apps/web && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/factory" pnpm exec prisma migrate dev

# Start dev server
cd apps/web && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/factory" pnpm dev

# Start worker (optional, for workflow execution)
cd apps/worker && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/factory" AI_MODE=mock pnpm dev
```

## Key User Flows to Test

### 1. New Project Creation → Chat
- Navigate to `/projects/new`
- Fill in "ラフ要件" (required field)
- Click "案件を作成"
- **Expected**: Redirects to `/projects/{id}/chat`
- An auto-message "要件の深掘りをお願いします" is sent automatically
- AI responds with clarifying questions

### 2. Chat Conversation Flow
- After project creation, chat page loads with initial AI response
- User sends messages, AI responds with progressive questions
- After 3+ user messages, "仕様書生成を開始" button appears in header AND above input
- Green banner: "要件が整理できました。仕様書の生成を開始できます。"
- Note: The auto-message counts as 1 user message, so only 2 manual messages needed

### 3. Start Workflow
- Click "仕様書生成を開始" button
- **Expected**: Redirects to `/projects/{id}` (monitor page)
- Status shows "処理待ち" (queued)
- Note: Worker service must be running for workflow to actually execute

### 4. Chat Persistence
- Navigate away from chat page and return
- **Expected**: All messages are preserved (stored in DB)

## Important Notes
- Default branch is `master` (not `main`)
- Title field is optional (defaults to "無題の案件")
- Worker service is NOT deployed to Railway, so workflows will stay in "queued" status on production
- AI responses are currently mocked (hardcoded based on message count)
- All UI text is in Japanese
- The app uses Prisma 5.x (not 7.x - do not use `npx prisma` which may install latest)

## Merge & Deploy Procedure
1. Create PR targeting `master`
2. Merge PR via GitHub API (direct push to master is blocked)
3. Railway auto-deploys from `master` branch
4. Wait ~90 seconds for deployment
5. Verify at https://s-factory.up.railway.app/

## Devin Secrets Needed
- `RAILWAY_TOKEN` - Railway API token (workspace-scoped for tkgathr2's Projects)
