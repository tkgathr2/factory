import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { StartWorkflowResponse } from "@spec-engine/shared";

/** POST /api/projects/{id}/start */
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
        { error: "not_found", detail: "案件が見つかりません" },
        { status: 404 },
      );
    }

    if (project.status !== "draft") {
      return NextResponse.json(
        { error: "conflict", detail: `開始できません: 案件のステータスは ${project.status} です` },
        { status: 409 },
      );
    }

    // Transition to queued
    await prisma.project.update({
      where: { id: project.id },
      data: { status: "queued" },
    });

    // Create workflow run
    await prisma.workflowRun.create({
      data: {
        projectId: project.id,
        status: "queued",
      },
    });

    const response: StartWorkflowResponse = {
      projectId: project.id,
      status: "queued",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("POST /api/projects/[id]/start エラー:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
