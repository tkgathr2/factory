import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LOOP_POLICY } from "@spec-engine/shared";
import type { LoopStatusResponse } from "@spec-engine/shared";

/** GET /api/projects/{id}/loop-status */
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

    const response: LoopStatusResponse = {
      loopCount: project.loopCount,
      hardLimit: LOOP_POLICY.hardLimit,
      currentScore: project.currentScore,
      lastScore: project.lastScore,
      scoreDelta: project.scoreDelta,
      loopStatus: project.loopStatus ?? "not_started",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/projects/[id]/loop-status エラー:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
