/** Source of Truth: validation/scoring.yml + loop-control/loop_policy.yml */

export const SCORING = {
  targetScore: 94,
  minimumCategoryScore: 80,
  categories: [
    { name: "completeness", weight: 0.1 },
    { name: "clarity", weight: 0.1 },
    { name: "implementability", weight: 0.1 },
    { name: "bug_risk", weight: 0.15 },
    { name: "consistency", weight: 0.1 },
    { name: "traceability", weight: 0.1 },
    { name: "testability", weight: 0.1 },
    { name: "extensibility", weight: 0.1 },
    { name: "operational_safety", weight: 0.1 },
    { name: "ai_output_quality", weight: 0.05 },
  ],
} as const;

export const SCORE_CATEGORY_NAMES = SCORING.categories.map((c) => c.name);
export type ScoreCategoryName = (typeof SCORE_CATEGORY_NAMES)[number];

export const LOOP_POLICY = {
  targetScore: 94,
  softLimit: 3,
  hardLimit: 7,
  minimumCategoryScore: 80,
  minimumImprovementDelta: 2,
  totalTimeoutSec: 7200,
} as const;

export const TOTAL_STEPS = 20;

export const REQUIRED_BEFORE_EXPORT = [
  "requirements_final",
  "specification_final",
  "conflict_report",
  "spec_score_report",
  "spec_test_report",
  "ui_navigation_diagram_png",
] as const;

export const REQUIRED_FOR_GATE = [
  ...REQUIRED_BEFORE_EXPORT,
  "export_bundle",
] as const;
