# Spec Score Rules

All category scores are integers in the range 0..100.
All formulas below use metrics defined in `validation/derived_metrics_spec.md`.

Category formulas:

## completeness
`completeness = ratio_to_percent_round(present_sections / 27)`

## clarity
`clarity = clamp_0_100(100 - ambiguity_penalty)`

## implementability
`implementability = clamp_0_100((api_ids_present * 35) + (db_ids_present * 35) + (ui_to_api_link_exists * 30))`

## bug_risk
`bug_risk = clamp_0_100(100 - (critical_conflict_count * 30) - (major_conflict_count * 10) - (missing_error_entries * 10))`

## consistency
`consistency = clamp_0_100(100 - (contradiction_count * 20))`

## traceability
`traceability = ratio_to_percent_round(req_ids_with_test_link_count / max(req_count, 1))`

## testability
`testability = ratio_to_percent_round((tests_present + acceptance_present + req_to_test_links_present) / 3)`

## extensibility
`extensibility = clamp_0_100((implementation_guide_present * 34) + (out_of_scope_present * 33) + (module_boundary_defined * 33))`

## operational_safety
`operational_safety = clamp_0_100((log_policy_present * 25) + (audit_reference_present * 25) + (stop_controls_present * 25) + (heartbeat_defined * 25))`

## ai_output_quality
`ai_output_quality = ratio_to_percent_round((template_order_ok + markdown_ok + ids_ok) / 3)`

Weighted total:
- completeness 0.10
- clarity 0.10
- implementability 0.10
- bug_risk 0.15
- consistency 0.10
- traceability 0.10
- testability 0.10
- extensibility 0.10
- operational_safety 0.10
- ai_output_quality 0.05

Formula:
`weighted_total = completeness*0.10 + clarity*0.10 + implementability*0.10 + bug_risk*0.15 + consistency*0.10 + traceability*0.10 + testability*0.10 + extensibility*0.10 + operational_safety*0.10 + ai_output_quality*0.05`

Rounding:
- `totalScore = round(weighted_total)` to nearest integer, halves away from zero

Weak category derivation:
- `weakCategories = categories where categoryScore < minimumCategoryScore`

Loop delta:
- `scoreDelta = currentTotalScore - previousTotalScore`

Implementation notes:
- Category scores must be persisted exactly as integers.
- `totalScore` must be persisted exactly as the rounded integer above.
- Do not re-interpret undefined variables; every symbol in this file must resolve to a metric defined in `validation/derived_metrics_spec.md`.
