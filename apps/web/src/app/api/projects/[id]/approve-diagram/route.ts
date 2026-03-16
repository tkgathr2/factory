import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApproveDiagramRequest, ApproveDiagramResponse } from "@spec-engine/shared";

/** POST /api/projects/{id}/approve-diagram */
export async function POST(
  request: NextRequest,
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

    if (project.status !== "awaiting_approval") {
      return NextResponse.json(
        { error: "conflict", detail: `Cannot approve: project is ${project.status}, expected awaiting_approval` },
        { status: 409 },
      );
    }

    const body = (await request.json()) as ApproveDiagramRequest;

    if (body.approved) {
      // Approval: update checkpoint and resume workflow
      await prisma.project.update({
        where: { id: project.id },
        data: {
          status: "queued",
          checkpointStepOrder: 18,
          checkpointLoopIteration: project.loopCount,
        },
      });

      const response: ApproveDiagramResponse = {
        projectId: project.id,
        status: "queued",
        message: "Diagram approved. Workflow will resume from Step 19 (export_spec).",
      };

      return NextResponse.json(response);
    } else {
      // Rejection: block with reason
      await prisma.project.update({
        where: { id: project.id },
        data: {
          status: "blocked",
          stopReason: "diagram_rejected",
          loopStopReason: "diagram_rejected",
        },
      });

      const response: ApproveDiagramResponse = {
        projectId: project.id,
        status: "blocked",
        message: body.comment
          ? `Diagram rejected: ${body.comment}. Resume to re-generate.`
          : "Diagram rejected. Resume to re-generate from Step 18.",
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error("POST /api/projects/[id]/approve-diagram error:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
