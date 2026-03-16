import { TOTAL_STEPS } from "@spec-engine/shared";

/** progressPercent = round((currentStepOrder / 20) * 100) */
export function calculateProgress(currentStepOrder: number): number {
  return Math.round((currentStepOrder / TOTAL_STEPS) * 100);
}
