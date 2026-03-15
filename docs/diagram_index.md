# Diagram Index

This package now includes concrete diagram artifacts in addition to the generation rules.

## Included diagram files
- `diagrams/ui_navigation_diagram.mmd`
- `diagrams/ui_navigation_diagram.png`
- `diagrams/spec_graph_overview.mmd`
- `diagrams/spec_graph_overview.png`
- `diagrams/database_er_overview.mmd`
- `diagrams/database_er_overview.png`

## Notes
- These files are reference diagrams for implementers.
- The implementation Source of Truth remains:
  - `prisma/schema.prisma`
  - `api/openapi.yaml`
  - `schemas/*.json`
  - `workflow-spec/workflow_steps_detailed.md`
  - `validation/*`
- If any diagram conflicts with the SoT, the SoT wins.
