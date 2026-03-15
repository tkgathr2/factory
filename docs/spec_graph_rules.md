# Spec Graph Rules

Nodes:
- REQ
- UI
- API
- DB
- TEST

Primary source:
- Links columns / Links lines are authoritative for traceability when present

Fallback source:
- exact ID references in section text

Edge generation:
1. REQ → UI if Links contains UI-NNN
2. REQ → API if Links contains API-NNN
3. API → DB if Links contains DB-NNN
4. REQ → TEST if Links contains TEST-NNN

Visualization:
- MVP displays JSON summary of nodes and edges on monitor page
- Full graph renderer is out-of-scope for MVP


## Persistence scope
- `SpecificationNode` and `SpecificationEdge` are project-scoped current-state tables.
- Step 13 updates the active graph snapshot for the project with UPSERT.
- Historical comparisons between loop iterations must rely on versioned artifacts, not on retaining multiple graph snapshots in these tables.
