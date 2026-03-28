# Testing Specification Engine v35

## Devin Secrets Needed
- `SPEC_ENGINE_DB_PASSWORD` - PostgreSQL password for spec_engine database

## Local Environment Setup

### Prerequisites
- Node.js v22+
- pnpm 9+
- PostgreSQL running locally

### Database Setup
```bash
# Create database and user (use the password from SPEC_ENGINE_DB_PASSWORD secret)
sudo -u postgres psql -c "CREATE USER ubuntu WITH PASSWORD '<SPEC_ENGINE_DB_PASSWORD>';"
sudo -u postgres psql -c "CREATE DATABASE spec_engine_test OWNER ubuntu;"
```

### Environment Variables
```bash
export DATABASE_URL="postgresql://ubuntu:<SPEC_ENGINE_DB_PASSWORD>@localhost:5432/spec_engine_test"
export AI_MODE="mock"  # Use mock AI for development/testing
```

### Install & Migrate
```bash
pnpm install
cd apps/web && npx prisma migrate dev && npx prisma db seed
```

### Start Dev Servers
Run in separate terminals:
```bash
# Terminal 1: Web (Next.js)
export DATABASE_URL="postgresql://ubuntu:<SPEC_ENGINE_DB_PASSWORD>@localhost:5432/spec_engine_test" && export AI_MODE="mock" && cd apps/web && npx next dev --port 3000

# Terminal 2: Worker
export DATABASE_URL="postgresql://ubuntu:<SPEC_ENGINE_DB_PASSWORD>@localhost:5432/spec_engine_test" && export AI_MODE="mock" && cd apps/worker && npx tsx src/index.ts
```

## Testing Procedures

### E2E Workflow Test
1. Open http://localhost:3000
2. Create a new project at `/projects/new`
3. Fill in title and raw requirements, click "案件を作成"
4. On project detail page, click "ワークフロー開始"
5. Watch 20 steps execute (takes ~30 seconds in mock mode)
6. At Step 18, the workflow pauses with `awaiting_approval` status
7. Click "図を承認" to approve, or "図を却下" to reject
8. After approval, Steps 19-20 complete and "ZIPダウンロード" becomes available

### Mobile Responsive Testing
1. Use browser's device toolbar or `set_mobile` action to simulate 375px width
2. Verify on all 4 pages:
   - `/` (home): Buttons visible, no horizontal overflow
   - `/projects` (list): Table scrolls horizontally via `table-wrapper` div
   - `/projects/new` (form): All fields fit within viewport, submit button full-width
   - `/projects/[id]` (detail): Dashboard grid stacks to 1 column (not 2-column side-by-side)
3. Key CSS: `globals.css` uses `!important` on class selectors to override inline styles at 768px and 480px breakpoints

### Favicon / Icon Testing
1. Navigate to `/favicon.svg` — should show blue rounded rect with document+checkmark+SE
2. Navigate to `/apple-touch-icon.png` — should show 180x180 PNG icon
3. Navigate to `/site.webmanifest` — should show JSON with `"name": "仕様書エンジン v35"`
4. Check HTML `<head>` for: `<link rel="icon">`, `<link rel="apple-touch-icon">`, `<link rel="manifest">`, `<meta name="theme-color">`

## Known Issues & Workarounds

- **themeColor warning**: In Next.js 14, `themeColor` must be in the `viewport` export, NOT in `metadata`. If you see "Unsupported metadata themeColor" warning, move it to `viewport`.
- **ImageMagick SVG conversion**: `rsvg-convert` may not be available. Use `npx sharp-cli` instead to convert SVG to PNG icons.
- **Seed data upsert**: When re-seeding, use `update: { name, description }` not `update: {}` — the empty object is a no-op and won't update existing records.
- **Resume after rejection**: The executor uses `upsert` for workflow steps to avoid unique constraint violations when re-running a step after resume.
- **Mock AI score**: Mock mode always produces score ~91, which never reaches the 94 target. `readyForDevin` will always be `false` in mock mode.
- **Inline styles vs responsive CSS**: All pages use React inline styles. Responsive overrides in `globals.css` require `!important` because inline styles have higher specificity than class selectors.

## Architecture Notes
- Monorepo: `apps/web` (Next.js), `apps/worker` (Node.js), `packages/shared`, `packages/spec-engine`
- All user-facing strings are hardcoded in Japanese (no i18n framework)
- No CI configured — verify with `tsc --noEmit` locally in each workspace
- No automated tests — all verification is manual E2E
