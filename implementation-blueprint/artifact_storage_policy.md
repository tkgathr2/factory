# Artifact Storage Policy

versionNo policy:
- first artifact for (projectId, artifactType) starts at 1
- next version = previous max(versionNo) + 1
- latest artifact = highest versionNo for projectId + artifactType

Required artifacts are stage-specific and authoritative in `validation/required_artifacts.yml`.

required_before_export:
- requirements_final
- specification_final
- conflict_report
- spec_score_report
- spec_test_report
- ui_navigation_diagram_png

required_for_gate:
- requirements_final
- specification_final
- conflict_report
- spec_score_report
- spec_test_report
- ui_navigation_diagram_png
- export_bundle

Important:
- `devin_gate_result` is produced by Step 20 and is never a prerequisite of Step 19 or Step 20.
