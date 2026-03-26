import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ProjectDetailResponse } from "@spec-engine/shared";

interface UpdateProjectBody {
  title?: string;
}

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
        { error: "not_found", detail: "案件が見つかりません" },
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
    console.error("GET /api/projects/[id] エラー:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}

/** PATCH /api/projects/{id} — タイトル等の更新 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = (await request.json()) as UpdateProjectBody;

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json(
        { error: "not_found", detail: "案件が見つかりません" },
        { status: 404 },
      );
    }

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
      },
    });

    return NextResponse.json({
      project: {
        id: updated.id,
        title: updated.title,
      },
    });
  } catch (error) {
    console.error("PATCH /api/projects/[id] エラー:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
