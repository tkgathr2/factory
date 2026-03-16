import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ProjectDetailResponse } from "@spec-engine/shared";

/** GET /api/projects/{id} — Get project detail */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json(
        { error: "not_found", detail: "Project not found" },
        { status: 404 },
      );
    }

    const response: ProjectDetailResponse = {
      project: {
        id: project.id,
        projectCode: project.projectCode,
        title: project.title,
        status: project.status,
        progressPercent: project.progressPercent,
        currentStepKey: project.currentStepKey,
        loopStatus: project.loopStatus,
        checkpointStepOrder: project.checkpointStepOrder,
        checkpointLoopIteration: project.checkpointLoopIteration,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
