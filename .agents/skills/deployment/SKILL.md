# Factory (工場長) Deployment & Testing

## Railway Architecture
- **Web Service**: Next.js app on Railway (service ID: `4a4becf1-86d5-43a3-95b6-800944ae6d7a`)
  - Custom domain: `s-factory.up.railway.app`
  - Dockerfile: `Dockerfile.web`
  - Auto-deploys on `master` branch push
- **Worker Service**: Background job processor (service ID: `99fc8ed7-2ae6-4ac2-bc52-82a0ffa0f972`)
  - Dockerfile: `Dockerfile.worker`
  - Uses esbuild to bundle all dependencies into single CJS file
  - `AI_MODE=mock` for fast testing (~30s per workflow)
  - `SLACK_WEBHOOK_URL` not configured (notifications skipped gracefully)
- **Database**: PostgreSQL on Railway
- **Project ID**: `60eeb0fd-6dfc-4085-9262-d44923ce3b24`
- **Environment ID**: `17863ef2-412a-489c-a9a5-566561229cf4`

## Merge & Deploy Procedure
1. Create PR from feature branch to `master`
2. Merge PR via GitHub API: `curl -X PUT https://api.github.com/repos/tkgathr2/factory/pulls/{PR_NUMBER}/merge`
3. Railway auto-deploys both Web and Worker services on `master` push
4. Wait 2-3 minutes for deployment to complete
5. Verify with: `curl -s -o /dev/null -w "%{http_code}" https://s-factory.up.railway.app/api/projects`

## Key Architecture Notes
- **Worker and Web run on separate containers** — they do NOT share filesystem
- ZIP export generates on-demand from database artifacts (PR #16 fix)
- Worker polls DB every 1000ms for queued projects
- Web UI polls every 2000ms when active, 10000ms when idle
- All artifact content is stored in the database `Artifact` table (`content` column)

## Railway API Access
- Token name: `devin-worker` (scoped to tkgathr2's Projects workspace)
- Token stored as secret: `RAILWAY_TOKEN`
- GraphQL endpoint: `https://backboard.railway.app/graphql/v2`
- Check Worker logs: Use Railway GraphQL API to fetch deployment logs

## E2E Testing Flow
1. Navigate to `/projects/new`
2. Enter requirements in ラフ要件 field, click 案件を作成
3. Chat with AI (2-3 messages) to unlock 仕様書生成を開始 button
4. Click 仕様書生成を開始 → redirects to monitor page
5. Wait for steps 1-18 (~14s in mock mode)
6. Approve diagram when prompted (承認待ち status)
7. Wait for steps 19-20 to complete
8. Verify 完了 status, 20/20 steps, score displayed
9. Click ZIPダウンロード → verify ZIP contains 7 files:
   - requirements_final.md
   - specification_final.md
   - conflict_report.json
   - spec_score_report.json
   - spec_test_report.json
   - ui_navigation_diagram.mmd
   - ui_navigation_diagram.png
10. Verify 過去の案件一覧 button navigates to /projects

## Build & Typecheck
```bash
pnpm run -r typecheck  # Typecheck all packages
pnpm run -r build      # Build all packages
```

## Common Issues
- **Worker ESM errors**: Worker must output CommonJS (esbuild bundles to CJS)
- **Prisma client path**: In pnpm monorepo, Prisma generates to `.pnpm` store, not `node_modules/@prisma/client`
- **ZIP download fails**: If ZIP returns "ディスク上に見つかりません", the export-zip endpoint may be trying to read from Worker's filesystem instead of generating from DB
