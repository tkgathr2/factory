# System Spec

## Goal
ラフ要件から、Devin が推測せず実装できる検証済み仕様書を生成する。

## Input Model Policy
API は ProjectDraftInput を受け取る。

最小入力:
- title
- rawRequirements

任意入力:
- goal
- problem
- targetUsers
- requiredFeatures[]
- optionalFeatures[]
- commonFeatureIds[]

DB の ProjectInput には以下を保存する。
- goal
- problem
- targetUsers
- requiredFeatures
- optionalFeatures
- rawPrompt

正規化ルール:
- 未指定 string は ""
- 未指定 array は []
- rawRequirements → rawPrompt

projectCode policy:
- server-generated only
- format: PRJ-YYYYMMDD-XXXX
- XXXX is a daily sequence or equivalent collision-safe suffix
- clients never submit projectCode

Prompt-chain policy:
- Step 03 must receive rawPrompt, goal, problem, targetUsers, requiredFeatures, optionalFeatures
- Step 08 must receive requirementsFinal and resolved enabled common features
- commonFeatureIds are resolved in Step 02 and passed downstream as names/descriptions, not as raw IDs

## Monitoring Policy
監視画面は `/api/projects/{id}/run-report` を一次 API とする。
ここで以下を一括取得する。
- project summary
- latest step status
- total score when available
- 10 category scores when available
- conflicts summary
- artifacts summary
- readyForDevin
- heartbeatAgeSec
- totalRuntimeSec
- loop status
- improvement recommendations
