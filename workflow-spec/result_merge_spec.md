# Result Merge Specification

Purpose:
Materialize the latest conflict, score, and test outputs into sections 25, 26, and 27 of the exported specification bundle.

Policy:
- The canonical executable results remain artifact-first: conflict_report, spec_score_report, spec_test_report.
- export_spec may render summary excerpts of those artifacts into sections 25-27 of the final export bundle.
- specification generation steps do not invent final values for sections 25-27 before steps 14-16 complete.
