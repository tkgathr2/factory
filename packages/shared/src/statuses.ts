/** Source of Truth: packages-shared/statuses.md */

export const ProjectStatuses = [
  "draft",
  "queued",
  "running",
  "awaiting_approval",
  "blocked",
  "completed",
  "ready_for_devin",
  "failed",
] as const;
export type ProjectStatus = (typeof ProjectStatuses)[number];

export const WorkflowRunStatuses = [
  "queued",
  "running",
  "completed",
  "failed",
] as const;
export type WorkflowRunStatus = (typeof WorkflowRunStatuses)[number];

export const WorkflowStepStatuses = [
  "pending",
  "running",
  "success",
  "warning",
  "failed",
  "skipped",
] as const;
export type WorkflowStepStatus = (typeof WorkflowStepStatuses)[number];

export const RunReportPhases = [
  "pre_score",
  "scoring_available",
  "awaiting_approval",
  "completed",
  "blocked",
  "failed",
] as const;
export type RunReportPhase = (typeof RunReportPhases)[number];

export const LoopStopReasons = [
  "manual_stop",
  "hard_limit",
  "quality_regression",
  "critical_conflict_increase",
  "total_timeout",
  "target_achieved",
  "soft_limit_reached",
  "diagram_rejected",
] as const;
export type LoopStopReason = (typeof LoopStopReasons)[number];
