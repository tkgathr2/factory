import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** POST /api/projects/{id}/retry-diagram
 *  Re-queue the project from step 17 (ui_navigation_diagram) so the diagram is regenerated.
 *  Only allowed when the project is blocked with stopReason "diagram_rejected".
 */
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

    if (project.status !== "blocked" || project.stopReason !== "diagram_rejected") {
      return NextResponse.json(
        { error: "conflict", detail: `図のやり直しはできません: ステータスは ${project.status}、停止理由は ${project.stopReason ?? "なし"} です` },
        { status: 409 },
      );
    }

    // Reset to queued, set checkpoint to step 17 (before ui_navigation_diagram = step 18)
    // so the worker will re-execute step 18 (ui_navigation_diagram)
    await prisma.project.update({
      where: { id: project.id },
      data: {
        status: "queued",
        checkpointStepOrder: 17,
        checkpointLoopIteration: project.loopCount,
        manualStopRequested: false,
        stopReason: null,
        loopStopReason: null,
      },
    });

    return NextResponse.json({
      projectId: project.id,
      status: "queued",
      message: "UI画面遷移図の生成をやり直します。ステップ18から再実行します。",
    });
  } catch (error) {
    console.error("POST /api/projects/[id]/retry-diagram エラー:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
