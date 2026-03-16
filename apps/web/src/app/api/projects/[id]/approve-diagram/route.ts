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
        { error: "not_found", detail: "案件が見つかりません" },
        { status: 404 },
      );
    }

    if (project.status !== "awaiting_approval") {
      return NextResponse.json(
        { error: "conflict", detail: `承認できません: 案件のステータスは ${project.status} です（awaiting_approval が必要）` },
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
        message: "図を承認しました。ステップ19（仕様書エクスポート）からワークフローを再開します。",
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
          ? `図を却下しました: ${body.comment}。再開してステップ18を再実行してください。`
          : "図を却下しました。再開してステップ18から再生成してください。",
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error("POST /api/projects/[id]/approve-diagram エラー:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
