-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('draft', 'queued', 'running', 'awaiting_approval', 'blocked', 'completed', 'ready_for_devin', 'failed');

-- CreateEnum
CREATE TYPE "WorkflowRunStatus" AS ENUM ('queued', 'running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "WorkflowStepStatus" AS ENUM ('pending', 'running', 'success', 'warning', 'failed', 'skipped');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "projectCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL,
    "currentStepKey" TEXT,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "lastHeartbeatAt" TIMESTAMP(3),
    "stopReason" TEXT,
    "loopCount" INTEGER NOT NULL DEFAULT 0,
    "loopStatus" TEXT,
    "loopStopReason" TEXT,
    "manualStopRequested" BOOLEAN NOT NULL DEFAULT false,
    "lastScore" INTEGER,
    "currentScore" INTEGER,
    "scoreDelta" INTEGER,
    "checkpointStepOrder" INTEGER,
    "checkpointLoopIteration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectInput" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "goal" TEXT NOT NULL DEFAULT '',
    "problem" TEXT NOT NULL DEFAULT '',
    "targetUsers" TEXT NOT NULL DEFAULT '',
    "requiredFeatures" JSONB NOT NULL DEFAULT '[]',
    "optionalFeatures" JSONB NOT NULL DEFAULT '[]',
    "rawPrompt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowRun" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "WorkflowRunStatus" NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "workflowRunId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "loopIteration" INTEGER NOT NULL DEFAULT 0,
    "stepKey" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "assignedAi" TEXT,
    "status" "WorkflowStepStatus" NOT NULL,
    "summary" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "workflowRunId" TEXT NOT NULL,
    "stepId" TEXT,
    "logLevel" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommonFeature" (
    "id" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "defaultEnabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "CommonFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCommonFeature" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "commonFeatureId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "excludeReason" TEXT,

    CONSTRAINT "ProjectCommonFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artifact" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "artifactType" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Artifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecificationNode" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "nodeCode" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "SpecificationNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecificationEdge" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,

    CONSTRAINT "SpecificationEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecificationConflict" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "workflowRunId" TEXT NOT NULL,
    "loopIteration" INTEGER NOT NULL DEFAULT 0,
    "conflictCode" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecificationConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectOutput" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "readyForDevin" BOOLEAN NOT NULL DEFAULT false,
    "specScore" INTEGER,
    "specScoreBreakdown" JSONB,
    "conflictsSummary" JSONB,
    "improvementRecommendations" JSONB,

    CONSTRAINT "ProjectOutput_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectCode_key" ON "Project"("projectCode");

-- CreateIndex
CREATE INDEX "Project_status_updatedAt_idx" ON "Project"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "ProjectInput_projectId_createdAt_idx" ON "ProjectInput"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowRun_projectId_createdAt_idx" ON "WorkflowRun"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowStep_workflowRunId_status_idx" ON "WorkflowStep"("workflowRunId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStep_workflowRunId_stepOrder_loopIteration_key" ON "WorkflowStep"("workflowRunId", "stepOrder", "loopIteration");

-- CreateIndex
CREATE INDEX "WorkflowLog_projectId_createdAt_idx" ON "WorkflowLog"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowLog_workflowRunId_createdAt_idx" ON "WorkflowLog"("workflowRunId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommonFeature_featureKey_key" ON "CommonFeature"("featureKey");

-- CreateIndex
CREATE INDEX "ProjectCommonFeature_projectId_idx" ON "ProjectCommonFeature"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCommonFeature_projectId_commonFeatureId_key" ON "ProjectCommonFeature"("projectId", "commonFeatureId");

-- CreateIndex
CREATE INDEX "Artifact_projectId_artifactType_versionNo_idx" ON "Artifact"("projectId", "artifactType", "versionNo");

-- CreateIndex
CREATE UNIQUE INDEX "Artifact_projectId_artifactType_versionNo_key" ON "Artifact"("projectId", "artifactType", "versionNo");

-- CreateIndex
CREATE INDEX "SpecificationNode_projectId_nodeType_idx" ON "SpecificationNode"("projectId", "nodeType");

-- CreateIndex
CREATE UNIQUE INDEX "SpecificationNode_projectId_nodeCode_key" ON "SpecificationNode"("projectId", "nodeCode");

-- CreateIndex
CREATE INDEX "SpecificationEdge_projectId_fromNodeId_toNodeId_idx" ON "SpecificationEdge"("projectId", "fromNodeId", "toNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "SpecificationEdge_projectId_fromNodeId_toNodeId_relationTyp_key" ON "SpecificationEdge"("projectId", "fromNodeId", "toNodeId", "relationType");

-- CreateIndex
CREATE INDEX "SpecificationConflict_projectId_workflowRunId_loopIteration_idx" ON "SpecificationConflict"("projectId", "workflowRunId", "loopIteration", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "SpecificationConflict_projectId_workflowRunId_loopIteration_key" ON "SpecificationConflict"("projectId", "workflowRunId", "loopIteration", "conflictCode", "description");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectOutput_projectId_key" ON "ProjectOutput"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectInput" ADD CONSTRAINT "ProjectInput_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowLog" ADD CONSTRAINT "WorkflowLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowLog" ADD CONSTRAINT "WorkflowLog_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowLog" ADD CONSTRAINT "WorkflowLog_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCommonFeature" ADD CONSTRAINT "ProjectCommonFeature_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCommonFeature" ADD CONSTRAINT "ProjectCommonFeature_commonFeatureId_fkey" FOREIGN KEY ("commonFeatureId") REFERENCES "CommonFeature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecificationNode" ADD CONSTRAINT "SpecificationNode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecificationEdge" ADD CONSTRAINT "SpecificationEdge_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecificationEdge" ADD CONSTRAINT "SpecificationEdge_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "SpecificationNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecificationEdge" ADD CONSTRAINT "SpecificationEdge_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "SpecificationNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecificationConflict" ADD CONSTRAINT "SpecificationConflict_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecificationConflict" ADD CONSTRAINT "SpecificationConflict_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectOutput" ADD CONSTRAINT "ProjectOutput_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
