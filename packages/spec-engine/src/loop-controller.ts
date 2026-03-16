import { LOOP_POLICY } from "@spec-engine/shared";

export type StopReason =
  | "manual_stop"
  | "hard_limit"
  | "quality_regression"
  | "critical_conflict_increase"
  | "total_timeout"
  | "target_achieved"
  | "soft_limit_reached";

export interface LoopEvaluationInput {
  manualStopRequested: boolean;
  loopCount: number;
  currentScore: number;
  lastScore: number | null;
  currentCriticalConflictCount: number;
  previousCriticalConflictCount: number;
  allCategoryScoresAboveMinimum: boolean;
  workflowRuntimeSec: number;
}

export interface LoopEvaluationResult {
  shouldContinue: boolean;
  stopReason: StopReason | null;
  /** If stopped, does workflow continue to Step 18 or halt entirely? */
  continueToStep18: boolean;
  /** New project status if stopping causes a status change */
  newProjectStatus: "blocked" | "failed" | null;
}

/**
 * Evaluate loop stop conditions per loop-control/loop_policy.yml
 * Evaluation order (checked BEFORE incrementing loopCount):
 * 1. manual_stop → blocked
 * 2. hard_limit → continue to Step 18
 * 3. quality_regression → blocked
 * 4. critical_conflict_increase → blocked
 * 5. total_timeout → failed
 * 6. target_achieved → continue to Step 18
 * 7. soft_limit_reached + delta <= 1 → continue to Step 18
 * 8. otherwise → continue loop
 */
export function evaluateLoop(input: LoopEvaluationInput): LoopEvaluationResult {
  // 1. manual_stop
  if (input.manualStopRequested) {
    return { shouldContinue: false, stopReason: "manual_stop", continueToStep18: false, newProjectStatus: "blocked" };
  }

  // 2. hard_limit
  if (input.loopCount >= LOOP_POLICY.hardLimit) {
    return { shouldContinue: false, stopReason: "hard_limit", continueToStep18: true, newProjectStatus: null };
  }

  // 3. quality_regression
  if (input.lastScore !== null && input.currentScore < input.lastScore) {
    return { shouldContinue: false, stopReason: "quality_regression", continueToStep18: false, newProjectStatus: "blocked" };
  }

  // 4. critical_conflict_increase
  if (input.currentCriticalConflictCount > input.previousCriticalConflictCount) {
    return { shouldContinue: false, stopReason: "critical_conflict_increase", continueToStep18: false, newProjectStatus: "blocked" };
  }

  // 5. total_timeout
  if (input.workflowRuntimeSec >= LOOP_POLICY.totalTimeoutSec) {
    return { shouldContinue: false, stopReason: "total_timeout", continueToStep18: false, newProjectStatus: "failed" };
  }

  // 6. target_achieved
  if (
    input.currentScore >= LOOP_POLICY.targetScore &&
    input.currentCriticalConflictCount === 0 &&
    input.allCategoryScoresAboveMinimum
  ) {
    return { shouldContinue: false, stopReason: "target_achieved", continueToStep18: true, newProjectStatus: null };
  }

  // 7. soft_limit_reached
  if (input.loopCount >= LOOP_POLICY.softLimit) {
    const delta = input.lastScore !== null ? input.currentScore - input.lastScore : 999;
    if (delta <= 1) {
      return { shouldContinue: false, stopReason: "soft_limit_reached", continueToStep18: true, newProjectStatus: null };
    }
  }

  // 8. continue
  return { shouldContinue: true, stopReason: null, continueToStep18: false, newProjectStatus: null };
}
