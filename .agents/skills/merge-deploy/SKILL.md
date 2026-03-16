# Factory (工場長) マージ・デプロイ手順

## 概要
factory リポジトリ（要件定義・仕様書生成システム【工場長】）のPRマージからRailwayデプロイまでの手順。

## 前提
- リポジトリ: `tkgathr2/factory`
- デフォルトブランチ: `master`
- デプロイ先: Railway (https://s-factory.up.railway.app/)
- デプロイトリガー: `master` ブランチへのpushで自動デプロイ
- Railway Token: `RAILWAY_TOKEN` シークレットを使用
- Railway Web Service ID: `4a4becf1-86d5-43a3-95b6-800944ae6d7a`
- Railway Environment ID: `17863ef2-412a-489c-a9a5-566561229cf4`
- Railway Deployment Trigger ID: `8876d5cd-0f90-445f-b524-06217abc330b`

## ブランチ命名規則
`devin/<timestamp>-<feature-name>` (例: `devin/1773612696-implement-spec-engine`)

## 手順

### 1. 開発ブランチで作業
```bash
git checkout -b devin/$(date +%s)-<feature-name>
# コード変更
git add <files>
git commit -m "feat: <変更内容の日本語説明>"
git push origin <branch-name>
```

### 2. PR作成
- `git_create_pr` ツールで PR を作成（base: master）
- PRタイトル・説明は日本語で記述

### 3. PRマージ
- GitHub API経由でマージ:
```bash
curl -s -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/tkgathr2/factory/pulls/<PR_NUMBER>/merge" \
  -d '{"merge_method": "merge", "commit_title": "feat: <変更内容>"}'
```

### 4. デプロイ確認
- master へのマージで Railway が自動デプロイを開始
- デプロイ状況確認:
```bash
curl -s -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST https://backboard.railway.com/graphql/v2 \
  -d '{"query": "query { deployments(first: 1, input: { serviceId: \"4a4becf1-86d5-43a3-95b6-800944ae6d7a\" }) { edges { node { id status createdAt } } } }"}'
```
- status が `SUCCESS` になるまで待機

### 5. ライブ確認
- https://s-factory.up.railway.app/ にアクセスして変更が反映されていることを確認

## 注意事項
- master に直接 push しない（必ずPR経由）
- force push 禁止
- コミットメッセージは日本語で記述
- Worker サービスは別途デプロイが必要（現在未デプロイ）
- このシステムはスタンドアローン（ノウハウキングとは連動しない）
