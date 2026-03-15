# Spec Test Cases

## 1. Flow Test
Input:
- minimum valid project input
Expected:
- requirements_final exists
- specification_final exists
- devin_gate_result exists

## 2. Rule Test
Input:
- spec missing API IDs
Expected:
- api_missing_definition conflict raised

## 3. Conflict Simulation
Input:
- section 21 and 22 with overlapping scope terms
Expected:
- scope_conflict major issue raised

## 4. Acceptance Coverage
Input:
- spec without Acceptance Criteria content
Expected:
- acceptance_missing critical issue raised

## 5. UI Navigation Coverage
Input:
- valid UI section
Expected:
- ui_navigation_diagram_png generated
- if UI-NNN count == 0 then warning allowed instead of hard failure

## 6. Golden Sample Validation
Input:
- examples/sample_01_minimum_input.md
- examples/sample_02_normal_case.md
- examples/sample_03_conflict_case.md
Expected:
- outputs match expected notes in examples
- spec_score_report matches schemas/spec_score_report.schema.json
