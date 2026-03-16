import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFileSync, existsSync } from "fs";

/** GET /api/projects/{id}/export-zip */
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

    // Find export_bundle artifact
    const exportArtifact = await prisma.artifact.findFirst({
      where: {
        projectId: project.id,
        artifactType: "export_bundle",
      },
      orderBy: { versionNo: "desc" },
    });

    if (!exportArtifact) {
      return NextResponse.json(
        { error: "conflict", detail: "エクスポートバンドルがまだ準備できていません。ステップ19が完了する必要があります。" },
        { status: 409 },
      );
    }

    const zipPath = exportArtifact.content ?? exportArtifact.storagePath;
    if (!zipPath || !existsSync(zipPath)) {
      return NextResponse.json(
        { error: "not_found", detail: "エクスポートファイルがディスク上に見つかりません" },
        { status: 404 },
      );
    }

    const fileBuffer = readFileSync(zipPath);
    const filename = `${project.projectCode}_spec_bundle.zip`;

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/projects/[id]/export-zip エラー:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
