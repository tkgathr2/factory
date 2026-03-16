import type {
  RunReportPhase,
  ProjectStatus,
} from "@spec-engine/shared";

/**
 * Determine RunReportPhase from project state.
 * Source of Truth: packages-shared/statuses.md
 */
export function determinePhase(
  projectStatus: ProjectStatus,
  hasScoreOutput: boolean,
): RunReportPhase {
  if (projectStatus === "failed") return "failed";
  if (projectStatus === "blocked") return "blocked";
  if (projectStatus === "awaiting_approval") return "awaiting_approval";
  if (projectStatus === "completed" || projectStatus === "ready_for_devin") return "completed";
  if (hasScoreOutput) return "scoring_available";
  return "pre_score";
}

/**
 * Determine available fields based on phase.
 */
export function determineAvailableFields(phase: RunReportPhase): string[] {
  const base = ["project", "phase", "conflictsSummary", "artifactsSummary", "heartbeatAgeSec", "totalRuntimeSec"];
  if (phase === "pre_score") return base;
  if (phase === "scoring_available") return [...base, "scores", "scoreDelta", "readyForDevin"];
  if (phase === "awaiting_approval") return [...base, "scores", "scoreDelta", "readyForDevin"];
  // completed, blocked, failed all include full fields
  return [...base, "scores", "scoreDelta", "readyForDevin", "improvementRecommendations"];
}
