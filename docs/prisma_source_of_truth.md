# Prisma Source of Truth

## 方針
- 人間向け説明の SoT: `data-model/database_schema.md`
- 実装向け SoT: `prisma/schema.prisma`

Devin 実装時は、最終的に `prisma/schema.prisma` を基準として migration を作成する。

## 運用ルール
1. `data-model/database_schema.md` で設計意図を説明する
2. `prisma/schema.prisma` に実装可能な最終形を置く
3. 両者に差分が出た場合は、`schema.prisma` を優先し、説明文を追従修正する

## 目的
- 実装者が「このまま migrate できるか」を判断しやすくする
- 監査AIが「説明用骨格」と「実装用完成形」を区別できるようにする
