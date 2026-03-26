import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/projects/{id}/artifacts/{type} - Get latest artifact content by type */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; type: string } },
) {
  try {
    const artifact = await prisma.artifact.findFirst({
      where: { projectId: params.id, artifactType: params.type },
      orderBy: { versionNo: "desc" },
    });

    if (!artifact) {
      return NextResponse.json(
        { error: "not_found", detail: "成果物が見つかりません" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      artifactType: artifact.artifactType,
      versionNo: artifact.versionNo,
      content: artifact.content,
    });
  } catch (error) {
    console.error("GET /api/projects/[id]/artifacts/[type] エラー:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
