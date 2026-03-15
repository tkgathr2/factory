# Specification ID Reference

## Purpose
This document summarizes the specification ID system used across the Specification Engine package.

## Source of Truth
- `schemas/id.schema.json`
- `templates/project_spec_template.md`
- `docs/spec_graph_rules.md`

## ID format
Regular expression:

```text
^(REQ|UI|API|DB|TEST)-\d{3}$
```

## Allowed node types
- `REQ`
- `UI`
- `API`
- `DB`
- `TEST`

## Examples
- `REQ-001`
- `REQ-014`
- `UI-001`
- `API-001`
- `DB-001`
- `TEST-001`

## Meaning
- `REQ` = requirement item
- `UI` = UI / screen item
- `API` = API item
- `DB` = database item
- `TEST` = test item

## Traceability
The traceability graph uses these IDs to create edges such as:
- `REQ -> UI`
- `REQ -> API`
- `API -> DB`
- `REQ -> TEST`

## Validation expectation
IDs must conform to the schema exactly. Free-form IDs are not allowed.
