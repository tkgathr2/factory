# Prompt Input Mapping

## requirements_generate
- rawPrompt <- ProjectInput.rawPrompt
- goal <- ProjectInput.goal
- problem <- ProjectInput.problem
- targetUsers <- ProjectInput.targetUsers
- requiredFeatures <- ProjectInput.requiredFeatures
- optionalFeatures <- ProjectInput.optionalFeatures

## requirements_polish
- requirementsDraft <- latest(requirements_draft or requirements_polish_*)

## requirements_audit
- requirementsDraft <- latest(requirements_final)
- previousFindings <- latest(requirements_audit_1.findings) for Step 07, otherwise []

## specification_generate
- requirementsFinal <- latest(requirements_final)
- enabledCommonFeatures <- latest(common_features_resolved)
- template <- templates/project_spec_template.md

## specification_polish (Step 09 / 10 polish)
- specificationDraft <- latest(specification_draft or specification_polish_*)

## specification_audit
- specificationDraft <- latest(specification_final)
- previousFindings <- latest(specification_audit_1.findings) for Step 12, otherwise []

## specification_improve (Step 17 feedback loop)
- specificationDraft <- latest(specification_with_ids)
- weakCategories <- string[] of category names where score < minimumCategoryScore
- findings <- specification_audit_final.findings JSON array, or [] if none

## ui_navigation_diagram_generate
- specificationWithIds <- latest(specification_with_ids)

## conflict_report
- specificationWithIds <- latest(specification_with_ids)
- rules <- validation/rules.yml

## spec_test_report
- specificationWithIds <- latest(specification_with_ids)
- specScoreReport <- latest(spec_score_report)
- testCases <- validation/spec_test_cases.md
