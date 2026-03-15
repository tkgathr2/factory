# ID Assignment Policy

Authoritative ID assignment happens only at Step 13 `specification_id_assign`.

Rules:
- specification_generate must not assign authoritative REQ/UI/API/DB/TEST IDs
- specification_polish must not assign authoritative IDs
- specification_improve at Step 17 must preserve existing IDs from specification_with_ids exactly
- downstream graph, conflict, score, and test steps use specification_with_ids as the source

## Loop re-execution strategy
When Step 13 re-runs in a subsequent loopIteration:
- Use upsert for SpecificationNode with where = (projectId, nodeCode)
- Update mutable fields only: nodeType, title, content
- Use upsert for SpecificationEdge with where = (projectId, fromNodeId, toNodeId, relationType)
- Do NOT delete and re-insert existing graph rows
- Existing row IDs must remain stable for downstream foreign-key references and deterministic traceability


## Graph table scope
- `SpecificationNode` and `SpecificationEdge` are project-scoped current-state tables.
- Step 13 updates the active graph snapshot for the project by UPSERT.
- Validation, scoring, and test steps consume the current graph state after the latest successful Step 13.
- Historical comparisons across loops must use versioned artifacts (`conflict_report`, `spec_score_report`) rather than expecting per-loop graph snapshots in these tables.
