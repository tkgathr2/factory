import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { determinePhase, determineAvailableFields } from "@spec-engine/engine";
import type { RunReportResponse, ScoreCategories } from "@spec-engine/shared";

/** GET /api/projects/{id}/run-report */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        output: true,
        artifacts: {
          orderBy: { versionNo: "desc" },
        },
        conflicts: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "not_found", detail: "Project not found" },
        { status: 404 },
      );
    }

    // Find latest step
    const latestRun = await prisma.workflowRun.findFirst({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
    });

    let latestStepStatus = null;
    if (latestRun) {
      const latestStep = await prisma.workflowStep.findFirst({
        where: { workflowRunId: latestRun.id },
        orderBy: [{ stepOrder: "desc" }, { loopIteration: "desc" }],
      });
      if (latestStep) {
        latestStepStatus = {
          stepOrder: latestStep.stepOrder,
          stepKey: latestStep.stepKey,
          status: latestStep.status,
          startedAt: latestStep.startedAt?.toISOString() ?? null,
          finishedAt: latestStep.finishedAt?.toISOString() ?? null,
        };
      }
    }

    // Check if score exists
    const scoreArtifact = project.artifacts.find((a) => a.artifactType === "spec_score_report");
    const hasScore = !!scoreArtifact;

    const phase = determinePhase(project.status, hasScore);
    const availableFields = determineAvailableFields(phase);

    // Parse score data
    let scores = null;
    if (hasScore && scoreArtifact?.content) {
      try {
        const parsed = JSON.parse(scoreArtifact.content);
        scores = {
          total: parsed.total ?? 0,
          categories: parsed.categories as ScoreCategories,
        };
      } catch {
        // Score parse error - leave null
      }
    }

    // Conflict summary
    const latestConflicts = latestRun
      ? project.conflicts.filter((c) => c.workflowRunId === latestRun.id)
      : [];
    const conflictsSummary = {
      critical: latestConflicts.filter((c) => c.severity === "critical").length,
      major: latestConflicts.filter((c) => c.severity === "major").length,
      minor: latestConflicts.filter((c) => c.severity === "minor").length,
    };

    // Artifacts summary (latest per type)
    const artifactMap = new Map<string, typeof project.artifacts[0]>();
    for (const a of project.artifacts) {
      if (!artifactMap.has(a.artifactType) || a.versionNo > artifactMap.get(a.artifactType)!.versionNo) {
        artifactMap.set(a.artifactType, a);
      }
    }
    const artifactsSummary = Array.from(artifactMap.values()).map((a) => ({
      artifactType: a.artifactType,
      versionNo: a.versionNo,
      storagePath: a.storagePath,
      createdAt: a.createdAt.toISOString(),
    }));

    // Heartbeat age
    const heartbeatAgeSec = project.lastHeartbeatAt
      ? Math.round((Date.now() - project.lastHeartbeatAt.getTime()) / 1000)
      : null;

    // Total runtime
    let totalRuntimeSec = null;
    if (latestRun?.startedAt) {
      const endTime = latestRun.endedAt ?? new Date();
      totalRuntimeSec = Math.round((endTime.getTime() - latestRun.startedAt.getTime()) / 1000);
    }

    const response: RunReportResponse = {
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        progressPercent: project.progressPercent,
        loopCount: project.loopCount,
        latestStepStatus,
        stopReason: project.stopReason,
        loopStopReason: project.loopStopReason,
      },
      phase,
      availableFields,
      scores,
      conflictsSummary,
      artifactsSummary,
      readyForDevin: project.output?.readyForDevin ?? false,
      heartbeatAgeSec,
      totalRuntimeSec,
      scoreDelta: project.scoreDelta,
      improvementRecommendations: (project.output?.improvementRecommendations as string[]) ?? [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/projects/[id]/run-report error:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
