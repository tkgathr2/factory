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
        { error: "not_found", detail: "Project not found" },
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
        { error: "conflict", detail: "Export bundle not yet available. Step 19 must complete first." },
        { status: 409 },
      );
    }

    if (!existsSync(exportArtifact.storagePath)) {
      return NextResponse.json(
        { error: "not_found", detail: "Export file not found on disk" },
        { status: 404 },
      );
    }

    const fileBuffer = readFileSync(exportArtifact.storagePath);
    const filename = `${project.projectCode}_spec_bundle.zip`;

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/projects/[id]/export-zip error:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
