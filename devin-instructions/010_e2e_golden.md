# Phase 10 E2E and Golden Tests

## Goal
Validate the full workflow from intake to devin_gate using fixed examples and golden expectations.

## Target files
- validation/spec_test_cases.md
- examples/sample_01_minimum_input.md
- examples/sample_02_normal_case.md
- examples/sample_03_conflict_case.md
- schemas/run_report.schema.json
- schemas/spec_score_report.schema.json

## Test scope
- Minimum input case completes without system failure
- Normal case produces required artifacts and reaches gate evaluation
- Conflict case produces conflict_report and reduced scores
- run-report response matches schema and contains monitor-critical fields
- export bundle contains all required final artifacts

## Completion
- E2E tests run intake → devin_gate for all sample cases
- Golden outputs are defined for required artifact existence, stop reason behavior, and readyForDevin evaluation
- Failing validations are reproducible from fixtures
- No manual interpretation is required to determine pass or fail
