# Validation DSL Specification

Section numbers are 1-based and refer to the markdown contract headings.
Do not convert them to zero-based indexes when implementing the parser.

## section_nonempty
implementation:
- locate the target section by 1-based sectionIndex
- trim whitespace
- fail if section body is empty

## section_id_min_count
implementation:
- locate the target section by 1-based sectionIndex
- count identifiers matching ^{idPrefix}-\d{3}$
- pass if count >= minCount

## section_pattern_min_count
implementation:
- if sectionIndex is provided (single) -> regex match count in that section, must be >= minCount
- if sectionIndexes is provided (array) -> count how many sections match regex >= 1 time, result must be >= minMatchingSections
- if patternSource=common_features_enabled -> build alternation regex from enabled common feature names after normalization

## required_artifacts_present
implementation:
- verify that all listed artifactTypes exist as latest successful artifacts for the project
- this check is used only at Step 20 final gate, not at Step 14 or Step 17

## overlapping_feature_tokens
implementation:
- normalize both sections with NFKC, lowercase ASCII, collapse whitespace, and strip punctuation except hyphen and slash
- split on line breaks first, then on whitespace
- compute exact overlap on normalized tokens/phrases only
- do not use language-dependent morphological analysis; implementation must be deterministic across Japanese and English text


Conflict title generation rule:
- title = humanized(conflictCode) when a human-readable title is needed for UI or reports
- Example: `api_missing_definition` -> `API Missing Definition`
- conflict_report.schema.json does not require `title`; generators may omit it and consumers may derive it from `conflictCode` deterministically
