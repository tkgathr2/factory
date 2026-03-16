import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { StopResponse } from "@spec-engine/shared";

/** POST /api/projects/{id}/stop */
export async function POST(
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

    if (project.status !== "running" && project.status !== "queued") {
      return NextResponse.json(
        { error: "conflict", detail: `Cannot stop: project is ${project.status}` },
        { status: 409 },
      );
    }

    await prisma.project.update({
      where: { id: project.id },
      data: {
        status: "blocked",
        manualStopRequested: true,
        stopReason: "manual_stop",
        loopStopReason: "manual_stop",
      },
    });

    const response: StopResponse = {
      status: "blocked",
      loopStatus: "stopped",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("POST /api/projects/[id]/stop error:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
