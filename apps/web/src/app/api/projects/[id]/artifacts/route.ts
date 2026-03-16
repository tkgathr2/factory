import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { GetArtifactsResponse } from "@spec-engine/shared";

/** GET /api/projects/{id}/artifacts */
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

    const artifacts = await prisma.artifact.findMany({
      where: { projectId: project.id },
      orderBy: [{ artifactType: "asc" }, { versionNo: "desc" }],
    });

    // Return latest per type
    const latestMap = new Map<string, typeof artifacts[0]>();
    for (const a of artifacts) {
      if (!latestMap.has(a.artifactType)) {
        latestMap.set(a.artifactType, a);
      }
    }

    const response: GetArtifactsResponse = {
      artifacts: Array.from(latestMap.values()).map((a) => ({
        artifactType: a.artifactType,
        versionNo: a.versionNo,
        storagePath: a.storagePath,
        createdAt: a.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/projects/[id]/artifacts エラー:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
