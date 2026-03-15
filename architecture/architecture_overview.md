# Architecture Overview

Frontend
- Next.js / Vercel
- 案件作成、監視、停止、再開、成果物閲覧

API Orchestrator
- Railway service
- 案件作成、run-report 提供、開始、停止、再開、成果物提供

Worker
- Railway worker
- 仕様生成、監査、評価、図面生成、ゲート判定

Database
- Neon Postgres / Prisma

Trust Boundary
- UI入力・AI出力・外部応答は untrusted
- DB保存前に schema 検証
