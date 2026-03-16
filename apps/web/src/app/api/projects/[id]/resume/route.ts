import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ResumeResponse } from "@spec-engine/shared";

/** POST /api/projects/{id}/resume */
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

    if (project.status !== "blocked") {
      return NextResponse.json(
        { error: "conflict", detail: `Cannot resume: project is ${project.status}` },
        { status: 409 },
      );
    }

    // Resume from checkpoint
    await prisma.project.update({
      where: { id: project.id },
      data: {
        status: "queued",
        manualStopRequested: false,
        stopReason: null,
      },
    });

    const response: ResumeResponse = {
      status: "queued",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("POST /api/projects/[id]/resume error:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
