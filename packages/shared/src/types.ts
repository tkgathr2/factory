import type { ProjectStatus, RunReportPhase, WorkflowStepStatus } from "./statuses";
import type { ScoreCategoryName } from "./constants";

/** API request/response types matching api/openapi.yaml */

export interface CreateProjectRequest {
  title: string;
  rawRequirements: string;
  goal?: string | null;
  problem?: string | null;
  targetUsers?: string | null;
  requiredFeatures?: string[] | null;
  optionalFeatures?: string[] | null;
  commonFeatureIds?: string[] | null;
}

export interface CreateProjectResponse {
  id: string;
  projectCode: string;
  status: "draft";
  createdAt: string;
}

export interface ProjectListItem {
  id: string;
  projectCode: string;
  title: string;
  status: ProjectStatus;
  progressPercent: number;
  loopCount: number;
  lastHeartbeatAt: string | null;
}

export interface ListProjectsResponse {
  projects: ProjectListItem[];
}

export interface ProjectDetailResponse {
  project: {
    id: string;
    projectCode: string;
    title: string;
    status: ProjectStatus;
    progressPercent: number;
    currentStepKey: string | null;
    loopStatus: string | null;
    checkpointStepOrder: number | null;
    checkpointLoopIteration: number | null;
  };
}

export interface RunReportLatestStepStatus {
  stepOrder: number;
  stepKey: string;
  status: WorkflowStepStatus;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface RunReportProject {
  id: string;
  title: string;
  status: ProjectStatus;
  progressPercent: number;
  loopCount: number | null;
  latestStepStatus: RunReportLatestStepStatus | null;
  stopReason: string | null;
  loopStopReason: string | null;
}

export interface ScoreCategories {
  completeness: number;
  clarity: number;
  implementability: number;
  bug_risk: number;
  consistency: number;
  traceability: number;
  testability: number;
  extensibility: number;
  operational_safety: number;
  ai_output_quality: number;
}

export interface RunReportScores {
  total: number;
  categories: ScoreCategories;
}

export interface ConflictsSummary {
  critical: number;
  major: number;
  minor: number;
}

export interface ArtifactItem {
  artifactType: string;
  versionNo: number;
  storagePath: string;
  createdAt: string;
}

export interface RunReportResponse {
  project: RunReportProject;
  phase: RunReportPhase;
  availableFields: string[];
  scores: RunReportScores | null;
  conflictsSummary: ConflictsSummary;
  artifactsSummary: ArtifactItem[];
  readyForDevin: boolean;
  heartbeatAgeSec: number | null;
  totalRuntimeSec: number | null;
  scoreDelta: number | null;
  improvementRecommendations: string[];
}

export interface GetArtifactsResponse {
  artifacts: ArtifactItem[];
}

export interface WorkflowLogItem {
  message: string;
  source: string;
  logLevel: string;
  createdAt: string;
}

export interface GetLogsResponse {
  logs: WorkflowLogItem[];
  total: number;
  nextCursor: string | null;
}

export interface StartWorkflowResponse {
  projectId: string;
  status: string;
}

export interface StopResponse {
  status: string;
  loopStatus: string;
}

export interface ResumeResponse {
  status: string;
}

export interface LoopStatusResponse {
  loopCount: number;
  hardLimit: number;
  currentScore: number | null;
  lastScore: number | null;
  scoreDelta: number | null;
  loopStatus: string;
}

export interface ApproveDiagramRequest {
  approved: boolean;
  comment?: string | null;
}

export interface ApproveDiagramResponse {
  projectId: string;
  status: string;
  message: string;
}

export interface ErrorResponse {
  error: string;
  detail: string;
}

export interface CreateCommonFeatureRequest {
  featureKey: string;
  name: string;
  description?: string;
  defaultEnabled?: boolean;
  priority?: number;
}

export interface UpdateCommonFeatureRequest {
  description?: string;
  defaultEnabled?: boolean;
  priority?: number;
}

export interface CommonFeatureResponse {
  id: string;
  featureKey: string;
  name: string;
  description: string;
  defaultEnabled: boolean;
  priority: number;
}

export interface CommonFeatureListResponse {
  commonFeatures: CommonFeatureResponse[];
}

/** Internal types for scoring engine */
export type ScoreCategoryMap = Record<ScoreCategoryName, number>;
