import { SCORING } from "@spec-engine/shared";
import type { ScoreCategoryMap } from "@spec-engine/shared";

export interface ScoreResult {
  total: number;
  categories: ScoreCategoryMap;
  weakCategories: string[];
}

/**
 * Calculate weighted total score from 10 category scores.
 * Source of Truth: validation/scoring.yml + validation/spec_score_rules.md
 */
export function calculateScore(categories: ScoreCategoryMap): ScoreResult {
  let total = 0;
  const weakCategories: string[] = [];

  for (const cat of SCORING.categories) {
    const score = categories[cat.name as keyof ScoreCategoryMap] ?? 0;
    total += score * cat.weight;
    if (score < SCORING.minimumCategoryScore) {
      weakCategories.push(cat.name);
    }
  }

  return {
    total: Math.round(total),
    categories,
    weakCategories,
  };
}

/**
 * Check if score meets gating requirements.
 * Source of Truth: validation/scoring.yml gating section
 */
export function meetsGatingRequirements(
  scoreResult: ScoreResult,
  criticalConflictCount: number,
  hasAcceptanceCriteria: boolean,
): boolean {
  if (scoreResult.total < SCORING.targetScore) return false;
  if (criticalConflictCount > 0) return false;
  if (scoreResult.weakCategories.length > 0) return false;
  if (!hasAcceptanceCriteria) return false;
  return true;
}
