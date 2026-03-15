# Markdown Structure Contract

## Required heading format
各章は必ず `## {n}. {Title}` 形式で開始する。

例:
- `## 1. Purpose`
- `## 8. API Specification`

## Section order
- 1 から 27 まで
- 順番入れ替え禁止
- 欠番禁止
- 同一番号の重複禁止

## ID format
- REQ-NNN
- UI-NNN
- API-NNN
- DB-NNN
- TEST-NNN

## Links rule
Traceability を高めるため、Links を使ってもよい。
例:
- `Links: REQ-001, API-001`
- `Links: UI-002, DB-003, TEST-001`

## Recommended table-heavy sections
- 8 API Specification
- 9 Database Schema
- 13 Decision Tables
- 14 Error Handling
- 19 Test Scenarios
- 20 Acceptance Criteria
